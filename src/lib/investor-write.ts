import "server-only";
import { getAdmin } from "@/lib/admin-guard";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Writing into the investor system from the project book, so a book payment
 *  also lands in the buyer's app / investor account (which the PWA reads).
 *  Balance rule mirrors admin-investments.ts exactly, so nothing drifts. */

type Admin = NonNullable<ReturnType<typeof getAdmin>>;

const INVESTMENT_TYPES = ["investment", "deposit", "booking_money", "installment"];
const normProj = (s: string | null | undefined) => (s || "").toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9]/g, "");
const last10 = (m: string | null | undefined) => { const d = (m || "").replace(/\D/g, ""); return d.length >= 10 ? d.slice(-10) : ""; };

/** Next sequential id, paged so it never collides past 1000 rows (see the
 *  transaction-id collision note in admin-investments.ts). */
async function nextId(admin: Admin, table: string, col: string, prefix: string, start: number): Promise<string> {
  const PAGE = 1000;
  let max = start - 1;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin.from(table as any).select(col).range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as unknown as Record<string, unknown>[];
    for (const r of rows) { const n = parseInt(String(r[col] ?? "").replace(/\D/g, ""), 10); if (Number.isFinite(n) && n > max) max = n; }
    if (rows.length < PAGE) break;
  }
  return `${prefix}${max + 1}`;
}

/** Recompute + persist an investor's balance from all their transactions. */
export async function recomputeInvestorBalance(admin: Admin, uid: string) {
  const [{ data: txs }, { data: types }] = await Promise.all([
    admin.from("investor_transactions").select("amount, type").eq("uid", uid),
    admin.from("investment_types").select("name, operator"),
  ]);
  const op = new Map((types ?? []).map((t: any) => [t.name, t.operator]));
  let invested = 0, profit = 0, withdrawn = 0;
  for (const t of (txs ?? []) as any[]) {
    const amt = Number(t.amount) || 0;
    if (op.get(t.type) === "-") withdrawn += amt;
    else if (INVESTMENT_TYPES.includes(t.type)) invested += amt;
    else profit += amt;
  }
  const balance = {
    total_investment: Math.round(invested * 100) / 100,
    total_profit: Math.round(profit * 100) / 100,
    total_withdrawn: Math.round(withdrawn * 100) / 100,
    total_balance: Math.round((invested + profit - withdrawn) * 100) / 100,
  };
  await admin.from("investor_accounts").update({ balance }).eq("uid", uid);
}

/** hub (book) project name → investment_projects.project_id (by normalised name). */
async function projectIdForName(admin: Admin, projectName: string): Promise<string | null> {
  const { data } = await admin.from("investment_projects").select("project_id, project_name");
  const want = normProj(projectName);
  for (const p of (data ?? []) as any[]) if (normProj(p.project_name) === want) return p.project_id;
  return null;
}

/** The investor account a book customer belongs to: the explicit link
 *  (hub_customers.investor_uid) first, else a last-10 mobile match. */
export async function resolveInvestorUid(admin: Admin, hub: { investor_uid?: string | null; mobile?: string | null }): Promise<string | null> {
  if (hub.investor_uid) return hub.investor_uid;
  const mk = last10(hub.mobile);
  if (!mk) return null;
  const { data } = await admin.from("investor_accounts").select("uid, phone_number");
  for (const a of (data ?? []) as any[]) if (last10(a.phone_number) === mk) return a.uid;
  return null;
}

/** Pick a valid investment_type name matching a book payment's kind/operator. */
function typeFor(kind: string, preferred: string, types: { name: string; operator: string }[]): string {
  const has = (n: string) => types.some((t) => t.name.toLowerCase() === n.toLowerCase());
  if (preferred && has(preferred)) return preferred;
  if (kind === "withdrawal") return types.find((t) => t.operator === "-")?.name ?? "withdrawal";
  if (kind === "dividend") return types.find((t) => /dividend|লভ্যাংশ|profit/i.test(t.name))?.name ?? "dividend";
  return types.find((t) => t.operator === "+" && INVESTMENT_TYPES.includes(t.name))?.name ?? "deposit";
}

/** Create ONE investor_transaction mirroring a book payment. No SMS (the book
 *  payment already texts). Returns the new txn id, or null if it couldn't map. */
async function insertMirror(
  admin: Admin,
  uid: string,
  m: { projectName: string; kind: string; type: string; amount: number; date: string | null; description?: string | null },
  types: { name: string; operator: string }[],
): Promise<string | null> {
  const amount = Math.round((Number(m.amount) || 0) * 100) / 100;
  if (!(amount > 0)) return null;
  const project_id = await projectIdForName(admin, m.projectName);
  const type = typeFor(m.kind, m.type, types);
  const date = m.date && /^\d{4}-\d{2}-\d{2}/.test(m.date) ? `${m.date.slice(0, 10)}T00:00:00+06:00` : new Date().toISOString();
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = await nextId(admin, "investor_transactions", "transaction_id", "TX", 100001);
    const { error } = await admin.from("investor_transactions").insert({ transaction_id: candidate, uid, type, amount, date, project_id, description: m.description ?? null } as any);
    if (!error) return candidate;
    if (!/duplicate|unique/i.test(error.message)) throw new Error(error.message);
  }
  return null;
}

/** Mirror a single freshly-added book payment into the investor account (if the
 *  customer resolves to one). Recomputes the investor balance. Never throws. */
export async function mirrorBookPayment(
  admin: Admin,
  hub: { investor_uid?: string | null; mobile?: string | null; project_name: string },
  payment: { kind: string; type: string; amount: number; date?: string | null; description?: string | null },
): Promise<void> {
  try {
    const uid = await resolveInvestorUid(admin, hub);
    if (!uid) return;
    const { data: types } = await admin.from("investment_types").select("name, operator");
    await insertMirror(admin, uid, { projectName: hub.project_name, kind: payment.kind, type: payment.type, amount: payment.amount, date: payment.date ?? null, description: payment.description ?? null }, (types ?? []) as any[]);
    await recomputeInvestorBalance(admin, uid);
  } catch { /* mirroring must never break the book payment */ }
}

/** Backfill: mirror all of a book customer's existing payments into `uid` (used
 *  when they're first linked). Skips payments already mirrored (same project +
 *  amount + date) so re-linking doesn't duplicate. Returns how many were added. */
export async function backfillHubToInvestor(admin: Admin, hubCustomerId: string, uid: string, projectName: string): Promise<number> {
  const [{ data: pays }, { data: types }, { data: existing }] = await Promise.all([
    admin.from("hub_customer_payments").select("date, amount, kind, description").eq("customer_id", hubCustomerId).order("seq", { ascending: true }),
    admin.from("investment_types").select("name, operator"),
    admin.from("investor_transactions").select("amount, date, project_id").eq("uid", uid),
  ]);
  const project_id = await projectIdForName(admin, projectName);
  const seen = new Set(((existing ?? []) as any[]).map((t) => `${t.project_id}|${Math.round(Number(t.amount) || 0)}|${String(t.date).slice(0, 10)}`));
  let added = 0;
  for (const p of (pays ?? []) as any[]) {
    const amt = Math.round(Number(p.amount) || 0);
    const day = String(p.date ?? "").slice(0, 10);
    if (seen.has(`${project_id}|${amt}|${day}`)) continue; // already there
    const sep = String(p.description ?? "").indexOf(" — ");
    const type = sep >= 0 ? String(p.description).slice(0, sep).trim() : "";
    const id = await insertMirror(admin, uid, { projectName, kind: p.kind, type, amount: p.amount, date: p.date, description: p.description }, (types ?? []) as any[]);
    if (id) { added++; seen.add(`${project_id}|${amt}|${day}`); }
  }
  if (added) await recomputeInvestorBalance(admin, uid);
  return added;
}
