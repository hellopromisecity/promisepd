import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Users, Wallet, TrendingUp, PiggyBank } from "lucide-react";
import { getCurrentUser, isManager } from "@/lib/auth";
import { PageHeader, StatCard } from "@/components/admin/ui";
import { hubAllCustomers, hubProjectSummaries } from "@/lib/hub";
import HubCustomerList, { type HubProject } from "../HubCustomerList";

export const metadata: Metadata = { title: "All Customers", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const fmt = (n: number) => {
  n = Number(n) || 0;
  if (n >= 1e7) return "৳" + (n / 1e7).toFixed(2).replace(/\.?0+$/, "") + " Cr";
  if (n >= 1e5) return "৳" + (n / 1e5).toFixed(2).replace(/\.?0+$/, "") + " L";
  return "৳" + Math.round(n).toLocaleString("en-IN");
};

export default async function AllCustomersPage() {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) redirect("/account");

  const [customers, summaries] = await Promise.all([hubAllCustomers(), hubProjectSummaries()]);
  const payers = customers.filter((c) => c.total_paid > 0).length;
  const raised = customers.reduce((s, c) => s + c.total_paid, 0);
  const payments = customers.reduce((s, c) => s + c.payments_count, 0);
  const projects: HubProject[] = summaries.map((p) => ({ key: p.key, name: p.name, type: p.type, sort: p.sort }));

  return (
    <div className="space-y-6">
      <Link href="/dashboard/projects" className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg-muted transition-colors hover:text-brand-blue">
        <ArrowLeft className="h-4 w-4" /> All projects
      </Link>
      <PageHeader title="All Customers" subtitle={`Every customer across all ${summaries.length} projects, in one place.`} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total collected" value={fmt(raised)} icon={Wallet} tone="success" />
        <StatCard label="Customers" value={customers.length.toLocaleString("en-IN")} sub={`${payers} have paid`} icon={Users} tone="info" />
        <StatCard label="Payments" value={payments.toLocaleString("en-IN")} icon={TrendingUp} tone="warning" />
        <StatCard label="Avg / payer" value={fmt(payers ? raised / payers : 0)} icon={PiggyBank} tone="neutral" />
      </div>

      <HubCustomerList customers={customers} project={{ key: "all", name: "All Customers", type: "all", sort: 0 }} projects={projects} />
    </div>
  );
}
