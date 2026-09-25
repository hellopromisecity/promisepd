"use client";

/** "Last 12 months ▾" button + popover (presets, custom from/to, Apply) —
 *  the Dashboard's date filter, shared with every project page's Monthly
 *  flow card. Reports the applied range + a human label to the parent. */

import { useState } from "react";
import { CalendarRange, ChevronDown, X } from "lucide-react";
import { FLOW_PRESETS, presetRange } from "./flow";

export type AppliedRange = { from: string; to: string; label: string };
export const DEFAULT_RANGE: AppliedRange = { from: "", to: "", label: "Last 12 months" };

export default function DateRangeFilter({ applied, onApply, compact = false }: { applied: AppliedRange; onApply: (r: AppliedRange) => void; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [draftPreset, setDraftPreset] = useState("12m");
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");

  function apply() {
    const label = FLOW_PRESETS.find((p) => p.id === draftPreset)?.label ?? "Custom";
    if (draftPreset === "custom") onApply({ from: draftFrom, to: draftTo, label: draftFrom && draftTo ? `${draftFrom} → ${draftTo}` : "Custom range" });
    else onApply({ ...presetRange(draftPreset), label });
    setOpen(false);
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className={`inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg font-semibold text-fg transition-colors hover:border-brand-blue/40 ${compact ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2.5 text-sm"}`}>
        <CalendarRange className={`text-brand-blue ${compact ? "h-3.5 w-3.5" : "h-4 w-4"}`} /> {applied.label} <ChevronDown className={`text-fg-faint ${compact ? "h-3.5 w-3.5" : "h-4 w-4"}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-64 rounded-2xl border border-border bg-bg p-3 text-left shadow-2xl">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-fg-muted">Date range</p>
              <button type="button" onClick={() => setOpen(false)} className="rounded p-0.5 text-fg-faint hover:text-fg"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {FLOW_PRESETS.filter((p) => p.id !== "custom").map((p) => (
                <button key={p.id} type="button" onClick={() => setDraftPreset(p.id)} className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${draftPreset === p.id ? "bg-brand-blue text-white" : "bg-bg-soft text-fg hover:bg-brand-blue-tint"}`}>{p.label}</button>
              ))}
              <button type="button" onClick={() => setDraftPreset("custom")} className={`col-span-2 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${draftPreset === "custom" ? "bg-brand-blue text-white" : "bg-bg-soft text-fg hover:bg-brand-blue-tint"}`}>Custom range</button>
            </div>
            {draftPreset === "custom" && (
              <div className="mt-2 space-y-1.5">
                <input type="date" value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)} className="w-full rounded-lg border border-border bg-bg-soft px-2 py-1.5 text-xs outline-none focus:border-brand-blue/50" />
                <input type="date" value={draftTo} onChange={(e) => setDraftTo(e.target.value)} className="w-full rounded-lg border border-border bg-bg-soft px-2 py-1.5 text-xs outline-none focus:border-brand-blue/50" />
              </div>
            )}
            <button type="button" onClick={apply} className="mt-3 w-full rounded-lg bg-brand-blue py-2 text-xs font-bold text-white transition-colors hover:bg-brand-blue-dark">Apply</button>
          </div>
        </>
      )}
    </div>
  );
}
