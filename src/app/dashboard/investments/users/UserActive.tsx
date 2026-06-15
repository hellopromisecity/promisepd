"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserX, UserCheck, Loader2 } from "lucide-react";
import { setInvestorActive } from "@/app/actions/admin-investments";

/** One-click activate / deactivate.  Deactivating asks for confirmation
 *  (it blocks the investor's login); activating is instant. */
export default function UserActive({ uid, name, active }: { uid: string; name: string; active: boolean }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function run(next: boolean) {
    setError(null);
    start(async () => {
      const res = await setInvestorActive(uid, next);
      if (!res.ok) return setError(res.error);
      setConfirm(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => (active ? setConfirm(true) : run(true))}
        disabled={pending}
        title={active ? "Deactivate user" : "Activate user"}
        className={`grid h-9 w-9 place-items-center rounded-lg border bg-bg transition-all hover:-translate-y-0.5 hover:shadow-sm disabled:opacity-50 ${
          active
            ? "border-border text-fg-muted hover:border-brand-red/40 hover:text-brand-red"
            : "border-emerald-500/30 text-emerald-600 hover:border-emerald-500/60"
        }`}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
      </button>

      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => !pending && setConfirm(false)}>
          <div className="w-full max-w-sm animate-[pop_.18s_ease-out] rounded-2xl border border-border bg-bg p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-red-tint text-brand-red">
                <UserX className="h-5 w-5" />
              </span>
              <h2 className="text-base font-bold text-fg">Deactivate user?</h2>
            </div>
            <p className="text-sm text-fg-muted">
              <b className="text-fg">{name || uid}</b> will no longer be able to log in until reactivated. Their data and transactions stay intact.
            </p>
            {error && <p className="mt-3 rounded-lg bg-brand-red-tint px-3 py-2 text-xs font-medium text-brand-red-dark">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirm(false)} disabled={pending} className="rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-brand-blue/40 disabled:opacity-50">Cancel</button>
              <button type="button" onClick={() => run(false)} disabled={pending} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-red px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-red-dark disabled:opacity-60">
                {pending && <Loader2 className="h-4 w-4 animate-spin" />} Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
