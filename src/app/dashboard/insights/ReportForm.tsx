"use client";

/** "Submit today's report" form for the Message box.  Client component:
 *  posts to the submitReport server action, surfaces errors inline, and
 *  refreshes the feed on success. */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { submitReport } from "@/app/actions/admin-insights";

const today = () => new Date().toISOString().slice(0, 10);

export default function ReportForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState(today);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);
    if (!body.trim()) {
      setError("Write a few words about your day first.");
      return;
    }
    startTransition(async () => {
      const res = await submitReport({ report_date: date, body: body.trim() });
      if (res.ok) {
        setBody("");
        setDate(today());
        setDone(true);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        <div>
          <label htmlFor="report_date" className="mb-1.5 block text-sm font-semibold text-fg">
            Date
          </label>
          <input
            id="report_date"
            type="date"
            value={date}
            max={today()}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm outline-none focus:border-brand-blue/50"
          />
        </div>
      </div>

      <div>
        <label htmlFor="report_body" className="mb-1.5 block text-sm font-semibold text-fg">
          What did you work on today?
        </label>
        <textarea
          id="report_body"
          rows={4}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            if (done) setDone(false);
          }}
          placeholder="Calls made, site visits, deals progressed, blockers…"
          className="w-full resize-y rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm outline-none focus:border-brand-blue/50"
        />
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-brand-red-dark">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}
      {done && !error && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Report submitted.
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="h-4 w-4" /> {pending ? "Submitting…" : "Submit report"}
        </button>
      </div>
    </form>
  );
}
