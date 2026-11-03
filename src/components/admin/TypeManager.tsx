"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, Loader2, X } from "lucide-react";
import { saveInvestmentType, deleteInvestmentType } from "@/app/actions/admin-investments";

export type ManagedType = { name: string; operator: string };

/** Add / remove transaction types without leaving the form (the owner's ask,
 *  2026-11-03: the boss wants to add a new type, or drop one, right where the
 *  Type dropdown is). Writes go through the same actions as the Types page —
 *  admins only; system types and types already used by a transaction can't be
 *  deleted, and the server says so. The parent owns the list so its dropdown
 *  updates at once; router.refresh() brings the server copy in step. */
export default function TypeManager({ types, onAdded, onRemoved, onClose }: {
  types: ManagedType[];
  onAdded: (t: ManagedType) => void;
  onRemoved: (name: string) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [operator, setOperator] = useState<"+" | "-">("+");
  const [confirm, setConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // "add" or the type being removed
  const [pending, start] = useTransition();

  function add() {
    const n = name.trim();
    if (!n) return setError("Type a name first.");
    if (types.some((t) => t.name.toLowerCase() === n.toLowerCase())) return setError(`“${n}” already exists.`);
    setError(null);
    setBusy("add");
    start(async () => {
      const res = await saveInvestmentType({ name: n, operator, classification: "other", is_active: true });
      setBusy(null);
      if (!res.ok) return setError(res.error);
      onAdded({ name: n, operator });
      setName("");
      router.refresh();
    });
  }

  function remove(n: string) {
    setError(null);
    setBusy(n);
    start(async () => {
      const res = await deleteInvestmentType(n);
      setBusy(null);
      setConfirm(null);
      if (!res.ok) return setError(res.error);
      onRemoved(n);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-brand-blue/30 bg-brand-blue-tint p-2.5 text-xs">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-bold text-fg">Manage types</p>
        <button type="button" onClick={onClose} className="rounded p-0.5 text-fg-muted hover:text-fg" aria-label="Close"><X className="h-3.5 w-3.5" /></button>
      </div>
      <ul className="mb-2 flex flex-wrap gap-1">
        {types.map((t) => (
          <li key={t.name} className="inline-flex items-center gap-1 rounded-full border border-border bg-bg px-2 py-0.5">
            <span className="font-semibold text-fg">{t.name}</span>
            <span className={t.operator === "-" ? "text-brand-red" : "text-emerald-600"}>({t.operator})</span>
            {confirm === t.name ? (
              <span className="inline-flex items-center gap-1">
                <button type="button" onClick={() => remove(t.name)} disabled={pending} className="font-bold text-brand-red hover:underline disabled:opacity-50">
                  {busy === t.name ? <Loader2 className="h-3 w-3 animate-spin" /> : "Delete?"}
                </button>
                <button type="button" onClick={() => setConfirm(null)} disabled={pending} className="text-fg-muted hover:underline">No</button>
              </span>
            ) : (
              <button type="button" onClick={() => { setConfirm(t.name); setError(null); }} title={`Remove ${t.name}`} className="rounded p-0.5 text-fg-faint hover:bg-brand-red-tint hover:text-brand-red">
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="flex gap-1">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="New type name"
          className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-2 py-1.5 text-xs outline-none focus:border-brand-blue/50"
        />
        <select value={operator} onChange={(e) => setOperator(e.target.value === "-" ? "-" : "+")} title="+ adds to the balance, − reduces it" className="rounded-lg border border-border bg-bg px-1.5 py-1.5 text-xs outline-none">
          <option value="+">+</option>
          <option value="-">−</option>
        </select>
        <button type="button" onClick={add} disabled={pending} className="inline-flex items-center gap-1 rounded-lg bg-brand-blue px-2 py-1.5 font-semibold text-white hover:bg-brand-blue-dark disabled:opacity-60">
          {busy === "add" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Add
        </button>
      </div>
      {error && <p className="mt-1.5 rounded-lg bg-brand-red-tint px-2 py-1 font-medium text-brand-red-dark">{error}</p>}
      <p className="mt-1.5 text-[11px] text-fg-faint">
        + adds to the balance, − reduces it. A type already used by a transaction can&apos;t be deleted — set it inactive on the{" "}
        <Link href="/dashboard/investments/types" className="font-semibold text-brand-blue hover:underline">Types page</Link>.
      </p>
    </div>
  );
}
