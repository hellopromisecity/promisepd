import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdmin } from "@/lib/admin-guard";
import { BLOG_POSTS } from "@/lib/blog";
import {
  listInvestors, listProjects, listTypes, listTransactions, bal,
  type InvestorAccount, type InvestmentProject, type InvestmentType, type InvestorTransaction,
} from "@/lib/investments";
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
  const [members, leads, recentLeadsList, blogCount] = await Promise.all([
    tableCount("profiles"),
    tableCount("contact_submissions"),
    recentLeads(),
    publishedBlogCount(),
  ]);

  // ---- real investment data (one set of fetches, computed in-process) ----
  let inv: DashboardData["investment"] = {
    aum: 0, invested: 0, profit: 0, withdrawn: 0, investors: 0, paying: 0,
    projects: 0, raised: 0, txnCount: 0,
    txns: [], funding: [], topInvestors: [], recentTxns: [],
  };

  if (admin) {
    const [investors, projects, types, txns]: [InvestorAccount[], InvestmentProject[], InvestmentType[], InvestorTransaction[]] =
      await Promise.all([listInvestors(admin), listProjects(admin), listTypes(admin), listTransactions(admin)]);

    const op = new Map(types.map((t) => [t.name, t.operator]));
    const pname = new Map(projects.map((p) => [p.project_id, p.project_name]));
    const iname = new Map(investors.map((i) => [i.uid, i.full_name]));

    let aum = 0, invested = 0, profit = 0, withdrawn = 0, paying = 0;
    for (const i of investors) {
      const b = bal(i.balance);
      aum += b.total_balance; invested += b.total_investment; profit += b.total_profit; withdrawn += b.total_withdrawn;
      if (b.total_balance !== 0 || b.total_investment > 0 || b.total_profit > 0 || b.total_withdrawn > 0) paying++;
    }

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

    const raised = [...raisedByProject.values()].reduce((s, v) => s + v, 0);
    const funding = projects
      .map((p) => {
        const r = raisedByProject.get(p.project_id) ?? 0;
        const goal = Number(p.total_amount_required) || 0;
        return { name: p.project_name, raised: r, goal, pct: goal > 0 ? Math.min(100, Math.round((r / goal) * 100)) : 0 };
      })
      .filter((f) => f.goal > 0)
      .sort((a, b) => b.raised - a.raised)
      .slice(0, 6);

    const topInvestors = [...investors]
      .map((i) => ({ name: i.full_name, balance: bal(i.balance).total_balance }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 8);

    const recentTxns = txns.slice(0, 7).map((t) => ({
      name: iname.get(t.uid) ?? t.uid,
      type: t.type,
      op: op.get(t.type) ?? "+",
      amount: Number(t.amount) || 0,
      date: String(t.date),
      project: t.project_id ? pname.get(t.project_id) ?? null : null,
    }));

    inv = {
      aum, invested, profit, withdrawn, investors: investors.length, paying,
      projects: projects.length, raised, txnCount: txns.length,
      txns: txnList, funding, topInvestors, recentTxns,
    };
  }

  const data: DashboardData = {
    investment: inv,
    members: members ?? 0,
    leads: leads ?? 0,
    blogCount,
    recentLeads: recentLeadsList,
  };

  return <DashboardView data={data} />;
}
