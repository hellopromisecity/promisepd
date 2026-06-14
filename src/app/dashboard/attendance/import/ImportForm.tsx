"use client";

/** Upload a ZKTeco export → importAttendance() → show a summary
 *  (imported days, unknown codes, a small preview). */

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { importAttendance, type ImportSummary } from "@/app/actions/admin-staff";
import { Card } from "@/components/admin/ui";
import { toast } from "@/components/ui/Toast";

export default function ImportForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [lateAfter, setLateAfter] = useState("");
  const [onlyDate, setOnlyDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    setSummary(null);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choose a CSV / TXT export first.");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    fd.append("late_after", lateAfter);
    fd.append("only_date", onlyDate);
    startTransition(async () => {
      const res = await importAttendance(fd);
      if (res.ok) {
        setSummary(res.data ?? null);
        toast(res.message ?? "Imported.", "success");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <Card>
      <h3 className="text-sm font-bold text-fg">Upload export</h3>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-fg-muted">Device file (.csv / .txt)</label>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt,.tsv,.dat,text/csv,text/plain"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
            className="block w-full text-sm text-fg file:mr-3 file:rounded-lg file:border-0 file:bg-brand-blue file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-blue-dark"
          />
          {fileName && <p className="mt-1 text-xs text-fg-muted">{fileName}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-fg-muted">Late after (optional)</label>
          <input
            type="time"
            value={lateAfter}
            onChange={(e) => setLateAfter(e.target.value)}
            className="w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm text-fg outline-none focus:border-brand-blue/50"
          />
          <p className="mt-1 text-[11px] text-fg-faint">Check-in after this = late.</p>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-fg-muted">Only this date (optional)</label>
          <input
            type="date"
            value={onlyDate}
            onChange={(e) => setOnlyDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm text-fg outline-none focus:border-brand-blue/50"
          />
          <p className="mt-1 text-[11px] text-fg-faint">Ignore punches on other days.</p>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-brand-red/30 bg-brand-red-tint px-3 py-2.5 text-sm text-brand-red-dark">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={pending}
        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Import
      </button>

      {summary && (
        <div className="mt-4 space-y-3 rounded-xl border border-border bg-bg-soft p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-fg">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {summary.imported} day(s) imported from {summary.rows} punches.
          </p>
          {summary.preview.length > 0 && (
            <ul className="space-y-1 text-xs text-fg-muted">
              {summary.preview.map((p, i) => (
                <li key={i} className="font-mono">
                  {p.code} · {p.name} · {p.date} · <span className="font-semibold">{p.status}</span>
                </li>
              ))}
            </ul>
          )}
          {summary.unknownCodes.length > 0 && (
            <div className="rounded-lg border border-amber-300/50 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <p className="font-semibold">{summary.unknownCodes.length} device code(s) didn&apos;t match any employee:</p>
              <p className="mt-1 font-mono">{summary.unknownCodes.join(", ")}</p>
              <p className="mt-1">Set those employees&apos; codes on the Staff page, then re-import.</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
