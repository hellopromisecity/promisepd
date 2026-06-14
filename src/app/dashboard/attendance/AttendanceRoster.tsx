"use client";

/** One editable list of every employee for a day:
 *   • an animated attendance gauge + Present/Late/Absent/Leave tiles
 *   • "Mark everyone" bulk buttons (the active one is filled) + Reset
 *   • per-row icon pills — ONE click sets a person's status (filled when
 *     active); click the name to cycle
 *   • a single "Save attendance" that persists the whole day in one batch */

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, X, Clock, Plane, Loader2, Save, RotateCcw } from "lucide-react";
import { saveAttendanceBatch, type AttendanceEntry } from "@/app/actions/admin-staff";
import { toast } from "@/components/ui/Toast";

type Status = "present" | "absent" | "late" | "leave";
const ORDER: Status[] = ["present", "absent", "late", "leave"];

export type RosterRow = {
  ref: string;
  memberId: string | null;
  name: string;
  meta: string;
  code: string;
  status: Status | null;
};

const META: Record<
  Status,
  { label: string; icon: typeof Check; fill: string; ring: string; text: string; dot: string }
> = {
  present: { label: "Present", icon: Check, fill: "bg-emerald-500 text-white", ring: "ring-emerald-200", text: "text-emerald-600", dot: "#10b981" },
  absent: { label: "Absent", icon: X, fill: "bg-brand-red text-white", ring: "ring-brand-red/30", text: "text-brand-red", dot: "#e11924" },
  late: { label: "Late", icon: Clock, fill: "bg-amber-500 text-white", ring: "ring-amber-200", text: "text-amber-600", dot: "#f59e0b" },
  leave: { label: "Leave", icon: Plane, fill: "bg-brand-blue text-white", ring: "ring-brand-blue/30", text: "text-brand-blue", dot: "#1847a1" },
};

export default function AttendanceRoster({ date, rows }: { date: string; rows: RosterRow[] }) {
  const initial = useMemo(() => {
    const o: Record<string, Status> = {};
    for (const r of rows) o[r.ref] = r.status ?? "present";
    return o;
  }, [rows]);

  const [entries, setEntries] = useState<Record<string, Status>>(initial);
  const [pending, startTransition] = useTransition();
  const [savedOnce, setSavedOnce] = useState(false);

  const counts = useMemo(() => {
    const c: Record<Status, number> = { present: 0, absent: 0, late: 0, leave: 0 };
    for (const s of Object.values(entries)) c[s]++;
    return c;
  }, [entries]);
  const total = rows.length;

  const setAll = (s: Status) => setEntries(Object.fromEntries(rows.map((r) => [r.ref, s])));
  const set = (ref: string, s: Status) => setEntries((e) => ({ ...e, [ref]: s }));
  const cycle = (ref: string) =>
    setEntries((e) => ({ ...e, [ref]: ORDER[(ORDER.indexOf(e[ref] ?? "present") + 1) % ORDER.length] }));
  const reset = () => setEntries(initial);
  const allAre = (s: Status) => total > 0 && rows.every((r) => entries[r.ref] === s);
  const dirty = rows.some((r) => entries[r.ref] !== initial[r.ref]);

  function save() {
    const payload: AttendanceEntry[] = rows.map((r) => ({
      ref: r.ref,
      memberId: r.memberId,
      status: entries[r.ref] ?? "present",
    }));
    startTransition(async () => {
      const res = await saveAttendanceBatch(date, payload);
      if (res.ok) {
        toast(res.message ?? "Saved.", "success");
        setSavedOnce(true);
      } else {
        toast(res.error, "error");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Animated summary */}
      <AttendanceSummary counts={counts} total={total} />

      {/* Bulk bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-bg p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-fg-muted">Mark everyone:</span>
          {ORDER.map((s) => {
            const m = META[s];
            const on = allAre(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => setAll(s)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                  on ? `${m.fill} border-transparent shadow-sm` : `border-border bg-bg ${m.text} hover:bg-bg-soft`
                }`}
              >
                <m.icon className="h-3.5 w-3.5" /> {m.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={reset}
          disabled={!dirty}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-fg-muted transition-colors hover:bg-bg-soft hover:text-fg disabled:opacity-40"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>

      {/* Roster */}
      <div className="overflow-hidden rounded-2xl border border-border bg-bg">
        <ul className="divide-y divide-border">
          {rows.map((r) => {
            const status = entries[r.ref] ?? "present";
            return (
              <li key={r.ref} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-blue-tint text-xs font-bold text-brand-blue">
                  {(r.name?.[0] ?? "?").toUpperCase()}
                </span>
                <button type="button" onClick={() => cycle(r.ref)} className="min-w-0 flex-1 text-left">
                  <p className="truncate font-semibold text-fg">{r.name || "Unnamed"}</p>
                  <p className="truncate text-[11px] text-fg-muted">
                    {r.meta}
                    {r.code ? ` · ${r.code}` : ""}
                  </p>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  {ORDER.map((s) => {
                    const m = META[s];
                    const active = status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        title={m.label}
                        onClick={() => set(r.ref, s)}
                        className={`grid h-8 w-8 place-items-center rounded-full transition-all ${
                          active ? `${m.fill} scale-105 shadow-sm` : "text-fg-faint hover:bg-bg-soft hover:text-fg"
                        }`}
                      >
                        <m.icon className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex items-center justify-end gap-3">
        {savedOnce && !pending && !dirty && <span className="text-xs font-semibold text-emerald-600">Saved ✓</span>}
        <button
          onClick={save}
          disabled={pending || total === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-blue-dark disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save attendance ({total})
        </button>
      </div>
    </div>
  );
}

/** Animated donut (present %) + four status tiles. */
function AttendanceSummary({
  counts,
  total,
}: {
  counts: Record<Status, number>;
  total: number;
}) {
  const pct = total > 0 ? Math.round((counts.present / total) * 100) : 0;
  // Animate the ring + number from 0 on mount, then track changes.
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  const R = 52;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - shown / 100);

  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-bg p-4 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-6">
      {/* Donut */}
      <div className="relative mx-auto grid h-32 w-32 place-items-center">
        <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
          <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-bg-soft,#eef2f7)" strokeWidth="12" />
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="#1847a1"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-2xl font-extrabold text-fg tabular-nums">{shown}%</div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-fg-muted">Present</div>
          </div>
        </div>
      </div>

      {/* Tiles */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {ORDER.map((s) => {
          const m = META[s];
          return (
            <div
              key={s}
              className="rounded-xl border border-border bg-bg-soft p-3 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg text-white" style={{ backgroundColor: m.dot }}>
                  <m.icon className="h-4 w-4" />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">{m.label}</span>
              </div>
              <div className={`mt-1.5 text-2xl font-extrabold tabular-nums ${m.text}`}>{counts[s]}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
