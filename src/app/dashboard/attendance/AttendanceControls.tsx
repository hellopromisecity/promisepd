"use client";

/** Attendance date control — Day vs Range tabs with preset chips.
 *  Writes URL params the server page reads back:
 *    ?date=YYYY-MM-DD                       (single day → editable roster)
 *    ?range=<id>                            (preset range → summary)
 *    ?range=custom&from=…&to=…              (custom range → summary)
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Check, ChevronDown, Loader2 } from "lucide-react";

const DAY_PRESETS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "custom_day", label: "Pick a day" },
] as const;

const RANGE_PRESETS = [
  { id: "last7", label: "Last 7 days" },
  { id: "last30", label: "Last 30 days" },
  { id: "this_month", label: "This month" },
  { id: "last_month", label: "Last month" },
  { id: "this_year", label: "This year" },
  { id: "last_year", label: "Last year" },
  { id: "custom_range", label: "Custom range" },
] as const;

function todayIso() {
  return new Date().toLocaleDateString("en-CA");
}
function yesterdayIso() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("en-CA");
}

export default function AttendanceControls({
  mode,
  date = todayIso(),
  rangeId = "",
  from = "",
  to = "",
}: {
  mode: "day" | "range";
  date?: string;
  rangeId?: string;
  from?: string;
  to?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showDay, setShowDay] = useState(false);
  const [showRange, setShowRange] = useState(false);
  const [customDay, setCustomDay] = useState(date);
  const [cFrom, setCFrom] = useState(from || todayIso());
  const [cTo, setCTo] = useState(to || todayIso());

  const go = (qs: string) => startTransition(() => router.push(`/dashboard/attendance${qs}`));
  const gotoDay = (d: string) => go(`?date=${d}`);
  const gotoRange = (id: string) => go(`?range=${id}`);

  const dayId =
    mode === "day" ? (date === todayIso() ? "today" : date === yesterdayIso() ? "yesterday" : "custom_day") : "";

  return (
    <div className="flex flex-col gap-2.5">
      {/* Day / Range tabs */}
      <div className="grid w-full max-w-[220px] grid-cols-2 gap-1 rounded-xl bg-bg-soft p-1">
        <button
          type="button"
          onClick={() => gotoDay(todayIso())}
          className={`rounded-lg py-1.5 text-xs font-semibold transition-colors ${mode === "day" ? "bg-bg text-fg shadow-sm" : "text-fg-muted hover:text-fg"}`}
        >
          Day
        </button>
        <button
          type="button"
          onClick={() => gotoRange("this_month")}
          className={`rounded-lg py-1.5 text-xs font-semibold transition-colors ${mode === "range" ? "bg-bg text-fg shadow-sm" : "text-fg-muted hover:text-fg"}`}
        >
          Range
        </button>
      </div>

      {/* Preset chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        {pending && <Loader2 className="h-4 w-4 animate-spin text-fg-faint" />}
        {(mode === "day" ? DAY_PRESETS : RANGE_PRESETS).map((p) => {
          const active = mode === "day" ? p.id === dayId : p.id === (rangeId || "this_month");
          const isCustom = p.id === "custom_day" || p.id === "custom_range";
          return (
            <button
              key={p.id}
              type="button"
              disabled={pending}
              onClick={() => {
                if (p.id === "today") gotoDay(todayIso());
                else if (p.id === "yesterday") gotoDay(yesterdayIso());
                else if (p.id === "custom_day") { setShowDay((v) => !v); setShowRange(false); }
                else if (p.id === "custom_range") { setShowRange((v) => !v); setShowDay(false); }
                else gotoRange(p.id);
              }}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "border-brand-blue/50 bg-brand-blue-tint text-brand-blue"
                  : "border-border bg-bg text-fg-muted hover:border-brand-blue/40 hover:text-fg"
              }`}
            >
              {isCustom && <Calendar className="h-3.5 w-3.5" />}
              {p.label}
              {active && !isCustom && <Check className="h-3.5 w-3.5" />}
              {isCustom && <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          );
        })}
      </div>

      {showDay && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-bg p-2.5">
          <input
            type="date"
            value={customDay}
            max={todayIso()}
            onChange={(e) => setCustomDay(e.target.value)}
            className="h-9 flex-1 rounded-lg border border-border bg-bg-soft px-3 text-sm text-fg outline-none focus:border-brand-blue/50"
          />
          <button
            type="button"
            onClick={() => customDay && gotoDay(customDay)}
            className="h-9 rounded-lg bg-brand-blue px-4 text-sm font-semibold text-white hover:bg-brand-blue-dark"
          >
            View
          </button>
        </div>
      )}

      {showRange && (
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-bg p-2.5">
          <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
            From
            <input type="date" value={cFrom} max={cTo || undefined} onChange={(e) => setCFrom(e.target.value)} className="h-9 rounded-lg border border-border bg-bg-soft px-3 text-sm text-fg outline-none focus:border-brand-blue/50" />
          </label>
          <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
            To
            <input type="date" value={cTo} min={cFrom || undefined} max={todayIso()} onChange={(e) => setCTo(e.target.value)} className="h-9 rounded-lg border border-border bg-bg-soft px-3 text-sm text-fg outline-none focus:border-brand-blue/50" />
          </label>
          <button
            type="button"
            disabled={!cFrom || !cTo}
            onClick={() => go(`?range=custom&from=${cFrom}&to=${cTo}`)}
            className="h-9 rounded-lg bg-brand-blue px-4 text-sm font-semibold text-white hover:bg-brand-blue-dark disabled:opacity-50"
          >
            View
          </button>
        </div>
      )}
    </div>
  );
}
