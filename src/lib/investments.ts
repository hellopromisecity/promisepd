/** Investment-platform data layer (ported from the legacy admin).
 *
 *  All reads go through the service-role client (getAdmin) — these tables
 *  are RLS service-role-only, exactly like the rest of the dashboard.
 *  Types mirror the tables created in migration 0019. */

import { cache } from "react";
import { getAdmin } from "@/lib/admin-guard";

export type InvestorBalance = {
  total_investment: number;
  total_profit: number;
  total_withdrawn: number;
  total_balance: number;
};

export type InvestorAccount = {
  uid: string;
  profile_id: string | null;
  fid: string | null;
  full_name: string;
  phone_number: string;
  email: string | null;
  language: string;
  is_verified: boolean;
  is_active: boolean;
  balance: InvestorBalance | null;
  last_login: string | null;
  created_at: string;
  updated_at: string;
};

export type InvestmentProject = {
  project_id: string;
  project_name: string;
  status: string;
  project_address: string | null;
  project_details: string | null;
  total_amount_required: number | null;
  per_user_share_amount: number | null;
  hide_total_amount: boolean;
  hide_share_price: boolean;
  current_funded_amount: number;
  project_progress: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
};

export type InvestmentType = {
  name: string;
  operator: "+" | "-";
  classification: string;
  is_editable: boolean;
  is_active: boolean;
  sort_order: number;
};

export type InvestorTransaction = {
  transaction_id: string;
  rashid_number: string | null;
  uid: string;
  project_id: string | null;
  date: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
};

export type UnsubscribeRequest = {
  id: string;
  uid: string;
  project_id: string;
  status: string;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  admin_notes: string | null;
};

export const emptyBalance: InvestorBalance = {
  total_investment: 0,
  total_profit: 0,
  total_withdrawn: 0,
  total_balance: 0,
};

export function bal(b: InvestorBalance | null | undefined): InvestorBalance {
  return { ...emptyBalance, ...(b ?? {}) };
}

/** ৳ with thousands grouping (matches the rest of the dashboard). */
export function taka(n: number | null | undefined): string {
  return `৳${Math.round(Number(n) || 0).toLocaleString("en-US")}`;
}

/** Local-friendly short date (e.g. 10 Sep 2025). */
export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const s = d.includes("T") ? d : `${d}T00:00:00`;
  const t = new Date(s);
  return Number.isNaN(t.getTime())
    ? "—"
    : t.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ── Readers ────────────────────────────────────────────────────────
type Admin = NonNullable<ReturnType<typeof getAdmin>>;

export async function listInvestors(admin: Admin): Promise<InvestorAccount[]> {
  const { data } = await admin
    .from("investor_accounts")
    .select("*")
    .order("created_at", { ascending: true });
  return (data ?? []) as InvestorAccount[];
}

export async function listProjects(admin: Admin): Promise<InvestmentProject[]> {
  const { data } = await admin
    .from("investment_projects")
    .select("*")
    .order("created_at", { ascending: true });
  return (data ?? []) as InvestmentProject[];
}

export async function listTypes(admin: Admin): Promise<InvestmentType[]> {
  const { data } = await admin
    .from("investment_types")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data ?? []) as InvestmentType[];
}

export async function listTransactions(admin: Admin, limit?: number): Promise<InvestorTransaction[]> {
  if (limit) {
    const { data } = await admin
      .from("investor_transactions")
      .select("*")
      .order("date", { ascending: false })
      .limit(limit);
    return (data ?? []) as InvestorTransaction[];
  }
  // No limit → fetch ALL rows. PostgREST returns at most ~1000 per request,
  // so page through with range() until a short page comes back.
  const out: InvestorTransaction[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin
      .from("investor_transactions")
      .select("*")
      .order("date", { ascending: false })
      .range(from, from + 999);
    if (error || !data?.length) break;
    out.push(...(data as InvestorTransaction[]));
    if (data.length < 1000) break;
  }
  return out;
}

export async function listUnsubscribe(admin: Admin): Promise<UnsubscribeRequest[]> {
  const { data } = await admin
    .from("investor_unsubscribe_requests")
    .select("*")
    .order("requested_at", { ascending: false });
  return (data ?? []) as UnsubscribeRequest[];
}

const PROFIT_TYPE_NAMES = new Set(["profit", "profit_share"]);

/** Per-project { investors, raised } for the projects list cards.
 *  investors = membership rows; raised = the real money paid in (sum of every
 *  member's "+" non-profit transactions tagged to the project — same rule the
 *  investor portal uses, so it never relies on the stale total_paid cache). */
export async function projectStats(admin: Admin): Promise<Map<string, { investors: number; raised: number }>> {
  const [memRes, txs, types] = await Promise.all([
    admin.from("investments").select("project_id, uid"),
    listTransactions(admin),
    listTypes(admin),
  ]);
  const op = new Map(types.map((t) => [t.name, t.operator]));
  const out = new Map<string, { investors: number; raised: number }>();
  const ensure = (id: string) => {
    let v = out.get(id);
    if (!v) { v = { investors: 0, raised: 0 }; out.set(id, v); }
    return v;
  };
  for (const m of (memRes.data ?? []) as { project_id: string; uid: string }[]) ensure(m.project_id).investors++;
  for (const t of txs) {
    if (!t.project_id) continue;
    const ty = String(t.type);
    if (PROFIT_TYPE_NAMES.has(ty) || (op.get(ty) ?? "+") !== "+") continue;
    ensure(t.project_id).raised += Number(t.amount) || 0;
  }
  return out;
}

export type ProjectMember = {
  uid: string;
  name: string;
  phone: string;
  custom_share_price: number | null;
  discount: number;
  start_date: string | null;
  end_date: string | null;
  paid: number; // this member's "+" non-profit transactions for THIS project
};

/** One project + its investor memberships (with names/phones and real paid). */
export async function projectWithInvestors(
  admin: Admin,
  projectId: string,
): Promise<{ project: InvestmentProject; members: ProjectMember[] } | null> {
  const { data: project } = await admin.from("investment_projects").select("*").eq("project_id", projectId).maybeSingle();
  if (!project) return null;

  const [memRes, txRes, types] = await Promise.all([
    admin.from("investments").select("uid, custom_share_price, discount, user_specific_start_date, user_specific_end_date").eq("project_id", projectId),
    admin.from("investor_transactions").select("uid, type, amount").eq("project_id", projectId),
    listTypes(admin),
  ]);
  const op = new Map(types.map((t) => [t.name, t.operator]));

  const memberships = (memRes.data ?? []) as {
    uid: string; custom_share_price: number | null; discount: number;
    user_specific_start_date: string | null; user_specific_end_date: string | null;
  }[];
  const uids = [...new Set(memberships.map((m) => m.uid))];
  const nameMap = new Map<string, { name: string; phone: string }>();
  if (uids.length) {
    const { data: accs } = await admin.from("investor_accounts").select("uid, full_name, phone_number").in("uid", uids);
    for (const a of (accs ?? []) as { uid: string; full_name: string; phone_number: string }[]) {
      nameMap.set(a.uid, { name: a.full_name, phone: a.phone_number });
    }
  }
  const paidByUid = new Map<string, number>();
  for (const t of (txRes.data ?? []) as { uid: string; type: string; amount: number }[]) {
    const ty = String(t.type);
    if (PROFIT_TYPE_NAMES.has(ty) || (op.get(ty) ?? "+") !== "+") continue;
    paidByUid.set(t.uid, (paidByUid.get(t.uid) ?? 0) + (Number(t.amount) || 0));
  }

  const members: ProjectMember[] = memberships
    .map((m) => ({
      uid: m.uid,
      name: nameMap.get(m.uid)?.name ?? m.uid,
      phone: nameMap.get(m.uid)?.phone ?? "",
      custom_share_price: m.custom_share_price,
      discount: Number(m.discount) || 0,
      start_date: m.user_specific_start_date,
      end_date: m.user_specific_end_date,
      paid: paidByUid.get(m.uid) ?? 0,
    }))
    .sort((a, b) => b.paid - a.paid);

  return { project: project as InvestmentProject, members };
}

// ── Investor self-service portal (/account) ───────────────────────
export type PortalMyProject = {
  project_id: string;
  project_name: string;
  status: string;
  invested: number; // sum of the member's non-profit "+" transactions for this project
  profit: number; // profit-type txns for this project
  goal: number; // per-investor target (custom share price, else project share)
  progress: number; // 0–100
  start_date: string | null;
  end_date: string | null;
};
export type PortalProject = {
  project_id: string;
  project_name: string;
  status: string;
  address: string | null;
  details: string | null;
  share_price: number | null;
  total_required: number | null;
  funded: number;
  progress: number;
  start_date: string | null;
  end_date: string | null;
};
export type PortalTxn = {
  transaction_id: string;
  type: string;
  operator: string; // "+" | "-"
  amount: number;
  date: string; // ISO (with time)
  project_name: string | null;
  rashid_number: string | null;
  description: string | null;
};
export type InvestorPortal = {
  uid: string;
  fid: string | null;
  full_name: string;
  is_active: boolean;
  is_verified: boolean;
  balance: InvestorBalance;
  myProjects: PortalMyProject[];
  allProjects: PortalProject[];
  transactions: PortalTxn[];
};

const PROFIT_TYPES = new Set(["profit", "profit_share"]);

/** An app user's account totals, summed from their OWN transactions the same
 *  way the PWA shows per-project figures — NOT the stored `balance` JSON, which
 *  is a stale denormalised cache that omits whole payment types and badly
 *  understates what was actually invested. Invested = the member's "+" non-profit
 *  credits, Profit = profit credits, Withdrawn = "−" debits — all project-tagged,
 *  matching buildPortal so the dashboard reconciles with the app. */
export function investorTotals(
  txns: { type: string; operator: string; amount: number; project_id: string | null }[],
): InvestorBalance {
  let invested = 0, profit = 0, withdrawn = 0;
  for (const t of txns) {
    if (!t.project_id) continue;
    const amt = Number(t.amount) || 0;
    if (PROFIT_TYPES.has(t.type)) profit += amt;
    else if (t.operator === "+") invested += amt;
    else if (t.operator === "-") withdrawn += amt;
  }
  return { total_investment: invested, total_profit: profit, total_withdrawn: withdrawn, total_balance: invested + profit - withdrawn };
}

/** Same as investorTotals, but broken down per project_id — so the unified
 *  All-Customers view can show an app member's investment as one row PER
 *  project (matching how the app itself presents it). */
export function investorProjectTotals(
  txns: { type: string; operator: string; amount: number; project_id: string | null }[],
): Map<string, { invested: number; profit: number; withdrawn: number; balance: number }> {
  const m = new Map<string, { invested: number; profit: number; withdrawn: number; balance: number }>();
  for (const t of txns) {
    if (!t.project_id) continue;
    const cur = m.get(t.project_id) ?? { invested: 0, profit: 0, withdrawn: 0, balance: 0 };
    const amt = Number(t.amount) || 0;
    if (PROFIT_TYPES.has(t.type)) cur.profit += amt;
    else if (t.operator === "+") cur.invested += amt;
    else if (t.operator === "-") cur.withdrawn += amt;
    cur.balance = cur.invested + cur.profit - cur.withdrawn;
    m.set(t.project_id, cur);
  }
  return m;
}

/** Everything a logged-in investor may see about THEMSELVES, fetched by
 *  their profile id (the auth user id).  Returns null if this member isn't
 *  a ported investor.  Service-role read, but scoped strictly to the one
 *  profile_id passed in — a member can only ever load their own data. */
const ACC_COLS = "uid, fid, full_name, is_active, is_verified, balance";
type InvestorAcc = { uid: string; fid: string | null; full_name: string | null; is_active: boolean; is_verified: boolean; balance: unknown };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Resolve an investor account by its File ID (fid) / UID, or — failing that
 *  — by mobile (investor_accounts.phone_number is stored as "+"+mobile). */
async function resolveInvestorAccount(admin: Admin, ref: string | null, mobile: string | null): Promise<InvestorAcc | null> {
  const r = (ref ?? "").trim();
  if (r) {
    const byFid = await admin.from("investor_accounts").select(ACC_COLS).eq("fid", r).maybeSingle();
    if (byFid.data) return byFid.data as InvestorAcc;
    if (UUID_RE.test(r)) {
      const byUid = await admin.from("investor_accounts").select(ACC_COLS).eq("uid", r).maybeSingle();
      if (byUid.data) return byUid.data as InvestorAcc;
    }
  }
  const m = (mobile ?? "").replace(/\D/g, "");
  if (m) {
    const byPhone = await admin.from("investor_accounts").select(ACC_COLS).eq("phone_number", "+" + m).maybeSingle();
    if (byPhone.data) return byPhone.data as InvestorAcc;
  }
  return null;
}

export async function investorPortalData(profileId: string): Promise<InvestorPortal | null> {
  const admin = getAdmin();
  if (!admin) return null;
  const { data: acc } = await admin.from("investor_accounts").select(ACC_COLS).eq("profile_id", profileId).maybeSingle();
  return acc ? buildPortal(admin, acc as InvestorAcc) : null;
}

/** Same portal, resolved for a STAFF member who is ALSO an investor — matched
 *  by their stored Investor ID (fid/uid) or by mobile. Powers "My Projects". */
export async function investorPortalForRef(ref: string | null, mobile: string | null): Promise<InvestorPortal | null> {
  const admin = getAdmin();
  if (!admin) return null;
  const acc = await resolveInvestorAccount(admin, ref, mobile);
  return acc ? buildPortal(admin, acc) : null;
}

/** Light existence check — does this person have a linked investor account?
 *  Used to decide whether to show the "My Projects" nav item. */
export async function hasLinkedInvestor(ref: string | null, mobile: string | null): Promise<boolean> {
  const admin = getAdmin();
  if (!admin) return false;
  return !!(await resolveInvestorAccount(admin, ref, mobile));
}

/** This member's stored Investor-ID link (profiles.investor_ref), cached per
 *  request so the layout + the My Projects page share one read. `investor_ref`
 *  is a new column, so we read it around the generated types. */
export const getInvestorRef = cache(async (profileId: string): Promise<string | null> => {
  const admin = getAdmin();
  if (!admin || !profileId) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin.from("profiles") as any).select("investor_ref").eq("id", profileId).maybeSingle();
  return (data?.investor_ref as string | null) ?? null;
});

async function buildPortal(admin: Admin, acc: InvestorAcc): Promise<InvestorPortal> {
  const uid = acc.uid;

  const [invRes, txRes, projRes, typeRes] = await Promise.all([
    admin
      .from("investments")
      .select("project_id, custom_share_price, user_specific_start_date, user_specific_end_date")
      .eq("uid", uid),
    admin
      .from("investor_transactions")
      .select("transaction_id, type, amount, date, project_id, rashid_number, description")
      .eq("uid", uid)
      .order("date", { ascending: false }),
    admin
      .from("investment_projects")
      .select("project_id, project_name, status, project_address, project_details, per_user_share_amount, total_amount_required, current_funded_amount, project_progress, start_date, end_date"),
    admin.from("investment_types").select("name, operator"),
  ]);

  type ProjRow = {
    project_id: string;
    project_name: string;
    status: string;
    project_address: string | null;
    project_details: string | null;
    per_user_share_amount: number | null;
    total_amount_required: number | null;
    current_funded_amount: number | null;
    project_progress: number | null;
    start_date: string | null;
    end_date: string | null;
  };
  const projects = (projRes.data ?? []) as ProjRow[];
  const byId = new Map(projects.map((p) => [p.project_id, p]));
  const op = new Map(((typeRes.data ?? []) as { name: string; operator: string }[]).map((t) => [t.name, t.operator]));

  const txRows = (txRes.data ?? []) as Record<string, unknown>[];

  // Per-project "Invested" + "Profit" are summed from the member's OWN
  // transactions, grouped by project — exactly like the legacy admin app.
  // We deliberately do NOT use the stored investments.total_paid column: in the
  // ported data it's a stale denormalised cache that omits whole payment types
  // (e.g. a member's "Land Share" payments), so it can badly understate what
  // was actually paid into a project. Invested = the member's "+" payments of
  // non-profit types; Profit = their profit / profit_share credits.
  const investedByProject = new Map<string, number>();
  const profitByProject = new Map<string, number>();
  for (const t of txRows) {
    if (!t.project_id) continue;
    const k = String(t.project_id);
    const amt = Number(t.amount) || 0;
    const ty = String(t.type);
    if (PROFIT_TYPES.has(ty)) {
      profitByProject.set(k, (profitByProject.get(k) ?? 0) + amt);
    } else if ((op.get(ty) ?? "+") === "+") {
      investedByProject.set(k, (investedByProject.get(k) ?? 0) + amt);
    }
  }

  const myProjects: PortalMyProject[] = ((invRes.data ?? []) as Record<string, unknown>[]).map((v) => {
    const pid = String(v.project_id);
    const proj = byId.get(pid);
    const invested = investedByProject.get(pid) ?? 0;
    const goal = Number(v.custom_share_price) || Number(proj?.per_user_share_amount) || 0;
    const progress = goal > 0 ? Math.min(100, Math.round((invested / goal) * 100)) : 0;
    return {
      project_id: pid,
      project_name: proj?.project_name ?? pid,
      status: proj?.status ?? "—",
      invested,
      profit: profitByProject.get(pid) ?? 0,
      goal,
      progress,
      start_date: (v.user_specific_start_date as string | null) ?? proj?.start_date ?? null,
      end_date: (v.user_specific_end_date as string | null) ?? proj?.end_date ?? null,
    };
  });

  const allProjects: PortalProject[] = projects.map((p) => ({
    project_id: p.project_id,
    project_name: p.project_name,
    status: p.status,
    address: p.project_address,
    details: p.project_details,
    share_price: p.per_user_share_amount,
    total_required: p.total_amount_required,
    funded: Number(p.current_funded_amount) || 0,
    progress: Math.min(100, Math.round(Number(p.project_progress) || 0)),
    start_date: p.start_date,
    end_date: p.end_date,
  }));

  const transactions: PortalTxn[] = txRows.map((t) => ({
    transaction_id: String(t.transaction_id),
    type: String(t.type),
    operator: op.get(String(t.type)) ?? "+",
    amount: Number(t.amount) || 0,
    date: String(t.date),
    project_name: t.project_id ? byId.get(String(t.project_id))?.project_name ?? null : null,
    rashid_number: (t.rashid_number as string | null) ?? null,
    description: (t.description as string | null) ?? null,
  }));

  return {
    uid,
    fid: (acc.fid as string | null) ?? null,
    full_name: acc.full_name ?? "",
    is_active: acc.is_active,
    is_verified: acc.is_verified,
    balance: bal(acc.balance as InvestorBalance | null),
    myProjects,
    allProjects,
    transactions,
  };
}

/** uid -> investor name, and project_id -> project name (for joins in lists). */
export async function nameMaps(admin: Admin): Promise<{
  investorName: Map<string, string>;
  investorPhone: Map<string, string>;
  projectName: Map<string, string>;
}> {
  const [inv, proj] = await Promise.all([
    admin.from("investor_accounts").select("uid, full_name, phone_number"),
    admin.from("investment_projects").select("project_id, project_name"),
  ]);
  const investorName = new Map<string, string>();
  const investorPhone = new Map<string, string>();
  for (const r of (inv.data ?? []) as { uid: string; full_name: string; phone_number: string }[]) {
    investorName.set(r.uid, r.full_name);
    investorPhone.set(r.uid, r.phone_number);
  }
  const projectName = new Map<string, string>();
  for (const r of (proj.data ?? []) as { project_id: string; project_name: string }[]) {
    projectName.set(r.project_id, r.project_name);
  }
  return { investorName, investorPhone, projectName };
}
