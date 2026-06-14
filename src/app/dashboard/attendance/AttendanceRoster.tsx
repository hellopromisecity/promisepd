"use client";

/** One editable list of every employee for a day, with:
 *   • "Set all" bulk buttons (Present / Absent / Late / Leave)
 *   • per-row icon pills — ONE click sets a person's status (no dropdown)
 *   • click the name to cycle the status
 *   • a single "Save all" that persists the whole roster in one batch
 *  Mirrors the muhiussunnah staff-attendance roster UX. */

import { useMemo, useState, useTransition } from "react";
import { Check, X, Clock, Plane, Loader2, Save } from "lucide-react";
import { saveAttendanceBatch, type AttendanceEntry } from "@/app/actions/admin-staff";
import { toast } from "@/components/ui/Toast";

type Status = "present" | "absent" | "late" | "leave";
const ORDER: Status[] = ["present", "absent", "late", "leave"];

export type RosterRow = {
  ref: string;
  memberId: string | null;
  name: string;
  meta: string; // designation · district, or mobile
  code: string;
  status: Status | null; // already-marked status for this date
};

const STATUS_META: Record<Status, { label: string; icon: typeof Check; active: string; bulk: string }> = {
  present: { label: "Present", icon: Check, active: "bg-emerald-100 text-emerald-700", bulk: "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
  absent: { label: "Absent", icon: X, active: "bg-brand-red-tint text-brand-red", bulk: "border-brand-red/30 bg-brand-red-tint text-brand-red hover:bg-brand-red/10" },
  late: { label: "Late", icon: Clock, active: "bg-amber-100 text-amber-700", bulk: "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100" },
  leave: { label: "Leave", icon: Plane, active: "bg-brand-blue-tint text-brand-blue", bulk: "border-brand-blue/30 bg-brand-blue-tint text-brand-blue hover:bg-brand-blue/10" },
};

export default function AttendanceRoster({ date, rows }: { date: string; rows: RosterRow[] }) {
  // Default an unmarked person to "present" (the common case — mark exceptions).
  const [entries, setEntries] = useState<Record<string, Status>>(() => {
    const out: Record<string, Status> = {};
    for (const r of rows) out[r.ref] = r.status ?? "present";
    return out;
  });
  const [pending, startTransition] = useTransition();
  const [savedOnce, setSavedOnce] = useState(false);

  const counts = useMemo(() => {
    const c: Record<Status, number> = { present: 0, absent: 0, late: 0, leave: 0 };
    for (const s of Object.values(entries)) c[s]++;
    return c;
  }, [entries]);

  const setAll = (s: Status) => setEntries(Object.fromEntries(rows.map((r) => [r.ref, s])));
  const set = (ref: string, s: Status) => setEntries((e) => ({ ...e, [ref]: s }));
  const cycle = (ref: string) =>
    setEntries((e) => ({ ...e, [ref]: ORDER[(ORDER.indexOf(e[ref] ?? "present") + 1) % ORDER.length] }));

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
      {/* Bulk bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-bg p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-fg-muted">Mark everyone:</span>
          {ORDER.map((s) => {
            const m = STATUS_META[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => setAll(s)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${m.bulk}`}
              >
                <m.icon className="h-3.5 w-3.5" /> {m.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2.5 text-xs text-fg-muted">
          <span>Present <strong className="text-emerald-600">{counts.present}</strong></span>·
          <span>Absent <strong className="text-brand-red">{counts.absent}</strong></span>·
          <span>Late <strong className="text-amber-600">{counts.late}</strong></span>·
          <span>Leave <strong className="text-brand-blue">{counts.leave}</strong></span>
        </div>
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
                    const m = STATUS_META[s];
                    const active = status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        title={m.label}
                        onClick={() => set(r.ref, s)}
                        className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${
                          active ? m.active : "text-fg-faint hover:bg-bg-soft hover:text-fg"
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
        {savedOnce && !pending && <span className="text-xs text-emerald-600">Saved ✓</span>}
        <button
          onClick={save}
          disabled={pending || rows.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save attendance ({rows.length})
        </button>
      </div>
    </div>
  );
}
