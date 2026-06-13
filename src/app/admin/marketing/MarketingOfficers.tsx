"use client";

/** Marketing officer leaderboard + management.  Lists the 4 officer types
 *  ranked by points, with two dialogs:
 *   - Add officer (name, type, position + contact fields)
 *   - Award points (pick officer + project → project's value × qty is
 *     auto-computed and added to the officer's total). */

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Award, Crown, Medal, Trophy, Trash2, X, Loader2, AlertCircle, Users,
} from "lucide-react";
import { Badge, Card } from "@/components/admin/ui";
import { OFFICER_TYPES, type OfficerType } from "@/lib/marketing";
import { addOfficer, deleteOfficer, awardPoints } from "@/app/actions/admin-marketing";

export type Officer = {
  id: string;
  name: string;
  officer_type: string;
  position: string | null;
  district: string | null;
  officer_code: string | null;
  mobile: string | null;
  points: number;
};
export type ProjectOpt = { slug: string; name: string; points: number };

const TYPE_TONE: Record<string, "info" | "success" | "warning" | "neutral"> = {
  MD: "success", HM: "warning", AMO: "info", MO: "neutral",
};
const RANK_ICON = [Crown, Medal, Trophy];

export default function MarketingOfficers({
  officers,
  projects,
}: {
  officers: Officer[];
  projects: ProjectOpt[];
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<null | "officer" | "points">(null);

  return (
    <Card pad={false}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-blue" />
          <h2 className="text-sm font-bold text-fg">Marketing officers</h2>
          <span className="rounded-full bg-bg-soft px-2 py-0.5 text-xs text-fg-muted">{officers.length}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setDialog("points")} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-3.5 py-2 text-sm font-semibold text-fg hover:border-brand-blue/40">
            <Award className="h-4 w-4 text-brand-blue" /> Award points
          </button>
          <button onClick={() => setDialog("officer")} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-3.5 py-2 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark">
            <Plus className="h-4 w-4" /> Add officer
          </button>
        </div>
      </div>

      {officers.length === 0 ? (
        <p className="px-5 pb-8 pt-2 text-center text-sm text-fg-muted">
          No officers yet — add your MO / AMO / MD / HM team to build the leaderboard.
        </p>
      ) : (
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wide text-fg-faint">
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Officer</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Position</th>
                <th className="px-4 py-3 font-semibold">District</th>
                <th className="px-4 py-3 text-right font-semibold">Points</th>
                <th className="px-4 py-3 text-right font-semibold"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {officers.map((o, i) => {
                const Icon = RANK_ICON[i];
                return (
                  <tr key={o.id} className="border-b border-border/60 last:border-0 hover:bg-bg-soft/50">
                    <td className="px-4 py-3">
                      {Icon ? (
                        <span className={`grid h-7 w-7 place-items-center rounded-full ${i === 0 ? "bg-brand-blue text-white" : i === 1 ? "bg-bg-soft text-fg" : "bg-brand-red text-white"}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-bg-soft text-xs font-bold text-fg-muted">{i + 1}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-fg">{o.name}</div>
                      {o.officer_code && <div className="text-xs text-fg-faint">{o.officer_code}</div>}
                    </td>
                    <td className="px-4 py-3"><Badge tone={TYPE_TONE[o.officer_type] ?? "neutral"}>{o.officer_type}</Badge></td>
                    <td className="px-4 py-3 text-fg-muted">{o.position || "—"}</td>
                    <td className="px-4 py-3 text-fg-muted">{o.district || "—"}</td>
                    <td className="px-4 py-3 text-right font-bold text-fg">{o.points.toLocaleString("en-US")}</td>
                    <td className="px-4 py-3 text-right"><DeleteBtn id={o.id} name={o.name} onDone={() => router.refresh()} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {dialog === "officer" && <AddOfficerDialog onClose={() => setDialog(null)} onDone={() => { setDialog(null); router.refresh(); }} />}
      {dialog === "points" && <AwardPointsDialog officers={officers} projects={projects} onClose={() => setDialog(null)} onDone={() => { setDialog(null); router.refresh(); }} />}
    </Card>
  );
}

function DeleteBtn({ id, name, onDone }: { id: string; name: string; onDone: () => void }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => {
        if (!window.confirm(`Remove “${name}” from the leaderboard?`)) return;
        start(async () => {
          const res = await deleteOfficer(id);
          if (res.ok) onDone();
          else window.alert(res.error);
        });
      }}
      disabled={pending}
      className="rounded-md p-1.5 text-fg-faint hover:bg-brand-red-tint hover:text-brand-red disabled:opacity-50"
      aria-label={`Delete ${name}`}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </button>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-bg p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-fg">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-fg-muted hover:bg-bg-soft" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm text-fg outline-none focus:border-brand-blue/50";
const labelCls = "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-fg-muted";

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="mb-3 flex items-start gap-2 rounded-xl border border-brand-red/30 bg-brand-red-tint px-3 py-2 text-sm text-brand-red-dark">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {msg}
    </div>
  );
}

function AddOfficerDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ name: "", officer_type: "MO" as OfficerType, position: "", officer_code: "", district: "", mobile: "", reference: "" });
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  function submit() {
    setErr(null);
    start(async () => {
      const res = await addOfficer(f);
      if (res.ok) onDone();
      else setErr(res.error);
    });
  }

  return (
    <Modal title="Add marketing officer" onClose={onClose}>
      {err && <ErrorBanner msg={err} />}
      <div className="space-y-3">
        <div><label className={labelCls}>Name *</label><input className={inputCls} value={f.name} onChange={set("name")} placeholder="Full name" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Type *</label>
            <select className={inputCls} value={f.officer_type} onChange={set("officer_type")}>
              {OFFICER_TYPES.map((t) => <option key={t.code} value={t.code}>{t.code} — {t.label}</option>)}
            </select>
          </div>
          <div><label className={labelCls}>Position</label><input className={inputCls} value={f.position} onChange={set("position")} placeholder="e.g. Director" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>ID / code</label><input className={inputCls} value={f.officer_code} onChange={set("officer_code")} placeholder="D-2025003" /></div>
          <div><label className={labelCls}>District</label><input className={inputCls} value={f.district} onChange={set("district")} placeholder="Dhaka" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Mobile</label><input className={inputCls} value={f.mobile} onChange={set("mobile")} placeholder="01XXXXXXXXX" /></div>
          <div><label className={labelCls}>Reference</label><input className={inputCls} value={f.reference} onChange={set("reference")} placeholder="Optional" /></div>
        </div>
        <button onClick={submit} disabled={pending} className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark disabled:opacity-60">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add officer
        </button>
      </div>
    </Modal>
  );
}

function AwardPointsDialog({
  officers, projects, onClose, onDone,
}: {
  officers: Officer[]; projects: ProjectOpt[]; onClose: () => void; onDone: () => void;
}) {
  const [officerId, setOfficerId] = useState(officers[0]?.id ?? "");
  const [slug, setSlug] = useState(projects[0]?.slug ?? "");
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const project = useMemo(() => projects.find((p) => p.slug === slug), [projects, slug]);
  const total = (project?.points ?? 0) * Math.max(1, qty || 1);

  function submit() {
    setErr(null);
    start(async () => {
      const res = await awardPoints({ officerId, projectSlug: slug, quantity: qty });
      if (res.ok) onDone();
      else setErr(res.error);
    });
  }

  return (
    <Modal title="Award points" onClose={onClose}>
      {err && <ErrorBanner msg={err} />}
      {officers.length === 0 ? (
        <p className="text-sm text-fg-muted">Add an officer first, then award points.</p>
      ) : (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Officer *</label>
            <select className={inputCls} value={officerId} onChange={(e) => setOfficerId(e.target.value)}>
              {officers.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.officer_type}) · {o.points} pts</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Project *</label>
            <select className={inputCls} value={slug} onChange={(e) => setSlug(e.target.value)}>
              {projects.map((p) => <option key={p.slug} value={p.slug}>{p.name} — {p.points} pts/unit</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Quantity (units sold/promoted)</label>
            <input type="number" min={1} className={inputCls} value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-brand-blue-tint px-4 py-3">
            <span className="text-sm font-semibold text-brand-blue-dark">Points to add</span>
            <span className="text-xl font-extrabold text-brand-blue-dark">+{total.toLocaleString("en-US")}</span>
          </div>
          <button onClick={submit} disabled={pending} className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark disabled:opacity-60">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />} Add points
          </button>
        </div>
      )}
    </Modal>
  );
}
