import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, isManager } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { loadProfitify } from "@/lib/profitify";
import ProfitifyExplorer from "./ProfitifyExplorer";

export const metadata: Metadata = { title: "Profitify", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
// engine payouts recompute every member's cycle — give it room
export const maxDuration = 60;

export default async function ProfitifyPage() {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) redirect("/account");
  const data = await loadProfitify();
  return (
    <div className="space-y-6">
      <PageHeader title="Profitify" subtitle="Every taka of profit the company has paid out — year by year, scheme by scheme, member by member. Special pays every July, General A every 2 years, General B on its own 2-year beat, Monthly every 5." />
      <ProfitifyExplorer data={data} />
    </div>
  );
}
