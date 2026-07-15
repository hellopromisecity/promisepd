import "server-only";
import { getAdmin } from "@/lib/admin-guard";
import { hubAllCustomers, hubProjectSummaries, type HubCustomer } from "@/lib/hub";
import { listInvestors, listTypes, listProjects, listTransactions, investorTotals } from "@/lib/investments";
import type { AppUser, UserTxn, TypeOpt, ProjectOpt } from "@/app/dashboard/investments/users/shared";

/** Synthetic "project" the app/investment accounts live under in the merged view. */
export const APP_PROJECT_KEY = "app-users";
export const APP_PROJECT_NAME = "App / Investment";

/** A row in the unified All-Customers grid — a real hub customer OR a live
 *  app/investment account surfaced in place (never copied into the DB). */
export type UnifiedCustomer = HubCustomer & {
  source: "hub" | "app";
  // app-only extras (undefined on hub rows)
  uid?: string;
  email?: string | null;
  is_verified?: boolean;
  is_active?: boolean;
  invested?: number;
  profit?: number;
  /** The full app record, so the investor action components can drive the row. */
  app?: AppUser;
};

export type AppStats = {
  total: number;
  verified: number;
  unverified: number;
  active: number;
  inactive: number;
  paying: number;
  nonpaying: number;
  invested: number;
  profit: number;
  aum: number;
  verifiedPct: number;
  activePct: number;
  merged: number; // how many app accounts were added (not already a customer)
  top: { uid: string; name: string; balance: number }[];
};

export type AllCustomersData = {
  rows: UnifiedCustomer[];
  projects: { key: string; name: string; type: string; sort: number }[];
  appStats: AppStats;
  investorTypes: TypeOpt[];
  investorProjects: ProjectOpt[];
  hub: { collected: number; customers: number; payers: number; payments: number };
};

/** BD mobile → last 10 significant digits ("01737000729" and "+8801737000729"
 *  both collapse to "1737000729"), so the dedup matches across formats. */
function last10(m: string | null | undefined): string {
  const d = (m || "").replace(/\D/g, "");
  return d.length >= 10 ? d.slice(-10) : "";
}

const isPaying = (u: AppUser) => u.invested > 0 || u.profit > 0 || u.withdrawn > 0 || u.balance !== 0;

/** Map a live app account into the unified customer shape. */
function appToRow(u: AppUser): UnifiedCustomer {
  return {
    id: `app:${u.uid}`,
    project_key: APP_PROJECT_KEY,
    project_name: APP_PROJECT_NAME,
    project_type: "investment",
    file_no: u.fid,
    name: u.full_name || "Unnamed",
    mobile: u.phone_number || null,
    district: null,
    nid: null,
    reference: null,
    joining_date: u.created_at ? u.created_at.slice(0, 10) : null,
    total_price: 0,
    total_paid: u.invested,
    total_remaining: 0,
    dividend: 0,
    withdrawn: u.withdrawn,
    balance: u.balance,
    payments_count: u.txns.length,
    reference_officer_id: null,
    bio: {},
    source: "app",
    uid: u.uid,
    email: u.email,
    is_verified: u.is_verified,
    is_active: u.is_active,
    invested: u.invested,
    profit: u.profit,
    app: u,
  };
}

/** Load the merged All-Customers dataset: every hub customer, plus every app
 *  account that ISN'T already a customer (matched by mobile). No DB writes. */
export async function loadAllCustomers(): Promise<AllCustomersData> {
  const admin = getAdmin();
  const empty: AllCustomersData = {
    rows: [], projects: [], investorTypes: [], investorProjects: [],
    appStats: { total: 0, verified: 0, unverified: 0, active: 0, inactive: 0, paying: 0, nonpaying: 0, invested: 0, profit: 0, aum: 0, verifiedPct: 0, activePct: 0, merged: 0, top: [] },
    hub: { collected: 0, customers: 0, payers: 0, payments: 0 },
  };
  if (!admin) return empty;

  const [customers, summaries, investors, types, projects, txns] = await Promise.all([
    hubAllCustomers(),
    hubProjectSummaries(),
    listInvestors(admin),
    listTypes(admin),
    listProjects(admin),
    listTransactions(admin),
  ]);

  // group each investor's transactions (newest-first from the reader)
  const op = new Map(types.map((t) => [t.name, t.operator]));
  const pname = new Map(projects.map((p) => [p.project_id, p.project_name]));
  const byUid = new Map<string, UserTxn[]>();
  for (const t of txns) {
    const list = byUid.get(t.uid) ?? [];
    list.push({
      transaction_id: t.transaction_id, date: t.date, type: t.type,
      operator: op.get(t.type) ?? "+", amount: Number(t.amount) || 0,
      project_id: t.project_id, project_name: t.project_id ? pname.get(t.project_id) ?? null : null,
      rashid_number: t.rashid_number, description: t.description,
    });
    byUid.set(t.uid, list);
  }

  const appUsers: AppUser[] = investors.map((i) => {
    // Totals from the member's OWN transactions (matches the app), not the
    // stale balance JSON which understates what was actually invested.
    const b = investorTotals(byUid.get(i.uid) ?? []);
    return {
      uid: i.uid, fid: i.fid, full_name: i.full_name, phone_number: i.phone_number,
      email: i.email, language: i.language, is_verified: i.is_verified, is_active: i.is_active,
      created_at: i.created_at, last_login: i.last_login,
      invested: b.total_investment, profit: b.total_profit, withdrawn: b.total_withdrawn, balance: b.total_balance,
      txns: byUid.get(i.uid) ?? [],
    };
  });

  // ── app-account stats over ALL app users (for the health cards) ──
  let verified = 0, active = 0, paying = 0, invested = 0, profit = 0, aum = 0;
  for (const u of appUsers) {
    if (u.is_verified) verified++;
    if (u.is_active) active++;
    if (isPaying(u)) paying++;
    invested += u.invested; profit += u.profit; aum += u.balance;
  }
  const denom = appUsers.length || 1;
  const top = [...appUsers].sort((a, b) => b.balance - a.balance).slice(0, 8)
    .map((u) => ({ uid: u.uid, name: u.full_name, balance: u.balance }));

  // ── dedup: only bring app accounts that aren't already a customer ──
  const hubMobiles = new Set(customers.map((c) => last10(c.mobile)).filter(Boolean));
  const merged = appUsers.filter((u) => { const k = last10(u.phone_number); return !k || !hubMobiles.has(k); });

  const rows: UnifiedCustomer[] = [
    ...customers.map((c) => ({ ...c, source: "hub" as const })),
    ...merged.map(appToRow),
  ];

  const projOpts = summaries.map((p) => ({ key: p.key, name: p.name, type: p.type, sort: p.sort }));
  if (merged.length) projOpts.push({ key: APP_PROJECT_KEY, name: APP_PROJECT_NAME, type: "investment", sort: 9999 });

  return {
    rows,
    projects: projOpts,
    appStats: {
      total: appUsers.length, verified, unverified: appUsers.length - verified,
      active, inactive: appUsers.length - active, paying, nonpaying: appUsers.length - paying,
      invested, profit, aum,
      verifiedPct: Math.round((verified / denom) * 100), activePct: Math.round((active / denom) * 100),
      merged: merged.length, top,
    },
    investorTypes: types.map((t) => ({ name: t.name, operator: t.operator })),
    investorProjects: projects.map((p) => ({ project_id: p.project_id, project_name: p.project_name })),
    hub: {
      collected: customers.reduce((s, c) => s + c.total_paid, 0),
      customers: customers.length,
      payers: customers.filter((c) => c.total_paid > 0).length,
      payments: customers.reduce((s, c) => s + c.payments_count, 0),
    },
  };
}
