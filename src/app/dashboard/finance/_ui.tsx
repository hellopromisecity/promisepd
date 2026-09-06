"use client";

/** Shared client bits for the Finance section — money/date formatting,
 *  period presets, the Modal shell, the animated Donut and the head label.
 *  Leading underscore → not a route. */

import { X } from "lucide-react";
import type { FinHead, FinTxn } from "@/lib/finance";

export const taka = (v: number) => "৳" + (Math.round(Number(v) || 0) || 0).toLocaleString("en-IN");
export const compact = (v: number) => {
  const a = Math.abs(Number(v) || 0);
  if (a >= 1e7) return `৳${(v / 1e7).toFixed(2)} Cr`;
  if (a >= 1e5) return `৳${(v / 1e5).toFixed(2)} L`;
  return taka(v);
};
export const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const t = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return Number.isNaN(t.getTime()) ? iso : t.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
export const todayIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

/** Head shown as "English · বাংলা" when both exist. */
export const headLabel = (h: Pick<FinHead, "name" | "name_bn"> | null | undefined) => (h ? (h.name_bn ? `${h.name} · ${h.name_bn}` : h.name) : "—");

/** The entry's head text: the head name, plus what exactly for "Others". */
export const txnHead = (t: FinTxn) => (t.head_detail ? `${t.category} — ${t.head_detail}` : t.category);

export const METHODS = ["Cash", "Bank transfer", "Cheque", "bKash", "Nagad", "Rocket", "Card"];

export const ACCOUNT_TYPES: { value: string; label: string; hint: string }[] = [
  { value: "cash", label: "Cash drawer", hint: "নগদ — office cash" },
  { value: "bank", label: "Bank", hint: "Islami Bank, DBBL, …" },
  { value: "mobile", label: "Mobile banking", hint: "bKash / Nagad / Rocket" },
];
export const accountTypeLabel = (t: string) => ACCOUNT_TYPES.find((a) => a.value === t)?.label ?? t;

/* ── period presets (dates are YYYY-MM-DD, compared as strings) ── */
export type Period = "month" | "last" | "30d" | "year" | "12m" | "all";
export const PERIODS: { value: Period; label: string }[] = [
  { value: "month", label: "This month" },
  { value: "last", label: "Last month" },
  { value: "30d", label: "Last 30 days" },
  { value: "year", label: "This year" },
  { value: "12m", label: "Last 12 months" },
  { value: "all", label: "All time" },
];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function periodRange(p: Period): { from: string | null; to: string | null; label: string } {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  if (p === "month") return { from: iso(new Date(y, m, 1)), to: iso(new Date(y, m + 1, 0)), label: now.toLocaleDateString("en-GB", { month: "long", year: "numeric" }) };
  if (p === "last") { const d = new Date(y, m - 1, 1); return { from: iso(d), to: iso(new Date(y, m, 0)), label: d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }) }; }
  if (p === "30d") { const d = new Date(now); d.setDate(d.getDate() - 29); return { from: iso(d), to: iso(now), label: "last 30 days" }; }
  if (p === "year") return { from: `${y}-01-01`, to: `${y}-12-31`, label: String(y) };
  if (p === "12m") { const d = new Date(y, m - 11, 1); return { from: iso(d), to: iso(now), label: "last 12 months" }; }
  return { from: null, to: null, label: "all time" };
}
export const inPeriod = (t: { txn_date: string }, r: { from: string | null; to: string | null }) => (!r.from || t.txn_date >= r.from) && (!r.to || t.txn_date <= r.to);

/** Last 12 calendar months as YYYY-MM keys + short labels, oldest first. */
export function last12Months(): { key: string; label: string }[] {
  const now = new Date();
  const out: { key: string; label: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleDateString("en-GB", { month: "short" }) });
  }
  return out;
}

export const inputCls = "w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm text-fg outline-none focus:border-brand-blue/50";
export const labelCls = "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-fg-muted";
export const selectCls = "rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-medium text-fg outline-none focus:border-brand-blue/50";

export function Modal({ title, subtitle, onClose, children, wide }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-14" onClick={onClose}>
      <div className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-2xl bg-bg shadow-2xl`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div><h3 className="text-lg font-bold text-fg">{title}</h3>{subtitle && <p className="text-xs text-fg-muted">{subtitle}</p>}</div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-fg-muted hover:bg-bg-soft"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

/** Animated ring — pct fills in after mount. */
export function Donut({ mounted, pct, color, label, a, b, size = 88 }: { mounted: boolean; pct: number; color: string; label: string; a: string; b?: string; size?: number }) {
  const r = 30, c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 80 80" width={size} height={size} className="-rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" stroke="var(--color-border)" strokeWidth="9" />
          <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={mounted ? off : c} style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)" }} />
        </svg>
        <div className="absolute inset-0 grid place-items-center"><span className="text-base font-extrabold tabular-nums text-fg">{Math.round(pct)}%</span></div>
      </div>
      <p className="text-xs font-semibold text-fg">{label}</p>
      <p className="text-[11px] text-fg-muted">{a}{b ? ` · ${b}` : ""}</p>
    </div>
  );
}

/** Horizontal breakdown bar list (head → amount), animated on mount. */
export function BarList({ mounted, rows, color, total, empty }: { mounted: boolean; rows: { label: string; value: number; count?: number }[]; color: string; total: number; empty: string }) {
  if (!rows.length) return <p className="py-8 text-center text-sm text-fg-muted">{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((r, i) => (
        <li key={r.label + i} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-medium text-fg" title={r.label}>{r.label}</span>
              <span className="shrink-0 text-[11px] text-fg-faint">{total > 0 ? `${Math.round((r.value / total) * 100)}%` : ""}{r.count != null ? ` · ${r.count}` : ""}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-bg-soft">
              <div className="h-full rounded-full transition-[width] duration-700" style={{ width: mounted ? `${Math.max(2, (r.value / max) * 100)}%` : "0%", background: color, transitionDelay: `${i * 50}ms` }} />
            </div>
          </div>
          <span className="w-24 text-right text-sm font-bold tabular-nums text-fg">{taka(r.value)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Group entries by head (category + detail for Others), largest first. */
export function byHead(txns: FinTxn[]): { label: string; value: number; count: number }[] {
  const m = new Map<string, { value: number; count: number }>();
  for (const t of txns) {
    const k = t.category || "—";
    const cur = m.get(k) ?? { value: 0, count: 0 };
    cur.value += t.amount; cur.count++;
    m.set(k, cur);
  }
  return [...m.entries()].map(([label, v]) => ({ label, ...v })).sort((a, b) => b.value - a.value);
}
