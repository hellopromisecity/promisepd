"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2 } from "lucide-react";
import { addFollowup } from "@/app/actions/admin-marketing";
import { STATUS_META, FOLLOWUP_STATUSES } from "./status";

export type StaffOption = { id: string; name: string };
export type ProjectOption = { slug: string; name: string };

const inputCls =
  "w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm outline-none focus:border-brand-blue/50";
const labelCls = "mb-1 block text-xs font-semibold text-fg-muted";

/** Slide-down panel to create a new client follow-up. */
export default function AddFollowupForm({
  staff,
  projects,
}: {
  staff: StaffOption[];
  projects: ProjectOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;

    start(async () => {
      const res = await addFollowup({
        client_name: String(fd.get("client_name") ?? ""),
        mobile: String(fd.get("mobile") ?? ""),
        email: String(fd.get("email") ?? ""),
        interest: String(fd.get("interest") ?? ""),
        source: String(fd.get("source") ?? ""),
        status: String(fd.get("status") ?? "new"),
        assigned_to: String(fd.get("assigned_to") ?? ""),
        next_followup: String(fd.get("next_followup") ?? ""),
        note: String(fd.get("note") ?? ""),
      });
      if (res.ok) {
        form.reset();
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-blue-dark"
      >
        <Plus className="h-4 w-4" /> New follow-up
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-2xl border border-border bg-bg p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-fg">New client follow-up</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="grid h-8 w-8 place-items-center rounded-xl text-fg-muted transition-colors hover:bg-bg-soft"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="f-client" className={labelCls}>
            Client name *
          </label>
          <input id="f-client" name="client_name" required className={inputCls} />
        </div>
        <div>
          <label htmlFor="f-mobile" className={labelCls}>
            Mobile
          </label>
          <input id="f-mobile" name="mobile" inputMode="tel" className={inputCls} />
        </div>
        <div>
          <label htmlFor="f-email" className={labelCls}>
            Email
          </label>
          <input id="f-email" name="email" type="email" className={inputCls} />
        </div>
        <div>
          <label htmlFor="f-interest" className={labelCls}>
            Interest
          </label>
          <input
            id="f-interest"
            name="interest"
            list="project-options"
            placeholder="Project or free text"
            className={inputCls}
          />
          <datalist id="project-options">
            {projects.map((p) => (
              <option key={p.slug} value={p.name} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="f-source" className={labelCls}>
            Source
          </label>
          <input
            id="f-source"
            name="source"
            placeholder="Walk-in, referral, Facebook…"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="f-status" className={labelCls}>
            Status
          </label>
          <select id="f-status" name="status" defaultValue="new" className={inputCls}>
            {FOLLOWUP_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-assigned" className={labelCls}>
            Assigned to
          </label>
          <select id="f-assigned" name="assigned_to" defaultValue="" className={inputCls}>
            <option value="">Unassigned</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-next" className={labelCls}>
            Next follow-up
          </label>
          <input id="f-next" name="next_followup" type="date" className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="f-note" className={labelCls}>
            Note
          </label>
          <textarea id="f-note" name="note" rows={2} className={inputCls} />
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-brand-red-dark">{error}</p>}

      <div className="mt-4 flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-blue-dark disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add follow-up
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-brand-blue/40"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
