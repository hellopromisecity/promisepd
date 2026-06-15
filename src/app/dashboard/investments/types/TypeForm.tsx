"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, X, Loader2 } from "lucide-react";
import { saveInvestmentType, type TypeInput } from "@/app/actions/admin-investments";

const inputCls =
  "w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm outline-none focus:border-brand-blue/50";
const labelCls = "mb-1 block text-xs font-semibold text-fg-muted";

export type EditableType = {
  name: string;
  operator: "+" | "-";
  classification: string;
  is_active: boolean;
};

export default function TypeForm({ type }: { type?: EditableType }) {
  const router = useRouter();
  const editing = !!type;
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(fd: FormData) {
    setError(null);
    const input: TypeInput = {
      original_name: type?.name ?? null,
      name: String(fd.get("name") ?? ""),
      operator: (String(fd.get("operator") ?? "+") === "-" ? "-" : "+") as "+" | "-",
      classification: String(fd.get("classification") ?? "other"),
      is_active: fd.get("is_active") === "on",
    };
    start(async () => {
      const res = await saveInvestmentType(input);
      if (!res.ok) return setError(res.error);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      {editing ? (
        <button type="button" onClick={() => setOpen(true)} title="Edit" className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-bg-soft hover:text-brand-blue">
          <Pencil className="h-4 w-4" />
        </button>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-blue-dark">
          <Plus className="h-4 w-4" /> Add type
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => !pending && setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-bg p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-fg">{editing ? "Edit type" : "Add type"}</h2>
              <button type="button" onClick={() => !pending && setOpen(false)} className="rounded-lg p-1 text-fg-muted hover:bg-bg-soft hover:text-fg" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={submit} className="space-y-3">
              <div>
                <label className={labelCls} htmlFor="ty-name">Name</label>
                <input id="ty-name" name="name" required defaultValue={type?.name ?? ""} placeholder="e.g. deposit" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="ty-op">Effect on balance</label>
                  <select id="ty-op" name="operator" defaultValue={type?.operator ?? "+"} className={inputCls}>
                    <option value="+">+ (Credit)</option>
                    <option value="-">− (Debit)</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls} htmlFor="ty-class">Classification</label>
                  <select id="ty-class" name="classification" defaultValue={type?.classification ?? "other"} className={inputCls}>
                    {[...new Set([type?.classification, "investment", "other", "installment"].filter(Boolean))].map((c) => (
                      <option key={c} value={c as string}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 pt-1 text-sm font-medium text-fg">
                <input type="checkbox" name="is_active" defaultChecked={type?.is_active ?? true} className="h-4 w-4 accent-brand-blue" /> Active
              </label>
              <p className="rounded-lg bg-bg-soft px-3 py-2 text-[11px] text-fg-muted">
                Balance buckets by type name: <b>investment / deposit / booking_money / installment</b> count as <b>invested</b>; other <b>+</b> types as <b>profit</b>; all <b>−</b> types as <b>withdrawn</b>.
              </p>

              {error && <p className="rounded-lg bg-brand-red-tint px-3 py-2 text-xs font-medium text-brand-red-dark">{error}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)} disabled={pending} className="rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-brand-blue/40 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={pending} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-blue-dark disabled:opacity-60">
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />} {editing ? "Save changes" : "Add type"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
