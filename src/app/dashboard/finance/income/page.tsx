import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, isManager } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { loadFinance } from "@/lib/finance";
import LedgerExplorer from "../LedgerExplorer";
import FinanceTabs from "../FinanceTabs";

export const metadata: Metadata = { title: "Finance · Income", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function IncomePage() {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) redirect("/account");
  const data = await loadFinance();
  return (
    <div className="space-y-6">
      <PageHeader title="Finance · Income" subtitle="আয় — মূলধন, নগদ বিক্রয়, বুকিং মানি, কিস্তি, সার্ভিস চার্জ, বিবিধ… every taka that came in, by head." action={<FinanceTabs active="income" />} />
      <LedgerExplorer kind="income" data={data} canManageHeads={me.role === "admin"} />
    </div>
  );
}
