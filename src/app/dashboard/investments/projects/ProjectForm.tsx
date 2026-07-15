"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, X, Loader2 } from "lucide-react";
import { saveInvestmentProject, type ProjectInput } from "@/app/actions/admin-investments";

const inputCls =
  "w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand-blue/50";
const labelCls = "mb-1 block text-xs font-semibold text-fg-muted";
const STATUSES = ["Ongoing", "Completed", "On Hold", "Cancelled", "Upcoming"];

export type EditableProject = {
  project_id: string;
  project_name: string;
  status: string;
  project_address: string | null;
  project_details: string | null;
  total_amount_required: number | null;
  per_user_share_amount: number | null;
  project_progress: number;
  start_date: string | null;
  end_date: string | null;
  hide_total_amount: boolean;
  hide_share_price: boolean;
};

export default function ProjectForm({ project, variant, defaultName, label }: { project?: EditableProject; variant?: "button" | "icon"; defaultName?: string; label?: string }) {
  const router = useRouter();
  const editing = !!project;
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(fd: FormData) {
    setError(null);
    const input: ProjectInput = {
      project_id: project?.project_id ?? null,
      project_name: String(fd.get("project_name") ?? ""),
      status: String(fd.get("status") ?? "Ongoing"),
      project_address: String(fd.get("project_address") ?? ""),
      project_details: String(fd.get("project_details") ?? ""),
      total_amount_required: String(fd.get("total_amount_required") ?? ""),
      per_user_share_amount: String(fd.get("per_user_share_amount") ?? ""),
      project_progress: String(fd.get("project_progress") ?? ""),
      start_date: String(fd.get("start_date") ?? "") || null,
      end_date: String(fd.get("end_date") ?? "") || null,
      hide_total_amount: fd.get("hide_total_amount") === "on",
      hide_share_price: fd.get("hide_share_price") === "on",
    };
    start(async () => {
      const res = await saveInvestmentProject(input);
      if (!res.ok) return setError(res.error);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      {editing && variant !== "button" ? (
        <button type="button" onClick={() => setOpen(true)} title="Edit project" className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-3 py-2 text-sm font-semibold text-fg transition-colors hover:border-brand-blue/40 hover:text-brand-blue">
          <Pencil className="h-4 w-4" /> Edit
        </button>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-all hover:-translate-y-0.5 hover:bg-brand-blue-dark">
          <Plus className="h-4 w-4" /> {label ?? (editing ? "Edit project" : "Add Project")}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => !pending && setOpen(false)}>
          <div className="max-h-[92vh] w-full max-w-lg animate-[pop_.18s_ease-out] overflow-y-auto rounded-2xl border border-border bg-bg p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-fg">{editing ? "Edit project" : "Add new project"}</h2>
              <button type="button" onClick={() => !pending && setOpen(false)} className="rounded-lg p-1 text-fg-muted transition-colors hover:bg-bg-soft hover:text-fg" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={submit} className="space-y-3">
              <div>
                <label className={labelCls} htmlFor="pr-name">Project name</label>
                <input id="pr-name" name="project_name" required defaultValue={project?.project_name ?? defaultName ?? ""} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="pr-status">Status</label>
                  <select id="pr-status" name="status" defaultValue={project?.status ?? "Ongoing"} className={inputCls}>
                    {[...new Set([project?.status, ...STATUSES].filter(Boolean))].map((s) => (
                      <option key={s} value={s as string}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls} htmlFor="pr-progress">Progress (%)</label>
                  <input id="pr-progress" name="project_progress" type="number" min="0" max="100" step="0.01" defaultValue={project?.project_progress ?? 0} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="pr-req">Total goal (৳)</label>
                  <input id="pr-req" name="total_amount_required" type="number" min="0" step="0.01" defaultValue={project?.total_amount_required ?? ""} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="pr-share">Per-user share (৳)</label>
                  <input id="pr-share" name="per_user_share_amount" type="number" min="0" step="0.01" defaultValue={project?.per_user_share_amount ?? ""} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="pr-start">Start date</label>
                  <input id="pr-start" name="start_date" type="date" defaultValue={project?.start_date ?? ""} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="pr-end">End date</label>
                  <input id="pr-end" name="end_date" type="date" defaultValue={project?.end_date ?? ""} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls} htmlFor="pr-addr">Address <span className="font-normal text-fg-faint">(optional)</span></label>
                <input id="pr-addr" name="project_address" defaultValue={project?.project_address ?? ""} className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="pr-details">Details <span className="font-normal text-fg-faint">(optional)</span></label>
                <textarea id="pr-details" name="project_details" rows={3} defaultValue={project?.project_details ?? ""} className={inputCls} />
              </div>
              <div className="flex flex-wrap items-center gap-5 rounded-xl bg-bg-soft/60 px-3 py-2.5">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-fg">
                  <input type="checkbox" name="hide_total_amount" defaultChecked={project?.hide_total_amount ?? false} className="h-4 w-4 accent-brand-blue" /> Hide total from app
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-fg">
                  <input type="checkbox" name="hide_share_price" defaultChecked={project?.hide_share_price ?? false} className="h-4 w-4 accent-brand-blue" /> Hide share price
                </label>
              </div>

              {error && <p className="rounded-lg bg-brand-red-tint px-3 py-2 text-xs font-medium text-brand-red-dark">{error}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)} disabled={pending} className="rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-brand-blue/40 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={pending} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-blue-dark disabled:opacity-60">
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />} {editing ? "Save changes" : "Save project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
