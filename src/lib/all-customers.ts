import "server-only";
import { getAdmin } from "@/lib/admin-guard";
import { hubAllCustomers, hubProjectSummaries, type HubCustomer } from "@/lib/hub";
import { listInvestors, listTypes, listProjects, listTransactions, investorTotals, investorProjectTotals } from "@/lib/investments";
import type { AppUser, UserTxn, TypeOpt, ProjectOpt } from "@/app/dashboard/investments/users/shared";

/** An internal per-project holding — a book customer OR a live app investment. */
type UnifiedCustomer = HubCustomer & {
  source: "hub" | "app";
  uid?: string;
  email?: string | null;
  is_verified?: boolean;
  is_active?: boolean;
  invested?: number;
  profit?: number;
  app?: AppUser;
};

/** One project a person holds in (shown in their detail popup). */
export type PersonHolding = {
  id: string; // the book (hub_customer) id for a "hub" holding — drives the row actions
  project_key: string;
  project_name: string;
  project_type: string;
  source: "hub" | "app";
  paid: number;
  profit: number;
  balance: number;
};

/** One UNIQUE person (by name), aggregating every project they hold across the
 *  book + the app — this is what the All-Customers list shows, one row each. */
export type PersonRow = {
  id: string;
  name: string;
  mobile: string | null;
  uid?: string;
  fid?: string | null;
  email?: string | null;
  is_verified?: boolean;
  is_active?: boolean;
  app?: AppUser;
  joined: string | null;
  totalPaid: number;
  totalProfit: number;
  totalBalance: number;
  projectKeys: string[];
  projectNames: string[];
  holdings: PersonHolding[];
};

export type AppHealth = {
  total: number; verified: number; unverified: number; active: number; inactive: number;
  verifiedPct: number; activePct: number;
};

export type AllCustomersData = {
  people: PersonRow[];
  projects: { key: string; name: string; type: string; sort: number }[];
  health: AppHealth;
  top: { name: string; balance: number }[];
  totals: { collected: number; uniqueCount: number; appAccounts: number; payers: number };
  investorTypes: TypeOpt[];
  investorProjects: ProjectOpt[];
};

function last10(m: string | null | undefined): string {
  const d = (m || "").replace(/\D/g, "");
  return d.length >= 10 ? d.slice(-10) : "";
}
const normName = (s: string | null | undefined) => (s || "").toLowerCase().trim().replace(/\s+/g, " ");
const normProj = (s: string | null | undefined) => (s || "").toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9]/g, "");

/** App project names → the book project they belong to, so the filter shows the
 *  real 9 projects (not "Investment (…)" or "(1800sft)" variants).
 *   "Investment (General Deposit) Group-A" → "General Deposit A"
 *   "Investment (Special Deposit)"          → "Special Deposit"
 *   "Ahbab Palace-02 (1200sft)"             → "Ahbab Palace-02" (via normProj) */
function appToHubName(appName: string): string {
  const g = appName.match(/investment\s*\(([^)]*)\)\s*group[\s-]*([ab])/i);
  if (g) return `${g[1].trim()} ${g[2].toUpperCase()}`;
  const i = appName.match(/investment\s*\(([^)]*)\)/i);
  if (i) return i[1].trim();
  return appName;
}

/** A holding's current worth: deposit → paid+dividend−withdrawn; real-estate → paid; app → balance. */
function currentBalance(c: UnifiedCustomer): number {
  if (c.source === "app") return c.balance;
  if (c.project_type === "deposit") return c.total_paid + c.dividend - c.withdrawn;
  return c.total_paid;
}
function rowProfit(c: UnifiedCustomer): number {
  if (c.source === "app") return c.profit ?? 0;
  if (c.project_type === "deposit") return c.dividend;
  return 0;
}

export async function loadAllCustomers(): Promise<AllCustomersData> {
  const admin = getAdmin();
  const empty: AllCustomersData = {
    people: [], projects: [], investorTypes: [], investorProjects: [], top: [],
    health: { total: 0, verified: 0, unverified: 0, active: 0, inactive: 0, verifiedPct: 0, activePct: 0 },
    totals: { collected: 0, uniqueCount: 0, appAccounts: 0, payers: 0 },
  };
  if (!admin) return empty;

  const [customers, summaries, investors, types, projects, txns] = await Promise.all([
    hubAllCustomers(), hubProjectSummaries(), listInvestors(admin), listTypes(admin), listProjects(admin), listTransactions(admin),
  ]);

  // group each investor's transactions
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

  // app project → book project (fixed naming so we land on the real 9)
  const hubByNorm = new Map<string, { key: string; name: string; type: string }>();
  for (const p of summaries) hubByNorm.set(normProj(p.name), { key: p.key, name: p.name, type: p.type });
  const appProjToHub = new Map<string, { key: string; name: string; type: string }>();
  for (const p of projects) {
    const hub = hubByNorm.get(normProj(appToHubName(p.project_name)));
    appProjToHub.set(p.project_id, hub ?? { key: "app-" + normProj(p.project_name), name: p.project_name, type: "investment" });
  }

  // book dedup index (avoid double-counting the same investment across systems)
  const hubMobileProj = new Set<string>();
  const hubUidProj = new Set<string>(); // explicit book↔app link (investor_uid + project)
  const hubNameProjAmt = new Map<string, number[]>();
  for (const c of customers) {
    const mk = last10(c.mobile);
    if (mk) hubMobileProj.add(`${mk}|${c.project_key}`);
    if (c.investor_uid) hubUidProj.add(`${c.investor_uid}|${c.project_key}`);
    const nk = `${normName(c.name)}|${c.project_key}`;
    const arr = hubNameProjAmt.get(nk) ?? []; arr.push(Math.round(c.total_paid)); hubNameProjAmt.set(nk, arr);
  }

  // expand app members into per-project holdings, deduped against the book
  const appRows: UnifiedCustomer[] = [];
  let verified = 0, active = 0;
  for (const i of investors) {
    if (i.is_verified) verified++;
    if (i.is_active) active++;
    const userTxns = byUid.get(i.uid) ?? [];
    const acct = investorTotals(userTxns);
    const appUser: AppUser = {
      uid: i.uid, fid: i.fid, full_name: i.full_name, phone_number: i.phone_number, email: i.email,
      language: i.language, is_verified: i.is_verified, is_active: i.is_active, created_at: i.created_at, last_login: i.last_login,
      invested: acct.total_investment, profit: acct.total_profit, withdrawn: acct.total_withdrawn, balance: acct.total_balance, txns: userTxns,
    };
    const mk10 = last10(i.phone_number);
    const nn = normName(i.full_name);
    for (const [appProjId, t] of investorProjectTotals(userTxns)) {
      if (t.invested <= 0 && t.profit <= 0 && t.withdrawn <= 0) continue;
      const hp = appProjToHub.get(appProjId);
      if (!hp) continue;
      const byMobile = mk10 !== "" && hubMobileProj.has(`${mk10}|${hp.key}`);
      const byUid = hubUidProj.has(`${i.uid}|${hp.key}`);
      const byNameAmt = (hubNameProjAmt.get(`${nn}|${hp.key}`) ?? []).some((a) => a === Math.round(t.invested));
      if (byMobile || byUid || byNameAmt) continue; // folded into the matching book row
      appRows.push({
        id: `app:${i.uid}:${hp.key}`, project_key: hp.key, project_name: hp.name, project_type: hp.type,
        file_no: i.fid, name: i.full_name || "Unnamed", mobile: i.phone_number || null,
        district: null, nid: null, reference: null, joining_date: i.created_at ? i.created_at.slice(0, 10) : null,
        total_price: 0, total_paid: t.invested, total_remaining: 0, dividend: t.profit, withdrawn: t.withdrawn, balance: t.balance,
        payments_count: userTxns.filter((x) => x.project_id === appProjId).length, reference_officer_id: null, investor_uid: null, bio: {},
        source: "app", uid: i.uid, email: i.email, is_verified: i.is_verified, is_active: i.is_active, invested: t.invested, profit: t.profit, app: appUser,
      });
    }
  }

  const rows: UnifiedCustomer[] = [...customers.map((c) => ({ ...c, source: "hub" as const })), ...appRows];

  // ── aggregate every holding into ONE row per unique person (by name) ──
  const byPerson = new Map<string, PersonRow>();
  for (const r of rows) {
    const nn = normName(r.name);
    if (!nn) continue;
    let p = byPerson.get(nn);
    if (!p) {
      p = {
        id: `person:${nn}`, name: r.name || "—", mobile: null, joined: null,
        totalPaid: 0, totalProfit: 0, totalBalance: 0, projectKeys: [], projectNames: [], holdings: [],
      };
      byPerson.set(nn, p);
    }
    if (!p.mobile && r.mobile) p.mobile = r.mobile;
    if (r.source === "app" && !p.app) {
      p.app = r.app; p.uid = r.uid; p.fid = r.file_no; p.email = r.email; p.is_verified = r.is_verified; p.is_active = r.is_active;
    }
    if (r.joining_date && (!p.joined || r.joining_date < p.joined)) p.joined = r.joining_date;
    p.totalPaid += r.total_paid;
    p.totalProfit += rowProfit(r);
    p.totalBalance += currentBalance(r);
    if (!p.projectKeys.includes(r.project_key)) { p.projectKeys.push(r.project_key); p.projectNames.push(r.project_name); }
    p.holdings.push({ id: r.id, project_key: r.project_key, project_name: r.project_name, project_type: r.project_type, source: r.source, paid: r.total_paid, profit: rowProfit(r), balance: currentBalance(r) });
  }
  const people = [...byPerson.values()].sort((a, b) => b.totalBalance - a.totalBalance);

  // top holders (already unique — reuse the person aggregate)
  const top = people.slice(0, 8).map((p) => ({ name: p.name, balance: p.totalBalance }));

  const projOpts = summaries.map((p) => ({ key: p.key, name: p.name, type: p.type, sort: p.sort }));
  const seen = new Set(projOpts.map((p) => p.key));
  for (const r of appRows) if (!seen.has(r.project_key)) { seen.add(r.project_key); projOpts.push({ key: r.project_key, name: r.project_name, type: r.project_type, sort: 9000 }); }

  const denom = investors.length || 1;
  return {
    people,
    projects: projOpts,
    health: {
      total: investors.length, verified, unverified: investors.length - verified, active, inactive: investors.length - active,
      verifiedPct: Math.round((verified / denom) * 100), activePct: Math.round((active / denom) * 100),
    },
    top,
    totals: {
      collected: people.reduce((s, p) => s + p.totalPaid, 0),
      uniqueCount: people.length,
      appAccounts: investors.length,
      payers: people.filter((p) => p.totalPaid > 0).length,
    },
    investorTypes: types.map((t) => ({ name: t.name, operator: t.operator })),
    investorProjects: projects.map((p) => ({ project_id: p.project_id, project_name: p.project_name })),
  };
}
