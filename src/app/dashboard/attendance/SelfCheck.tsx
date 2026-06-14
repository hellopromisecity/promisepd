"use client";

/** Staff self check-in / check-out for today.  The action only ever
 *  touches the caller's own row, so the only state we need is whether
 *  they've already checked in / out (to disable the relevant button). */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, LogOut } from "lucide-react";
import { setOwnCheck } from "@/app/actions/admin-staff";

export default function SelfCheck({
  checkedIn,
  checkedOut,
}: {
  checkedIn: boolean;
  checkedOut: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(kind: "in" | "out") {
    setError(null);
    startTransition(async () => {
      const res = await setOwnCheck(kind);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={pending || checkedIn}
          onClick={() => run("in")}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          {checkedIn ? "Checked in" : "Check in"}
        </button>
        <button
          type="button"
          disabled={pending || !checkedIn || checkedOut}
          onClick={() => run("out")}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-brand-blue/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          {checkedOut ? "Checked out" : "Check out"}
        </button>
      </div>
      {error && <p className="text-[11px] font-medium text-brand-red-dark">{error}</p>}
    </div>
  );
}
