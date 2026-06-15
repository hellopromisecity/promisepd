"use client";

/** Interactive Transaction Types table — system types are read-only
 *  (locked), editable types get an inline Active toggle, Edit and Delete.
 *  Keeps every original capability; adds the row toggle + delete + a
 *  cleaner, animated look. */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Minus, Lock, Trash2, Loader2, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { thCls, tdCls, Badge } from "@/components/admin/ui";
import { toast } from "@/components/ui/Toast";
import { setInvestmentTypeActive, deleteInvestmentType } from "@/app/actions/admin-investments";
import TypeForm from "./TypeForm";

export type TypeRow = {
  name: string;
  operator: "+" | "-";
  classification: string;
  is_editable: boolean;
  is_active: boolean;
  used: number;
};

export default function TypesTable({ types }: { types: TypeRow[] }) {
  const router = useRouter();
  // optimistic active overrides + delete-in-flight set
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [, start] = useTransition();

  const isActive = (t: TypeRow) => overrides[t.name] ?? t.is_active;

  function toggle(t: TypeRow) {
    const next = !isActive(t);
    setOverrides((o) => ({ ...o, [t.name]: next })); // optimistic
    start(async () => {
      const res = await setInvestmentTypeActive(t.name, next);
      if (!res.ok) {
        setOverrides((o) => ({ ...o, [t.name]: !next })); // revert
        toast(res.error, "error");
      }
    });
  }

  function del(name: string) {
    setBusy(name);
    start(async () => {
      const res = await deleteInvestmentType(name);
      setBusy(null);
      setConfirmDel(null);
      if (res.ok) {
        toast(res.message ?? "Deleted.", "success");
        router.refresh();
      } else {
        toast(res.error, "error");
      }
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-bg">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-bg-soft">
            <tr>
              <th className={thCls}>Type</th>
              <th className={thCls}>Effect</th>
              <th className={thCls}>Classification</th>
              <th className={`${thCls} text-right`}>Used</th>
              <th className={thCls}>Status</th>
              <th className={`${thCls} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {types.map((t, i) => {
              const minus = t.operator === "-";
              const active = isActive(t);
              return (
                <motion.tr
                  key={t.name}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.025, 0.3) }}
                  className="border-t border-border hover:bg-bg-soft/50"
                >
                  <td className={tdCls}>
                    <div className="flex items-center gap-3">
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${minus ? "bg-brand-red-tint text-brand-red-dark" : "bg-emerald-50 text-emerald-600"}`}>
                        {minus ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                      </span>
                      <span className="font-semibold text-fg">{t.name}</span>
                    </div>
                  </td>
                  <td className={tdCls}>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${minus ? "bg-brand-red-tint text-brand-red-dark" : "bg-emerald-50 text-emerald-700"}`}>
                      {minus ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                      {minus ? "Debit" : "Credit"}
                    </span>
                  </td>
                  <td className={tdCls}>
                    <Badge tone={t.classification === "investment" ? "info" : t.classification === "installment" ? "warning" : "neutral"}>
                      {t.classification}
                    </Badge>
                  </td>
                  <td className={`${tdCls} text-right tabular-nums text-fg-muted`}>{t.used.toLocaleString("en-US")}</td>
                  <td className={tdCls}>
                    {t.is_editable ? (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={active}
                        onClick={() => toggle(t)}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${active ? "bg-brand-blue" : "bg-border"}`}
                        title={active ? "Active — click to deactivate" : "Inactive — click to activate"}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${active ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    ) : (
                      <Badge tone={active ? "success" : "neutral"}>{active ? "Active" : "Inactive"}</Badge>
                    )}
                  </td>
                  <td className={tdCls}>
                    {t.is_editable ? (
                      <div className="flex items-center justify-end gap-1">
                        <TypeForm type={{ name: t.name, operator: t.operator, classification: t.classification, is_active: active }} />
                        {confirmDel === t.name ? (
                          <span className="inline-flex items-center gap-1">
                            <button type="button" onClick={() => del(t.name)} disabled={busy === t.name} className="inline-flex items-center gap-1 rounded-lg bg-brand-red px-2 py-1 text-xs font-semibold text-white disabled:opacity-60">
                              {busy === t.name ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Delete
                            </button>
                            <button type="button" onClick={() => setConfirmDel(null)} className="rounded-lg border border-border px-2 py-1 text-xs font-semibold text-fg-muted hover:bg-bg-soft">No</button>
                          </span>
                        ) : (
                          <button type="button" onClick={() => setConfirmDel(t.name)} title="Delete" className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-brand-red-tint hover:text-brand-red-dark">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5 text-xs font-semibold text-fg-faint">
                        <Lock className="h-3.5 w-3.5" /> System
                      </div>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
