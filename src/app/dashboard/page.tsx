import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdmin } from "@/lib/admin-guard";
import { BLOG_POSTS } from "@/lib/blog";
import {
  listInvestors, listProjects, listTypes, listTransactions, bal,
  type InvestorAccount, type InvestmentProject, type InvestmentType, type InvestorTransaction,
} from "@/lib/investments";
import { loadAllCustomers } from "@/lib/all-customers";
import { smsStats } from "@/lib/sms-stats";
import DashboardView, { type DashboardData } from "./DashboardView";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const PROFIT_TYPES = new Set(["profit", "profit_share"]);

async function tableCount(table: "profiles" | "contact_submissions"): Promise<number | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const { count, error } = await admin.from(table).select("*", { count: "exact", head: true });
  return error ? null : count;
}

async function publishedBlogCount(): Promise<number> {
  const admin = createAdminClient();
  if (!admin) return BLOG_POSTS.length;
  const { data, error } = await admin.from("blog_posts").select("slug").eq("status", "published");
  if (error || !data) return BLOG_POSTS.length;
  const codeSlugs = new Set(BLOG_POSTS.map((p) => p.slug));
  return BLOG_POSTS.length + (data as { slug: string }[]).filter((r) => !codeSlugs.has(r.slug)).length;
}

async function recentLeads() {
  const admin = createAdminClient();
  if (!admin) return [] as { name: string; interest: string | null; created_at: string }[];
  const { data } = await admin
    .from("contact_submissions")
    .select("name, interest, created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  return data ?? [];
}

export default async function AdminDashboard() {
  const admin = getAdmin();
  const [members, leads, recentLeadsList, blogCount, sms] = await Promise.all([
    tableCount("profiles"),
    tableCount("contact_submissions"),
    recentLeads(),
    publishedBlogCount(),
    smsStats(),
  ]);

  // ---- real investment data (one set of fetches, computed in-process) ----
  let inv: DashboardData["investment"] = {
    aum: 0, invested: 0, profit: 0, withdrawn: 0, investors: 0, paying: 0,
    projects: 0, raised: 0, txnCount: 0,
    txns: [], funding: [], topInvestors: [], recentTxns: [],
  };

  if (admin) {
    // Projectify's All Customers is the source of truth for the headline
    // cards — the exact numbers the user sees on /dashboard/projects
    // (book + app merged, one row per person, accrued dividends included).
    const [investors, projects, types, txns, ac]: [InvestorAccount[], InvestmentProject[], InvestmentType[], InvestorTransaction[], Awaited<ReturnType<typeof loadAllCustomers>>] =
      await Promise.all([listInvestors(admin), listProjects(admin), listTypes(admin), listTransactions(admin), loadAllCustomers()]);

    const op = new Map(types.map((t) => [t.name, t.operator]));
    const pname = new Map(projects.map((p) => [p.project_id, p.project_name]));
    const iname = new Map(investors.map((i) => [i.uid, i.full_name]));

    let withdrawn = 0;
    for (const i of investors) withdrawn += bal(i.balance).total_withdrawn;

    // raised per project (for funding) + a compact txn list the client uses to
    // recompute the capital flow for any selected date range.
    const raisedByProject = new Map<string, number>();
    const txnList: { date: string; op: string; amount: number }[] = [];
    for (const t of txns) {
      const amt = Number(t.amount) || 0;
      const o = op.get(t.type) ?? "+";
      txnList.push({ date: String(t.date), op: o, amount: amt });
      if (t.project_id && o !== "-" && !PROFIT_TYPES.has(String(t.type))) {
        raisedByProject.set(t.project_id, (raisedByProject.get(t.project_id) ?? 0) + amt);
      }
    }

    const funding = projects
      .map((p) => {
        const r = raisedByProject.get(p.project_id) ?? 0;
        const goal = Number(p.total_amount_required) || 0;
        return { name: p.project_name, raised: r, goal, pct: goal > 0 ? Math.min(100, Math.round((r / goal) * 100)) : 0 };
      })
      .filter((f) => f.goal > 0)
      .sort((a, b) => b.raised - a.raised)
      .slice(0, 6);

    // Skip future-dated entries (e.g. a scheduled maturity withdrawal) —
    // "recent" means things that have actually happened.
    const nowMs = Date.now();
    const recentTxns = txns.filter((t) => new Date(t.date).getTime() <= nowMs).slice(0, 7).map((t) => ({
      name: iname.get(t.uid) ?? t.uid,
      type: t.type,
      op: op.get(t.type) ?? "+",
      amount: Number(t.amount) || 0,
      date: String(t.date),
      project: t.project_id ? pname.get(t.project_id) ?? null : null,
    }));

    inv = {
      aum: ac.people.reduce((s, p) => s + p.totalBalance, 0),
      invested: ac.totals.collected,
      profit: ac.people.reduce((s, p) => s + p.totalProfit, 0),
      withdrawn,
      investors: ac.totals.uniqueCount,
      paying: ac.totals.payers,
      projects: ac.projects.length,
      raised: ac.totals.memberships, // shown as "N memberships" on the Projects card
      txnCount: txns.length,
      txns: txnList, funding, topInvestors: ac.top, recentTxns,
    };
  }

  const data: DashboardData = {
    investment: inv,
    members: members ?? 0,
    leads: leads ?? 0,
    blogCount,
    recentLeads: recentLeadsList,
    sms: sms
      ? {
          estBalance: sms.estBalance, balance: sms.balance, remainingSms: sms.remainingSms, rate: sms.rate,
          sent30d: sms.sent30d, sentToday: sms.sentToday, sent7d: sms.sent7d, cost30d: sms.cost30d, cost7d: sms.cost7d,
        }
      : null,
  };

  return <DashboardView data={data} />;
}
