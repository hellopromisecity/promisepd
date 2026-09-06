import "server-only";
import { getAdmin } from "@/lib/admin-guard";

/** Finance module data — heads (খাত), bank & cash accounts and every ledger
 *  entry (income + expense). Loaded once per page; the explorers filter and
 *  aggregate on the client (the ledger is small — this is the office book,
 *  not the customer transaction stream). */

export type FinKind = "income" | "expense";

export type FinHead = {
  id: string;
  kind: FinKind;
  name: string;
  name_bn: string | null;
  sort: number;
  is_default: boolean;
  is_active: boolean;
};

export type FinAccount = {
  id: string;
  name: string;
  /** bank | cash | mobile (bKash / Nagad / Rocket) */
  type: string;
  account_number: string | null;
  opening_balance: number;
  note: string | null;
  created_at: string;
};

export type FinTxn = {
  id: string;
  type: FinKind;
  amount: number;
  /** head name (denormalised — survives a head rename/delete) */
  category: string;
  head_id: string | null;
  /** what exactly — required when the head is "Others" */
  head_detail: string | null;
  account_id: string | null;
  project_slug: string | null;
  txn_date: string;
  description: string | null;
  /** client / vendor */
  party: string | null;
  /** cash | bank transfer | cheque | bkash | nagad … */
  method: string | null;
  reference: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
};

export type FinanceData = {
  heads: FinHead[];
  accounts: FinAccount[];
  txns: FinTxn[];
  /** opening + Σ income − Σ expense, all time, per account id */
  balances: Record<string, number>;
  /** true once migration 0033 is in (heads table present) */
  ready: boolean;
};

const n = (v: unknown) => Number(v) || 0;

export async function loadFinance(): Promise<FinanceData> {
  const admin = getAdmin();
  const empty: FinanceData = { heads: [], accounts: [], txns: [], balances: {}, ready: false };
  if (!admin) return empty;
  // hub-style loosening: finance_heads + the 0033 columns aren't in the
  // generated types yet. Keep the call BOUND to the client — a detached
  // `admin.from` loses `this` and throws at runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const from = (table: string) => (admin.from as any)(table);

  const [headsRes, accRes] = await Promise.all([
    from("finance_heads").select("*").order("sort", { ascending: true }).order("name", { ascending: true }),
    from("finance_accounts").select("*").order("created_at", { ascending: true }),
  ]);
  const ready = !headsRes.error;
  const heads: FinHead[] = ((headsRes.data ?? []) as Record<string, unknown>[]).map((h) => ({
    id: String(h.id), kind: h.kind as FinKind, name: String(h.name ?? ""), name_bn: (h.name_bn as string) ?? null,
    sort: n(h.sort), is_default: !!h.is_default, is_active: h.is_active !== false,
  }));
  const accounts: FinAccount[] = ((accRes.data ?? []) as Record<string, unknown>[]).map((a) => ({
    id: String(a.id), name: String(a.name ?? ""), type: String(a.type ?? "bank"), account_number: (a.account_number as string) ?? null,
    opening_balance: n(a.opening_balance), note: (a.note as string) ?? null, created_at: String(a.created_at ?? ""),
  }));

  // every ledger row, paged past the 1000-row cap, newest first
  const raw: Record<string, unknown>[] = [];
  for (let start = 0; ; start += 1000) {
    const { data } = await from("transactions").select("*").order("txn_date", { ascending: false }).order("created_at", { ascending: false }).range(start, start + 999);
    const r = (data ?? []) as Record<string, unknown>[];
    raw.push(...r);
    if (r.length < 1000) break;
  }
  const byIds = [...new Set(raw.map((t) => t.created_by).filter(Boolean))] as string[];
  const names = new Map<string, string>();
  if (byIds.length) {
    const { data: profs } = await admin.from("profiles").select("id, name").in("id", byIds);
    for (const p of (profs ?? []) as { id: string; name: string | null }[]) names.set(p.id, p.name || "");
  }
  const txns: FinTxn[] = raw.map((t) => ({
    id: String(t.id), type: (t.type === "income" ? "income" : "expense") as FinKind, amount: n(t.amount),
    category: String(t.category ?? ""), head_id: (t.head_id as string) ?? null, head_detail: (t.head_detail as string) ?? null,
    account_id: (t.account_id as string) ?? null, project_slug: (t.project_slug as string) ?? null,
    txn_date: String(t.txn_date ?? "").slice(0, 10), description: (t.description as string) ?? null,
    party: (t.party as string) ?? null, method: (t.method as string) ?? null, reference: (t.reference as string) ?? null,
    created_by: (t.created_by as string) ?? null, created_by_name: t.created_by ? names.get(String(t.created_by)) ?? null : null,
    created_at: String(t.created_at ?? ""),
  }));

  const balances: Record<string, number> = {};
  for (const a of accounts) balances[a.id] = a.opening_balance;
  for (const t of txns) {
    if (!t.account_id || !(t.account_id in balances)) continue;
    balances[t.account_id] += t.type === "income" ? t.amount : -t.amount;
  }
  for (const k of Object.keys(balances)) balances[k] = Math.round(balances[k] * 100) / 100;

  return { heads, accounts, txns, balances, ready };
}
