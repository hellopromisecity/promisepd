"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X, Loader2, AlertTriangle } from "lucide-react";
import { deleteInvestmentProject } from "@/app/actions/admin-investments";

export default function DeleteProject({ projectId, projectName }: { projectId: string; projectName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function run() {
    setError(null);
    start(async () => {
      const res = await deleteInvestmentProject(projectId);
      if (!res.ok) return setError(res.error);
      setOpen(false);
      router.push("/dashboard/investments/projects");
      router.refresh();
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-brand-red/30 bg-bg px-3 py-2 text-sm font-semibold text-brand-red transition-colors hover:bg-brand-red-tint">
        <Trash2 className="h-4 w-4" /> Delete
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => !pending && setOpen(false)}>
          <div className="w-full max-w-sm animate-[pop_.18s_ease-out] rounded-2xl border border-border bg-bg p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-red-tint text-brand-red"><AlertTriangle className="h-5 w-5" /></span>
              <h2 className="text-base font-bold text-fg">Delete project?</h2>
              <button type="button" onClick={() => !pending && setOpen(false)} className="ml-auto rounded-lg p-1 text-fg-muted hover:bg-bg-soft hover:text-fg" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-fg-muted">
              Delete <b className="text-fg">{projectName}</b>? This also removes its investor memberships. It’s blocked if any transactions still reference the project.
            </p>
            {error && <p className="mt-3 rounded-lg bg-brand-red-tint px-3 py-2 text-xs font-medium text-brand-red-dark">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} disabled={pending} className="rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-brand-blue/40 disabled:opacity-50">Cancel</button>
              <button type="button" onClick={run} disabled={pending} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-red px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-red-dark disabled:opacity-60">
                {pending && <Loader2 className="h-4 w-4 animate-spin" />} Delete project
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
