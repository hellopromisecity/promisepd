import "server-only";
import { getAdmin } from "@/lib/admin-guard";

/** Deposit-scheme profit (লভ্যাংশ) engine — see 0024_deposit_profit_config.sql.
 *
 *  Shariah Mudaraba, day-weighted on the RUNNING BALANCE. Members pay in and
 *  withdraw freely through the year; on the payout date (16 July) each member
 *  is paid for exactly how much money was in the company and for how many days
 *  ("koto taka koto din joma chilo"). So profit = daily-rate × Σ(balance × days
 *  it was held), across the whole cycle.
 *
 *  Rate is one editable number per scheme:
 *    Special Deposit  : ৳13,000 / lakh / YEAR  (= ৳35.616 / lakh / day, 365-day year)
 *  Change `per_lakh` (or the dates) and every member's profit recomputes.
 *
 *  Day counting: the start date earns, the payout date pays out (exclusive) —
 *  so with a 15 Jul → 15 Jul cycle (365 days) a full-cycle ৳1,00,000 gets
 *  exactly `per_lakh`, to the taka. Set the dates a year apart, not 364 days. */

export type ProfitConfig = {
  project_key: string;
  enabled: boolean;
  per_lakh: number;            // dividend per 1,00,000 over one full cycle
  cycle_days: number;          // days in a full cycle → the rate divisor (365 = 1yr, 730 = 2yr)
  cycle_start: string | null;  // cycle start; balance already in here earns from this date
  payout_date: string | null;  // payout / "as of" date — profit accrues to here
  next_payout: string | null;  // projection target (next cycle's payout)
  note: string | null;
};

const DAY = 86400000;
const parseDay = (iso: string | null) => (iso ? Date.parse(`${iso}T00:00:00Z`) : NaN);
const days = (from: number, to: number) => Math.max(0, Math.round((to - from) / DAY));

/** Per-lakh daily rate implied by the cycle, e.g. 13000 / 365 = 35.616. */
export function dailyPerLakh(cfg: Pick<ProfitConfig, "per_lakh" | "cycle_days">): number {
  return cfg.cycle_days > 0 ? cfg.per_lakh / cfg.cycle_days : 0;
}

export type Txn = { date: string | null; amount: number; kind: string };

/** Current-cycle profit on a member's fluctuating balance.
 *  Walks deposits (+), credited dividends (+) and withdrawals (−) in date
 *  order, accruing daily-rate × balance for the days between each event, from
 *  the cycle start to the payout date. Money already in before the cycle
 *  starts (or undated) forms the opening balance and earns from the start
 *  date. A reinvested dividend earns like principal; a later withdrawal drops
 *  the balance from its own date, so withdrawn money stops earning. */
export function cycleProfit(txns: Txn[], cfg: ProfitConfig): number {
  if (!cfg.enabled || cfg.cycle_days <= 0) return 0;
  const start = parseDay(cfg.cycle_start);
  const payout = parseDay(cfg.payout_date);
  if (!Number.isFinite(start) || !Number.isFinite(payout) || payout <= start) return 0;

  let opening = 0;
  const events: { t: number; delta: number }[] = [];
  for (const p of txns) {
    const amt = Number(p.amount) || 0;
    if (amt <= 0) continue;
    const delta = p.kind === "withdrawal" ? -amt : amt; // deposit + / withdrawal −
    const t = parseDay(p.date);
    if (!Number.isFinite(t) || t <= start) opening += delta;   // before cycle (or undated) → opening balance
    else if (t < payout) events.push({ t, delta });            // within cycle
    // events on/after payout don't earn this cycle
  }
  events.sort((a, b) => a.t - b.t);

  let bal = Math.max(0, opening);
  let product = 0; // Σ balance × days
  let cursor = start;
  for (const e of events) {
    product += bal * days(cursor, e.t);
    bal = Math.max(0, bal + e.delta);
    cursor = e.t;
  }
  product += bal * days(cursor, payout);

  return ((cfg.per_lakh / 1e5) * product) / cfg.cycle_days;
}

/** Projected profit if `principal` stays in for the whole NEXT cycle. */
export function projectedProfit(principal: number, cfg: ProfitConfig): number {
  if (!cfg.enabled || !(principal > 0) || cfg.cycle_days <= 0) return 0;
  const from = parseDay(cfg.payout_date);
  const to = parseDay(cfg.next_payout);
  const d = Number.isFinite(from) && Number.isFinite(to) ? Math.min(cfg.cycle_days, days(from, to)) : cfg.cycle_days;
  return ((principal * cfg.per_lakh) / 1e5) * (d / cfg.cycle_days);
}

const DEFAULT_CFG = (key: string): ProfitConfig => ({
  project_key: key, enabled: false, per_lakh: 0, cycle_days: 365,
  cycle_start: null, payout_date: null, next_payout: null, note: null,
});

function mapCfg(d: Record<string, unknown>): ProfitConfig {
  return {
    project_key: d.project_key as string,
    enabled: !!d.enabled,
    per_lakh: Number(d.per_lakh) || 0,
    cycle_days: Number(d.cycle_days) || 365,
    cycle_start: (d.cycle_start as string) ?? null,
    payout_date: (d.payout_date as string) ?? null,
    next_payout: (d.next_payout as string) ?? null,
    note: (d.note as string) ?? null,
  };
}

/** One scheme's profit rate (falls back to a disabled default if unset / table absent). */
export async function getProfitConfig(key: string): Promise<ProfitConfig> {
  const admin = getAdmin();
  if (!admin || !key) return DEFAULT_CFG(key);
  try {
    const { data } = await admin.from("deposit_profit_config").select("*").eq("project_key", key).maybeSingle();
    return data ? mapCfg(data as Record<string, unknown>) : DEFAULT_CFG(key);
  } catch {
    return DEFAULT_CFG(key); // table not migrated yet → treat as no rate set
  }
}

/** Accrued current-cycle profit per customer, day-weighted on the running balance. */
export async function accruedProfitByCustomer(customerIds: string[], cfg: ProfitConfig): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const admin = getAdmin();
  if (!admin || !cfg.enabled || !customerIds.length) return out;
  const byCust = new Map<string, Txn[]>();
  for (let i = 0; i < customerIds.length; i += 200) {
    const chunk = customerIds.slice(i, i + 200);
    const { data } = await admin
      .from("hub_customer_payments")
      .select("customer_id, amount, date, kind")
      .in("customer_id", chunk)
      // Dividend counts too: a credited/reinvested dividend stays in the company
      // as part of the running balance and earns — until the member withdraws
      // it, at which point the withdrawal drops the balance from that date.
      .in("kind", ["deposit", "withdrawal", "dividend"]);
    for (const p of (data ?? []) as Record<string, unknown>[]) {
      const id = p.customer_id as string;
      (byCust.get(id) ?? byCust.set(id, []).get(id)!).push({ date: (p.date as string) ?? null, amount: Number(p.amount) || 0, kind: (p.kind as string) ?? "deposit" });
    }
  }
  for (const [id, txns] of byCust) {
    const profit = cycleProfit(txns, cfg);
    if (profit) out.set(id, profit);
  }
  return out;
}
