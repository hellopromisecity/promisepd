import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Landmark, Users, Wallet, TrendingUp, PiggyBank, ArrowRight } from "lucide-react";
import { getCurrentUser, isManager } from "@/lib/auth";
import { PageHeader, StatCard, EmptyState } from "@/components/admin/ui";
import { hubProjectSummaries, type HubProjectSummary } from "@/lib/hub";

export const metadata: Metadata = { title: "Projectify", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** ৳ compact — Cr / L / grouped. */
const fmt = (n: number) => {
  n = Number(n) || 0;
  if (n >= 1e7) return "৳" + (n / 1e7).toFixed(2).replace(/\.?0+$/, "") + " Cr";
  if (n >= 1e5) return "৳" + (n / 1e5).toFixed(2).replace(/\.?0+$/, "") + " L";
  return "৳" + Math.round(n).toLocaleString("en-IN");
};

export default async function ProjectsHubPage() {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) redirect("/account");

  const projects = await hubProjectSummaries();
  const t = projects.reduce(
    (a, p) => ({ raised: a.raised + p.raised, customers: a.customers + p.customers, payers: a.payers + p.payers, payments: a.payments + p.payments }),
    { raised: 0, customers: 0, payers: 0, payments: 0 },
  );
  const realEstate = projects.filter((p) => p.type === "realestate");
  const deposits = projects.filter((p) => p.type === "deposit");

  return (
    <div className="space-y-7">
      <PageHeader title="Projectify" subtitle="Every project's customers and collections — the whole company at a glance." />

      {projects.length === 0 ? (
        <EmptyState icon={Building2} title="No project data yet" message="Import the customer books to populate the hub." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total collected" value={fmt(t.raised)} sub={`across ${projects.length} projects`} icon={Wallet} tone="success" />
            <StatCard label="Customers" value={t.customers.toLocaleString("en-IN")} sub={`${t.payers.toLocaleString("en-IN")} have paid`} icon={Users} tone="info" />
            <StatCard label="Payments" value={t.payments.toLocaleString("en-IN")} sub="receipts logged" icon={TrendingUp} tone="warning" />
            <StatCard label="Avg / payer" value={fmt(t.payers ? t.raised / t.payers : 0)} sub="all projects" icon={PiggyBank} tone="neutral" />
          </div>

          <ProjectGroup title="Real Estate" icon={Building2} projects={realEstate} lead={<AllCustomersCard customers={t.customers} raised={t.raised} />} />
          <ProjectGroup title="Deposit Schemes" icon={Landmark} projects={deposits} />
        </>
      )}
    </div>
  );
}

function ProjectGroup({ title, icon: Icon, projects, lead }: { title: string; icon: typeof Building2; projects: HubProjectSummary[]; lead?: React.ReactNode }) {
  if (!projects.length && !lead) return null;
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-brand-blue" />
        <h2 className="text-sm font-bold uppercase tracking-wide text-fg-muted">{title}</h2>
        <span className="text-xs text-fg-faint">({projects.length})</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lead}
        {projects.map((p) => <ProjectCard key={p.key} p={p} />)}
      </div>
    </section>
  );
}

function AllCustomersCard({ customers, raised }: { customers: number; raised: number }) {
  return (
    <Link href="/dashboard/projects/all" className="group relative overflow-hidden rounded-2xl border-2 border-brand-blue/40 bg-brand-blue-tint/40 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-brand-blue-dark">All Customers</h3>
          <p className="mt-0.5 text-xs text-fg-muted">every project combined</p>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-blue text-white transition-transform duration-300 group-hover:scale-110"><Users className="h-5 w-5" /></span>
      </div>
      <p className="mt-4 text-2xl font-extrabold tabular-nums text-brand-blue">{customers.toLocaleString("en-IN")}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-faint">customers · {fmt(raised)} collected</p>
      <div className="mt-3 flex items-center justify-end text-xs">
        <span className="inline-flex items-center gap-1 font-semibold text-brand-blue">Open <ArrowRight className="h-3.5 w-3.5" /></span>
      </div>
    </Link>
  );
}

function ProjectCard({ p }: { p: HubProjectSummary }) {
  const pct = p.customers ? Math.round((p.payers / p.customers) * 100) : 0;
  const Icon = p.type === "deposit" ? Landmark : Building2;
  return (
    <Link
      href={`/dashboard/projects/${p.key}`}
      className="group relative overflow-hidden rounded-2xl border border-border bg-bg p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-blue/40 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-fg">{p.name}</h3>
          <p className="mt-0.5 text-xs text-fg-muted">{p.customers} customers · {p.payers} paid</p>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-blue-tint text-brand-blue transition-transform duration-300 group-hover:scale-110">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-2xl font-extrabold tabular-nums text-brand-blue">{fmt(p.raised)}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-faint">collected</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg-soft">
        <div className="h-1.5 rounded-full bg-brand-blue" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-fg-muted">
        <span>avg {fmt(p.avg)}</span>
        <span className="inline-flex items-center gap-1 font-semibold text-brand-blue opacity-0 transition-opacity group-hover:opacity-100">
          View all <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
