import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser, isManager } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { loadAllCustomers } from "@/lib/all-customers";
import AllCustomersExplorer from "../AllCustomersExplorer";

export const metadata: Metadata = { title: "All Customers", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AllCustomersPage() {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) redirect("/account");

  const data = await loadAllCustomers();
  const projectCount = data.projects.filter((p) => p.type !== "investment").length;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/projects" className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg-muted transition-colors hover:text-brand-blue">
        <ArrowLeft className="h-4 w-4" /> All projects
      </Link>
      <PageHeader
        title="All Customers"
        subtitle={`${data.totals.uniqueCount.toLocaleString("en-IN")} customers across ${projectCount} projects — one row per app account, exactly like App Users; open anyone to see their project breakdown.`}
      />
      <AllCustomersExplorer
        people={data.people}
        projects={data.projects}
        health={data.health}
        top={data.top}
        totals={data.totals}
        investorTypes={data.investorTypes}
        investorProjects={data.investorProjects}
      />
    </div>
  );
}
