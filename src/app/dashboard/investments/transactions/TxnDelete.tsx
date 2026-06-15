"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { deleteInvestorTransaction } from "@/app/actions/admin-investments";
import { toast } from "@/components/ui/Toast";

export default function TxnDelete({ id, label }: { id: string; label: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();

  function del() {
    start(async () => {
      const res = await deleteInvestorTransaction(id);
      if (res.ok) {
        toast(res.message ?? "Deleted.", "success");
        setConfirm(false);
        router.refresh();
      } else {
        toast(res.error, "error");
      }
    });
  }

  if (!confirm) {
    return (
      <button
        type="button"
        onClick={() => setConfirm(true)}
        title="Delete"
        className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-brand-red-tint hover:text-brand-red-dark"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={del}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-lg bg-brand-red px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
        title={`Delete ${label}`}
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Delete
      </button>
      <button
        type="button"
        onClick={() => setConfirm(false)}
        disabled={pending}
        className="rounded-lg border border-border px-2 py-1 text-xs font-semibold text-fg-muted hover:bg-bg-soft"
      >
        No
      </button>
    </div>
  );
}
