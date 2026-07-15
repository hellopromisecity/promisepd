import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Users, Wallet, TrendingUp, PiggyBank } from "lucide-react";
import { getCurrentUser, isManager } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import { PROJECTS } from "@/lib/site";
import { PageHeader, StatCard, Card, Badge, type Tone } from "@/components/admin/ui";
import { hubProjectMeta, hubProjectCustomers } from "@/lib/hub";
import { listProjects, matchHubProject } from "@/lib/investments";
import { getProfitConfig, accruedProfitByCustomer, dailyPerLakh } from "@/lib/deposit-profit";
import ProjectMetaPanel from "../ProjectMetaPanel";
import type { EditableProject } from "../../investments/projects/ProjectForm";
import HubCustomerList from "../HubCustomerList";
import DepositProfitPanel from "../DepositProfitPanel";
import {
  projectModel, effectiveStatus,
  shareMapFromOverride, buildingsFromOverride, sellThrough, type OverrideRow,
} from "../availability";
import OverrideForm from "../OverrideForm";

export const metadata: Metadata = { title: "Project", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
// Profit Push texts every member — give the bulk send room to finish.
export const maxDuration = 60;

const fmt = (n: number) => {
  n = Number(n) || 0;
  if (n >= 1e7) return "৳" + (n / 1e7).toFixed(2).replace(/\.?0+$/, "") + " Cr";
  if (n >= 1e5) return "৳" + (n / 1e5).toFixed(2).replace(/\.?0+$/, "") + " L";
  return "৳" + Math.round(n).toLocaleString("en-IN");
};
const pctTone = (p: number): Tone => (p >= 90 ? "danger" : p >= 60 ? "warning" : p > 0 ? "info" : "neutral");

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) redirect("/account");

  const { slug } = await params;
  const meta = await hubProjectMeta(slug);
  if (!meta) notFound();

  const admin = getAdmin();
  const customers = await hubProjectCustomers(slug);
  const payers = customers.filter((c) => c.total_paid > 0).length;
  const raised = customers.reduce((s, c) => s + c.total_paid, 0);
  const payments = customers.reduce((s, c) => s + c.payments_count, 0);

  // This book project's matching APP project (same real project, matched by
  // name) — its rich metadata is what the app/PWA reads. Surfacing it here lets
  // one edit update the book view, the app, and the investor PWA together.
  const appProjects = admin ? await listProjects(admin) : [];
  const linkedProj = matchHubProject(appProjects, meta.name);
  const editable: EditableProject | null = linkedProj
    ? {
        project_id: linkedProj.project_id,
        project_name: linkedProj.project_name,
        status: linkedProj.status,
        project_address: linkedProj.project_address,
        project_details: linkedProj.project_details,
        total_amount_required: linkedProj.total_amount_required,
        per_user_share_amount: linkedProj.per_user_share_amount,
        project_progress: Number(linkedProj.project_progress) || 0,
        start_date: linkedProj.start_date,
        end_date: linkedProj.end_date,
        hide_total_amount: linkedProj.hide_total_amount,
        hide_share_price: linkedProj.hide_share_price,
      }
    : null;

  // Deposit schemes: accrue each member's dividend per day from every deposit's
  // date until the payout date (rate is editable in the panel below).
  const isDeposit = meta.type === "deposit";
  let profits: Record<string, number> | undefined;
  let profitPanel: React.ReactNode = null;
  if (isDeposit) {
    const cfg = await getProfitConfig(slug);
    const accrued = await accruedProfitByCustomer(customers.map((c) => c.id), cfg);
    profits = {};
    for (const c of customers) { const a = accrued.get(c.id) || 0; if (a) profits[c.id] = a; }
    profitPanel = (
      <DepositProfitPanel
        projectKey={slug}
        cfg={{ enabled: cfg.enabled, per_lakh: cfg.per_lakh, cycle_days: cfg.cycle_days, cycle_start: cfg.cycle_start, payout_date: cfg.payout_date, next_payout: cfg.next_payout }}
        dailyPerLakh={dailyPerLakh(cfg)}
      />
    );
  }

  // Real-estate projects also expose the public-site availability editor.
  const staticProject = PROJECTS.find((p) => p.slug === slug);
  let override: OverrideRow | null = null;
  if (staticProject) {
    if (admin) {
      const { data } = await admin.from("project_overrides").select("slug, status, share_map, buildings").eq("slug", slug).maybeSingle();
      override = (data as OverrideRow | null) ?? null;
    }
  }
  const model = staticProject ? projectModel(staticProject) : "none";
  const st = staticProject ? sellThrough(staticProject, override) : null;
  const ovShare = shareMapFromOverride(override);
  const ovBuildings = buildingsFromOverride(override);

  return (
    <div className="space-y-6">
      <Link href="/dashboard/projects" className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg-muted transition-colors hover:text-brand-blue">
        <ArrowLeft className="h-4 w-4" /> All projects
      </Link>

      <PageHeader
        title={meta.name}
        subtitle={`${customers.length} customers · ${meta.type === "deposit" ? "deposit scheme" : "real estate"}`}
        action={staticProject && (
          <Link href={`/projects/${slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-brand-blue/40 hover:text-brand-blue">
            <ExternalLink className="h-4 w-4" /> View on site
          </Link>
        )}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Collected" value={fmt(raised)} icon={Wallet} tone="success" />
        <StatCard label="Customers" value={customers.length.toLocaleString("en-IN")} sub={`${payers} have paid`} icon={Users} tone="info" />
        <StatCard label="Payments" value={payments.toLocaleString("en-IN")} icon={TrendingUp} tone="warning" />
        <StatCard label="Avg / payer" value={fmt(payers ? raised / payers : 0)} icon={PiggyBank} tone="neutral" />
      </div>

      <ProjectMetaPanel linked={editable} hubName={meta.name} appHref={linkedProj ? `/dashboard/investments/projects/${linkedProj.project_id}` : null} />

      {profitPanel}

      <HubCustomerList customers={customers} project={{ key: slug, name: meta.name, type: meta.type, sort: meta.sort }} profits={profits} />

      {staticProject && (
        <>
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-fg">Public availability (live on the website)</h2>
              <div className="flex items-center gap-2">
                <Badge tone="info">{effectiveStatus(staticProject, override)}</Badge>
                {override && <Badge tone="warning">override active</Badge>}
              </div>
            </div>
            {st ? (
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-fg-muted">{st.sold}/{st.total} {st.unit} sold</span>
                  <Badge tone={pctTone(st.pct)}>{st.pct}% sold</Badge>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-bg-soft"><div className="h-2 rounded-full bg-brand-blue" style={{ width: `${st.pct}%` }} /></div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-fg-muted">This project only carries a status on the public site.</p>
            )}
          </Card>

          <Card>
            <h2 className="text-sm font-bold text-fg">Edit public availability</h2>
            <p className="mb-5 mt-0.5 text-xs text-fg-muted">Writes an override that takes precedence over the code values everywhere on the site. Placeholders show the current defaults.</p>
            <OverrideForm
              slug={slug}
              model={model}
              hasOverride={!!override}
              defaults={{
                status: staticProject.status,
                share: staticProject.shareMap?.total ? { total: staticProject.shareMap.total, sold: staticProject.shareMap.sold, note: staticProject.shareMap.note ?? "" } : null,
                buildings: staticProject.buildings?.total ? { total: staticProject.buildings.total, soldOut: staticProject.buildings.soldOut, nowBooking: staticProject.buildings.nowBooking } : null,
              }}
              current={{
                status: override?.status ?? "",
                share: ovShare ? { total: ovShare.total, sold: ovShare.sold, note: ovShare.note ?? "" } : null,
                buildings: ovBuildings ?? null,
              }}
            />
          </Card>
        </>
      )}
    </div>
  );
}
