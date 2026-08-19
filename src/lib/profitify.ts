/** Profitify — the profit (dividend) payout history of the 4 deposit schemes.
 *
 *  Two sources, merged without double counting:
 *   • BOOKED dividends — hub_customer_payments rows with kind "dividend"
 *     (the old system's credited entries; 2025 and earlier live here).
 *   • ENGINE payouts — for a scheme whose configured payout date has already
 *     passed (e.g. Special + General A paid 16 Jul 2026), each member's
 *     cycle-accrued dividend from the profit engine IS what was handed out
 *     that day, even where the book row was never typed in. Per member we
 *     count accrued − (their booked dividends in the payout year), floored
 *     at 0 — so as the office books entries, the computed remainder shrinks
 *     and the year total never double counts. */

import { getAdmin } from "@/lib/admin-guard";
import { getProfitConfig, accruedProfitByCustomer } from "@/lib/deposit-profit";

export type ProfitPaymentRow = {
  project_key: string;
  project_name: string;
  customer_name: string;
  file_no: string | null;
  amount: number;
  /** YYYY-MM-DD (BD day) */
  date: string;
  year: number;
  /** "book" = typed dividend entry · "engine" = computed payout share */
  source: "book" | "engine";
};

export type SchemeSummary = {
  key: string;
  name: string;
  /** e.g. "প্রতি বছর — জুলাই মাসে" */
  cycleText: string;
  cycleYears: number;
  lifetime: number;
  thisYear: number;
  paidThisYear: boolean;
  lastPaidYear: number | null;
  nextYear: number | null;
  members: number;
};

export type ProfitifyData = {
  payments: ProfitPaymentRow[];
  schemes: SchemeSummary[];
  years: number[];
  thisYear: number;
  totals: { lifetime: number; thisYear: number; members: number; schemesPaidThisYear: string[] };
};

const r2 = (n: unknown) => Math.round((Number(n) || 0) * 100) / 100;
const bdDay = (iso: string) => new Date(new Date(iso).getTime() + 6 * 3600e3).toISOString().slice(0, 10);

/** Payout rhythm per scheme (the business rule, from the owner):
 *  Special = every July · General A = every 2 years (2026 paid → 2028) ·
 *  General B = every 2 years, offset (next 2027) · Monthly = every 5 years. */
const CYCLES: Record<string, { years: number; text: string; fallbackNext: number | null }> = {
  "special-deposit": { years: 1, text: "প্রতি বছর — জুলাই মাসে", fallbackNext: 2027 },
  "general-deposit-a": { years: 2, text: "প্রতি ২ বছর পরপর", fallbackNext: 2028 },
  "general-deposit-b": { years: 2, text: "প্রতি ২ বছর পরপর", fallbackNext: 2027 },
  "monthly-deposit": { years: 5, text: "প্রতি ৫ বছর পরপর", fallbackNext: null },
};

type Admin = NonNullable<ReturnType<typeof getAdmin>>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyFrom = (a: Admin) => a.from as any;

async function pageAll<T>(q: (from: number, to: number) => PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await q(from, from + 999);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < 1000) break;
  }
  return out;
}

export async function loadProfitify(): Promise<ProfitifyData> {
  const now = new Date(Date.now() + 6 * 3600e3);
  const thisYear = now.getUTCFullYear();
  const empty: ProfitifyData = { payments: [], schemes: [], years: [], thisYear, totals: { lifetime: 0, thisYear: 0, members: 0, schemesPaidThisYear: [] } };
  const admin = getAdmin();
  if (!admin) return empty;

  type HubRow = { id: string; project_key: string; project_name: string; name: string | null; file_no: string | null; deleted_at: string | null };
  const hubRows = await pageAll<HubRow>((a, b) => anyFrom(admin)("hub_customers").select("id, project_key, project_name, name, file_no, deleted_at").eq("project_type", "deposit").range(a, b));
  const live = hubRows.filter((c) => !c.deleted_at);
  const byId = new Map(live.map((c) => [c.id, c]));
  const schemeKeys = [...new Set(live.map((c) => c.project_key))];

  type PayRow = { customer_id: string; amount: number; kind: string; date: string | null };
  const pays = await pageAll<PayRow>((a, b) => anyFrom(admin)("hub_customer_payments").select("customer_id, amount, kind, date").eq("kind", "dividend").range(a, b));

  const payments: ProfitPaymentRow[] = [];
  // booked dividend entries (any year)
  const bookedByCustYear = new Map<string, number>(); // `${id}·${year}` → amount
  for (const p of pays) {
    const c = byId.get(p.customer_id);
    if (!c || !p.date) continue;
    const day = bdDay(p.date);
    const year = Number(day.slice(0, 4));
    payments.push({ project_key: c.project_key, project_name: c.project_name, customer_name: c.name || "—", file_no: c.file_no ?? null, amount: r2(p.amount), date: day, year, source: "book" });
    const k = `${p.customer_id}·${year}`;
    bookedByCustYear.set(k, r2((bookedByCustYear.get(k) ?? 0) + r2(p.amount)));
  }

  // engine payouts for schemes whose configured payout day has passed
  for (const key of schemeKeys) {
    try {
      const cfg = await getProfitConfig(key);
      if (!cfg.enabled || !cfg.payout_date) continue;
      const payoutDay = String(cfg.payout_date).slice(0, 10);
      if (payoutDay > now.toISOString().slice(0, 10)) continue; // not paid yet
      const year = Number(payoutDay.slice(0, 4));
      const members = live.filter((c) => c.project_key === key);
      const accrued = await accruedProfitByCustomer(members.map((c) => c.id), cfg);
      for (const c of members) {
        const acc = r2(accrued.get(c.id) ?? 0);
        if (acc <= 0) continue;
        const remainder = r2(acc - (bookedByCustYear.get(`${c.id}·${year}`) ?? 0));
        if (remainder <= 0) continue;
        payments.push({ project_key: c.project_key, project_name: c.project_name, customer_name: c.name || "—", file_no: c.file_no ?? null, amount: remainder, date: payoutDay, year, source: "engine" });
      }
    } catch { /* a scheme without a rate simply has no engine payout */ }
  }

  // summaries
  const schemeNames = new Map(live.map((c) => [c.project_key, c.project_name]));
  const schemes: SchemeSummary[] = schemeKeys.map((key) => {
    const rows = payments.filter((p) => p.project_key === key);
    const lifetime = r2(rows.reduce((s, p) => s + p.amount, 0));
    const yearAmt = r2(rows.filter((p) => p.year === thisYear).reduce((s, p) => s + p.amount, 0));
    const years = [...new Set(rows.map((p) => p.year))].sort();
    const lastPaidYear = years.length ? years[years.length - 1] : null;
    const cyc = CYCLES[key] ?? { years: 1, text: "", fallbackNext: null };
    const nextYear = lastPaidYear ? lastPaidYear + cyc.years : cyc.fallbackNext;
    const memberIds = new Set(rows.map((p) => p.customer_name + "·" + (p.file_no ?? "")));
    return {
      key, name: schemeNames.get(key) ?? key, cycleText: cyc.text, cycleYears: cyc.years,
      lifetime, thisYear: yearAmt, paidThisYear: yearAmt > 0, lastPaidYear, nextYear, members: memberIds.size,
    };
  }).sort((a, b) => b.lifetime - a.lifetime);

  const years = [...new Set(payments.map((p) => p.year))].sort((a, b) => b - a);
  const uniqMembers = new Set(payments.map((p) => p.customer_name + "·" + (p.file_no ?? ""))).size;
  return {
    payments,
    schemes,
    years,
    thisYear,
    totals: {
      lifetime: r2(payments.reduce((s, p) => s + p.amount, 0)),
      thisYear: r2(payments.filter((p) => p.year === thisYear).reduce((s, p) => s + p.amount, 0)),
      members: uniqMembers,
      schemesPaidThisYear: schemes.filter((s) => s.paidThisYear).map((s) => s.name),
    },
  };
}
