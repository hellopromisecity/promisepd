import "server-only";
import { getAdmin } from "@/lib/admin-guard";
import { hubAllCustomers, hubProjectSummaries, type HubCustomer } from "@/lib/hub";
import { listInvestors, listTypes, listProjects, listTransactions, investorTotals, investorProjectTotals } from "@/lib/investments";
import type { AppUser, UserTxn, TypeOpt, ProjectOpt } from "@/app/dashboard/investments/users/shared";

/** One project a customer holds in (shown in their detail popup).
 *  source "hub" → a real book row (id = hub_customer id, drives the actions);
 *  source "app" → app-only money in a project with no book row. */
export type PersonHolding = {
  id: string;
  project_key: string;
  project_name: string;
  project_type: string;
  source: "hub" | "app";
  paid: number;
  profit: number;
  balance: number;
};

/** ONE ROW PER APP ACCOUNT (exactly like Investments → App Users — same count,
 *  same identities; two people with the same name stay two rows). Every book
 *  customer now has an account (the 2026-07 migration), so an account row
 *  carries its linked book holdings + any app-only project money. The only
 *  name-grouped rows left are the handful of unlinked book customers still
 *  awaiting a manual "Link to app account". */
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

/** A deleted customer sitting in the 30-day archive, restorable in one click. */
export type ArchivedRow = {
  uid: string;
  name: string;
  mobile: string | null;
  fid: string | null;
  balance: number;
  deletedAt: string;
  daysLeft: number;
};

export type AllCustomersData = {
  people: PersonRow[];
  archived: ArchivedRow[];
  projects: { key: string; name: string; type: string; sort: number }[];
  health: AppHealth;
  top: { name: string; balance: number }[];
  /** memberships = customer-per-project count (a person in 3 projects counts 3);
   *  uniqueCount = unique people (one row per account). */
  totals: { collected: number; memberships: number; uniqueCount: number; appAccounts: number; payers: number };
  investorTypes: TypeOpt[];
  investorProjects: ProjectOpt[];
};

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

/** A book holding's worth: deposit → paid+dividend−withdrawn; real-estate → paid. */
const hubBalance = (c: HubCustomer) => (c.project_type === "deposit" ? c.total_paid + c.dividend - c.withdrawn : c.total_paid);
const hubProfit = (c: HubCustomer) => (c.project_type === "deposit" ? c.dividend : 0);

export async function loadAllCustomers(): Promise<AllCustomersData> {
  const admin = getAdmin();
  const empty: AllCustomersData = {
    people: [], archived: [], projects: [], investorTypes: [], investorProjects: [], top: [],
    health: { total: 0, verified: 0, unverified: 0, active: 0, inactive: 0, verifiedPct: 0, activePct: 0 },
    totals: { collected: 0, memberships: 0, uniqueCount: 0, appAccounts: 0, payers: 0 },
  };
  if (!admin) return empty;

  const [customersAll, summaries, investorsAll, types, projects, txns] = await Promise.all([
    hubAllCustomers(), hubProjectSummaries(), listInvestors(admin), listTypes(admin), listProjects(admin), listTransactions(admin),
  ]);

  // ── soft-deleted (archived) customers: out of every list, restorable 30 days ──
  const DAY = 86400000;
  const now = Date.now();
  const customers = customersAll.filter((c) => !c.deleted_at);
  const investors = investorsAll.filter((i) => !(i as unknown as { deleted_at?: string }).deleted_at);
  const archived: ArchivedRow[] = investorsAll
    .filter((i) => (i as unknown as { deleted_at?: string }).deleted_at)
    .map((i) => {
      const deletedAt = String((i as unknown as { deleted_at?: string }).deleted_at);
      const daysLeft = 30 - Math.floor((now - Date.parse(deletedAt)) / DAY);
      const bal = (i.balance as { total_balance?: number } | null)?.total_balance ?? 0;
      return { uid: i.uid, name: i.full_name || "Unnamed", mobile: i.phone_number, fid: i.fid, balance: Number(bal) || 0, deletedAt, daysLeft };
    })
    .filter((a) => a.daysLeft > 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);

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

  // book rows by their linked account; the rest stay book-only rows
  const accountUids = new Set(investors.map((i) => i.uid));
  const rowsByUid = new Map<string, HubCustomer[]>();
  const unlinked: HubCustomer[] = [];
  for (const c of customers) {
    if (c.investor_uid && accountUids.has(c.investor_uid)) {
      const l = rowsByUid.get(c.investor_uid) ?? []; l.push(c); rowsByUid.set(c.investor_uid, l);
    } else unlinked.push(c);
  }

  // ── one row per app account ──
  const people: PersonRow[] = [];
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

    const bookRows = rowsByUid.get(i.uid) ?? [];
    const covered = new Set(bookRows.map((r) => r.project_key));
    const holdings: PersonHolding[] = bookRows.map((r) => ({
      id: r.id, project_key: r.project_key, project_name: r.project_name, project_type: r.project_type,
      source: "hub" as const, paid: r.total_paid, profit: hubProfit(r), balance: hubBalance(r),
    }));
    // app-only money (projects with no book row) — the book ledger wins where both exist
    for (const [appProjId, t] of investorProjectTotals(userTxns)) {
      if (t.invested <= 0 && t.profit <= 0 && t.withdrawn <= 0) continue;
      const hp = appProjToHub.get(appProjId);
      if (!hp || covered.has(hp.key)) continue;
      holdings.push({ id: `app:${i.uid}:${hp.key}`, project_key: hp.key, project_name: hp.name, project_type: hp.type, source: "app", paid: t.invested, profit: t.profit, balance: t.balance });
    }

    // display mobile: the account's number, unless it's a book:<uid> placeholder
    const phone = i.phone_number && !/^book:/i.test(i.phone_number) ? i.phone_number : bookRows.find((r) => r.mobile)?.mobile ?? null;
    const joinedBook = bookRows.map((r) => r.joining_date).filter(Boolean).sort()[0] ?? null;
    const keys: string[] = [], names: string[] = [];
    for (const h of holdings) if (!keys.includes(h.project_key)) { keys.push(h.project_key); names.push(h.project_name); }

    people.push({
      id: i.uid,
      name: i.full_name || bookRows[0]?.name || "Unnamed",
      mobile: phone,
      uid: i.uid, fid: i.fid, email: i.email, is_verified: i.is_verified, is_active: i.is_active, app: appUser,
      joined: joinedBook ?? (i.created_at ? i.created_at.slice(0, 10) : null),
      totalPaid: holdings.reduce((s, h) => s + h.paid, 0),
      totalProfit: holdings.reduce((s, h) => s + h.profit, 0),
      totalBalance: holdings.reduce((s, h) => s + h.balance, 0),
      projectKeys: keys, projectNames: names, holdings,
    });
  }

  // ── leftover unlinked book customers (no account yet — e.g. the ambiguous
  // same-name cases awaiting a manual Link) — grouped by name like before ──
  const byName = new Map<string, PersonRow>();
  for (const r of unlinked) {
    const nn = normName(r.name);
    if (!nn) continue;
    let p = byName.get(nn);
    if (!p) {
      p = { id: `book:${nn}`, name: r.name || "—", mobile: null, joined: null, totalPaid: 0, totalProfit: 0, totalBalance: 0, projectKeys: [], projectNames: [], holdings: [] };
      byName.set(nn, p);
    }
    if (!p.mobile && r.mobile) p.mobile = r.mobile;
    if (r.joining_date && (!p.joined || r.joining_date < p.joined)) p.joined = r.joining_date;
    p.totalPaid += r.total_paid;
    p.totalProfit += hubProfit(r);
    p.totalBalance += hubBalance(r);
    if (!p.projectKeys.includes(r.project_key)) { p.projectKeys.push(r.project_key); p.projectNames.push(r.project_name); }
    p.holdings.push({ id: r.id, project_key: r.project_key, project_name: r.project_name, project_type: r.project_type, source: "hub", paid: r.total_paid, profit: hubProfit(r), balance: hubBalance(r) });
  }
  people.push(...byName.values());
  people.sort((a, b) => b.totalBalance - a.totalBalance);

  const top = people.slice(0, 8).map((p) => ({ name: p.name, balance: p.totalBalance }));

  const projOpts = summaries.map((p) => ({ key: p.key, name: p.name, type: p.type, sort: p.sort }));
  const seen = new Set(projOpts.map((p) => p.key));
  for (const p of people) for (const h of p.holdings) if (!seen.has(h.project_key)) { seen.add(h.project_key); projOpts.push({ key: h.project_key, name: h.project_name, type: h.project_type, sort: 9000 }); }

  const denom = investors.length || 1;
  return {
    people,
    archived,
    projects: projOpts,
    health: {
      total: investors.length, verified, unverified: investors.length - verified, active, inactive: investors.length - active,
      verifiedPct: Math.round((verified / denom) * 100), activePct: Math.round((active / denom) * 100),
    },
    top,
    totals: {
      collected: people.reduce((s, p) => s + p.totalPaid, 0),
      memberships: people.reduce((s, p) => s + p.projectKeys.length, 0),
      uniqueCount: people.length,
      appAccounts: investors.length,
      payers: people.filter((p) => p.totalPaid > 0).length,
    },
    investorTypes: types.map((t) => ({ name: t.name, operator: t.operator })),
    investorProjects: projects.map((p) => ({ project_id: p.project_id, project_name: p.project_name })),
  };
}
