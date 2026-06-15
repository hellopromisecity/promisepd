/** Investment-platform data layer (ported from the legacy admin).
 *
 *  All reads go through the service-role client (getAdmin) — these tables
 *  are RLS service-role-only, exactly like the rest of the dashboard.
 *  Types mirror the tables created in migration 0019. */

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
  let q = admin
    .from("investor_transactions")
    .select("*")
    .order("date", { ascending: false });
  if (limit) q = q.limit(limit);
  const { data } = await q;
  return (data ?? []) as InvestorTransaction[];
}

export async function listUnsubscribe(admin: Admin): Promise<UnsubscribeRequest[]> {
  const { data } = await admin
    .from("investor_unsubscribe_requests")
    .select("*")
    .order("requested_at", { ascending: false });
  return (data ?? []) as UnsubscribeRequest[];
}

// ── Investor self-service portal (/account) ───────────────────────
export type PortalInvestment = {
  project_id: string;
  project_name: string;
  total_paid: number;
  discount: number;
  start_date: string | null;
  end_date: string | null;
};
export type PortalTxn = {
  transaction_id: string;
  type: string;
  operator: string; // "+" | "-"
  amount: number;
  date: string;
  project_name: string | null;
  rashid_number: string | null;
  description: string | null;
};
export type InvestorPortal = {
  uid: string;
  full_name: string;
  is_active: boolean;
  is_verified: boolean;
  balance: InvestorBalance;
  investments: PortalInvestment[];
  transactions: PortalTxn[];
};

/** Everything a logged-in investor may see about THEMSELVES, fetched by
 *  their profile id (the auth user id).  Returns null if this member isn't
 *  a ported investor.  Service-role read, but scoped strictly to the one
 *  profile_id passed in — a member can only ever load their own data. */
export async function investorPortalData(profileId: string): Promise<InvestorPortal | null> {
  const admin = getAdmin();
  if (!admin) return null;
  const { data: acc } = await admin
    .from("investor_accounts")
    .select("uid, full_name, is_active, is_verified, balance")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (!acc) return null;
  const uid = acc.uid;

  const [invRes, txRes, projRes, typeRes] = await Promise.all([
    admin
      .from("investments")
      .select("project_id, total_paid, discount, user_specific_start_date, user_specific_end_date")
      .eq("uid", uid),
    admin
      .from("investor_transactions")
      .select("transaction_id, type, amount, date, project_id, rashid_number, description")
      .eq("uid", uid)
      .order("date", { ascending: false }),
    admin.from("investment_projects").select("project_id, project_name"),
    admin.from("investment_types").select("name, operator"),
  ]);

  const pName = new Map(((projRes.data ?? []) as { project_id: string; project_name: string }[]).map((p) => [p.project_id, p.project_name]));
  const op = new Map(((typeRes.data ?? []) as { name: string; operator: string }[]).map((t) => [t.name, t.operator]));

  const investments: PortalInvestment[] = ((invRes.data ?? []) as Record<string, unknown>[]).map((v) => ({
    project_id: String(v.project_id),
    project_name: pName.get(String(v.project_id)) ?? String(v.project_id),
    total_paid: Number(v.total_paid) || 0,
    discount: Number(v.discount) || 0,
    start_date: (v.user_specific_start_date as string | null) ?? null,
    end_date: (v.user_specific_end_date as string | null) ?? null,
  }));
  const transactions: PortalTxn[] = ((txRes.data ?? []) as Record<string, unknown>[]).map((t) => ({
    transaction_id: String(t.transaction_id),
    type: String(t.type),
    operator: op.get(String(t.type)) ?? "+",
    amount: Number(t.amount) || 0,
    date: String(t.date),
    project_name: t.project_id ? pName.get(String(t.project_id)) ?? null : null,
    rashid_number: (t.rashid_number as string | null) ?? null,
    description: (t.description as string | null) ?? null,
  }));

  return {
    uid,
    full_name: acc.full_name,
    is_active: acc.is_active,
    is_verified: acc.is_verified,
    balance: bal(acc.balance as InvestorBalance | null),
    investments,
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
