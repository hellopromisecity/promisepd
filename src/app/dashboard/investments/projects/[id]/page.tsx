import { redirect } from "next/navigation";
import Link from "next/link";
import { Briefcase, MapPin } from "lucide-react";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import { EmptyState } from "@/components/admin/ui";
import { projectWithInvestors, listInvestors } from "@/lib/investments";
import { taka, fmtDate, statusTone, type ProjectMemberRow, type InvestorOpt } from "../shared";
import ProjectForm from "../ProjectForm";
import DeleteProject from "../DeleteProject";
import ProjectInvestors from "../ProjectInvestors";

export const dynamic = "force-dynamic";
export const metadata = { title: "Project", robots: { index: false } };

export default async function ProjectDetailPage(props: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me || !isAdmin(me.role)) redirect("/account");
  const { id } = await props.params;

  const admin = getAdmin();
  if (!admin) return <EmptyState icon={Briefcase} title="Data unavailable" message="Supabase isn’t configured." />;

  const data = await projectWithInvestors(admin, id);
  if (!data) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/investments/projects" className="text-sm font-semibold text-brand-blue hover:underline">← Back to projects</Link>
        <EmptyState icon={Briefcase} title="Project not found" message={`No project with id ${id}.`} />
      </div>
    );
  }

  const p = data.project;
  const tone = statusTone(p.status);
  const raised = data.members.reduce((s, m) => s + m.paid, 0);
  const pct = Math.max(0, Math.min(100, Number(p.project_progress) || 0));

  const members: ProjectMemberRow[] = data.members.map((m) => ({
    uid: m.uid, name: m.name, phone: m.phone, share: m.custom_share_price,
    discount: m.discount, start_date: m.start_date, end_date: m.end_date, paid: m.paid,
  }));
  const allInvestors: InvestorOpt[] = (await listInvestors(admin)).map((i) => ({ uid: i.uid, name: i.full_name, phone: i.phone_number }));

  const editable = {
    project_id: p.project_id, project_name: p.project_name, status: p.status,
    project_address: p.project_address, project_details: p.project_details,
    total_amount_required: p.total_amount_required, per_user_share_amount: p.per_user_share_amount,
    project_progress: Number(p.project_progress) || 0, start_date: p.start_date, end_date: p.end_date,
    hide_total_amount: p.hide_total_amount, hide_share_price: p.hide_share_price,
  };

  return (
    <div className="space-y-5">
      {/* breadcrumb + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <nav className="text-sm text-fg-muted">
            <Link href="/dashboard/investments/projects" className="font-medium text-brand-blue hover:underline">Projects</Link>
            <span className="px-1.5 text-fg-faint">/</span>
            <span className="text-fg">{p.project_name}</span>
          </nav>
          <h1 className="mt-1 truncate text-2xl font-extrabold text-fg">{p.project_name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <ProjectForm project={editable} variant="button" />
          <DeleteProject projectId={p.project_id} projectName={p.project_name} />
        </div>
      </div>

      {/* info card */}
      <div className="grid gap-5 rounded-2xl border border-border bg-bg p-5 md:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-fg-faint">{p.project_id}</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${tone.bg} ${tone.fg}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} /> {p.status}
            </span>
          </div>
          {p.project_address && <p className="flex items-start gap-1.5 text-sm text-fg"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-fg-faint" /> {p.project_address}</p>}
          {p.project_details && <p className="whitespace-pre-line text-sm leading-relaxed text-fg-muted">{p.project_details}</p>}
          {(p.start_date || p.end_date) && <p className="text-xs text-fg-muted">Period: {fmtDate(p.start_date)} – {fmtDate(p.end_date)}</p>}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-bg-soft/50 p-3">
              <p className="text-[10px] uppercase tracking-wide text-fg-faint">Total goal</p>
              <p className="text-lg font-extrabold tabular-nums text-fg">{p.hide_total_amount ? "—" : taka(p.total_amount_required)}</p>
            </div>
            <div className="rounded-xl border border-border bg-bg-soft/50 p-3">
              <p className="text-[10px] uppercase tracking-wide text-fg-faint">Default share</p>
              <p className="text-lg font-extrabold tabular-nums text-fg">{p.hide_share_price ? "—" : taka(p.per_user_share_amount)}</p>
            </div>
            <div className="rounded-xl border border-border bg-bg-soft/50 p-3">
              <p className="text-[10px] uppercase tracking-wide text-fg-faint">Raised</p>
              <p className="text-lg font-extrabold tabular-nums text-emerald-600">{taka(raised)}</p>
            </div>
            <div className="rounded-xl border border-border bg-bg-soft/50 p-3">
              <p className="text-[10px] uppercase tracking-wide text-fg-faint">Investors</p>
              <p className="text-lg font-extrabold tabular-nums text-fg">{data.members.length}</p>
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-fg-muted">Progress</span>
              <span className="font-bold tabular-nums text-fg">{pct.toFixed(1)}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-bg-soft">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-blue to-emerald-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* investors management */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-fg">Investors management</h2>
        <ProjectInvestors projectId={p.project_id} members={members} allInvestors={allInvestors} />
      </div>
    </div>
  );
}
