import "server-only";
import { getAdmin } from "@/lib/admin-guard";
import { hubAllCustomers, hubProjectSummaries, type HubCustomer } from "@/lib/hub";
import { listInvestors, listTypes, listProjects, listTransactions, investorTotals, investorProjectTotals } from "@/lib/investments";
import type { AppUser, UserTxn, TypeOpt, ProjectOpt } from "@/app/dashboard/investments/users/shared";

/** A row in the unified All-Customers grid — a real project-book customer OR a
 *  live app/investment holding, shown per project (never copied into the DB). */
export type UnifiedCustomer = HubCustomer & {
  source: "hub" | "app";
  uid?: string;
  email?: string | null;
  is_verified?: boolean;
  is_active?: boolean;
  invested?: number;
  profit?: number;
  /** The full app record, so the investor action components can drive the row. */
  app?: AppUser;
};

export type AppHealth = {
  total: number;
  verified: number;
  unverified: number;
  active: number;
  inactive: number;
  verifiedPct: number;
  activePct: number;
  merged: number; // app holdings surfaced here (not already a book customer)
};

export type AllCustomersData = {
  rows: UnifiedCustomer[];
  projects: { key: string; name: string; type: string; sort: number }[];
  health: AppHealth;
  /** Top unique people by CURRENT holding across every project (deposit remaining
   *  + real-estate invested + app balance), highest first. */
  top: { name: string; balance: number }[];
  totals: {
    collected: number;   // Σ money across every row
    memberships: number; // one per person-per-project (a person in 5 projects = 5)
    payers: number;
    uniqueCount: number; // distinct people (by name)
    appAccounts: number; // total app accounts
  };
  /** Names folded into a book customer by the name+amount match (for spot-checking). */
  mergedNames: string[];
  investorTypes: TypeOpt[];
  investorProjects: ProjectOpt[];
};

/** BD mobile → last 10 significant digits ("01…" and "+8801…" both collapse). */
function last10(m: string | null | undefined): string {
  const d = (m || "").replace(/\D/g, "");
  return d.length >= 10 ? d.slice(-10) : "";
}
/** Person key — normalised full name (mobiles differ across the two systems). */
const normName = (s: string | null | undefined) => (s || "").toLowerCase().trim().replace(/\s+/g, " ");
/** Project key — drop parentheticals ("(1200sft)") + punctuation so the app's
 *  project names line up with the book's ("Ahbab Palace-02"). */
const normProj = (s: string | null | undefined) => (s || "").toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9]/g, "");

/** A person's current holding in one row, for the Top-investors ranking. */
function currentBalance(c: UnifiedCustomer): number {
  if (c.source === "app") return c.balance;
  if (c.project_type === "deposit") return c.total_paid + c.dividend - c.withdrawn; // remaining
  return c.total_paid; // real estate: what they've put in
}

export async function loadAllCustomers(): Promise<AllCustomersData> {
  const admin = getAdmin();
  const empty: AllCustomersData = {
    rows: [], projects: [], investorTypes: [], investorProjects: [], top: [], mergedNames: [],
    health: { total: 0, verified: 0, unverified: 0, active: 0, inactive: 0, verifiedPct: 0, activePct: 0, merged: 0 },
    totals: { collected: 0, memberships: 0, payers: 0, uniqueCount: 0, appAccounts: 0 },
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

  // ── group each investor's transactions (newest-first from the reader) ──
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

  // ── app project_id → the matching book project (by normalised name) ──
  const hubByNorm = new Map<string, { key: string; name: string; type: string }>();
  for (const p of summaries) hubByNorm.set(normProj(p.name), { key: p.key, name: p.name, type: p.type });
  const appProjToHub = new Map<string, { key: string; name: string; type: string }>();
  for (const p of projects) {
    const hub = hubByNorm.get(normProj(p.project_name));
    appProjToHub.set(p.project_id, hub ?? { key: "app-" + normProj(p.project_name), name: p.project_name, type: "investment" });
  }

  // ── book dedup index: mobile+project, and name+project → amounts ──
  const hubMobileProj = new Set<string>();
  const hubNameProjAmt = new Map<string, number[]>();
  for (const c of customers) {
    const mk = last10(c.mobile);
    if (mk) hubMobileProj.add(`${mk}|${c.project_key}`);
    const nk = `${normName(c.name)}|${c.project_key}`;
    const arr = hubNameProjAmt.get(nk) ?? [];
    arr.push(Math.round(c.total_paid));
    hubNameProjAmt.set(nk, arr);
  }

  // ── expand every app member into per-project rows, deduped against the book ──
  const appRows: UnifiedCustomer[] = [];
  const mergedNames = new Set<string>();
  let verified = 0, active = 0;
  for (const i of investors) {
    if (i.is_verified) verified++;
    if (i.is_active) active++;
    const userTxns = byUid.get(i.uid) ?? [];
    const acct = investorTotals(userTxns);
    const appUser: AppUser = {
      uid: i.uid, fid: i.fid, full_name: i.full_name, phone_number: i.phone_number,
      email: i.email, language: i.language, is_verified: i.is_verified, is_active: i.is_active,
      created_at: i.created_at, last_login: i.last_login,
      invested: acct.total_investment, profit: acct.total_profit, withdrawn: acct.total_withdrawn, balance: acct.total_balance,
      txns: userTxns,
    };
    const mk10 = last10(i.phone_number);
    const nn = normName(i.full_name);
    for (const [appProjId, t] of investorProjectTotals(userTxns)) {
      if (t.invested <= 0 && t.profit <= 0 && t.withdrawn <= 0) continue;
      const hp = appProjToHub.get(appProjId);
      if (!hp) continue;
      // Safe-mode dedup: same person already a book customer of this project?
      const byMobile = mk10 !== "" && hubMobileProj.has(`${mk10}|${hp.key}`);
      const byNameAmt = (hubNameProjAmt.get(`${nn}|${hp.key}`) ?? []).some((a) => a === Math.round(t.invested));
      if (byMobile || byNameAmt) { if (byNameAmt && !byMobile) mergedNames.add(i.full_name); continue; }
      appRows.push({
        id: `app:${i.uid}:${hp.key}`,
        project_key: hp.key, project_name: hp.name, project_type: hp.type,
        file_no: i.fid, name: i.full_name || "Unnamed", mobile: i.phone_number || null,
        district: null, nid: null, reference: null,
        joining_date: i.created_at ? i.created_at.slice(0, 10) : null,
        total_price: 0, total_paid: t.invested, total_remaining: 0,
        dividend: t.profit, withdrawn: t.withdrawn, balance: t.balance,
        payments_count: userTxns.filter((x) => x.project_id === appProjId).length,
        reference_officer_id: null, bio: {},
        source: "app", uid: i.uid, email: i.email, is_verified: i.is_verified, is_active: i.is_active,
        invested: t.invested, profit: t.profit, app: appUser,
      });
    }
  }

  const rows: UnifiedCustomer[] = [
    ...customers.map((c) => ({ ...c, source: "hub" as const })),
    ...appRows,
  ];

  // ── unique people + top holders (grouped by name across every row) ──
  const uniqueNames = new Set<string>();
  const holdingByName = new Map<string, { name: string; balance: number }>();
  for (const r of rows) {
    const nn = normName(r.name);
    if (nn) uniqueNames.add(nn);
    const cur = holdingByName.get(nn) ?? { name: r.name || "—", balance: 0 };
    cur.balance += currentBalance(r);
    holdingByName.set(nn, cur);
  }
  const top = [...holdingByName.values()].sort((a, b) => b.balance - a.balance).slice(0, 8);

  const projOpts = summaries.map((p) => ({ key: p.key, name: p.name, type: p.type, sort: p.sort }));
  // any app-only projects (no book match) that actually produced rows
  const seenKeys = new Set(projOpts.map((p) => p.key));
  for (const r of appRows) if (!seenKeys.has(r.project_key)) { seenKeys.add(r.project_key); projOpts.push({ key: r.project_key, name: r.project_name, type: r.project_type, sort: 9000 }); }

  const denom = investors.length || 1;
  return {
    rows,
    projects: projOpts,
    health: {
      total: investors.length, verified, unverified: investors.length - verified,
      active, inactive: investors.length - active,
      verifiedPct: Math.round((verified / denom) * 100), activePct: Math.round((active / denom) * 100),
      merged: appRows.length,
    },
    top,
    totals: {
      collected: rows.reduce((s, r) => s + r.total_paid, 0),
      memberships: rows.length,
      payers: rows.filter((r) => r.total_paid > 0).length,
      uniqueCount: uniqueNames.size,
      appAccounts: investors.length,
    },
    mergedNames: [...mergedNames].sort(),
    investorTypes: types.map((t) => ({ name: t.name, operator: t.operator })),
    investorProjects: projects.map((p) => ({ project_id: p.project_id, project_name: p.project_name })),
  };
}
