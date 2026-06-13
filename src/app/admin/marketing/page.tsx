import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Megaphone, ListChecks } from "lucide-react";
import { getCurrentUser, isManager } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import { PageHeader, EmptyState } from "@/components/admin/ui";
import { PROJECTS } from "@/lib/site";
import { pointsForProject } from "@/lib/marketing";
import MarketingOfficers, { type Officer, type ProjectOpt } from "./MarketingOfficers";

export const metadata: Metadata = {
  title: "Marketing",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function MarketingOverviewPage() {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) redirect("/account");

  const followupsLink = (
    <Link
      href="/admin/marketing/followup"
      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-brand-blue/40"
    >
      <ListChecks className="h-4 w-4" /> Client follow-up
    </Link>
  );

  const admin = getAdmin();
  if (!admin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Marketing" subtitle="Officer leaderboard." action={followupsLink} />
        <EmptyState icon={Megaphone} title="Data unavailable" message="Supabase isn't configured." />
      </div>
    );
  }

  const { data } = await admin
    .from("marketing_officers")
    .select("id, name, officer_type, position, district, officer_code, mobile, points")
    .order("points", { ascending: false });

  const officers = (data ?? []) as Officer[];
  const projectOpts: ProjectOpt[] = PROJECTS.map((p) => ({
    slug: p.slug,
    name: p.name,
    points: pointsForProject(p.slug),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing"
        subtitle="Officer leaderboard — ranked by points. Add officers and award points per project."
        action={followupsLink}
      />
      <MarketingOfficers officers={officers} projects={projectOpts} />
    </div>
  );
}
