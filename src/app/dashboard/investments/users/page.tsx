import { redirect } from "next/navigation";
import { UsersRound } from "lucide-react";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import { PageHeader, EmptyState } from "@/components/admin/ui";
import {
  listInvestors, listTypes, listProjects, listTransactions, bal,
  type InvestorAccount, type InvestmentType, type InvestmentProject, type InvestorTransaction,
} from "@/lib/investments";
import AppUsersExplorer from "./AppUsersExplorer";
import type { AppUser, UserTxn } from "./shared";

export const dynamic = "force-dynamic";
export const metadata = { title: "App Users", robots: { index: false } };

export default async function InvestorUsersPage() {
  const me = await getCurrentUser();
  if (!me || !isAdmin(me.role)) redirect("/account");

  const admin = getAdmin();
  if (!admin) {
    return (
      <div className="space-y-6">
        <PageHeader title="App Users" subtitle="Investor accounts." />
        <EmptyState icon={UsersRound} title="Data unavailable" message="Supabase isn’t configured." />
      </div>
    );
  }

  const [investors, types, projects, txns]: [InvestorAccount[], InvestmentType[], InvestmentProject[], InvestorTransaction[]] =
    await Promise.all([listInvestors(admin), listTypes(admin), listProjects(admin), listTransactions(admin)]);

  const op = new Map(types.map((t) => [t.name, t.operator]));
  const pname = new Map(projects.map((p) => [p.project_id, p.project_name]));

  // group every investor's transactions (already newest-first from the reader)
  const byUid = new Map<string, UserTxn[]>();
  for (const t of txns) {
    const list = byUid.get(t.uid) ?? [];
    list.push({
      transaction_id: t.transaction_id,
      date: t.date,
      type: t.type,
      operator: op.get(t.type) ?? "+",
      amount: Number(t.amount) || 0,
      project_id: t.project_id,
      project_name: t.project_id ? pname.get(t.project_id) ?? null : null,
      rashid_number: t.rashid_number,
      description: t.description,
    });
    byUid.set(t.uid, list);
  }

  const users: AppUser[] = investors.map((i) => {
    const b = bal(i.balance);
    return {
      uid: i.uid,
      fid: i.fid,
      full_name: i.full_name,
      phone_number: i.phone_number,
      email: i.email,
      language: i.language,
      is_verified: i.is_verified,
      is_active: i.is_active,
      created_at: i.created_at,
      last_login: i.last_login,
      invested: b.total_investment,
      profit: b.total_profit,
      withdrawn: b.total_withdrawn,
      balance: b.total_balance,
      txns: byUid.get(i.uid) ?? [],
    };
  });

  const typeOpts = types.map((t) => ({ name: t.name, operator: t.operator }));
  const projectOpts = projects.map((p) => ({ project_id: p.project_id, project_name: p.project_name }));

  return (
    <div className="space-y-6">
      <PageHeader title="App Users" subtitle={`${investors.length} investor accounts — search, filter, manage, and export.`} />
      <AppUsersExplorer users={users} types={typeOpts} projects={projectOpts} />
    </div>
  );
}
