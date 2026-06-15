"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, Pencil } from "lucide-react";
import { saveInvestorTransaction, type TxnInput } from "@/app/actions/admin-investments";

export type InvestorOption = { uid: string; label: string };
export type TypeOption = { name: string; operator: string };
export type ProjectOption = { project_id: string; project_name: string };

export type EditableTxn = {
  transaction_id: string;
  uid: string;
  type: string;
  amount: number;
  date: string; // YYYY-MM-DD
  project_id: string | null;
  rashid_number: string | null;
  description: string | null;
};

const inputCls =
  "w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm outline-none focus:border-brand-blue/50";
const labelCls = "mb-1 block text-xs font-semibold text-fg-muted";

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function TxnForm({
  investors,
  types,
  projects,
  txn,
}: {
  investors: InvestorOption[];
  types: TypeOption[];
  projects: ProjectOption[];
  txn?: EditableTxn;
}) {
  const router = useRouter();
  const editing = !!txn;
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(fd: FormData) {
    setError(null);
    const input: TxnInput = {
      transaction_id: txn?.transaction_id ?? null,
      uid: String(fd.get("uid") ?? ""),
      type: String(fd.get("type") ?? ""),
      amount: String(fd.get("amount") ?? "0"),
      date: String(fd.get("date") ?? ""),
      project_id: String(fd.get("project_id") ?? "") || null,
      rashid_number: String(fd.get("rashid_number") ?? ""),
      description: String(fd.get("description") ?? ""),
    };
    start(async () => {
      const res = await saveInvestorTransaction(input);
      if (!res.ok) return setError(res.error);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      {editing ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Edit"
          className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-bg-soft hover:text-brand-blue"
        >
          <Pencil className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-blue-dark"
        >
          <Plus className="h-4 w-4" /> Add transaction
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => !pending && setOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-border bg-bg p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-fg">{editing ? "Edit transaction" : "Add transaction"}</h2>
              <button type="button" onClick={() => !pending && setOpen(false)} className="rounded-lg p-1 text-fg-muted hover:bg-bg-soft hover:text-fg" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={submit} className="space-y-3">
              <div>
                <label className={labelCls} htmlFor="tx-uid">Investor</label>
                <select id="tx-uid" name="uid" required defaultValue={txn?.uid ?? ""} className={inputCls}>
                  <option value="" disabled>— Select investor —</option>
                  {investors.map((i) => (
                    <option key={i.uid} value={i.uid}>{i.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="tx-type">Type</label>
                  <select id="tx-type" name="type" required defaultValue={txn?.type ?? ""} className={inputCls}>
                    <option value="" disabled>— Select —</option>
                    {types.map((t) => (
                      <option key={t.name} value={t.name}>{t.name} ({t.operator})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls} htmlFor="tx-amount">Amount (৳)</label>
                  <input id="tx-amount" name="amount" type="number" min="0" step="0.01" required defaultValue={txn?.amount ?? ""} placeholder="0" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="tx-date">Date</label>
                  <input id="tx-date" name="date" type="date" required defaultValue={txn?.date ?? todayLocal()} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="tx-rashid">Receipt # <span className="font-normal text-fg-faint">(optional)</span></label>
                  <input id="tx-rashid" name="rashid_number" defaultValue={txn?.rashid_number ?? ""} placeholder="রশিদ নম্বর" className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls} htmlFor="tx-project">Project <span className="font-normal text-fg-faint">(optional)</span></label>
                <select id="tx-project" name="project_id" defaultValue={txn?.project_id ?? ""} className={inputCls}>
                  <option value="">— None —</option>
                  {projects.map((p) => (
                    <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls} htmlFor="tx-desc">Description <span className="font-normal text-fg-faint">(optional)</span></label>
                <textarea id="tx-desc" name="description" rows={2} defaultValue={txn?.description ?? ""} className={inputCls} />
              </div>

              {error && <p className="rounded-lg bg-brand-red-tint px-3 py-2 text-xs font-medium text-brand-red-dark">{error}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)} disabled={pending} className="rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-brand-blue/40 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={pending} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-blue-dark disabled:opacity-60">
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editing ? "Save changes" : "Add transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
