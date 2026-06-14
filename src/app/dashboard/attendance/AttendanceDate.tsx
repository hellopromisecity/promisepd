"use client";

/** Date selector for the team attendance view — navigating to
 *  ?date=YYYY-MM-DD re-renders the server page for that day so managers
 *  can mark or review past dates, not just today. */

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";

export default function AttendanceDate({ value, today }: { value: string; today: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={value}
        max={today}
        onChange={(e) => {
          const d = e.target.value;
          if (!d) return;
          startTransition(() => router.push(`/dashboard/attendance?date=${d}`));
        }}
        className="rounded-xl border border-border bg-bg-soft px-3 py-1.5 text-sm text-fg outline-none focus:border-brand-blue/50"
      />
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin text-fg-faint" />
      ) : value !== today ? (
        <button
          onClick={() => startTransition(() => router.push("/dashboard/attendance"))}
          className="text-xs font-semibold text-brand-blue hover:underline"
        >
          Today
        </button>
      ) : null}
    </div>
  );
}
