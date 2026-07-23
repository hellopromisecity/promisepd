import "server-only";
import { getAdmin } from "@/lib/admin-guard";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Writing into the investor system from the project book, so a book payment
 *  also lands in the buyer's app / investor account (which the PWA reads).
 *  Balance rule mirrors admin-investments.ts exactly, so nothing drifts.
 *
 *  The company is moving EVERYONE onto the app: a book customer with a mobile
 *  and no app account gets one auto-created (login = mobile + the default
 *  password below, verified + active); existing accounts are never touched —
 *  they keep their own password. */

type Admin = NonNullable<ReturnType<typeof getAdmin>>;

/** Default password for auto-created member logins (announced to customers).
 *  Must be ≥6 chars — both our login form and Supabase enforce a 6 minimum. */
export const DEFAULT_MEMBER_PASSWORD = "258025";
const AUTH_EMAIL_DOMAIN = "users.promisepd.app";

const INVESTMENT_TYPES = ["investment", "deposit", "booking_money", "installment"];
/** BD calendar day of a stored transaction date. Postgres hands timestamptz
 *  back in UTC — "2026-07-20T18:00:00+00:00" IS 21 Jul in Bangladesh, which is
 *  the day the book's date column says — so comparing raw date-part slices
 *  silently misses by one day (the bug that duplicated an edited payment's
 *  mirror). Always compare through this. */
function bdDay(iso: unknown): string {
  const t = Date.parse(String(iso ?? ""));
  return Number.isFinite(t) ? new Date(t + 6 * 3600 * 1000).toISOString().slice(0, 10) : String(iso ?? "").slice(0, 10);
}
const normProj = (s: string | null | undefined) => (s || "").toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9]/g, "");
const last10 = (m: string | null | undefined) => { const d = (m || "").replace(/\D/g, ""); return d.length >= 10 ? d.slice(-10) : ""; };
/** Canonical login mobile from a book mobile field — which may hold SEVERAL
 *  numbers ("01704… 01628…"): take the FIRST BD-shaped token, else fall back
 *  to the digits as an intl number. "" when nothing usable. */
function canonMobile(raw: string | null | undefined): string {
  for (const tok of String(raw || "").split(/[^\d+]+/).filter(Boolean)) {
    const d = tok.replace(/\D/g, "");
    if (d.length === 11 && d.startsWith("01")) return "880" + d.slice(1);
    if (d.length === 13 && d.startsWith("8801")) return d;
    if (d.length === 10 && d.startsWith("1")) return "880" + d;
  }
  const all = String(raw || "").replace(/\D/g, "");
  return all.length >= 8 && all.length <= 15 ? all : "";
}
/** App project names fold onto the book name ("Investment (Special Deposit)" →
 *  "Special Deposit", "… Group-A" → "… A") — same mapping the All-Customers
 *  merge uses, so deposit-scheme payments mirror into the right app project. */
function appToHubName(appName: string): string {
  const g = appName.match(/investment\s*\(([^)]*)\)\s*group[\s-]*([ab])/i);
  if (g) return `${g[1].trim()} ${g[2].toUpperCase()}`;
  const i = appName.match(/investment\s*\(([^)]*)\)/i);
  if (i) return i[1].trim();
  return appName;
}

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

/** hub (book) project name → investment_projects.project_id. Matches by the
 *  normalised name with the app→hub fold, so "Special Deposit" finds
 *  "Investment (Special Deposit)" and real-estate names match directly. */
export async function projectIdForName(admin: Admin, projectName: string): Promise<string | null> {
  const { data } = await admin.from("investment_projects").select("project_id, project_name");
  const want = normProj(projectName);
  for (const p of (data ?? []) as any[]) {
    if (normProj(appToHubName(p.project_name)) === want || normProj(p.project_name) === want) return p.project_id;
  }
  return null;
}

/** Make sure the investor is a MEMBER of the project (the `investments` row) —
 *  the PWA builds its "My Projects" cards from memberships, not transactions,
 *  so a mirrored payment without one never shows as a project card. */
export async function ensureMembership(admin: Admin, uid: string, project_id: string): Promise<void> {
  try {
    const { data: existing } = await admin.from("investments").select("id").eq("project_id", project_id).eq("uid", uid).maybeSingle();
    if (existing) return;
    await admin.from("investments").insert({ uid, project_id, total_paid: 0, discount: 0 } as any);
  } catch { /* membership is cosmetic — never block the payment */ }
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

/** Record the explicit book↔app link on the hub row (so future payments skip
 *  the mobile scan and the All-Customers merge de-dups by uid). */
async function linkHubRow(admin: Admin, hubCustomerId: string | null | undefined, uid: string): Promise<void> {
  if (!hubCustomerId) return;
  try { await (admin.from as any)("hub_customers").update({ investor_uid: uid }).eq("id", hubCustomerId); } catch { /* best-effort */ }
}

/** Resolve the book customer's app account — CREATING one when they have none:
 *  auth login (synthetic email = canonical mobile, password
 *  DEFAULT_MEMBER_PASSWORD, pre-confirmed) → member profile → investor account
 *  (verified + active, zero balance). Existing accounts are returned untouched.
 *  Returns the uid, or null when no account can be made (no usable mobile). */
export async function ensureInvestorForHub(
  admin: Admin,
  hub: { id?: string | null; name?: string | null; investor_uid?: string | null; mobile?: string | null },
  opts?: { fid?: string | null; email?: string | null; password?: string | null },
): Promise<string | null> {
  const existing = await resolveInvestorUid(admin, hub);
  if (existing) { if (!hub.investor_uid) await linkHubRow(admin, hub.id, existing); return existing; }

  const name = (hub.name || "").trim();
  const mobile = canonMobile(hub.mobile);
  if (!name || mobile.length < 8) return null; // can't build a login without a usable number
  const email = opts?.email?.trim() || null;
  const password = opts?.password?.trim() || DEFAULT_MEMBER_PASSWORD;

  // 1) auth login — or adopt the orphan member profile that already owns this mobile.
  let profileId: string | null = null;
  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email: `${mobile}@${AUTH_EMAIL_DOMAIN}`,
    password,
    email_confirm: true,
    user_metadata: { name, mobile, email },
  });
  if (cErr) {
    if (!/already|registered|exists/i.test(cErr.message)) return null;
    const { data: prof } = await admin.from("profiles").select("id").eq("mobile", mobile).maybeSingle();
    profileId = (prof as any)?.id ?? null; // existing login keeps its own password
    if (!profileId) return null;
  } else {
    profileId = created.user.id;
    await admin.from("profiles").upsert({ id: profileId, name, mobile, email, role: "member" } as any, { onConflict: "id" });
  }

  // 2) investor account (uid race → retry; phone landed meanwhile → re-resolve;
  //    a taken File ID just drops off rather than blocking the account).
  let fid = opts?.fid?.trim() || null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const uid = await nextId(admin, "investor_accounts", "uid", "U", 100001);
    const { error } = await admin.from("investor_accounts").insert({
      uid,
      profile_id: profileId,
      fid,
      full_name: name,
      phone_number: "+" + mobile,
      email,
      language: "bn",
      is_verified: true,
      is_active: true,
      balance: { total_investment: 0, total_profit: 0, total_withdrawn: 0, total_balance: 0 },
    } as any);
    if (!error) { await linkHubRow(admin, hub.id, uid); return uid; }
    if (!/duplicate|unique/i.test(error.message)) return null;
    if (/fid/i.test(error.message)) { fid = null; continue; }
    if (/phone/i.test(error.message)) return await resolveInvestorUid(admin, hub);
  }
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
  project_id: string | null,
  m: { kind: string; type: string; amount: number; date: string | null; description?: string | null },
  types: { name: string; operator: string }[],
): Promise<string | null> {
  const amount = Math.round((Number(m.amount) || 0) * 100) / 100;
  if (!(amount > 0)) return null;
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

/** Mirror a single freshly-added book payment into the buyer's app account —
 *  creating the account (mobile + default password) when they don't have one —
 *  plus the project membership, so their PWA gains the project card too.
 *  Recomputes the investor balance. Returns the mirrored transaction's id so
 *  the payment row can remember it (mirror_tx). Never throws. */
export async function mirrorBookPayment(
  admin: Admin,
  hub: { id?: string | null; name?: string | null; investor_uid?: string | null; mobile?: string | null; project_name: string },
  payment: { kind: string; type: string; amount: number; date?: string | null; description?: string | null },
): Promise<string | null> {
  try {
    const uid = await ensureInvestorForHub(admin, hub);
    if (!uid) return null;
    const [{ data: types }, project_id] = await Promise.all([
      admin.from("investment_types").select("name, operator"),
      projectIdForName(admin, hub.project_name),
    ]);
    const id = await insertMirror(admin, uid, project_id, { kind: payment.kind, type: payment.type, amount: payment.amount, date: payment.date ?? null, description: payment.description ?? null }, (types ?? []) as any[]);
    if (project_id) await ensureMembership(admin, uid, project_id);
    await recomputeInvestorBalance(admin, uid);
    return id;
  } catch { return null; /* mirroring must never break the book payment */ }
}

/** Keep the mirror in step when a book payment is EDITED or DELETED. The
 *  payment's stored mirror_tx (migration 0029) targets the exact transaction;
 *  older rows fall back to matching (uid, project, old amount, old BD-day).
 *  Edits rewrite the mirror, deletes remove it, and an edit with no mirror yet
 *  creates one (so the two systems converge). Recomputes the balance. Returns
 *  the mirror's id after the change (for self-healing storage); never throws. */
export async function syncMirrorOnPaymentChange(
  admin: Admin,
  hub: { investor_uid?: string | null; mobile?: string | null; project_name: string },
  old: { amount: number; date: string | null },
  next: { kind: string; type: string; amount: number; date?: string | null; description?: string | null } | null,
  mirrorTx?: string | null,
): Promise<string | null> {
  try {
    const uid = await resolveInvestorUid(admin, hub);
    if (!uid) return null;
    const project_id = await projectIdForName(admin, hub.project_name);

    let hit: { transaction_id: string; date: unknown } | null = null;
    if (mirrorTx) {
      const { data } = await admin.from("investor_transactions").select("transaction_id, date").eq("transaction_id", mirrorTx).eq("uid", uid).maybeSingle();
      hit = (data as any) ?? null;
    }
    if (!hit) {
      const oldAmt = Math.round((Number(old.amount) || 0) * 100) / 100;
      const oldDay = String(old.date ?? "").slice(0, 10);
      let q = admin.from("investor_transactions").select("transaction_id, date").eq("uid", uid).eq("amount", oldAmt);
      q = project_id ? q.eq("project_id", project_id) : (q.is("project_id", null) as typeof q);
      const { data } = await q;
      hit = ((data ?? []) as any[]).find((t) => bdDay(t.date) === oldDay || String(t.date).slice(0, 10) === oldDay) ?? null;
    }

    const { data: types } = await admin.from("investment_types").select("name, operator");
    let result: string | null = null;
    if (next) {
      if (!hit) {
        result = await insertMirror(admin, uid, project_id, { kind: next.kind, type: next.type, amount: next.amount, date: next.date ?? null, description: next.description ?? null }, (types ?? []) as any[]);
      } else {
        const type = typeFor(next.kind, next.type, (types ?? []) as any[]);
        const date = next.date && /^\d{4}-\d{2}-\d{2}/.test(next.date) ? `${next.date.slice(0, 10)}T00:00:00+06:00` : (hit.date as string);
        await admin.from("investor_transactions").update({ type, amount: Math.round((Number(next.amount) || 0) * 100) / 100, date, description: next.description ?? null } as any).eq("transaction_id", hit.transaction_id);
        result = hit.transaction_id;
      }
    } else if (hit) {
      await admin.from("investor_transactions").delete().eq("transaction_id", hit.transaction_id);
    } else return null; // deleted a payment that never mirrored — nothing to do
    await recomputeInvestorBalance(admin, uid);
    return result;
  } catch { return null; /* the book stays the source of truth — never block its edit */ }
}

const r2 = (n: unknown) => Math.round((Number(n) || 0) * 100) / 100;

/** Re-roll a book customer's totals from their payments (same math as the
 *  hub actions' recompute — kept in step so the two never drift). */
async function recomputeHubCustomer(admin: Admin, customerId: string): Promise<void> {
  const { data } = await (admin.from as any)("hub_customer_payments").select("amount, kind").eq("customer_id", customerId);
  const rows = (data ?? []) as Record<string, unknown>[];
  let paid = 0, dividend = 0, withdrawn = 0;
  for (const p of rows) { const a = Number(p.amount) || 0; const k = p.kind as string; if (k === "dividend") dividend += a; else if (k === "withdrawal") withdrawn += a; else paid += a; }
  await (admin.from as any)("hub_customers").update({ total_paid: r2(paid), dividend: r2(dividend), withdrawn: r2(withdrawn), payments_count: rows.length }).eq("id", customerId);
}

/** The customer's book row in the app project's book — creating one when the
 *  project has a book but this customer isn't in it yet. Null when the app
 *  project has no book at all. */
async function hubRowForAppProject(admin: Admin, uid: string, project_id: string): Promise<{ id: string } | null> {
  const { data: projD } = await admin.from("investment_projects").select("project_name").eq("project_id", project_id).maybeSingle();
  const appName = (projD as { project_name?: string } | null)?.project_name;
  if (!appName) return null;
  const want = normProj(appToHubName(appName));

  const { data: mineD } = await (admin.from as any)("hub_customers").select("id, project_name, deleted_at").eq("investor_uid", uid);
  const mine = ((mineD ?? []) as Record<string, unknown>[]).find((r) => !r.deleted_at && (normProj(r.project_name as string) === want || normProj(appToHubName(r.project_name as string)) === want));
  if (mine) return { id: mine.id as string };

  // project meta from any existing book row of that project
  const meta = await (async () => {
    for (let from = 0; ; from += 1000) {
      const { data } = await (admin.from as any)("hub_customers").select("project_key, project_name, project_type, sort_order").range(from, from + 999);
      const rows = (data ?? []) as Record<string, unknown>[];
      const hit = rows.find((r) => normProj(r.project_name as string) === want || normProj(appToHubName(r.project_name as string)) === want);
      if (hit) return hit;
      if (rows.length < 1000) return null;
    }
  })();
  if (!meta) return null; // the app project has no book — nothing to write into

  const { data: accD } = await admin.from("investor_accounts").select("full_name, phone_number, fid").eq("uid", uid).maybeSingle();
  const acc = accD as { full_name: string | null; phone_number: string | null; fid: string | null } | null;
  if (!acc) return null;
  const digits = String(acc.phone_number ?? "").replace(/\D/g, "");
  const mobile = /^book:/i.test(String(acc.phone_number ?? "")) ? null : digits.startsWith("880") ? "0" + digits.slice(3) : digits || null;
  const { data: ins, error } = await (admin.from as any)("hub_customers").insert({
    project_key: meta.project_key, project_name: meta.project_name, project_type: meta.project_type, sort_order: meta.sort_order,
    source_tab: `apptxn-${Date.now()}`, name: acc.full_name ?? "Unnamed", mobile, file_no: acc.fid ?? null,
    total_price: 0, total_paid: 0, payments_count: 0, investor_uid: uid, bio: {},
  }).select("id").single();
  if (error) return null;
  return { id: (ins as { id: string }).id };
}

/** REVERSE mirror: an app transaction (added in the Transactions editor) also
 *  lands in the project BOOK, which every Projectify page reads. The book
 *  payment stores mirror_tx = the transaction id so the pair stays 1:1 both
 *  ways. No SMS here (the app editor already texts). Never throws. */
export async function syncBookFromAppTxn(
  admin: Admin,
  txn: { transaction_id: string; uid: string; project_id: string | null; type: string; operator: string; amount: number; date?: string | null; rashid_number?: string | null; description?: string | null },
  mode: "create" | "update" | "delete",
): Promise<void> {
  try {
    // the linked book payment, if the pair already exists (best-effort pre-0029)
    let payment: { id: string; customer_id: string } | null = null;
    try {
      const { data, error } = await (admin.from as any)("hub_customer_payments").select("id, customer_id").eq("mirror_tx", txn.transaction_id).maybeSingle();
      if (!error) payment = (data as { id: string; customer_id: string } | null) ?? null;
    } catch { /* mirror_tx column not migrated yet */ }

    if (mode === "delete") {
      if (!payment) return;
      await (admin.from as any)("hub_customer_payments").delete().eq("id", payment.id);
      await recomputeHubCustomer(admin, payment.customer_id);
      return;
    }

    const kind = txn.operator === "-" ? "withdrawal" : /dividend|লভ্যাংশ|profit/i.test(txn.type) ? "dividend" : "deposit";
    const day = txn.date && /^\d{4}-\d{2}-\d{2}/.test(String(txn.date)) ? String(txn.date).slice(0, 10) : bdDay(txn.date ?? new Date().toISOString());
    const desc = txn.description ? `${txn.type} — ${txn.description}` : txn.type;
    const row = { date: day, amount: r2(txn.amount), kind, description: desc, receipt_no: txn.rashid_number || null };

    if (payment) {
      await (admin.from as any)("hub_customer_payments").update(row).eq("id", payment.id);
      await recomputeHubCustomer(admin, payment.customer_id);
      return;
    }

    // no pair yet → create it (covers both fresh adds and older unlinked edits)
    if (!txn.project_id) return; // a general (no-project) txn has no book home
    const hub = await hubRowForAppProject(admin, txn.uid, txn.project_id);
    if (!hub) return;
    const { data: mx } = await (admin.from as any)("hub_customer_payments").select("seq").eq("customer_id", hub.id).order("seq", { ascending: false }).limit(1).maybeSingle();
    const seq = Number((mx as { seq?: number } | null)?.seq ?? -1) + 1;
    const { error } = await (admin.from as any)("hub_customer_payments").insert({ customer_id: hub.id, seq, ...row, mirror_tx: txn.transaction_id });
    if (error) await (admin.from as any)("hub_customer_payments").insert({ customer_id: hub.id, seq, ...row }); // pre-0029 fallback
    await recomputeHubCustomer(admin, hub.id);
    await ensureMembership(admin, txn.uid, txn.project_id);
  } catch { /* the app-side save must never fail because of the book copy */ }
}

/** Backfill: mirror all of a book customer's existing payments into `uid` (used
 *  when they're first linked). Skips payments already mirrored (same project +
 *  amount + date) so re-linking doesn't duplicate, and ensures the project
 *  membership so the PWA shows the project card. Returns how many were added. */
export async function backfillHubToInvestor(admin: Admin, hubCustomerId: string, uid: string, projectName: string): Promise<number> {
  const [{ data: pays }, { data: types }, { data: existing }, project_id] = await Promise.all([
    admin.from("hub_customer_payments").select("date, amount, kind, description").eq("customer_id", hubCustomerId).order("seq", { ascending: true }),
    admin.from("investment_types").select("name, operator"),
    admin.from("investor_transactions").select("amount, date, project_id").eq("uid", uid),
    projectIdForName(admin, projectName),
  ]);
  const seen = new Set(((existing ?? []) as any[]).map((t) => `${t.project_id}|${Math.round(Number(t.amount) || 0)}|${bdDay(t.date)}`));
  let added = 0;
  for (const p of (pays ?? []) as any[]) {
    const amt = Math.round(Number(p.amount) || 0);
    const day = String(p.date ?? "").slice(0, 10);
    if (seen.has(`${project_id}|${amt}|${day}`)) continue; // already there
    const sep = String(p.description ?? "").indexOf(" — ");
    const type = sep >= 0 ? String(p.description).slice(0, sep).trim() : "";
    const id = await insertMirror(admin, uid, project_id, { kind: p.kind, type, amount: p.amount, date: p.date, description: p.description }, (types ?? []) as any[]);
    if (id) { added++; seen.add(`${project_id}|${amt}|${day}`); }
  }
  if (project_id) await ensureMembership(admin, uid, project_id);
  if (added) await recomputeInvestorBalance(admin, uid);
  return added;
}
