"use client";

/** Marketing officer leaderboard + management — a full data grid:
 *  search, date-range + role filters, sortable columns, pagination,
 *  CSV/PDF export, and dialogs to add/edit officers, award points, and
 *  manage the point catalogue (points + AFR + income per sale).
 *
 *  AFR  = Approximate Fund Raising the officer brings the company.
 *  Income = the officer's own commission/earning for that sale.
 *  Points can be fractional (e.g. 0.20 / FB activity). */

import { useMemo, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Award, Crown, Medal, Trophy, Trash2, Pencil, X, Loader2, AlertCircle,
  Users, SlidersHorizontal, Check, Search, ChevronDown, ArrowUp, ArrowDown,
  ArrowUpDown, ChevronLeft, ChevronRight, Download, FileText, FileSpreadsheet, Save, Eye,
} from "lucide-react";
import { Card } from "@/components/admin/ui";
import { OFFICER_TYPES, type OfficerType } from "@/lib/marketing";
import {
  addOfficer, updateOfficer, deleteOfficer, awardPoints,
  addPointItem, deletePointItem, savePointItems,
  getOfficerHistory, deletePointEntry, updatePointEntry, type OfficerHistoryEntry,
} from "@/app/actions/admin-marketing";
import { confirmDialog } from "@/components/ui/Dialog";
import { toast } from "@/components/ui/Toast";

export type Officer = {
  id: string; name: string; officer_type: string; position: string | null;
  district: string | null; officer_code: string | null; mobile: string | null;
  points: number; afr: number; income: number;
};
export type PointItem = { id: string; label: string; points: number; afr: number; income: number };
export type Entry = { officer_id: string; points: number; afr: number; income: number; created_at: string };

type Range = "30d" | "thisyear" | "lastyear" | "lifetime" | "custom";
type SortKey = "points" | "afr" | "income" | "name";

const RANK_ICON = [Crown, Medal, Trophy];
const inputCls = "w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm text-fg outline-none focus:border-brand-blue/50";
const labelCls = "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-fg-muted";

const RANGES: { key: Range; label: string }[] = [
  { key: "30d", label: "Last 30 days" },
  { key: "thisyear", label: "This year" },
  { key: "lastyear", label: "Last year" },
  { key: "lifetime", label: "Lifetime" },
  { key: "custom", label: "Custom range" },
];

const fmtPts = (n: number) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100));
/** Percentage with one decimal (e.g. 1.3%, 17%) — trailing .0 dropped. */
const fmtPct = (n: number) => `${Math.round((Number(n) || 0) * 10) / 10}%`;
function fmtBDT(n: number) {
  n = Number(n) || 0;
  if (n >= 1e7) return "৳ " + (n / 1e7).toFixed(2).replace(/\.?0+$/, "") + " Cr";
  if (n >= 1e5) return "৳ " + (n / 1e5).toFixed(2).replace(/\.?0+$/, "") + " L";
  return "৳ " + Math.round(n).toLocaleString("en-IN");
}

function rangeBounds(range: Range, customFrom = "", customTo = ""): [number | null, number | null] {
  const now = new Date();
  if (range === "custom")
    return [customFrom ? new Date(customFrom).getTime() : null, customTo ? new Date(customTo).getTime() + 86400000 : null];
  if (range === "30d") return [Date.now() - 30 * 86400000, null];
  if (range === "thisyear") return [new Date(now.getFullYear(), 0, 1).getTime(), null];
  if (range === "lastyear") return [new Date(now.getFullYear() - 1, 0, 1).getTime(), new Date(now.getFullYear(), 0, 1).getTime()];
  return [null, null];
}

export default function MarketingOfficers({
  officers, items, entries, clientsByOfficer, payingUsers, companyFund,
}: {
  officers: Officer[]; items: PointItem[]; entries: Entry[];
  clientsByOfficer: Record<string, number>; payingUsers: number; companyFund: number;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<null | "officer" | "points" | "values">(null);
  const [editing, setEditing] = useState<Officer | null>(null);
  const [history, setHistory] = useState<Officer | null>(null);

  const [search, setSearch] = useState("");
  const [range, setRange] = useState<Range>("lifetime");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("points");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const periodMap = useMemo(() => {
    if (range === "lifetime") return null;
    const [start, end] = rangeBounds(range, customFrom, customTo);
    const m = new Map<string, { points: number; afr: number; income: number }>();
    for (const e of entries) {
      const t = new Date(e.created_at).getTime();
      if (start != null && t < start) continue;
      if (end != null && t >= end) continue;
      const cur = m.get(e.officer_id) || { points: 0, afr: 0, income: 0 };
      cur.points += Number(e.points) || 0;
      cur.afr += Number(e.afr) || 0;
      cur.income += Number(e.income) || 0;
      m.set(e.officer_id, cur);
    }
    return m;
  }, [entries, range, customFrom, customTo]);

  const computed = useMemo(
    () =>
      officers.map((o) => {
        const p = periodMap ? periodMap.get(o.id) : null;
        return {
          ...o,
          rPoints: range === "lifetime" ? Number(o.points) || 0 : p?.points ?? 0,
          rAfr: range === "lifetime" ? Number(o.afr) || 0 : p?.afr ?? 0,
          rIncome: range === "lifetime" ? Number(o.income) || 0 : p?.income ?? 0,
        };
      }),
    [officers, periodMap, range],
  );

  const rankMap = useMemo(() => {
    const m = new Map<string, number>();
    [...computed].sort((a, b) => b.rPoints - a.rPoints).forEach((o, i) => m.set(o.id, i + 1));
    return m;
  }, [computed]);

  // Top 3 by points (range-aware) for the leaderboard podium.
  const top3 = useMemo(
    () => [...computed].sort((a, b) => b.rPoints - a.rPoints).slice(0, 3),
    [computed],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = computed.filter((o) => {
      if (typeFilter !== "all" && o.officer_type !== typeFilter) return false;
      if (term && !`${o.name} ${o.officer_code ?? ""}`.toLowerCase().includes(term)) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      let v = 0;
      if (sortKey === "points") v = a.rPoints - b.rPoints;
      else if (sortKey === "afr") v = a.rAfr - b.rAfr;
      else if (sortKey === "income") v = a.rIncome - b.rIncome;
      else v = a.name.localeCompare(b.name);
      return sortDir === "asc" ? v : -v;
    });
    return list;
  }, [computed, typeFilter, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  useEffect(() => { setPage(1); }, [search, range, customFrom, customTo, typeFilter, perPage, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "name" ? "asc" : "desc"); }
  }

  const refresh = () => router.refresh();

  return (
    <div className="space-y-5">
      {officers.length > 0 && <Podium top={top3} />}
      <Card pad={false}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-blue" />
          <h2 className="text-sm font-bold text-fg">Marketing officers</h2>
          <span className="rounded-full bg-bg-soft px-2 py-0.5 text-xs text-fg-muted">{officers.length}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setDialog("values")} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-3 py-2 text-sm font-semibold text-fg hover:border-brand-blue/40">
            <SlidersHorizontal className="h-4 w-4 text-brand-blue" /> Point values
          </button>
          <button onClick={() => setDialog("points")} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-3 py-2 text-sm font-semibold text-fg hover:border-brand-blue/40">
            <Award className="h-4 w-4 text-brand-blue" /> Award points
          </button>
          <button onClick={() => { setEditing(null); setDialog("officer"); }} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-3 py-2 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark">
            <Plus className="h-4 w-4" /> Add officer
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3">
        <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-xl border border-border bg-bg-soft px-3 py-2">
          <Search className="h-4 w-4 text-fg-faint" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or ID…" className="w-full bg-transparent text-sm text-fg outline-none" />
        </div>
        <Select value={range} onChange={(v) => setRange(v as Range)} options={RANGES.map((r) => ({ value: r.key, label: r.label }))} />
        {range === "custom" && (
          <>
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="rounded-xl border border-border bg-bg px-2.5 py-2 text-sm text-fg outline-none focus:border-brand-blue/50" aria-label="From date" />
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="rounded-xl border border-border bg-bg px-2.5 py-2 text-sm text-fg outline-none focus:border-brand-blue/50" aria-label="To date" />
          </>
        )}
        <Select value={typeFilter} onChange={setTypeFilter} options={[{ value: "all", label: "All roles" }, ...OFFICER_TYPES.map((t) => ({ value: t.code, label: t.label }))]} />
        <ExportMenu rows={filtered} range={range} clientsByOfficer={clientsByOfficer} payingUsers={payingUsers} companyFund={companyFund} />
      </div>

      {officers.length === 0 ? (
        <p className="px-5 pb-8 pt-2 text-center text-sm text-fg-muted">
          No officers yet — add your MO / AMO / MD / HM team to build the leaderboard.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto border-t border-border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wide text-fg-faint">
                  <th className="px-4 py-3 font-semibold">#</th>
                  <SortableTh label="Officer" active={sortKey === "name"} dir={sortDir} onClick={() => toggleSort("name")} />
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <SortableTh label="AFR" active={sortKey === "afr"} dir={sortDir} onClick={() => toggleSort("afr")} align="right" />
                  <SortableTh label="Income" active={sortKey === "income"} dir={sortDir} onClick={() => toggleSort("income")} align="right" />
                  <SortableTh label="Points" active={sortKey === "points"} dir={sortDir} onClick={() => toggleSort("points")} align="right" />
                  <th className="px-4 py-3 text-right font-semibold" title="Total User % — this officer's distinct clients as a share of all paying customers">TUPAC</th>
                  <th className="px-4 py-3 text-right font-semibold" title="Total Fund Raised AFR % — this officer's AFR as a share of the company's total fund">TFRAF</th>
                  <th className="px-4 py-3 text-right font-semibold"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((o) => {
                  const rank = rankMap.get(o.id) ?? 0;
                  const Icon = RANK_ICON[rank - 1];
                  return (
                    <tr key={o.id} className="border-b border-border/60 last:border-0 hover:bg-bg-soft/50">
                      <td className="px-4 py-3">
                        {Icon ? (
                          <span className={`grid h-7 w-7 place-items-center rounded-full ${rank === 1 ? "bg-brand-blue text-white" : rank === 2 ? "bg-bg-soft text-fg" : "bg-brand-red text-white"}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <span className="grid h-7 w-7 place-items-center rounded-full bg-bg-soft text-xs font-bold text-fg-muted">{rank}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-fg">{o.name}</div>
                        {o.officer_code && <div className="text-xs text-fg-faint">{o.officer_code}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-fg">{o.position || o.officer_type}</div>
                        {o.district && <div className="text-[11px] text-fg-faint">{o.district}</div>}
                      </td>
                      <td className="px-4 py-3 text-right text-fg">{fmtBDT(o.rAfr)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700">{fmtBDT(o.rIncome)}</td>
                      <td className="px-4 py-3 text-right font-bold text-fg">{fmtPts(o.rPoints)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-semibold text-brand-blue">{fmtPct(payingUsers > 0 ? ((clientsByOfficer[o.id] ?? 0) / payingUsers) * 100 : 0)}</div>
                        <div className="text-[11px] text-fg-faint">{clientsByOfficer[o.id] ?? 0} / {payingUsers}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-semibold text-emerald-700">{fmtPct(companyFund > 0 ? (o.afr / companyFund) * 100 : 0)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 text-fg-faint">
                          <button onClick={() => setHistory(o)} title="View history" className="rounded-md p-1.5 hover:bg-bg-soft hover:text-brand-blue"><Eye className="h-4 w-4" /></button>
                          <button onClick={() => { setEditing(o); setDialog("officer"); }} title="Edit" className="rounded-md p-1.5 hover:bg-bg-soft hover:text-brand-blue"><Pencil className="h-4 w-4" /></button>
                          <DeleteBtn id={o.id} name={o.name} onDone={refresh} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {pageRows.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-fg-muted">No officers match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 text-sm">
            <div className="flex items-center gap-2 text-fg-muted">
              <span>Rows per page</span>
              <Select value={String(perPage)} onChange={(v) => setPerPage(parseInt(v))} options={[10, 25, 50, 100].map((n) => ({ value: String(n), label: String(n) }))} compact />
              <span className="text-fg-faint">· {filtered.length} total</span>
            </div>
            <Pagination page={safePage} totalPages={totalPages} onPage={setPage} />
          </div>
        </>
      )}

      {dialog === "officer" && <OfficerDialog officer={editing} onClose={() => setDialog(null)} onDone={() => { setDialog(null); refresh(); }} />}
      {dialog === "points" && <AwardPointsDialog officers={officers} items={items} onClose={() => setDialog(null)} onDone={() => { setDialog(null); refresh(); }} />}
      {dialog === "values" && <ManagePointsDialog items={items} onClose={() => { setDialog(null); refresh(); }} />}
      </Card>
      {history && <HistoryDialog officer={history} items={items} onClose={() => setHistory(null)} onChanged={refresh} />}
    </div>
  );
}

function Select({ value, onChange, options, compact }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; compact?: boolean }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`appearance-none rounded-xl border border-border bg-bg ${compact ? "py-1.5 pl-2.5 pr-7" : "py-2 pl-3 pr-8"} text-sm font-medium text-fg outline-none focus:border-brand-blue/50`}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" />
    </div>
  );
}

function SortableTh({ label, active, dir, onClick, align }: { label: string; active: boolean; dir: "asc" | "desc"; onClick: () => void; align?: "right" }) {
  return (
    <th className={`px-4 py-3 font-semibold ${align === "right" ? "text-right" : ""}`}>
      <button onClick={onClick} className={`inline-flex items-center gap-1 ${align === "right" ? "flex-row-reverse" : ""} ${active ? "text-brand-blue" : "hover:text-fg"}`}>
        {label}
        {active ? (dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-50" />}
      </button>
    </th>
  );
}

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return <div />;
  const win = 5;
  let start = Math.max(1, page - Math.floor(win / 2));
  const end = Math.min(totalPages, start + win - 1);
  start = Math.max(1, end - win + 1);
  const nums = [];
  for (let i = start; i <= end; i++) nums.push(i);
  const btn = "grid h-8 min-w-8 place-items-center rounded-lg border border-border px-2 text-sm font-medium disabled:opacity-40";
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onPage(page - 1)} disabled={page <= 1} className={btn} aria-label="Previous"><ChevronLeft className="h-4 w-4" /></button>
      {nums.map((n) => (
        <button key={n} onClick={() => onPage(n)} className={`${btn} ${n === page ? "bg-brand-blue text-white border-brand-blue" : "hover:bg-bg-soft"}`}>{n}</button>
      ))}
      <button onClick={() => onPage(page + 1)} disabled={page >= totalPages} className={btn} aria-label="Next"><ChevronRight className="h-4 w-4" /></button>
    </div>
  );
}

function ExportMenu({ rows, range, clientsByOfficer, payingUsers, companyFund }: { rows: (Officer & { rPoints: number; rAfr: number; rIncome: number })[]; range: Range; clientsByOfficer: Record<string, number>; payingUsers: number; companyFund: number }) {
  const [open, setOpen] = useState(false);
  const pct1 = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0);
  const data = () =>
    rows.map((o, i) => ({
      "#": i + 1, Name: o.name, ID: o.officer_code ?? "", Type: o.officer_type,
      Position: o.position ?? "", District: o.district ?? "",
      Users: clientsByOfficer[o.id] ?? 0, "TUPAC%": pct1(clientsByOfficer[o.id] ?? 0, payingUsers),
      AFR: Math.round(o.rAfr), "TFRAF%": pct1(o.afr, companyFund),
      Income: Math.round(o.rIncome), Points: Math.round(o.rPoints * 100) / 100,
    }));
  const HEADERS = ["#", "Name", "ID", "Type", "Position", "District", "Users", "TUPAC%", "AFR", "TFRAF%", "Income", "Points"];

  function exportCSV() {
    const d = data();
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [HEADERS.join(","), ...d.map((r) => HEADERS.map((h) => esc((r as Record<string, unknown>)[h])).join(","))].join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `marketing-officers-${range}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    setOpen(false);
  }
  function exportPDF() {
    const d = data();
    const rowsHtml = d.map((r) => `<tr>${HEADERS.map((h) => `<td>${String((r as Record<string, unknown>)[h] ?? "")}</td>`).join("")}</tr>`).join("");
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Marketing officers</title>
      <style>body{font-family:system-ui,'Noto Sans Bengali',sans-serif;padding:24px;color:#0b1220}h1{font-size:18px}table{width:100%;border-collapse:collapse;font-size:12px;margin-top:12px}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}th{background:#1847A1;color:#fff}</style>
      </head><body><h1>Marketing officers — ${range}</h1><table><thead><tr>${HEADERS.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rowsHtml}</tbody></table>
      <script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
    setOpen(false);
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-3 py-2 text-sm font-semibold text-fg hover:border-brand-blue/40">
        <Download className="h-4 w-4 text-brand-blue" /> Export
      </button>
      {open && (
        <>
          <button aria-hidden tabIndex={-1} onClick={() => setOpen(false)} className="fixed inset-0 z-10 cursor-default" />
          <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-bg shadow-lg">
            <button onClick={exportCSV} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-fg hover:bg-bg-soft"><FileSpreadsheet className="h-4 w-4 text-brand-blue" /> CSV / Excel</button>
            <button onClick={exportPDF} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-fg hover:bg-bg-soft"><FileText className="h-4 w-4 text-brand-red" /> PDF (print)</button>
          </div>
        </>
      )}
    </div>
  );
}

function DeleteBtn({ id, name, onDone }: { id: string; name: string; onDone: () => void }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={async () => {
        const ok = await confirmDialog({ title: "Remove officer", message: `Remove “${name}” from the leaderboard?`, confirmText: "Remove", danger: true });
        if (!ok) return;
        start(async () => {
          const res = await deleteOfficer(id);
          if (res.ok) onDone(); else toast(res.error, "error");
        });
      }}
      disabled={pending}
      className="rounded-md p-1.5 hover:bg-brand-red-tint hover:text-brand-red disabled:opacity-50"
      aria-label={`Delete ${name}`}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </button>
  );
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16">
      <div className={`w-full ${wide ? "max-w-lg" : "max-w-md"} rounded-2xl border border-border bg-bg p-5 shadow-xl`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-fg">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-fg-muted hover:bg-bg-soft" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="mb-3 flex items-start gap-2 rounded-xl border border-brand-red/30 bg-brand-red-tint px-3 py-2 text-sm text-brand-red-dark">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {msg}
    </div>
  );
}

function OfficerDialog({ officer, onClose, onDone }: { officer: Officer | null; onClose: () => void; onDone: () => void }) {
  const editing = !!officer;
  const [f, setF] = useState({
    name: officer?.name ?? "",
    officer_type: (officer?.officer_type as OfficerType) ?? "MO",
    position: officer?.position ?? "",
    officer_code: officer?.officer_code ?? "",
    district: officer?.district ?? "",
    mobile: officer?.mobile ?? "",
    reference: "",
  });
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  function submit() {
    setErr(null);
    start(async () => {
      const res = editing ? await updateOfficer(officer!.id, f) : await addOfficer(f);
      if (res.ok) onDone(); else setErr(res.error);
    });
  }

  return (
    <Modal title={editing ? "Edit officer" : "Add marketing officer"} onClose={onClose}>
      {err && <ErrorBanner msg={err} />}
      <div className="space-y-3">
        <div><label className={labelCls}>Name *</label><input className={inputCls} value={f.name} onChange={set("name")} placeholder="Full name" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Type *</label>
            <select className={inputCls} value={f.officer_type} onChange={set("officer_type")}>
              {OFFICER_TYPES.map((t) => <option key={t.code} value={t.code}>{t.code} — {t.label}</option>)}
            </select>
          </div>
          <div><label className={labelCls}>Position</label><input className={inputCls} value={f.position} onChange={set("position")} placeholder="e.g. Director" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>ID / code</label><input className={inputCls} value={f.officer_code} onChange={set("officer_code")} placeholder="D-2025003" /></div>
          <div><label className={labelCls}>District</label><input className={inputCls} value={f.district} onChange={set("district")} placeholder="Dhaka" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Mobile</label><input className={inputCls} value={f.mobile} onChange={set("mobile")} placeholder="01XXXXXXXXX" /></div>
          <div><label className={labelCls}>Reference</label><input className={inputCls} value={f.reference} onChange={set("reference")} placeholder="Optional" /></div>
        </div>
        <button onClick={submit} disabled={pending} className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark disabled:opacity-60">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {editing ? "Save changes" : "Add officer"}
        </button>
      </div>
    </Modal>
  );
}

/** Searchable officer picker for the award dialog — filters the (now
 *  large) officer list by name, mobile, or ID number.  ID search matches
 *  the digits only, so "2026001" finds "MI-2026001" without the prefix. */
function OfficerPicker({ officers, value, onChange }: { officers: Officer[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = officers.find((o) => o.id === value);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return officers;
    const digits = term.replace(/\D/g, "");
    return officers.filter((o) => {
      if (o.name.toLowerCase().includes(term)) return true;
      if ((o.officer_code ?? "").toLowerCase().includes(term)) return true;
      if (digits) {
        const codeNum = (o.officer_code ?? "").replace(/\D/g, "");
        const mob = (o.mobile ?? "").replace(/\D/g, "");
        if (codeNum.includes(digits) || mob.includes(digits)) return true;
      }
      return false;
    });
  }, [officers, query]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${inputCls} flex items-center justify-between gap-2 text-left`}
      >
        <span className={`truncate ${selected ? "text-fg" : "text-fg-faint"}`}>
          {selected
            ? `${selected.name} (${selected.officer_type})${selected.officer_code ? " · " + selected.officer_code : ""}`
            : "Select an officer…"}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-fg-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <button aria-hidden tabIndex={-1} onClick={() => setOpen(false)} className="fixed inset-0 z-10 cursor-default" />
          <div className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-xl border border-border bg-bg shadow-xl">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-fg-faint" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, mobile or ID number…"
                className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-faint"
              />
            </div>
            <ul className="max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-3 text-center text-sm text-fg-muted">No officer matches “{query}”.</li>
              ) : (
                filtered.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => { onChange(o.id); setOpen(false); setQuery(""); }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-bg-soft ${o.id === value ? "bg-brand-blue-tint" : ""}`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-fg">
                          {o.name} <span className="font-normal text-fg-faint">({o.officer_type})</span>
                        </div>
                        <div className="truncate text-[11px] text-fg-faint">
                          {[o.officer_code, o.mobile, o.district].filter(Boolean).join(" · ") || "—"}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-fg-muted">{fmtPts(Number(o.points) || 0)} pts</span>
                      {o.id === value && <Check className="h-4 w-4 shrink-0 text-brand-blue" />}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function AwardPointsDialog({ officers, items, onClose, onDone }: { officers: Officer[]; items: PointItem[]; onClose: () => void; onDone: () => void }) {
  const [officerId, setOfficerId] = useState(officers[0]?.id ?? "");
  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [clientName, setClientName] = useState("");
  const [clientId, setClientId] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const item = useMemo(() => items.find((p) => p.id === itemId), [items, itemId]);
  const q = Math.max(1, qty || 1);
  const totalPts = Math.round((item?.points ?? 0) * q * 100) / 100;
  const totalAfr = (item?.afr ?? 0) * q;
  const totalIncome = (item?.income ?? 0) * q;

  function submit() {
    setErr(null);
    start(async () => {
      const res = await awardPoints({ officerId, itemId, quantity: qty, saleDate, clientName, clientId });
      if (res.ok) onDone(); else setErr(res.error);
    });
  }

  return (
    <Modal title="Award points" onClose={onClose}>
      {err && <ErrorBanner msg={err} />}
      {officers.length === 0 ? (
        <p className="text-sm text-fg-muted">Add an officer first, then award points.</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-fg-muted">No point items yet — add some under “Point values” first.</p>
      ) : (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Officer *</label>
            <OfficerPicker officers={officers} value={officerId} onChange={setOfficerId} />
          </div>
          <div>
            <label className={labelCls}>Point item *</label>
            <select className={inputCls} value={itemId} onChange={(e) => setItemId(e.target.value)}>
              {items.map((p) => <option key={p.id} value={p.id}>{p.label} — {fmtPts(p.points)} pts</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Quantity (units sold)</label>
              <input type="number" min={1} className={inputCls} value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} />
            </div>
            <div>
              <label className={labelCls}>Sale date</label>
              <input type="date" className={inputCls} value={saleDate} onChange={(e) => setSaleDate(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Client name</label><input className={inputCls} value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Buyer's name" /></div>
            <div><label className={labelCls}>Client ID</label><input className={inputCls} value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="Optional" /></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-brand-blue-tint px-3 py-2.5"><div className="text-[10px] font-semibold uppercase text-brand-blue-dark/70">Points</div><div className="text-lg font-extrabold text-brand-blue-dark">+{fmtPts(totalPts)}</div></div>
            <div className="rounded-xl bg-bg-soft px-3 py-2.5"><div className="text-[10px] font-semibold uppercase text-fg-muted">AFR</div><div className="text-sm font-extrabold text-fg">{fmtBDT(totalAfr)}</div></div>
            <div className="rounded-xl bg-emerald-50 px-3 py-2.5"><div className="text-[10px] font-semibold uppercase text-emerald-700/80">Income</div><div className="text-sm font-extrabold text-emerald-700">{fmtBDT(totalIncome)}</div></div>
          </div>
          <button onClick={submit} disabled={pending} className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark disabled:opacity-60">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />} Add points
          </button>
        </div>
      )}
    </Modal>
  );
}

type Draft = { id: string; label: string; points: string; afr: string; income: string };

function ManagePointsDialog({ items, onClose }: { items: PointItem[]; onClose: () => void }) {
  const [draft, setDraft] = useState<Draft[]>(
    items.map((i) => ({ id: i.id, label: i.label, points: String(i.points), afr: String(i.afr), income: String(i.income) })),
  );
  const [newLabel, setNewLabel] = useState("");
  const [newPoints, setNewPoints] = useState("1");
  const [newAfr, setNewAfr] = useState("0");
  const [newIncome, setNewIncome] = useState("0");
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const dirty = draft.some((d) => {
    const o = items.find((i) => i.id === d.id);
    return !o || parseFloat(d.points) !== o.points || parseFloat(d.afr) !== o.afr || parseFloat(d.income) !== o.income;
  });

  const setField = (id: string, k: "points" | "afr" | "income", v: string) =>
    setDraft((l) => l.map((d) => (d.id === id ? { ...d, [k]: v } : d)));

  function saveAll() {
    setErr(null); setSaved(false);
    start(async () => {
      const res = await savePointItems(
        draft.map((d) => ({ id: d.id, points: parseFloat(d.points) || 0, afr: parseFloat(d.afr) || 0, income: parseFloat(d.income) || 0 })),
      );
      if (res.ok) setSaved(true); else setErr(res.error);
    });
  }
  function add() {
    const label = newLabel.trim();
    if (!label) return;
    setErr(null);
    start(async () => {
      const res = await addPointItem(label, parseFloat(newPoints) || 0, parseFloat(newAfr) || 0, parseFloat(newIncome) || 0);
      if (res.ok && res.data) {
        setDraft((l) => [...l, { id: res.data!.id, label, points: newPoints, afr: newAfr, income: newIncome }]);
        setNewLabel(""); setNewPoints("1"); setNewAfr("0"); setNewIncome("0");
      } else if (!res.ok) setErr(res.error);
    });
  }
  function remove(id: string) {
    setErr(null);
    start(async () => {
      const res = await deletePointItem(id);
      if (res.ok) setDraft((l) => l.filter((x) => x.id !== id));
      else setErr(res.error);
    });
  }

  const num = "w-full rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-fg outline-none focus:border-brand-blue/50";

  return (
    <Modal title="Point values per sale" onClose={onClose}>
      {err && <ErrorBanner msg={err} />}
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs text-fg-muted">Set points, AFR (fund raised) and income (officer commission) per unit.</p>
        <button onClick={saveAll} disabled={pending || !dirty} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-blue px-3 py-2 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark disabled:opacity-50">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved && !dirty ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved && !dirty ? "Saved" : "Save all"}
        </button>
      </div>

      <div className="space-y-2">
        {draft.map((d) => (
          <div key={d.id} className="rounded-xl bg-bg-soft px-3 py-2.5">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-sm text-fg">{d.label}</span>
              <button onClick={async () => { if (await confirmDialog({ title: "Delete item", message: `Delete “${d.label}”?`, confirmText: "Delete", danger: true })) remove(d.id); }} disabled={pending} className="shrink-0 rounded-md p-1 text-fg-faint hover:bg-brand-red-tint hover:text-brand-red disabled:opacity-40" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <label className="block"><span className="text-[10px] text-fg-faint">Points</span><input type="number" step="0.01" min={0} className={num} value={d.points} onChange={(e) => setField(d.id, "points", e.target.value)} /></label>
              <label className="block"><span className="text-[10px] text-fg-faint">AFR ৳</span><input type="number" step="any" min={0} className={num} value={d.afr} onChange={(e) => setField(d.id, "afr", e.target.value)} /></label>
              <label className="block"><span className="text-[10px] text-fg-faint">Income ৳</span><input type="number" step="any" min={0} className={num} value={d.income} onChange={(e) => setField(d.id, "income", e.target.value)} /></label>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2 border-t border-border pt-3">
        <label className={labelCls}>Add custom item</label>
        <input className={inputCls} value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="e.g. FB activity (per post)" />
        <div className="grid grid-cols-3 gap-2">
          <label className="block"><span className="text-[10px] text-fg-faint">Points/unit</span><input type="number" step="0.01" min={0} className={num} value={newPoints} onChange={(e) => setNewPoints(e.target.value)} /></label>
          <label className="block"><span className="text-[10px] text-fg-faint">AFR ৳/unit</span><input type="number" step="any" min={0} className={num} value={newAfr} onChange={(e) => setNewAfr(e.target.value)} /></label>
          <label className="block"><span className="text-[10px] text-fg-faint">Income ৳/unit</span><input type="number" step="any" min={0} className={num} value={newIncome} onChange={(e) => setNewIncome(e.target.value)} /></label>
        </div>
        <button onClick={add} disabled={pending} className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-bg px-4 py-2 text-sm font-semibold text-fg hover:border-brand-blue/40 disabled:opacity-60">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 text-brand-blue" />} Add item
        </button>
      </div>
    </Modal>
  );
}

/** Top-3 leaderboard podium — 1st elevated in the centre, 2nd left, 3rd
 *  right.  Range-aware (points/income follow the date filter). */
function Podium({ top }: { top: (Officer & { rPoints: number; rIncome: number })[] }) {
  if (top.length === 0) return null;
  const order = [top[1], top[0], top[2]]; // 2nd · 1st · 3rd
  const STYLE: Record<number, { grad: string; Icon: typeof Crown; label: string; ring: string }> = {
    1: { grad: "from-brand-blue to-brand-blue-dark", Icon: Crown, label: "1st", ring: "ring-brand-blue/30" },
    2: { grad: "from-slate-400 to-slate-600", Icon: Medal, label: "2nd", ring: "ring-slate-300" },
    3: { grad: "from-brand-red to-brand-red-dark", Icon: Trophy, label: "3rd", ring: "ring-brand-red/30" },
  };
  return (
    <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
      {order.map((o, i) => {
        if (!o) return <div key={i} />;
        const rank = i === 1 ? 1 : i === 0 ? 2 : 3;
        const s = STYLE[rank];
        const champ = rank === 1;
        const Icon = s.Icon;
        return (
          <div
            key={o.id}
            className={`group relative cursor-default rounded-2xl text-center shadow-sm ring-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${s.ring} ${
              champ
                ? "podium-glow border border-brand-blue/40 bg-gradient-to-b from-brand-blue-tint to-bg p-4 sm:p-5"
                : "overflow-hidden border border-border bg-bg p-3 sm:mt-4 sm:p-4"
            }`}
          >
            <div className={`absolute right-2 top-2 rounded-full bg-gradient-to-r ${s.grad} px-2 py-0.5 text-[9px] font-bold text-white`}>{s.label}</div>
            <div className={`mx-auto grid place-items-center rounded-full bg-gradient-to-br ${s.grad} text-white shadow-md transition-transform duration-300 group-hover:scale-110 ${champ ? "h-12 w-12" : "h-10 w-10"}`}>
              <Icon className={champ ? "h-6 w-6" : "h-5 w-5"} />
            </div>
            <div className={`mt-2 truncate font-bold text-fg ${champ ? "text-sm sm:text-base" : "text-xs sm:text-sm"}`}>{o.name}</div>
            <div className="truncate text-[10px] uppercase tracking-wide text-fg-faint">{o.position || o.officer_type}</div>
            <div className={`mt-1.5 font-extrabold tabular-nums text-brand-blue ${champ ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"}`}>
              {fmtPts(o.rPoints)}<span className="ml-0.5 text-[10px] font-semibold text-fg-faint">pts</span>
            </div>
            <div className="text-[11px] font-semibold text-emerald-700">{fmtBDT(o.rIncome)}</div>
          </div>
        );
      })}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "blue" | "green" }) {
  const box = tone === "blue" ? "bg-brand-blue-tint" : tone === "green" ? "bg-emerald-50" : "bg-bg-soft";
  const txt = tone === "blue" ? "text-brand-blue-dark" : tone === "green" ? "text-emerald-700" : "text-fg";
  return (
    <div className={`rounded-xl px-3 py-2 ${box}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-fg-faint">{label}</div>
      <div className={`text-sm font-extrabold ${txt}`}>{value}</div>
    </div>
  );
}

/** Eye-icon detail: an officer's full referral / sale history — what each
 *  award was for (item label), when, the client's total deposit, income +
 *  points — with per-entry edit & delete. */
function HistoryDialog({ officer, items, onClose, onChanged }: { officer: Officer; items: PointItem[]; onClose: () => void; onChanged: () => void }) {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<OfficerHistoryEntry[]>([]);
  const [edit, setEdit] = useState<OfficerHistoryEntry | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
    return getOfficerHistory(officer.id).then((e) => { setEntries(e); setLoading(false); });
  };
  useEffect(() => {
    let alive = true;
    getOfficerHistory(officer.id).then((e) => { if (alive) { setEntries(e); setLoading(false); } });
    return () => { alive = false; };
  }, [officer.id]);

  const totals = useMemo(
    () => entries.reduce((a, e) => ({ afr: a.afr + e.afr, income: a.income + e.income, points: a.points + e.points }), { afr: 0, income: 0, points: 0 }),
    [entries],
  );
  const fmtDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); } catch { return iso; }
  };

  async function remove(e: OfficerHistoryEntry) {
    const ok = await confirmDialog({
      title: "Delete this entry?",
      message: `“${e.item_label || "Entry"}”${e.client_name ? ` · ${e.client_name}` : ""} (${fmtPts(e.points)} pts) will be removed and the officer's totals recalculated.`,
      confirmText: "Delete", danger: true,
    });
    if (!ok) return;
    setBusy(e.id);
    const res = await deletePointEntry(e.id);
    setBusy(null);
    if (res.ok) { toast(res.message || "Removed.", "success"); await reload(); onChanged(); }
    else toast(res.error, "error");
  }

  return (
    <>
      <Modal title={`History — ${officer.name}`} onClose={onClose} wide>
        <p className="-mt-2 mb-3 text-xs text-fg-muted">
          {officer.position || officer.officer_type}{officer.district ? ` · ${officer.district}` : ""}{officer.officer_code ? ` · ${officer.officer_code}` : ""}
        </p>
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Referrals" value={String(entries.length)} />
          <Stat label="মোট বিনিয়োগ" value={fmtBDT(totals.afr)} tone="blue" />
          <Stat label="Income" value={fmtBDT(totals.income)} tone="green" />
          <Stat label="Points" value={fmtPts(totals.points)} />
        </div>
        {loading ? (
          <div className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-brand-blue" /></div>
        ) : entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-fg-muted">এখনো কোনো রেফার / সেল রেকর্ড নেই।</p>
        ) : (
          <div className="max-h-[48vh] space-y-2 overflow-y-auto pr-1">
            {entries.map((e) => (
              <div key={e.id} className="rounded-xl border border-border bg-bg-soft px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-fg">{e.client_name || "—"}</div>
                    {e.item_label && (
                      <span className="mt-0.5 inline-block rounded-md bg-brand-blue-tint px-1.5 py-0.5 text-[10px] font-semibold text-brand-blue-dark">
                        {e.item_label}{e.quantity > 1 ? ` ×${e.quantity}` : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="mr-1 text-[11px] font-medium text-fg-faint">{fmtDate(e.date)}</span>
                    <button onClick={() => setEdit(e)} title="Edit entry" className="rounded-md p-1 text-fg-faint hover:bg-bg hover:text-brand-blue"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => remove(e)} disabled={busy === e.id} title="Delete entry" className="rounded-md p-1 text-fg-faint hover:bg-bg hover:text-brand-red disabled:opacity-50">
                      {busy === e.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]">
                  <span className="text-fg-muted">এই সেলে <b className="text-fg">{fmtBDT(e.afr)}</b></span>
                  <span className="text-fg-muted">income <b className="text-emerald-700">{fmtBDT(e.income)}</b></span>
                  <span className="text-fg-muted">points <b className="text-brand-blue">+{fmtPts(e.points)}</b></span>
                  {e.clientInvested != null && (
                    <span className="ml-auto rounded-md bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700">মোট জমা {fmtBDT(e.clientInvested)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
      {edit && (
        <EditEntryDialog
          entry={edit}
          items={items}
          onClose={() => setEdit(null)}
          onDone={async () => { setEdit(null); await reload(); onChanged(); }}
        />
      )}
    </>
  );
}

/** Edit a single history entry — re-pick item × quantity + client + date.
 *  Mirrors the award form; saving recomputes the officer's totals. */
function EditEntryDialog({ entry, items, onClose, onDone }: { entry: OfficerHistoryEntry; items: PointItem[]; onClose: () => void; onDone: () => void }) {
  const [itemId, setItemId] = useState(items.find((p) => p.label === entry.item_label)?.id ?? items[0]?.id ?? "");
  const [qty, setQty] = useState(entry.quantity || 1);
  const [saleDate, setSaleDate] = useState(entry.date ? entry.date.slice(0, 10) : "");
  const [clientName, setClientName] = useState(entry.client_name ?? "");
  const [clientId, setClientId] = useState(entry.client_id ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const item = useMemo(() => items.find((p) => p.id === itemId), [items, itemId]);
  const q = Math.max(1, qty || 1);
  const totalPts = Math.round((item?.points ?? 0) * q * 100) / 100;
  const totalAfr = (item?.afr ?? 0) * q;
  const totalIncome = (item?.income ?? 0) * q;

  function submit() {
    setErr(null);
    start(async () => {
      const res = await updatePointEntry(entry.id, { itemId, quantity: q, clientName, clientId, saleDate });
      if (res.ok) { toast(res.message || "Updated.", "success"); onDone(); } else setErr(res.error);
    });
  }

  return (
    <Modal title="Edit entry" onClose={onClose}>
      {err && <ErrorBanner msg={err} />}
      {items.length === 0 ? (
        <p className="text-sm text-fg-muted">No point items yet — add some under “Point values” first.</p>
      ) : (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Point item *</label>
            <select className={inputCls} value={itemId} onChange={(e) => setItemId(e.target.value)}>
              {items.map((p) => <option key={p.id} value={p.id}>{p.label} — {fmtPts(p.points)} pts</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Quantity (units)</label><input type="number" min={1} className={inputCls} value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} /></div>
            <div><label className={labelCls}>Sale date</label><input type="date" className={inputCls} value={saleDate} onChange={(e) => setSaleDate(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Client name</label><input className={inputCls} value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Buyer's name" /></div>
            <div><label className={labelCls}>Client ID</label><input className={inputCls} value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="Optional" /></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-brand-blue-tint px-3 py-2.5"><div className="text-[10px] font-semibold uppercase text-brand-blue-dark/70">Points</div><div className="text-lg font-extrabold text-brand-blue-dark">+{fmtPts(totalPts)}</div></div>
            <div className="rounded-xl bg-bg-soft px-3 py-2.5"><div className="text-[10px] font-semibold uppercase text-fg-muted">AFR</div><div className="text-sm font-extrabold text-fg">{fmtBDT(totalAfr)}</div></div>
            <div className="rounded-xl bg-emerald-50 px-3 py-2.5"><div className="text-[10px] font-semibold uppercase text-emerald-700/80">Income</div><div className="text-sm font-extrabold text-emerald-700">{fmtBDT(totalIncome)}</div></div>
          </div>
          <button onClick={submit} disabled={pending} className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark disabled:opacity-60">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
          </button>
        </div>
      )}
    </Modal>
  );
}
