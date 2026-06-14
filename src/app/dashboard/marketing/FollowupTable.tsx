"use client";

/** Follow-up pipeline as a data grid: search, status + date-range
 *  (incl. custom) filters, sortable columns, rows-per-page + pagination,
 *  CSV/PDF export, and inline edit + delete (via FollowupRow). */

import { useMemo, useState, useEffect } from "react";
import {
  Search, ChevronDown, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown,
  Download, FileSpreadsheet, FileText,
} from "lucide-react";
import { thCls } from "@/components/admin/ui";
import FollowupRow from "./FollowupRow";
import { STATUS_META, FOLLOWUP_STATUSES } from "./status";
import type { StaffOption } from "./AddFollowupForm";

export type FollowupItem = {
  id: string; client_name: string; mobile: string | null; interest: string | null;
  status: string; next_followup: string | null; assigned_to: string | null;
  created_by: string | null; created_at: string;
};

type Range = "lifetime" | "30d" | "thisyear" | "lastyear" | "custom";
type SortKey = "client" | "status" | "date";

const RANGES: { key: Range; label: string }[] = [
  { key: "lifetime", label: "Lifetime" },
  { key: "30d", label: "Last 30 days" },
  { key: "thisyear", label: "This year" },
  { key: "lastyear", label: "Last year" },
  { key: "custom", label: "Custom range" },
];

function bounds(range: Range, from: string, to: string): [number | null, number | null] {
  const now = new Date();
  if (range === "custom") return [from ? new Date(from).getTime() : null, to ? new Date(to).getTime() + 86400000 : null];
  if (range === "30d") return [Date.now() - 30 * 86400000, null];
  if (range === "thisyear") return [new Date(now.getFullYear(), 0, 1).getTime(), null];
  if (range === "lastyear") return [new Date(now.getFullYear() - 1, 0, 1).getTime(), new Date(now.getFullYear(), 0, 1).getTime()];
  return [null, null];
}

function Sel({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="appearance-none rounded-xl border border-border bg-bg py-2 pl-3 pr-8 text-sm font-medium text-fg outline-none focus:border-brand-blue/50">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" />
    </div>
  );
}

export default function FollowupTable({
  items, staff, canSeeAll, meId,
}: {
  items: FollowupItem[]; staff: StaffOption[]; canSeeAll: boolean; meId: string;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [range, setRange] = useState<Range>("lifetime");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const [start, end] = range === "lifetime" ? [null, null] : bounds(range, from, to);
    let list = items.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (term && !`${r.client_name} ${r.mobile ?? ""} ${r.interest ?? ""}`.toLowerCase().includes(term)) return false;
      if (start != null || end != null) {
        const t = new Date(r.created_at).getTime();
        if (start != null && t < start) return false;
        if (end != null && t >= end) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      let v = 0;
      if (sortKey === "client") v = a.client_name.localeCompare(b.client_name);
      else if (sortKey === "status") v = a.status.localeCompare(b.status);
      else v = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === "asc" ? v : -v;
    });
    return list;
  }, [items, search, status, range, from, to, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * perPage, safePage * perPage);
  useEffect(() => { setPage(1); }, [search, status, range, from, to, perPage, sortKey, sortDir]);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir(k === "client" ? "asc" : "desc"); }
  }

  function exportCSV() {
    const rows = filtered.map((r) => ({
      Client: r.client_name, Mobile: r.mobile ?? "", Interest: r.interest ?? "",
      Status: STATUS_META[r.status as keyof typeof STATUS_META]?.label ?? r.status,
      "Next follow-up": r.next_followup ?? "",
      Assigned: staff.find((s) => s.id === r.assigned_to)?.name ?? "",
      Added: new Date(r.created_at).toLocaleDateString("en-GB"),
    }));
    const headers = ["Client", "Mobile", "Interest", "Status", "Next follow-up", "Assigned", "Added"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => esc((r as Record<string, unknown>)[h])).join(","))].join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "client-followups.csv"; a.click();
    URL.revokeObjectURL(a.href); setExportOpen(false);
  }
  function exportPDF() {
    const headers = ["Client", "Mobile", "Interest", "Status", "Next", "Assigned", "Added"];
    const body = filtered.map((r) => `<tr><td>${r.client_name}</td><td>${r.mobile ?? ""}</td><td>${r.interest ?? ""}</td><td>${STATUS_META[r.status as keyof typeof STATUS_META]?.label ?? r.status}</td><td>${r.next_followup ?? ""}</td><td>${staff.find((s) => s.id === r.assigned_to)?.name ?? ""}</td><td>${new Date(r.created_at).toLocaleDateString("en-GB")}</td></tr>`).join("");
    const w = window.open("", "_blank"); if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Client follow-ups</title><style>body{font-family:system-ui,'Noto Sans Bengali',sans-serif;padding:24px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}th{background:#1847A1;color:#fff}</style></head><body><h1>Client follow-ups</h1><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table><script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close(); setExportOpen(false);
  }
  const [exportOpen, setExportOpen] = useState(false);

  const Th = ({ k, label }: { k: SortKey; label: string }) => (
    <th className={thCls}>
      <button onClick={() => toggleSort(k)} className={`inline-flex items-center gap-1 ${sortKey === k ? "text-brand-blue" : "hover:text-fg"}`}>
        {label}{sortKey === k ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-50" />}
      </button>
    </th>
  );
  const btn = "grid h-8 min-w-8 place-items-center rounded-lg border border-border px-2 text-sm font-medium disabled:opacity-40";

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold text-fg">Follow-up pipeline</h2>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2">
          <Search className="h-4 w-4 text-fg-faint" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search client, mobile, interest…" className="w-full bg-transparent text-sm text-fg outline-none" />
        </div>
        <Sel value={status} onChange={setStatus} options={[{ value: "all", label: "All statuses" }, ...FOLLOWUP_STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label }))]} />
        <Sel value={range} onChange={(v) => setRange(v as Range)} options={RANGES.map((r) => ({ value: r.key, label: r.label }))} />
        {range === "custom" && (
          <>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl border border-border bg-bg px-2.5 py-2 text-sm text-fg outline-none focus:border-brand-blue/50" aria-label="From" />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl border border-border bg-bg px-2.5 py-2 text-sm text-fg outline-none focus:border-brand-blue/50" aria-label="To" />
          </>
        )}
        <div className="relative">
          <button onClick={() => setExportOpen((v) => !v)} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-3 py-2 text-sm font-semibold text-fg hover:border-brand-blue/40">
            <Download className="h-4 w-4 text-brand-blue" /> Export
          </button>
          {exportOpen && (
            <>
              <button aria-hidden tabIndex={-1} onClick={() => setExportOpen(false)} className="fixed inset-0 z-10 cursor-default" />
              <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-bg shadow-lg">
                <button onClick={exportCSV} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-fg hover:bg-bg-soft"><FileSpreadsheet className="h-4 w-4 text-brand-blue" /> CSV / Excel</button>
                <button onClick={exportPDF} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-fg hover:bg-bg-soft"><FileText className="h-4 w-4 text-brand-red" /> PDF (print)</button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-bg">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <Th k="client" label="Client" />
              <th className={thCls}>Mobile</th>
              <th className={thCls}>Interest</th>
              <Th k="status" label="Status" />
              <th className={thCls}>Next follow-up</th>
              <th className={thCls}>Assigned to</th>
              <th className={`${thCls} text-right`}><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-fg-muted">No follow-ups match your filters.</td></tr>
            ) : (
              pageRows.map((row) => {
                const owns = row.created_by === meId || row.assigned_to === meId;
                const allowed = canSeeAll || owns;
                return (
                  <FollowupRow
                    key={row.id}
                    row={{ id: row.id, client_name: row.client_name, mobile: row.mobile, interest: row.interest, status: row.status, next_followup: row.next_followup, assigned_to: row.assigned_to }}
                    staff={staff}
                    editable={allowed}
                    canDelete={allowed}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 text-fg-muted">
          <span>Rows per page</span>
          <Sel value={String(perPage)} onChange={(v) => setPerPage(parseInt(v))} options={[10, 25, 50, 100].map((n) => ({ value: String(n), label: String(n) }))} />
          <span className="text-fg-faint">· {filtered.length} total</span>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(safePage - 1)} disabled={safePage <= 1} className={btn} aria-label="Previous"><ChevronLeft className="h-4 w-4" /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter((n) => Math.abs(n - safePage) < 3 || n === 1 || n === totalPages).map((n, i, arr) => (
              <span key={n} className="flex items-center gap-1">
                {i > 0 && arr[i - 1] !== n - 1 && <span className="px-1 text-fg-faint">…</span>}
                <button onClick={() => setPage(n)} className={`${btn} ${n === safePage ? "bg-brand-blue text-white border-brand-blue" : "hover:bg-bg-soft"}`}>{n}</button>
              </span>
            ))}
            <button onClick={() => setPage(safePage + 1)} disabled={safePage >= totalPages} className={btn} aria-label="Next"><ChevronRight className="h-4 w-4" /></button>
          </div>
        )}
      </div>
    </div>
  );
}
