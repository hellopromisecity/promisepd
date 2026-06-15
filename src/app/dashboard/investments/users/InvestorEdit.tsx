"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Loader2, Lock } from "lucide-react";
import { updateInvestor, type InvestorInput } from "@/app/actions/admin-investments";

const inputCls =
  "w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand-blue/50";
const labelCls = "mb-1 block text-xs font-semibold text-fg-muted";

export type EditableInvestor = {
  uid: string;
  full_name: string;
  fid: string | null;
  phone_number: string;
  email: string | null;
  is_active: boolean;
  is_verified: boolean;
};

export default function InvestorEdit({ investor }: { investor: EditableInvestor }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(fd: FormData) {
    setError(null);
    const input: InvestorInput = {
      full_name: String(fd.get("full_name") ?? ""),
      fid: String(fd.get("fid") ?? ""),
      email: String(fd.get("email") ?? ""),
      is_active: fd.get("is_active") === "on",
      is_verified: fd.get("is_verified") === "on",
    };
    start(async () => {
      const res = await updateInvestor(investor.uid, input);
      if (!res.ok) return setError(res.error);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Edit user"
        className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-bg text-fg-muted transition-all hover:-translate-y-0.5 hover:border-brand-blue/40 hover:text-brand-blue hover:shadow-sm"
      >
        <Pencil className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => !pending && setOpen(false)}>
          <div className="w-full max-w-md animate-[pop_.18s_ease-out] rounded-2xl border border-border bg-bg p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-fg">Edit user</h2>
              <button type="button" onClick={() => !pending && setOpen(false)} className="rounded-lg p-1 text-fg-muted transition-colors hover:bg-bg-soft hover:text-fg" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={submit} className="space-y-3">
              <div>
                <label className={labelCls} htmlFor="iv-name">Full name</label>
                <input id="iv-name" name="full_name" required defaultValue={investor.full_name} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="iv-fid">File ID (FID)</label>
                  <input id="iv-fid" name="fid" defaultValue={investor.fid ?? ""} placeholder="—" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Phone <span className="font-normal text-fg-faint">(login key)</span></label>
                  <div className="flex items-center gap-1.5 rounded-xl border border-border bg-bg-soft/60 px-3 py-2.5 text-sm text-fg-muted">
                    <Lock className="h-3.5 w-3.5 shrink-0 text-fg-faint" />
                    <span className="truncate">{investor.phone_number || "—"}</span>
                  </div>
                </div>
              </div>
              <div>
                <label className={labelCls} htmlFor="iv-email">Email <span className="font-normal text-fg-faint">(optional)</span></label>
                <input id="iv-email" name="email" type="email" defaultValue={investor.email ?? ""} className={inputCls} />
              </div>
              <div className="flex items-center gap-5 pt-1">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-fg">
                  <input type="checkbox" name="is_verified" defaultChecked={investor.is_verified} className="h-4 w-4 accent-brand-blue" /> Verified
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-fg">
                  <input type="checkbox" name="is_active" defaultChecked={investor.is_active} className="h-4 w-4 accent-brand-blue" /> Active
                </label>
              </div>

              {error && <p className="rounded-lg bg-brand-red-tint px-3 py-2 text-xs font-medium text-brand-red-dark">{error}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)} disabled={pending} className="rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-brand-blue/40 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={pending} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-blue-dark disabled:opacity-60">
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
