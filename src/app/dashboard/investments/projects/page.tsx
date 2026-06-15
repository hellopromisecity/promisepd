import { redirect } from "next/navigation";
import { Briefcase } from "lucide-react";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import { PageHeader, EmptyState } from "@/components/admin/ui";
import { listProjects, projectStats, type InvestmentProject } from "@/lib/investments";
import ProjectsExplorer from "./ProjectsExplorer";
import type { ProjectCardData } from "./shared";

export const dynamic = "force-dynamic";
export const metadata = { title: "Investment Projects", robots: { index: false } };

export default async function InvestmentProjectsPage() {
  const me = await getCurrentUser();
  if (!me || !isAdmin(me.role)) redirect("/account");

  const admin = getAdmin();
  if (!admin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Projects" subtitle="Funds and schemes investors put money into." />
        <EmptyState icon={Briefcase} title="Data unavailable" message="Supabase isn’t configured." />
      </div>
    );
  }

  const [projects, stats] = await Promise.all([listProjects(admin), projectStats(admin)]);
  const cards: ProjectCardData[] = (projects as InvestmentProject[]).map((p) => {
    const st = stats.get(p.project_id) ?? { investors: 0, raised: 0 };
    return {
      project_id: p.project_id,
      project_name: p.project_name,
      status: p.status,
      address: p.project_address,
      details: p.project_details,
      goal: p.total_amount_required,
      share: p.per_user_share_amount,
      progress: Number(p.project_progress) || 0,
      raised: st.raised,
      investors: st.investors,
      hide_total: p.hide_total_amount,
      hide_share: p.hide_share_price,
      start_date: p.start_date,
      end_date: p.end_date,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Projects" subtitle={`${projects.length} investment projects — search, manage funding, and assign investors.`} />
      <ProjectsExplorer projects={cards} />
    </div>
  );
}
