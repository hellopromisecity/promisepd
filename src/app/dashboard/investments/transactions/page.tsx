import { redirect } from "next/navigation";
import { ReceiptText } from "lucide-react";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import { PageHeader, EmptyState } from "@/components/admin/ui";
import { listTransactions, listTypes, listInvestors, listProjects, nameMaps } from "@/lib/investments";
import TransactionsExplorer, { type Row } from "./TransactionsExplorer";

export const dynamic = "force-dynamic";

export const metadata = { title: "All Transactions", robots: { index: false } };

const localPhone = (p: string) => {
  const d = (p || "").replace(/\D/g, "");
  return d.startsWith("880") && d.length === 13 ? "0" + d.slice(3) : p;
};

export default async function InvestorTransactionsPage() {
  const me = await getCurrentUser();
  if (!me || !isAdmin(me.role)) redirect("/account");

  const admin = getAdmin();
  if (!admin) {
    return (
      <div className="space-y-6">
        <PageHeader title="All Transactions" subtitle="Every investor deposit, profit and withdrawal." />
        <EmptyState icon={ReceiptText} title="Data unavailable" message="Supabase isn’t configured." />
      </div>
    );
  }

  const [all, types, maps, investors, projects] = await Promise.all([
    listTransactions(admin),
    listTypes(admin),
    nameMaps(admin),
    listInvestors(admin),
    listProjects(admin),
  ]);
  const op = new Map(types.map((t) => [t.name, t.operator]));

  const rows: Row[] = all.map((t) => ({
    transaction_id: t.transaction_id,
    uid: t.uid,
    userName: maps.investorName.get(t.uid) || t.uid,
    type: t.type,
    operator: op.get(t.type) ?? "+",
    amount: Number(t.amount) || 0,
    date: t.date,
    projectId: t.project_id,
    projectName: t.project_id ? maps.projectName.get(t.project_id) ?? t.project_id : null,
    rashid: t.rashid_number,
    description: t.description,
  }));

  const investorOptions = investors.map((i) => ({ uid: i.uid, label: `${i.full_name || "Unnamed"} — ${localPhone(i.phone_number)}` }));
  const typeOptions = types.map((t) => ({ name: t.name, operator: t.operator }));
  const projectOptions = projects.map((p) => ({ project_id: p.project_id, project_name: p.project_name }));

  return (
    <div className="space-y-6">
      <PageHeader title="All Transactions" subtitle={`${all.length.toLocaleString("en-US")} investor transactions.`} />
      <TransactionsExplorer rows={rows} investors={investorOptions} types={typeOptions} projects={projectOptions} />
    </div>
  );
}
