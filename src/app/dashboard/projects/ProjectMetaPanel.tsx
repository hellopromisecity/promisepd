"use client";

/** Projectify ⇄ app project bridge. A Projectify (book) project and its app
 *  project are the SAME real project, so this panel surfaces the app's rich
 *  metadata (description, goal, share, dates, status) right on the Projectify
 *  page and lets you edit it — one edit flows to the book view, the app, and
 *  the investor PWA. If no app project is linked yet, it offers to create one
 *  (pre-named to match), which links them by name. */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Info, Trash2, ExternalLink, Loader2, Users, EyeOff } from "lucide-react";
import ProjectForm, { type EditableProject } from "../investments/projects/ProjectForm";
import { deleteInvestmentProject } from "@/app/actions/admin-investments";

const fmt = (n: number | null) => {
  const v = Number(n) || 0;
  if (!v) return "—";
  if (v >= 1e7) return "৳" + (v / 1e7).toFixed(2).replace(/\.?0+$/, "") + " Cr";
  if (v >= 1e5) return "৳" + (v / 1e5).toFixed(2).replace(/\.?0+$/, "") + " L";
  return "৳" + Math.round(v).toLocaleString("en-IN");
};
const dOnly = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : `${iso}T00:00:00`);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export default function ProjectMetaPanel({
  linked,
  hubName,
  appHref,
  investors,
}: {
  linked: EditableProject | null;
  hubName: string;
  appHref: string | null;
  investors?: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function del() {
    if (!linked) return;
    if (!window.confirm(`Delete the app project "${linked.project_name}"?\n\nThe book customers here stay untouched — this only removes the app project record + its investor memberships, so it disappears from the app/PWA. Blocked if it still has transactions.`)) return;
    setErr(null);
    start(async () => {
      const res = await deleteInvestmentProject(linked.project_id);
      if (!res.ok) return setErr(res.error);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-bg p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
          <Info className="h-4 w-4 text-brand-blue" /> Project details
          <span className="font-normal text-fg-faint">— shown in the app &amp; investor PWA</span>
        </h2>
        {linked && (
          <div className="flex items-center gap-2">
            {appHref && (
              <Link href={appHref} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-3 py-2 text-sm font-semibold text-fg transition-colors hover:border-brand-blue/40 hover:text-brand-blue">
                <Users className="h-4 w-4" /> Investors
              </Link>
            )}
            <ProjectForm project={linked} variant="icon" />
            <button type="button" onClick={del} disabled={pending} title="Delete app project" className="inline-flex items-center gap-1.5 rounded-xl border border-brand-red/30 bg-bg px-3 py-2 text-sm font-semibold text-brand-red-dark transition-colors hover:bg-brand-red-tint disabled:opacity-50">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
            </button>
          </div>
        )}
      </div>

      {err && <p className="mt-3 rounded-lg bg-brand-red-tint px-3 py-2 text-xs font-medium text-brand-red-dark">{err}</p>}

      {!linked ? (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-bg-soft/50 px-4 py-5 text-center">
          <p className="text-sm text-fg-muted">No app project is linked yet — so the app &amp; investor PWA show no details, goal, or share for <span className="font-semibold text-fg">{hubName}</span>.</p>
          <p className="mt-1 text-xs text-fg-faint">Create one (pre-named to match) to link them — its description, goal and members will then show in the app.</p>
          <div className="mt-3 flex justify-center">
            <ProjectForm defaultName={hubName} label="Link app project" />
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700">{linked.status}</span>
            <span className="font-mono text-fg-faint">{linked.project_id}</span>
            {typeof investors === "number" && <span className="text-fg-muted">· {investors} investor{investors === 1 ? "" : "s"}</span>}
            {linked.hide_total_amount && <span className="inline-flex items-center gap-1 text-fg-faint"><EyeOff className="h-3 w-3" /> total hidden</span>}
            {linked.hide_share_price && <span className="inline-flex items-center gap-1 text-fg-faint"><EyeOff className="h-3 w-3" /> share hidden</span>}
          </div>

          {linked.project_details && <p className="whitespace-pre-line text-sm leading-relaxed text-fg-muted">{linked.project_details}</p>}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            <Field k="Total goal" v={fmt(linked.total_amount_required)} />
            <Field k="Per-user share" v={fmt(linked.per_user_share_amount)} />
            <Field k="Start" v={dOnly(linked.start_date)} />
            <Field k="End" v={dOnly(linked.end_date)} />
          </dl>

          {linked.project_address && <p className="text-xs text-fg-muted">📍 {linked.project_address}</p>}

          {(Number(linked.project_progress) || 0) > 0 && (
            <div>
              <div className="mb-1 flex justify-between text-[11px] text-fg-muted"><span>Progress</span><span className="font-semibold">{Math.round(Number(linked.project_progress) || 0)}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-bg-soft"><div className="h-2 rounded-full bg-gradient-to-r from-brand-blue to-emerald-500" style={{ width: `${Math.min(100, Number(linked.project_progress) || 0)}%` }} /></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-fg-faint">{k}</dt>
      <dd className="mt-0.5 font-bold tabular-nums text-fg">{v}</dd>
    </div>
  );
}
