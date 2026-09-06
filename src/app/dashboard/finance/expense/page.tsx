import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, isManager } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { loadFinance } from "@/lib/finance";
import LedgerExplorer from "../LedgerExplorer";
import FinanceTabs from "../FinanceTabs";

export const metadata: Metadata = { title: "Finance · Expense", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ExpensePage() {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) redirect("/account");
  const data = await loadFinance();
  return (
    <div className="space-y-6">
      <PageHeader title="Finance · Expense" subtitle="ব্যয় — office rent, salary, registration, promotion, commission… every taka that went out, by head." action={<FinanceTabs active="expense" />} />
      <LedgerExplorer kind="expense" data={data} canManageHeads={me.role === "admin"} />
    </div>
  );
}
