"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { createInvestor, type NewInvestorInput } from "@/app/actions/admin-investments";

const inputCls = "w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand-blue/50";
const labelCls = "mb-1 block text-xs font-semibold text-fg-muted";

export default function AddUser() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(fd: FormData) {
    setError(null);
    const input: NewInvestorInput = {
      full_name: String(fd.get("full_name") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      password: String(fd.get("password") ?? ""),
      fid: String(fd.get("fid") ?? ""),
      email: String(fd.get("email") ?? ""),
      is_active: fd.get("is_active") === "on",
      is_verified: fd.get("is_verified") === "on",
    };
    start(async () => {
      const res = await createInvestor(input);
      if (!res.ok) return setError(res.error);
      setDone(res.data?.uid ?? "");
      router.refresh();
    });
  }

  function close() {
    setOpen(false);
    setDone(null);
    setError(null);
    setShow(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-all hover:-translate-y-0.5 hover:bg-brand-blue-dark"
      >
        <UserPlus className="h-4 w-4" /> Add User
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => !pending && close()}>
          <div className="w-full max-w-md animate-[pop_.18s_ease-out] rounded-2xl border border-border bg-bg p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-fg">Add app user</h2>
              <button type="button" onClick={close} className="rounded-lg p-1 text-fg-muted transition-colors hover:bg-bg-soft hover:text-fg" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>

            {done !== null ? (
              <div className="py-4 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-600"><CheckCircle2 className="h-8 w-8" /></span>
                <p className="mt-3 text-sm font-semibold text-fg">App user created 🎉</p>
                <p className="mt-1 text-xs text-fg-muted">New UID <span className="font-mono font-bold text-fg">{done}</span>. They can sign in with their phone + password.</p>
                <div className="mt-4 flex justify-center gap-2">
                  <button type="button" onClick={() => { setDone(null); }} className="rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-brand-blue/40">Add another</button>
                  <button type="button" onClick={close} className="rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark">Done</button>
                </div>
              </div>
            ) : (
              <form action={submit} className="space-y-3">
                <div>
                  <label className={labelCls} htmlFor="au-name">Full name</label>
                  <input id="au-name" name="full_name" required placeholder="e.g. Injamul Haque" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls} htmlFor="au-phone">Phone</label>
                    <input id="au-phone" name="phone" required placeholder="01XXXXXXXXX" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="au-fid">File ID <span className="font-normal text-fg-faint">(opt)</span></label>
                    <input id="au-fid" name="fid" placeholder="—" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls} htmlFor="au-email">Email <span className="font-normal text-fg-faint">(optional)</span></label>
                  <input id="au-email" name="email" type="email" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="au-pass">Password</label>
                  <div className="relative">
                    <input id="au-pass" name="password" type={show ? "text" : "password"} required minLength={6} placeholder="min 6 characters" className={`${inputCls} pr-10`} />
                    <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-fg-muted hover:text-fg" aria-label={show ? "Hide" : "Show"}>
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-fg-faint">They’ll log in with their phone number + this password.</p>
                </div>
                <div className="flex items-center gap-5 pt-1">
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-fg">
                    <input type="checkbox" name="is_verified" className="h-4 w-4 accent-brand-blue" /> Verified
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-fg">
                    <input type="checkbox" name="is_active" defaultChecked className="h-4 w-4 accent-brand-blue" /> Active
                  </label>
                </div>

                {error && <p className="rounded-lg bg-brand-red-tint px-3 py-2 text-xs font-medium text-brand-red-dark">{error}</p>}

                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={close} disabled={pending} className="rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-brand-blue/40 disabled:opacity-50">Cancel</button>
                  <button type="submit" disabled={pending} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-blue-dark disabled:opacity-60">
                    {pending && <Loader2 className="h-4 w-4 animate-spin" />} Create user
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
