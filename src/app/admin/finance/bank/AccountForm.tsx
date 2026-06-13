"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, X, Loader2 } from "lucide-react";
import { addAccount, updateAccount, type AccountInput } from "@/app/actions/admin-finance";

export type EditableAccount = {
  id: string;
  name: string;
  type: string;
  account_number: string | null;
  opening_balance: number;
  note: string | null;
};

const inputCls =
  "w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm outline-none focus:border-brand-blue/50";
const labelCls = "mb-1 block text-xs font-semibold text-fg-muted";

const TYPES: { value: string; label: string }[] = [
  { value: "bank", label: "Bank" },
  { value: "cash", label: "Cash" },
  { value: "mobile", label: "Mobile banking" },
];

/** Add (no `account`) or edit (with `account`) a finance account.
 *  Renders a trigger button → inline dialog overlay. */
export default function AccountForm({ account }: { account?: EditableAccount }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const isEdit = !!account;

  function submit(formData: FormData) {
    setError(null);
    const input: AccountInput = {
      name: String(formData.get("name") ?? ""),
      type: String(formData.get("type") ?? "bank"),
      account_number: String(formData.get("account_number") ?? ""),
      opening_balance: String(formData.get("opening_balance") ?? "0"),
      note: String(formData.get("note") ?? ""),
    };
    start(async () => {
      const res = isEdit
        ? await updateAccount(account!.id, input)
        : await addAccount(input);
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
      {isEdit ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-bg px-2.5 py-1.5 text-xs font-semibold text-fg transition-colors hover:border-brand-blue/40 hover:text-brand-blue"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-blue-dark"
        >
          <Plus className="h-4 w-4" /> Add account
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-bg p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-fg">
                {isEdit ? "Edit account" : "Add account"}
              </h2>
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
              <div>
                <label className={labelCls} htmlFor="acc-name">
                  Name
                </label>
                <input
                  id="acc-name"
                  name="name"
                  required
                  defaultValue={account?.name ?? ""}
                  placeholder="e.g. City Bank — Main"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="acc-type">
                    Type
                  </label>
                  <select
                    id="acc-type"
                    name="type"
                    defaultValue={account?.type ?? "bank"}
                    className={inputCls}
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls} htmlFor="acc-opening">
                    Opening balance (৳)
                  </label>
                  <input
                    id="acc-opening"
                    name="opening_balance"
                    type="number"
                    step="0.01"
                    defaultValue={account?.opening_balance ?? 0}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls} htmlFor="acc-number">
                  Account number <span className="font-normal text-fg-faint">(optional)</span>
                </label>
                <input
                  id="acc-number"
                  name="account_number"
                  defaultValue={account?.account_number ?? ""}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls} htmlFor="acc-note">
                  Note <span className="font-normal text-fg-faint">(optional)</span>
                </label>
                <textarea
                  id="acc-note"
                  name="note"
                  rows={2}
                  defaultValue={account?.note ?? ""}
                  className={inputCls}
                />
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
                  {isEdit ? "Save changes" : "Add account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
