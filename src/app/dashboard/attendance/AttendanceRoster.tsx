"use client";

/** Attendance for a single day, with three clear states:
 *
 *   • NOT TAKEN, today  → a centered "Take today's attendance" call-to-action
 *                         (no pre-filled roster — nothing is assumed present).
 *   • NOT TAKEN, past   → a "No attendance taken" notice (+ a backfill button).
 *   • TAKEN             → the recorded statuses, read-only, with a "taken ✓"
 *                         banner and an Edit button.
 *   • EDITING           → the editable roster: animated gauge, "Mark everyone"
 *                         bulk buttons, per-row pills, and one Save that
 *                         persists the whole day in a single batch.
 *
 *  The old version seeded every unmarked person as "present", so any day
 *  without records looked like a full house — and every empty day looked
 *  identical.  Now an untaken day is shown as exactly that. */

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  X,
  Clock,
  Plane,
  Loader2,
  Save,
  RotateCcw,
  ClipboardCheck,
  CalendarX2,
  CheckCircle2,
  Pencil,
} from "lucide-react";
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

/** Parse a bare YYYY-MM-DD as LOCAL midnight so the label never shifts. */
function fmtDay(d: string): string {
  const s = d.includes("T") ? d : `${d}T00:00:00`;
  return new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function AttendanceRoster({
  date,
  rows,
  isToday,
  taken,
}: {
  date: string;
  rows: RosterRow[];
  isToday: boolean;
  taken: boolean;
}) {
  const router = useRouter();
  const total = rows.length;

  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  // A snapshot of what we just saved, so the recorded view is correct
  // instantly (before router.refresh() brings the new server props in).
  const [saved, setSaved] = useState<Record<string, Status> | null>(null);

  const seed = (): Record<string, Status> =>
    Object.fromEntries(rows.map((r) => [r.ref, r.status ?? "present"]));

  const [entries, setEntries] = useState<Record<string, Status>>(seed);

  const beginEdit = () => {
    setEntries(seed());
    setEditing(true);
  };
  const cancelEdit = () => {
    setEntries(seed());
    setEditing(false);
  };

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
        setSaved({ ...entries });
        setEditing(false);
        router.refresh(); // re-fetch so `taken` + statuses reflect the DB
      } else {
        toast(res.error, "error");
      }
    });
  }

  // ───────────────────────── EDIT MODE ─────────────────────────
  if (editing) {
    const counts: Record<Status, number> = { present: 0, absent: 0, late: 0, leave: 0 };
    for (const r of rows) counts[entries[r.ref] ?? "present"]++;
    const setAll = (s: Status) => setEntries(Object.fromEntries(rows.map((r) => [r.ref, s])));
    const setOne = (ref: string, s: Status) => setEntries((e) => ({ ...e, [ref]: s }));
    const cycle = (ref: string) =>
      setEntries((e) => ({ ...e, [ref]: ORDER[(ORDER.indexOf(e[ref] ?? "present") + 1) % ORDER.length] }));
    const allAre = (s: Status) => total > 0 && rows.every((r) => entries[r.ref] === s);

    return (
      <div className="space-y-4">
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
            onClick={() => setEntries(seed())}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-fg-muted transition-colors hover:bg-bg-soft hover:text-fg"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>

        {/* Editable roster */}
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
                          onClick={() => setOne(r.ref, s)}
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
          <button
            type="button"
            onClick={cancelEdit}
            disabled={pending}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-fg-muted transition-colors hover:bg-bg-soft hover:text-fg disabled:opacity-60"
          >
            Cancel
          </button>
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

  // ─────────────────────── RECORDED VIEW ───────────────────────
  if (taken || saved) {
    // Prefer the just-saved snapshot; otherwise read the day's real statuses.
    const display: Record<string, Status | null> = saved
      ? saved
      : Object.fromEntries(rows.map((r) => [r.ref, r.status]));
    const counts: Record<Status, number> = { present: 0, absent: 0, late: 0, leave: 0 };
    let marked = 0;
    for (const r of rows) {
      const s = display[r.ref];
      if (s) {
        counts[s]++;
        marked++;
      }
    }

    return (
      <div className="space-y-4">
        {/* Taken banner */}
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>
            {isToday ? "Today's attendance taken" : `Attendance recorded · ${fmtDay(date)}`}
            {marked < total && (
              <span className="ml-1 font-medium text-emerald-600/80">
                ({marked} of {total} marked)
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={beginEdit}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        </div>

        <AttendanceSummary counts={counts} total={total} />

        {/* Read-only roster with recorded statuses */}
        <div className="overflow-hidden rounded-2xl border border-border bg-bg">
          <ul className="divide-y divide-border">
            {rows.map((r) => {
              const s = display[r.ref];
              const m = s ? META[s] : null;
              return (
                <li key={r.ref} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-blue-tint text-xs font-bold text-brand-blue">
                    {(r.name?.[0] ?? "?").toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-fg">{r.name || "Unnamed"}</p>
                    <p className="truncate text-[11px] text-fg-muted">
                      {r.meta}
                      {r.code ? ` · ${r.code}` : ""}
                    </p>
                  </div>
                  {m ? (
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white`}
                      style={{ backgroundColor: m.dot }}
                    >
                      <m.icon className="h-3.5 w-3.5" /> {m.label}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-semibold text-fg-faint">
                      Not marked
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }

  // ─────────────────── NOT TAKEN: today (CTA) ───────────────────
  if (isToday) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-bg px-6 py-12 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-blue-tint text-brand-blue">
          <ClipboardCheck className="h-7 w-7" />
        </span>
        <h3 className="mt-4 text-base font-bold text-fg">Today&rsquo;s attendance not taken yet</h3>
        <p className="mt-1 max-w-sm text-sm text-fg-muted">
          Start the roster, mark everyone in one go, then save. {total} {total === 1 ? "person" : "people"} on the list.
        </p>
        <button
          type="button"
          onClick={beginEdit}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-blue px-6 py-3 text-sm font-bold text-white shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-blue-dark"
        >
          <ClipboardCheck className="h-4 w-4" /> Take today&rsquo;s attendance
        </button>
      </div>
    );
  }

  // ─────────────── NOT TAKEN: a past day (notice) ───────────────
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-bg px-6 py-12 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-bg-soft text-fg-faint">
        <CalendarX2 className="h-7 w-7" />
      </span>
      <h3 className="mt-4 text-base font-bold text-fg">No attendance taken</h3>
      <p className="mt-1 max-w-sm text-sm text-fg-muted">
        No attendance was recorded on {fmtDay(date)}.
      </p>
      <button
        type="button"
        onClick={beginEdit}
        className="mt-5 inline-flex items-center gap-2 rounded-xl border border-border bg-bg px-5 py-2.5 text-sm font-semibold text-brand-blue transition-colors hover:bg-brand-blue-tint"
      >
        <Pencil className="h-4 w-4" /> Mark this day
      </button>
    </div>
  );
}

/** Animated donut (present %) + four status tiles. */
function AttendanceSummary({ counts, total }: { counts: Record<Status, number>; total: number }) {
  const pct = total > 0 ? Math.round((counts.present / total) * 100) : 0;
  const shown = useAnimatedPct(pct);

  const R = 52;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - shown / 100);

  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-bg p-4 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-6">
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

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {ORDER.map((s) => {
          const m = META[s];
          return (
            <div key={s} className="rounded-xl border border-border bg-bg-soft p-3 transition-transform hover:-translate-y-0.5">
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

/** Ease the ring + number from 0 on mount, then track changes. */
function useAnimatedPct(pct: number) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);
  return shown;
}
