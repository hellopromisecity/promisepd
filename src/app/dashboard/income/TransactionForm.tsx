"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2 } from "lucide-react";
import { addTransaction, type TransactionInput } from "@/app/actions/admin-finance";

export type AccountOption = { id: string; name: string; type: string };
export type ProjectOption = { slug: string; name: string };

const inputCls =
  "w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm outline-none focus:border-brand-blue/50";
const labelCls = "mb-1 block text-xs font-semibold text-fg-muted";

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** Add an income or expense transaction. `type` fixes which kind. */
export default function TransactionForm({
  type,
  accounts,
  projects,
}: {
  type: "income" | "expense";
  accounts: AccountOption[];
  projects: ProjectOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const verb = type === "income" ? "income" : "expense";

  function submit(formData: FormData) {
    setError(null);
    const accountId = String(formData.get("account_id") ?? "");
    const projectSlug = String(formData.get("project_slug") ?? "");
    const input: TransactionInput = {
      amount: String(formData.get("amount") ?? "0"),
      category: String(formData.get("category") ?? ""),
      account_id: accountId || null,
      txn_date: String(formData.get("txn_date") ?? ""),
      party: String(formData.get("party") ?? ""),
      project_slug: projectSlug || null,
      method: String(formData.get("method") ?? ""),
      description: String(formData.get("description") ?? ""),
    };
    start(async () => {
      const res = await addTransaction(type, input);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-blue-dark"
      >
        <Plus className="h-4 w-4" /> Add {verb}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-bg p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-fg capitalize">Add {verb}</h2>
              <button
                type="button"
                onClick={() => !pending && setOpen(false)}
                className="rounded-lg p-1 text-fg-muted hover:bg-bg-soft hover:text-fg"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="txn-amount">
                    Amount (৳)
                  </label>
                  <input
                    id="txn-amount"
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="0"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor="txn-date">
                    Date
                  </label>
                  <input
                    id="txn-date"
                    name="txn_date"
                    type="date"
                    required
                    defaultValue={todayLocal()}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls} htmlFor="txn-category">
                  Category
                </label>
                <input
                  id="txn-category"
                  name="category"
                  required
                  placeholder={type === "income" ? "e.g. Booking, Instalment" : "e.g. Salary, Materials"}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="txn-account">
                    Account
                  </label>
                  <select id="txn-account" name="account_id" className={inputCls} defaultValue="">
                    <option value="">— None —</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls} htmlFor="txn-project">
                    Project <span className="font-normal text-fg-faint">(optional)</span>
                  </label>
                  <select id="txn-project" name="project_slug" className={inputCls} defaultValue="">
                    <option value="">— None —</option>
                    {projects.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="txn-party">
                    Party <span className="font-normal text-fg-faint">(optional)</span>
                  </label>
                  <input
                    id="txn-party"
                    name="party"
                    placeholder={type === "income" ? "Payer" : "Payee"}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor="txn-method">
                    Method <span className="font-normal text-fg-faint">(optional)</span>
                  </label>
                  <input
                    id="txn-method"
                    name="method"
                    placeholder="Cash, bKash, cheque…"
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls} htmlFor="txn-desc">
                  Description <span className="font-normal text-fg-faint">(optional)</span>
                </label>
                <textarea id="txn-desc" name="description" rows={2} className={inputCls} />
              </div>

              {error && (
                <p className="rounded-lg bg-brand-red-tint px-3 py-2 text-xs font-medium text-brand-red-dark">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-brand-blue/40 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-blue-dark disabled:opacity-60"
                >
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save {verb}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
