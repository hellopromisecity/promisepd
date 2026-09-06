import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, isManager } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { loadFinance } from "@/lib/finance";
import FinanceOverview from "./FinanceOverview";
import FinanceTabs from "./FinanceTabs";

export const metadata: Metadata = { title: "Finance · Overview", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function FinanceOverviewPage() {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) redirect("/account");
  const data = await loadFinance();
  return (
    <div className="space-y-6">
      <PageHeader title="Finance · Overview" subtitle="Income and expense by head, the net, and where the money sits — the office book at a glance." action={<FinanceTabs active="overview" />} />
      <FinanceOverview data={data} />
    </div>
  );
}
