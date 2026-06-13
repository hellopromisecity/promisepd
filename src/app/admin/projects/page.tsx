import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Pencil, BadgeCheck, Layers } from "lucide-react";
import { getCurrentUser, isManager } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import { PROJECTS } from "@/lib/site";
import {
  PageHeader,
  Card,
  StatCard,
  Badge,
  EmptyState,
  TableShell,
  thCls,
  tdCls,
  type Tone,
} from "@/components/admin/ui";
import {
  sellThrough,
  projectModel,
  type OverrideRow,
  type ProjectModel,
} from "./availability";

export const metadata: Metadata = {
  title: "Projects",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const MODEL_LABEL: Record<ProjectModel, string> = {
  share: "Share map",
  buildings: "Buildings",
  units: "Unit grid",
  none: "—",
};

/** Sell-through % → badge tone (red when nearly gone, green when fresh). */
function pctTone(pct: number): Tone {
  if (pct >= 90) return "danger";
  if (pct >= 60) return "warning";
  if (pct > 0) return "info";
  return "neutral";
}

export default async function AdminProjectsPage() {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) redirect("/account");

  const admin = getAdmin();

  // Pull every override row in one shot, keyed by slug.
  const overrides = new Map<string, OverrideRow>();
  let dbDown = false;
  if (admin) {
    const { data, error } = await admin
      .from("project_overrides")
      .select("slug, status, share_map, buildings");
    if (error) {
      dbDown = true;
    } else {
      for (const row of data ?? []) overrides.set(row.slug, row as OverrideRow);
    }
  } else {
    dbDown = true;
  }

  const rows = PROJECTS.map((p) => {
    const o = overrides.get(p.slug) ?? null;
    return {
      project: p,
      override: o,
      st: sellThrough(p, o),
      model: projectModel(p),
      overridden: !!o,
    };
  });

  const overriddenCount = rows.filter((r) => r.overridden).length;
  const editableCount = rows.filter((r) => r.model === "share" || r.model === "buildings").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        subtitle="Availability that the public site shows. Rich content lives in code — here you fine-tune the fast-moving numbers."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Projects" value={PROJECTS.length} sub="live on the site" icon={Building2} />
        <StatCard
          label="Editable here"
          value={editableCount}
          sub="share-map or building projects"
          icon={Layers}
          tone="info"
        />
        <StatCard
          label="With overrides"
          value={overriddenCount}
          sub={overriddenCount ? "differ from code defaults" : "all on code defaults"}
          icon={BadgeCheck}
          tone={overriddenCount ? "warning" : "success"}
        />
      </div>

      {dbDown && (
        <Card className="border-amber-200 bg-amber-50/60">
          <p className="text-sm text-amber-800">
            Supabase isn’t configured, so saved overrides can’t be loaded — the table below shows the
            code defaults only.
          </p>
        </Card>
      )}

      {PROJECTS.length === 0 ? (
        <EmptyState icon={Building2} title="No projects" message="No projects are defined in the site data." />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <th className={thCls}>Project</th>
              <th className={thCls}>Slug</th>
              <th className={thCls}>Status</th>
              <th className={thCls}>Model</th>
              <th className={thCls}>Availability</th>
              <th className={`${thCls} text-right`}>Edit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ project: p, st, model, override, overridden }) => {
              const status = (override?.status && override.status.trim()) || p.status;
              return (
                <tr key={p.slug} className="hover:bg-bg-soft/60">
                  <td className={tdCls}>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-fg">{p.name}</span>
                      {overridden && <Badge tone="warning">override</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-fg-faint">{p.location}</p>
                  </td>
                  <td className={tdCls}>
                    <code className="rounded-md bg-bg-soft px-1.5 py-0.5 text-xs text-fg-muted">
                      {p.slug}
                    </code>
                  </td>
                  <td className={tdCls}>
                    <span className="text-sm text-fg">{status}</span>
                  </td>
                  <td className={tdCls}>
                    <span className="text-xs text-fg-muted">{MODEL_LABEL[model]}</span>
                  </td>
                  <td className={tdCls}>
                    {st ? (
                      <div className="min-w-[160px]">
                        <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                          <span className="text-fg-muted">
                            {st.sold}/{st.total} {st.unit}
                          </span>
                          <Badge tone={pctTone(st.pct)}>{st.pct}% sold</Badge>
                        </div>
                        <div className="h-1.5 rounded-full bg-bg-soft">
                          <div
                            className="h-1.5 rounded-full bg-brand-blue"
                            style={{ width: `${st.pct}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-fg-faint">No availability data</span>
                    )}
                  </td>
                  <td className={`${tdCls} text-right`}>
                    <Link
                      href={`/admin/projects/${p.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-3 py-1.5 text-xs font-semibold text-fg transition-colors hover:border-brand-blue/40 hover:text-brand-blue"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Link>
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
