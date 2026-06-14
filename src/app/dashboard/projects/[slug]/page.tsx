import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Building2 } from "lucide-react";
import { getCurrentUser, isManager } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import { PROJECTS } from "@/lib/site";
import { PageHeader, Card, Badge, type Tone } from "@/components/admin/ui";
import {
  projectModel,
  effectiveStatus,
  effectiveShareMap,
  effectiveBuildings,
  shareMapFromOverride,
  buildingsFromOverride,
  sellThrough,
  type OverrideRow,
} from "../availability";
import OverrideForm from "../OverrideForm";

export const metadata: Metadata = {
  title: "Edit project",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

function pctTone(pct: number): Tone {
  if (pct >= 90) return "danger";
  if (pct >= 60) return "warning";
  if (pct > 0) return "info";
  return "neutral";
}

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) redirect("/account");

  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug);
  if (!project) notFound();

  const admin = getAdmin();
  let override: OverrideRow | null = null;
  let dbDown = false;
  if (admin) {
    const { data, error } = await admin
      .from("project_overrides")
      .select("slug, status, share_map, buildings")
      .eq("slug", slug)
      .maybeSingle();
    if (error) dbDown = true;
    else override = (data as OverrideRow | null) ?? null;
  } else {
    dbDown = true;
  }

  const model = projectModel(project);
  const hasOverride = !!override;

  // Effective (override-on-top-of-code) values, for the summary + form seed.
  const st = sellThrough(project, override);
  const effStatus = effectiveStatus(project, override);
  const effShare = effectiveShareMap(project, override);
  const effBuildings = effectiveBuildings(project, override);

  // Code defaults — shown as placeholders so the editor sees what they override.
  const defaults = {
    status: project.status,
    share: project.shareMap?.total
      ? { total: project.shareMap.total, sold: project.shareMap.sold, note: project.shareMap.note ?? "" }
      : null,
    buildings: project.buildings?.total
      ? {
          total: project.buildings.total,
          soldOut: project.buildings.soldOut,
          nowBooking: project.buildings.nowBooking,
        }
      : null,
  };

  // Currently-saved override values (seed the controlled inputs).
  const ovShare = shareMapFromOverride(override);
  const ovBuildings = buildingsFromOverride(override);
  const current = {
    status: override?.status ?? "",
    share: ovShare ? { total: ovShare.total, sold: ovShare.sold, note: ovShare.note ?? "" } : null,
    buildings: ovBuildings ?? null,
  };

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/projects"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg-muted transition-colors hover:text-brand-blue"
      >
        <ArrowLeft className="h-4 w-4" /> Back to projects
      </Link>

      <PageHeader
        title={project.name}
        subtitle={`${project.location} · slug: ${project.slug}`}
        action={
          <Link
            href={`/projects/${project.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-brand-blue/40 hover:text-brand-blue"
          >
            <ExternalLink className="h-4 w-4" /> View on site
          </Link>
        }
      />

      {dbDown && (
        <Card className="border-amber-200 bg-amber-50/60">
          <p className="text-sm text-amber-800">
            Supabase isn’t configured. You can review the code values below, but saving an override
            won’t work until the database is connected.
          </p>
        </Card>
      )}

      {/* Current effective availability */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-fg">Current availability (live on the site)</h2>
          <div className="flex items-center gap-2">
            <Badge tone="info">{effStatus}</Badge>
            {hasOverride && <Badge tone="warning">override active</Badge>}
          </div>
        </div>

        {st ? (
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-fg-muted">
                {st.sold}/{st.total} {st.unit} sold
              </span>
              <Badge tone={pctTone(st.pct)}>{st.pct}% sold</Badge>
            </div>
            <div className="h-2 rounded-full bg-bg-soft">
              <div className="h-2 rounded-full bg-brand-blue" style={{ width: `${st.pct}%` }} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              {effShare && (
                <>
                  <Fact label="Total shares" value={effShare.total} />
                  <Fact label="Sold shares" value={effShare.sold} />
                  <Fact label="Remaining" value={Math.max(0, effShare.total - effShare.sold)} />
                </>
              )}
              {effBuildings && (
                <>
                  <Fact label="Total buildings" value={effBuildings.total} />
                  <Fact label="Sold out" value={effBuildings.soldOut} />
                  <Fact label="Now booking" value={`#${effBuildings.nowBooking}`} />
                </>
              )}
              {model === "units" && (
                <Fact label="Source" value="Unit grid (code only)" wide />
              )}
            </dl>
            {effShare?.note && (
              <p className="mt-3 rounded-xl bg-bg-soft px-3.5 py-2.5 text-xs leading-relaxed text-fg-muted">
                {effShare.note}
              </p>
            )}
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2 text-sm text-fg-muted">
            <Building2 className="h-4 w-4" />
            This project doesn’t carry numeric availability data — only its status can be overridden.
          </div>
        )}
      </Card>

      {/* Edit form */}
      <Card>
        <h2 className="text-sm font-bold text-fg">Override availability</h2>
        <p className="mt-0.5 mb-5 text-xs text-fg-muted">
          Saving writes a row that takes precedence over the code values everywhere on the site.
          Placeholders show the current code defaults.
        </p>
        <OverrideForm
          slug={project.slug}
          model={model}
          hasOverride={hasOverride}
          defaults={defaults}
          current={current}
        />
      </Card>
    </div>
  );
}

function Fact({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-border bg-bg-soft px-3.5 py-2.5 ${wide ? "col-span-2 sm:col-span-3" : ""}`}>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-fg-faint">{label}</dt>
      <dd className="mt-0.5 text-base font-bold text-fg">{value}</dd>
    </div>
  );
}
