"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Wallet, X, Loader2, Plus, Pencil, Trash2, Check } from "lucide-react";
import { saveInvestorTransaction, deleteInvestorTransaction, type TxnInput } from "@/app/actions/admin-investments";
import { taka, fmtDate, dateInput, initial, avatarTint, type AppUser, type TypeOpt, type ProjectOpt, type UserTxn } from "./shared";

const inputCls = "w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand-blue/50";
const labelCls = "mb-1 block text-xs font-semibold text-fg-muted";

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function UserTxns({ user, types, projects }: { user: AppUser; types: TypeOpt[]; projects: ProjectOpt[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<UserTxn | null>(null); // null = adding
  const [error, setError] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  // bump key to reset the uncontrolled form after a successful save
  const [formKey, setFormKey] = useState(0);

  function submit(fd: FormData) {
    setError(null);
    const input: TxnInput = {
      transaction_id: edit?.transaction_id ?? null,
      uid: user.uid,
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
      setEdit(null);
      setFormKey((k) => k + 1);
      router.refresh();
    });
  }

  function del(id: string) {
    setError(null);
    start(async () => {
      const res = await deleteInvestorTransaction(id);
      if (!res.ok) return setError(res.error);
      setConfirmDel(null);
      if (edit?.transaction_id === id) setEdit(null);
      router.refresh();
    });
  }

  const tint = avatarTint(user.uid);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Transactions"
        className="grid h-9 w-9 place-items-center rounded-lg border border-emerald-500/30 bg-bg text-emerald-600 transition-all hover:-translate-y-0.5 hover:border-emerald-500/60 hover:shadow-sm"
      >
        <Wallet className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => !pending && setOpen(false)}>
          <div className="flex max-h-[92vh] w-full max-w-4xl animate-[pop_.18s_ease-out] flex-col overflow-hidden rounded-2xl border border-border bg-bg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* header */}
            <div className="flex items-center justify-between gap-3 border-b border-border bg-bg-soft/50 p-4">
              <div className="flex items-center gap-2.5">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${tint.bg} ${tint.fg}`}>{initial(user.full_name)}</span>
                <div>
                  <h2 className="text-base font-bold text-fg">Transactions — {user.full_name}</h2>
                  <p className="font-mono text-xs text-fg-muted">{user.uid} · balance {taka(user.balance)}</p>
                </div>
              </div>
              <button type="button" onClick={() => !pending && setOpen(false)} className="rounded-lg p-1 text-fg-muted transition-colors hover:bg-bg-soft hover:text-fg" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 gap-0 md:grid-cols-[300px_1fr]">
              {/* add / edit form */}
              <form key={formKey} action={submit} className="space-y-3 overflow-y-auto border-b border-border p-4 md:border-b-0 md:border-r">
                <p className="text-sm font-bold text-fg">{edit ? "Edit transaction" : "Add new transaction"}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Type</label>
                    <select name="type" required defaultValue={edit?.type ?? ""} className={inputCls}>
                      <option value="" disabled>— Select —</option>
                      {types.map((t) => <option key={t.name} value={t.name}>{t.name} ({t.operator})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Amount (৳)</label>
                    <input name="amount" type="number" min="0" step="0.01" required defaultValue={edit?.amount ?? ""} placeholder="0" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Project <span className="font-normal text-fg-faint">(optional)</span></label>
                  <select name="project_id" defaultValue={edit?.project_id ?? ""} className={inputCls}>
                    <option value="">— None (general) —</option>
                    {projects.map((p) => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Date</label>
                    <input name="date" type="date" required defaultValue={edit ? dateInput(edit.date) : todayLocal()} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Receipt #</label>
                    <input name="rashid_number" defaultValue={edit?.rashid_number ?? ""} placeholder="রশিদ" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Description <span className="font-normal text-fg-faint">(optional)</span></label>
                  <textarea name="description" rows={2} defaultValue={edit?.description ?? ""} className={inputCls} />
                </div>

                {error && <p className="rounded-lg bg-brand-red-tint px-3 py-2 text-xs font-medium text-brand-red-dark">{error}</p>}

                <div className="flex gap-2">
                  {edit && (
                    <button type="button" onClick={() => { setEdit(null); setFormKey((k) => k + 1); setError(null); }} disabled={pending} className="rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-brand-blue/40 disabled:opacity-50">Cancel</button>
                  )}
                  <button type="submit" disabled={pending} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-blue-dark disabled:opacity-60">
                    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : edit ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {edit ? "Save changes" : "Add transaction"}
                  </button>
                </div>
              </form>

              {/* history */}
              <div className="flex min-h-0 flex-col">
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                  <p className="text-sm font-bold text-fg">Transaction history</p>
                  <span className="rounded-full bg-bg-soft px-2 py-0.5 text-xs font-semibold text-fg-muted">{user.txns.length}</span>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  {user.txns.length === 0 ? (
                    <p className="p-8 text-center text-sm text-fg-muted">No transactions yet.</p>
                  ) : (
                    <ul className="divide-y divide-border/60">
                      {user.txns.map((t) => {
                        const out = t.operator === "-";
                        return (
                          <li key={t.transaction_id} className="group px-4 py-2.5 transition-colors hover:bg-bg-soft/60">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="flex items-center gap-1.5 text-sm font-semibold text-fg">
                                  <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${out ? "bg-brand-red" : "bg-emerald-500"}`} />
                                  {t.type}
                                  {t.project_name && <span className="truncate text-xs font-normal text-fg-muted">· {t.project_name}</span>}
                                </p>
                                <p className="mt-0.5 text-xs text-fg-faint">
                                  {fmtDate(t.date)} · <span className="font-mono">{t.transaction_id}</span>{t.rashid_number ? ` · RN ${t.rashid_number}` : ""}
                                </p>
                                {t.description && <p className="mt-0.5 line-clamp-2 text-xs text-fg-muted">{t.description}</p>}
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-1">
                                <span className={`text-sm font-bold tabular-nums ${out ? "text-brand-red-dark" : "text-emerald-600"}`}>{out ? "−" : "+"}{taka(t.amount)}</span>
                                {confirmDel === t.transaction_id ? (
                                  <span className="flex items-center gap-1 text-[11px]">
                                    <span className="text-fg-muted">Delete?</span>
                                    <button type="button" onClick={() => del(t.transaction_id)} disabled={pending} className="font-bold text-brand-red hover:underline disabled:opacity-50">Yes</button>
                                    <button type="button" onClick={() => setConfirmDel(null)} disabled={pending} className="text-fg-muted hover:underline">No</button>
                                  </span>
                                ) : (
                                  <span className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                    <button type="button" onClick={() => { setEdit(t); setError(null); }} title="Edit" className="grid h-7 w-7 place-items-center rounded-md text-fg-muted hover:bg-bg-soft hover:text-brand-blue"><Pencil className="h-3.5 w-3.5" /></button>
                                    <button type="button" onClick={() => setConfirmDel(t.transaction_id)} title="Delete" className="grid h-7 w-7 place-items-center rounded-md text-fg-muted hover:bg-brand-red-tint hover:text-brand-red"><Trash2 className="h-3.5 w-3.5" /></button>
                                  </span>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
