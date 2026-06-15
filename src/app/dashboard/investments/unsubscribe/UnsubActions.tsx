"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { reviewUnsubscribe } from "@/app/actions/admin-investments";
import { toast } from "@/components/ui/Toast";

export default function UnsubActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function decide(decision: "approved" | "rejected") {
    start(async () => {
      const res = await reviewUnsubscribe(id, decision);
      if (res.ok) {
        toast(res.message ?? "Done.", "success");
        router.refresh();
      } else {
        toast(res.error, "error");
      }
    });
  }

  const done = status.toLowerCase() !== "pending";

  return (
    <div className="flex items-center justify-end gap-1.5">
      {pending && <Loader2 className="h-4 w-4 animate-spin text-fg-faint" />}
      <button
        type="button"
        onClick={() => decide("approved")}
        disabled={pending}
        title="Approve"
        className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
      >
        <Check className="h-3.5 w-3.5" /> Approve
      </button>
      <button
        type="button"
        onClick={() => decide("rejected")}
        disabled={pending}
        title="Reject"
        className="inline-flex items-center gap-1 rounded-lg border border-brand-red/30 bg-brand-red-tint px-2.5 py-1.5 text-xs font-semibold text-brand-red-dark transition-colors hover:bg-brand-red/15 disabled:opacity-50"
      >
        <X className="h-3.5 w-3.5" /> Reject
      </button>
      {done && <span className="ml-1 text-[11px] text-fg-faint">re-review</span>}
    </div>
  );
}
