"use client";

/** Report inbox — Gmail-style. Managers/admins get one tab per staff member
 *  who has filed reports (click a name → their date-wise reports). Plain
 *  staff see only their own. Left-side checkboxes (single / multi-select) →
 *  Delete; date filters; the list scrolls inside its own box. */

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2, Loader2, CheckSquare, Square, Inbox, Calendar, ChevronDown,
} from "lucide-react";
import { deleteReports } from "@/app/actions/admin-insights";
import { confirmDialog } from "@/components/ui/Dialog";
import { toast } from "@/components/ui/Toast";

export type Report = { id: string; member_id: string; report_date: string; body: string; created_at: string };
type Staff = { id: string; name: string };
type Range = "all" | "month" | "30d" | "year" | "lastyear";

const RANGES: { key: Range; label: string }[] = [
  { key: "all", label: "All time" },
  { key: "month", label: "This month" },
  { key: "30d", label: "Last 30 days" },
  { key: "year", label: "This year" },
  { key: "lastyear", label: "Last year" },
];

const fmtDate = (d: string) =>
  new Date(d + (d.length === 10 ? "T00:00:00" : "")).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function inRange(dateStr: string, range: Range): boolean {
  if (range === "all") return true;
  const t = new Date(dateStr + "T00:00:00").getTime();
  const now = new Date();
  const y = now.getFullYear();
  if (range === "month") return t >= new Date(y, now.getMonth(), 1).getTime();
  if (range === "30d") return t >= Date.now() - 30 * 86400000;
  if (range === "year") return t >= new Date(y, 0, 1).getTime();
  // last year
  return t >= new Date(y - 1, 0, 1).getTime() && t < new Date(y, 0, 1).getTime();
}

export default function ReportView({
  reports, staff, canSeeAll, meId,
}: {
  reports: Report[]; staff: Staff[]; canSeeAll: boolean; meId: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<string>(canSeeAll ? (staff[0]?.id ?? "") : meId);
  const [range, setRange] = useState<Range>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();

  const rows = useMemo(
    () => reports.filter((r) => (canSeeAll ? r.member_id === tab : true)).filter((r) => inRange(r.report_date, range)),
    [reports, tab, range, canSeeAll],
  );

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggle = (id: string) =>
    setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () =>
    setSelected((s) => (rows.every((r) => s.has(r.id)) ? new Set() : new Set(rows.map((r) => r.id))));
  const toggleExpand = (id: string) =>
    setExpanded((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  async function removeSelected() {
    const ids = [...selected].filter((id) => rows.some((r) => r.id === id));
    if (!ids.length) return;
    const ok = await confirmDialog({ title: "Delete reports", message: `Delete ${ids.length} selected report${ids.length > 1 ? "s" : ""}? This can't be undone.`, confirmText: "Delete", danger: true });
    if (!ok) return;
    start(async () => {
      const res = await deleteReports(ids);
      if (res.ok) { toast(res.message || "Deleted.", "success"); setSelected(new Set()); router.refresh(); }
      else toast(res.error, "error");
    });
  }

  // switching tabs clears the selection (avoid deleting across people)
  const pickTab = (id: string) => { setTab(id); setSelected(new Set()); };

  return (
    <div className="rounded-2xl border border-border bg-bg">
      {/* Tabs — one per staff member (managers/admins only) */}
      {canSeeAll && staff.length > 0 && (
        <div className="flex gap-1 overflow-x-auto border-b border-border px-2 pt-2">
          {staff.map((s) => (
            <button
              key={s.id}
              onClick={() => pickTab(s.id)}
              className={`whitespace-nowrap rounded-t-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                tab === s.id ? "bg-brand-blue-tint text-brand-blue-dark" : "text-fg-muted hover:bg-bg-soft hover:text-fg"
              }`}
            >
              {s.name || "—"}
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5">
        <button onClick={toggleAll} disabled={!rows.length} className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted hover:bg-bg-soft disabled:opacity-40" title={allSelected ? "Clear" : "Select all"}>
          {allSelected ? <CheckSquare className="h-[18px] w-[18px] text-brand-blue" /> : <Square className="h-[18px] w-[18px]" />}
        </button>
        {selected.size > 0 ? (
          <button onClick={removeSelected} disabled={pending} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-red-tint px-3 py-1.5 text-sm font-semibold text-brand-red-dark hover:bg-brand-red/20 disabled:opacity-60">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete ({[...selected].filter((id) => rows.some((r) => r.id === id)).length})
          </button>
        ) : (
          <span className="text-sm text-fg-muted">{rows.length} report{rows.length !== 1 ? "s" : ""}</span>
        )}
        <div className="relative ml-auto">
          <Calendar className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" />
          <select value={range} onChange={(e) => setRange(e.target.value as Range)} className="appearance-none rounded-lg border border-border bg-bg py-1.5 pl-8 pr-8 text-sm font-medium text-fg outline-none focus:border-brand-blue/50">
            {RANGES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" />
        </div>
      </div>

      {/* List — scrolls inside its own box */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
          <Inbox className="h-8 w-8 text-fg-faint" />
          <p className="text-sm text-fg-muted">No reports{range !== "all" ? " in this period" : ""} yet.</p>
        </div>
      ) : (
        <div className="max-h-[62vh] overflow-y-auto [scrollbar-gutter:stable]">
          {rows.map((r) => {
            const isSel = selected.has(r.id);
            const isOpen = expanded.has(r.id);
            const oneLine = r.body.split("\n")[0];
            return (
              <div key={r.id} className={`flex items-start gap-3 border-b border-border/60 px-3 py-3 transition-colors ${isSel ? "bg-brand-blue-tint/40" : "hover:bg-bg-soft/60"}`}>
                <button onClick={() => toggle(r.id)} className="mt-0.5 shrink-0 text-fg-muted hover:text-brand-blue" aria-label={isSel ? "Deselect" : "Select"}>
                  {isSel ? <CheckSquare className="h-[18px] w-[18px] text-brand-blue" /> : <Square className="h-[18px] w-[18px]" />}
                </button>
                <button onClick={() => toggleExpand(r.id)} className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-fg-muted">{fmtDate(r.report_date)}</span>
                  </div>
                  <p className={`mt-1 text-sm text-fg ${isOpen ? "whitespace-pre-wrap leading-relaxed" : "truncate"}`}>
                    {isOpen ? r.body : oneLine}
                  </p>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
