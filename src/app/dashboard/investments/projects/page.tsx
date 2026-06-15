import { redirect } from "next/navigation";
import { Briefcase, Target, Wallet } from "lucide-react";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import {
  PageHeader,
  StatCard,
  Badge,
  EmptyState,
  TableShell,
  thCls,
  tdCls,
  type Tone,
} from "@/components/admin/ui";
import { listProjects, taka, fmtDate, type InvestmentProject } from "@/lib/investments";

export const dynamic = "force-dynamic";

export const metadata = { title: "Investment Projects", robots: { index: false } };

function statusTone(s: string): Tone {
  const v = s.toLowerCase();
  if (v.includes("complete") || v.includes("done")) return "success";
  if (v.includes("ongoing") || v.includes("active")) return "info";
  if (v.includes("hold") || v.includes("pause")) return "warning";
  if (v.includes("cancel") || v.includes("close")) return "danger";
  return "neutral";
}

export default async function InvestmentProjectsPage() {
  const me = await getCurrentUser();
  if (!me || !isAdmin(me.role)) redirect("/account");

  const admin = getAdmin();
  if (!admin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Investment Projects" subtitle="Funds and schemes investors put money into." />
        <EmptyState icon={Briefcase} title="Data unavailable" message="Supabase isn’t configured." />
      </div>
    );
  }

  const projects: InvestmentProject[] = await listProjects(admin);
  const required = projects.reduce((s, p) => s + (Number(p.total_amount_required) || 0), 0);
  const funded = projects.reduce((s, p) => s + (Number(p.current_funded_amount) || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Investment Projects" subtitle={`${projects.length} projects ported from the app.`} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Projects" value={projects.length} sub="total" icon={Briefcase} tone="info" />
        <StatCard label="Required" value={taka(required)} sub="target across all" icon={Target} tone="warning" />
        <StatCard label="Funded" value={taka(funded)} sub="raised so far" icon={Wallet} tone="success" />
      </div>

      {projects.length === 0 ? (
        <EmptyState icon={Briefcase} title="No projects yet" message="Imported investment projects will appear here." />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <th className={thCls}>Project</th>
              <th className={thCls}>Status</th>
              <th className={`${thCls} text-right`}>Required</th>
              <th className={`${thCls} text-right`}>Funded</th>
              <th className={thCls}>Progress</th>
              <th className={`${thCls} text-right`}>Share price</th>
              <th className={thCls}>Period</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => {
              const pct = Math.max(0, Math.min(100, Number(p.project_progress) || 0));
              return (
                <tr key={p.project_id}>
                  <td className={tdCls}>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-fg">{p.project_name}</p>
                      <p className="truncate text-xs text-fg-muted">
                        <span className="font-mono text-fg-faint">{p.project_id}</span>
                        {p.project_address ? ` · ${p.project_address}` : ""}
                      </p>
                    </div>
                  </td>
                  <td className={tdCls}>
                    <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                  </td>
                  <td className={`${tdCls} text-right text-fg-muted`}>
                    {p.hide_total_amount ? "—" : taka(p.total_amount_required)}
                  </td>
                  <td className={`${tdCls} text-right font-semibold text-fg`}>{taka(p.current_funded_amount)}</td>
                  <td className={tdCls}>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-bg-soft">
                        <div className="h-full rounded-full bg-brand-blue" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs tabular-nums text-fg-muted">{Math.round(pct)}%</span>
                    </div>
                  </td>
                  <td className={`${tdCls} text-right text-fg-muted`}>
                    {p.hide_share_price ? "—" : taka(p.per_user_share_amount)}
                  </td>
                  <td className={`${tdCls} whitespace-nowrap text-xs text-fg-muted`}>
                    {p.start_date || p.end_date ? `${fmtDate(p.start_date)} – ${fmtDate(p.end_date)}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}
