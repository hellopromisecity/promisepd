"use client";

/** Manager+ control to set one team member's status for the day.
 *  A status <select> applies immediately on change; an optional note
 *  is sent along with whatever status is currently selected. */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { setAttendance } from "@/app/actions/admin-staff";

type AttendanceStatus = "present" | "late" | "absent" | "leave";

const OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "absent", label: "Absent" },
  { value: "leave", label: "Leave" },
];

export default function AttendanceRow({
  memberId,
  name,
  date,
  current,
  note,
}: {
  memberId: string;
  name: string;
  date: string;
  current: AttendanceStatus | "holiday" | null;
  note: string | null;
}) {
  const router = useRouter();
  const initial: AttendanceStatus =
    current && current !== "holiday" ? current : "present";
  const [status, setStatus] = useState<AttendanceStatus>(initial);
  const [noteVal, setNoteVal] = useState(note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function save(next: AttendanceStatus, noteText: string) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await setAttendance(memberId, date, next, noteText || undefined);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <select
          aria-label={`Status for ${name}`}
          value={status}
          disabled={pending}
          onChange={(e) => {
            const next = e.target.value as AttendanceStatus;
            setStatus(next);
            save(next, noteVal);
          }}
          className="rounded-xl border border-border bg-bg-soft px-3 py-1.5 text-sm outline-none focus:border-brand-blue/50 disabled:opacity-60"
        >
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          aria-label={`Note for ${name}`}
          placeholder="Note"
          value={noteVal}
          disabled={pending}
          onChange={(e) => setNoteVal(e.target.value)}
          onBlur={() => {
            if ((note ?? "") !== noteVal) save(status, noteVal);
          }}
          className="w-28 rounded-xl border border-border bg-bg-soft px-3 py-1.5 text-sm outline-none focus:border-brand-blue/50 disabled:opacity-60"
        />
        {pending && <Loader2 className="h-4 w-4 animate-spin text-fg-faint" />}
        {saved && !pending && <Check className="h-4 w-4 text-emerald-600" />}
      </div>
      {error && <p className="text-[11px] font-medium text-brand-red-dark">{error}</p>}
    </div>
  );
}
