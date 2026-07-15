"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Wallet } from "lucide-react";
import { Card } from "@/components/admin/ui";
import { toast } from "@/components/ui/Toast";
import { updateSmsConfig } from "@/app/actions/sms-config";

export default function SmsConfigForm({ balance, rate }: { balance: number; rate: number }) {
  const router = useRouter();
  const [bal, setBal] = useState(String(balance ?? ""));
  const [rt, setRt] = useState(String(rate ?? ""));
  const [pending, start] = useTransition();

  function save(kind: "balance" | "rate") {
    const payload = kind === "balance" ? { balance: parseFloat(bal) } : { rate: parseFloat(rt) };
    if (kind === "balance" && !(parseFloat(bal) >= 0)) { toast("Enter a valid balance.", "error"); return; }
    if (kind === "rate" && !(parseFloat(rt) > 0)) { toast("Enter a valid rate.", "error"); return; }
    start(async () => {
      const r = await updateSmsConfig(payload);
      if (r.ok) { toast(r.message || "Saved.", "success"); router.refresh(); } else toast(r.error, "error");
    });
  }

  const inputCls = "w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm text-fg outline-none focus:border-brand-blue/50";
  const labelCls = "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-fg-muted";

  return (
    <Card>
      <h2 className="mb-1 flex items-center gap-1.5 text-sm font-bold text-fg"><Wallet className="h-4 w-4 text-brand-blue" /> Update balance & rate</h2>
      <p className="mb-3 text-xs text-fg-muted">After a top-up, set the new balance here — sends are subtracted from it automatically.</p>

      <div className="space-y-3">
        <div>
          <label className={labelCls}>Current balance (৳)</label>
          <div className="flex gap-2">
            <input type="number" step="0.01" className={inputCls} value={bal} onChange={(e) => setBal(e.target.value)} placeholder="e.g. 2011.14" />
            <button onClick={() => save("balance")} disabled={pending} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-blue px-3 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue-dark disabled:opacity-60">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Set
            </button>
          </div>
        </div>
        <div>
          <label className={labelCls}>Per-SMS rate (৳)</label>
          <div className="flex gap-2">
            <input type="number" step="0.01" className={inputCls} value={rt} onChange={(e) => setRt(e.target.value)} placeholder="e.g. 0.35" />
            <button onClick={() => save("rate")} disabled={pending} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-semibold text-fg hover:border-brand-blue/40 disabled:opacity-60">
              Save
            </button>
          </div>
          <p className="mt-1 text-[11px] text-fg-faint">Set this to your exact KhudeBarta rate (see their &quot;Rate&quot; menu) for accurate cost + remaining-SMS.</p>
        </div>
      </div>
    </Card>
  );
}
