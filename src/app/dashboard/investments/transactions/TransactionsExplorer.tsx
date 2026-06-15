"use client";

/** All Transactions — a rich, interactive explorer:
 *  animated Lakh/Crore summary cards + a monthly in/out chart, search,
 *  a date-range filter (presets + custom, applied on a button), sortable
 *  columns, a fixed-height scroll box with a sticky header, page-size
 *  control and pagination. Rows reuse the add/edit form + delete control. */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  Hash,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ReceiptText,
} from "lucide-react";
import { thCls, tdCls, Badge, EmptyState } from "@/components/admin/ui";
import TxnForm, { type InvestorOption, type TypeOption, type ProjectOption } from "./TxnForm";
import TxnDelete from "./TxnDelete";

export type Row = {
  transaction_id: string;
  uid: string;
  userName: string;
  type: string;
  operator: string; // + | -
  amount: number;
  date: string; // ISO
  projectId: string | null;
  projectName: string | null;
  rashid: string | null;
  description: string | null;
};

const inputCls = "h-9 rounded-xl border border-border bg-bg-soft px-3 text-sm outline-none focus:border-brand-blue/50";

/** ৳ in market form: 2.24 Cr / 1.10 Lakh / 68,000. */
function compact(n: number): string {
  const a = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (a >= 1e7) return `${sign}৳${(a / 1e7).toFixed(2)} Cr`;
  if (a >= 1e5) return `${sign}৳${(a / 1e5).toFixed(2)} Lakh`;
  return `${sign}৳${Math.round(a).toLocaleString("en-US")}`;
}
const taka = (n: number) => `৳${Math.round(Number(n) || 0).toLocaleString("en-US")}`;
const fmtDate = (iso: string) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const dayKey = (iso: string) => (iso || "").slice(0, 10);

type SortKey = "date" | "amount" | "type" | "user";

const DATE_PRESETS = [
  { id: "all", label: "All time" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "this_year", label: "This year" },
  { id: "last_year", label: "Last year" },
  { id: "custom", label: "Custom range" },
] as const;

function presetRange(id: string): { from: string; to: string } {
  const now = new Date();
  const iso = (d: Date) => d.toLocaleDateString("en-CA");
  const y = now.getFullYear();
  if (id === "30d") { const f = new Date(now); f.setDate(f.getDate() - 29); return { from: iso(f), to: iso(now) }; }
  if (id === "90d") { const f = new Date(now); f.setDate(f.getDate() - 89); return { from: iso(f), to: iso(now) }; }
  if (id === "this_year") return { from: `${y}-01-01`, to: iso(now) };
  if (id === "last_year") return { from: `${y - 1}-01-01`, to: `${y - 1}-12-31` };
  return { from: "", to: "" };
}

export default function TransactionsExplorer({
  rows,
  investors,
  types,
  projects,
}: {
  rows: Row[];
  investors: InvestorOption[];
  types: TypeOption[];
  projects: ProjectOption[];
}) {
  const formProps = { investors, types, projects };

  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  // Date filter: a draft (preset + custom) applied via the Apply button.
  const [draftPreset, setDraftPreset] = useState("all");
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [applied, setApplied] = useState<{ from: string; to: string }>({ from: "", to: "" });

  function applyDateFilter() {
    const r = draftPreset === "custom" ? { from: draftFrom, to: draftTo } : presetRange(draftPreset);
    setApplied(r);
    setPage(1);
  }
  function clearDateFilter() {
    setDraftPreset("all"); setDraftFrom(""); setDraftTo(""); setApplied({ from: "", to: "" }); setPage(1);
  }

  // ── filter (search + applied date) ──
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (applied.from && dayKey(r.date) < applied.from) return false;
      if (applied.to && dayKey(r.date) > applied.to) return false;
      if (ql) {
        const hay = `${r.transaction_id} ${r.uid} ${r.userName} ${r.rashid ?? ""} ${r.type} ${r.projectName ?? ""}`.toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      return true;
    });
  }, [rows, q, applied]);

  // ── summary over the filtered set ──
  const stats = useMemo(() => {
    let inflow = 0, outflow = 0;
    for (const r of filtered) (r.operator === "-" ? (outflow += r.amount) : (inflow += r.amount));
    return { inflow, outflow, net: inflow - outflow, count: filtered.length };
  }, [filtered]);

  // ── in/out flow chart — granularity follows the selected range ──
  // Short range → daily bars, medium → weekly, long → monthly; every bucket
  // in the range is emitted (even empty ones) so the bars are evenly spaced.
  const chart = useMemo(() => {
    const empty = { gran: "month" as "day" | "week" | "month", bars: [] as { label: string; in: number; out: number }[] };
    if (!filtered.length) return empty;
    let fromS = applied.from;
    let toS = applied.to;
    if (!fromS || !toS) {
      // No date filter → show the LAST 12 MONTHS of activity (anchored to the
      // latest transaction). Spanning the raw min→max would blow up to dozens
      // of mostly-empty buckets if a single stray old/future date exists.
      let max = "0000-01-01";
      for (const r of filtered) { const d = dayKey(r.date); if (d && d > max) max = d; }
      const maxD = new Date(`${max}T00:00:00`);
      const minD = new Date(maxD); minD.setMonth(minD.getMonth() - 11); minD.setDate(1);
      toS = toS || max;
      fromS = fromS || minD.toLocaleDateString("en-CA");
    }
    const fromD = new Date(`${fromS}T00:00:00`);
    const toD = new Date(`${toS}T00:00:00`);
    if (Number.isNaN(fromD.getTime()) || Number.isNaN(toD.getTime()) || fromD > toD) return empty;
    const span = (toD.getTime() - fromD.getTime()) / 86400000;
    const gran: "day" | "week" | "month" = span <= 45 ? "day" : span <= 180 ? "week" : "month";

    const keyOf = (iso: string) => {
      const ds = iso.slice(0, 10);
      if (gran === "day") return ds;
      if (gran === "month") return iso.slice(0, 7);
      const d = new Date(`${ds}T00:00:00`); d.setDate(d.getDate() - d.getDay()); // week start (Sun)
      return d.toLocaleDateString("en-CA");
    };
    const acc = new Map<string, { in: number; out: number }>();
    for (const r of filtered) {
      const dk = dayKey(r.date);
      if (!dk || dk < fromS || dk > toS) continue;
      const k = keyOf(r.date);
      const e = acc.get(k) ?? { in: 0, out: 0 };
      if (r.operator === "-") e.out += r.amount; else e.in += r.amount;
      acc.set(k, e);
    }

    const bars: { label: string; in: number; out: number }[] = [];
    const push = (key: string, label: string) => { const e = acc.get(key) ?? { in: 0, out: 0 }; bars.push({ label, ...e }); };
    if (gran === "day") {
      for (const d = new Date(fromD); d <= toD; d.setDate(d.getDate() + 1)) push(d.toLocaleDateString("en-CA"), String(d.getDate()));
    } else if (gran === "week") {
      const d = new Date(fromD); d.setDate(d.getDate() - d.getDay());
      for (; d <= toD; d.setDate(d.getDate() + 7)) push(d.toLocaleDateString("en-CA"), d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }));
    } else {
      const d = new Date(fromD.getFullYear(), fromD.getMonth(), 1);
      const end = new Date(toD.getFullYear(), toD.getMonth(), 1);
      for (; d <= end; d.setMonth(d.getMonth() + 1)) {
        push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, d.toLocaleDateString("en-GB", { month: "short" }));
      }
    }
    return { gran, bars };
  }, [filtered, applied]);

  // ── sort + paginate ──
  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      if (sortKey === "amount") return (a.amount - b.amount) * dir;
      if (sortKey === "type") return a.type.localeCompare(b.type) * dir;
      if (sortKey === "user") return a.userName.localeCompare(b.userName) * dir;
      return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const curPage = Math.min(page, pageCount);
  const start = (curPage - 1) * perPage;
  const pageRows = sorted.slice(start, start + perPage);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir(k === "date" || k === "amount" ? "desc" : "asc"); }
  }
  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey !== k ? <ArrowUpDown className="h-3 w-3 opacity-40" /> : sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;

  const maxBar = Math.max(1, ...chart.bars.map((b) => Math.max(b.in, b.out)));
  const labelStep = Math.max(1, Math.ceil(chart.bars.length / 14)); // thin out labels when many buckets

  const STAT = [
    { label: "Inflow", value: stats.inflow, sub: "deposits, profit…", icon: ArrowDownLeft, cls: "text-emerald-600", ring: "from-emerald-50" },
    { label: "Outflow", value: stats.outflow, sub: "withdrawals, fees…", icon: ArrowUpRight, cls: "text-brand-red-dark", ring: "from-brand-red-tint" },
    { label: "Net", value: stats.net, sub: "in − out", icon: Scale, cls: "text-brand-blue", ring: "from-brand-blue-tint" },
    { label: "Transactions", value: stats.count, sub: "in view", icon: Hash, cls: "text-fg", ring: "from-bg-soft", isCount: true },
  ];

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STAT.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            className={`overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${s.ring} to-bg p-4`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">{s.label}</p>
              <s.icon className={`h-4 w-4 ${s.cls}`} />
            </div>
            <p className={`mt-1 text-xl font-extrabold tabular-nums sm:text-2xl ${s.cls}`}>
              {s.isCount ? s.value.toLocaleString("en-US") : compact(s.value)}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-fg-faint">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Flow chart — daily / weekly / monthly depending on the selected range */}
      {chart.bars.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="rounded-2xl border border-border bg-bg p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-fg-muted">
              {chart.gran === "day" ? "Daily flow" : chart.gran === "week" ? "Weekly flow" : "Monthly flow"}
            </p>
            <div className="flex items-center gap-3 text-[11px] text-fg-muted">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> In</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-brand-red" /> Out</span>
            </div>
          </div>
          <div className="flex items-end gap-1 pb-1" style={{ height: 136 }}>
            {chart.bars.map((b, i) => (
              <div key={i} className="group/bar flex min-w-0 flex-1 flex-col items-center gap-1">
                <div className="flex w-full items-end justify-center gap-[2px]" style={{ height: 104 }}>
                  <div className="w-full max-w-[13px] rounded-t bg-emerald-500/90 transition-[height,background-color] duration-300 group-hover/bar:bg-emerald-500" style={{ height: `${b.in > 0 ? Math.max(3, (b.in / maxBar) * 100) : 0}%` }} title={`${b.label} · In ${compact(b.in)}`} />
                  <div className="w-full max-w-[13px] rounded-t bg-brand-red/80 transition-[height,background-color] duration-300 group-hover/bar:bg-brand-red" style={{ height: `${b.out > 0 ? Math.max(3, (b.out / maxBar) * 100) : 0}%` }} title={`${b.label} · Out ${compact(b.out)}`} />
                </div>
                <span className="h-3 w-full truncate text-center text-[9px] text-fg-faint">{i % labelStep === 0 ? b.label : ""}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Toolbar: search + date filter + per-page + add */}
      <div className="space-y-3 rounded-2xl border border-border bg-bg p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-border bg-bg-soft px-3">
            <Search className="h-4 w-4 shrink-0 text-fg-faint" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search by ID, user, receipt, project…" className="h-9 w-full bg-transparent text-sm outline-none" />
          </div>
          <TxnForm {...formProps} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={draftPreset} onChange={(e) => setDraftPreset(e.target.value)} className={inputCls}>
            {DATE_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          {draftPreset === "custom" && (
            <>
              <input type="date" value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)} className={inputCls} />
              <span className="text-fg-faint">–</span>
              <input type="date" value={draftTo} onChange={(e) => setDraftTo(e.target.value)} className={inputCls} />
            </>
          )}
          <button type="button" onClick={applyDateFilter} className="h-9 rounded-xl bg-brand-blue px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark">Apply</button>
          {(applied.from || applied.to) && (
            <button type="button" onClick={clearDateFilter} className="h-9 rounded-xl border border-border px-3 text-sm font-semibold text-fg-muted hover:bg-bg-soft">Clear</button>
          )}
          <div className="ml-auto flex items-center gap-2 text-sm text-fg-muted">
            <span className="hidden sm:inline">Per page</span>
            <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} className={inputCls}>
              {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table (fixed-height scroll box, sticky header) */}
      {total === 0 ? (
        <EmptyState icon={ReceiptText} title="No transactions" message="Try a different search or date range." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-bg">
          <div className="max-h-[58vh] overflow-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-bg-soft">
                <tr>
                  <th className={thCls}>ID / Receipt</th>
                  <th className={`${thCls} cursor-pointer select-none`} onClick={() => toggleSort("user")}><span className="inline-flex items-center gap-1">User <SortIcon k="user" /></span></th>
                  <th className={`${thCls} cursor-pointer select-none`} onClick={() => toggleSort("date")}><span className="inline-flex items-center gap-1">Date <SortIcon k="date" /></span></th>
                  <th className={`${thCls} cursor-pointer select-none`} onClick={() => toggleSort("type")}><span className="inline-flex items-center gap-1">Type <SortIcon k="type" /></span></th>
                  <th className={`${thCls} cursor-pointer select-none text-right`} onClick={() => toggleSort("amount")}><span className="inline-flex items-center gap-1">Amount <SortIcon k="amount" /></span></th>
                  <th className={thCls}>Project</th>
                  <th className={`${thCls} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => {
                  const minus = r.operator === "-";
                  return (
                    <tr key={r.transaction_id} className="hover:bg-bg-soft/60">
                      <td className={`${tdCls} whitespace-nowrap font-mono text-xs`}>
                        <p className="font-semibold text-fg">{r.transaction_id}</p>
                        {r.rashid && <p className="text-fg-faint">{r.rashid}</p>}
                      </td>
                      <td className={tdCls}>
                        <p className="font-mono text-[11px] text-fg-faint">{r.uid}</p>
                        <p className="font-semibold text-fg">{r.userName || "—"}</p>
                      </td>
                      <td className={`${tdCls} whitespace-nowrap text-fg-muted`}>{fmtDate(r.date)}</td>
                      <td className={tdCls}><Badge tone={minus ? "danger" : "success"}>{r.type}</Badge></td>
                      <td className={`${tdCls} whitespace-nowrap text-right font-bold ${minus ? "text-brand-red-dark" : "text-emerald-600"}`}>{minus ? "−" : "+"}{taka(r.amount)}</td>
                      <td className={`${tdCls} text-fg-muted`}>{r.projectName ?? "—"}</td>
                      <td className={tdCls}>
                        <div className="flex items-center justify-end gap-1">
                          <TxnForm {...formProps} txn={{ transaction_id: r.transaction_id, uid: r.uid, type: r.type, amount: r.amount, date: (r.date || "").slice(0, 10), project_id: r.projectId, rashid_number: r.rashid, description: r.description }} />
                          <TxnDelete id={r.transaction_id} label={r.transaction_id} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-sm">
            <span className="text-fg-muted">
              Showing <b className="text-fg">{start + 1}</b>–<b className="text-fg">{Math.min(start + perPage, total)}</b> of <b className="text-fg">{total.toLocaleString("en-US")}</b>
            </span>
            <div className="flex items-center gap-1">
              <PageBtn disabled={curPage <= 1} onClick={() => setPage(curPage - 1)}>«</PageBtn>
              {pageNumbers(curPage, pageCount).map((p, i) =>
                p === "…" ? (
                  <span key={`e${i}`} className="px-2 text-fg-faint">…</span>
                ) : (
                  <PageBtn key={p} active={p === curPage} onClick={() => setPage(p as number)}>{p}</PageBtn>
                ),
              )}
              <PageBtn disabled={curPage >= pageCount} onClick={() => setPage(curPage + 1)}>»</PageBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PageBtn({ children, active, disabled, onClick }: { children: React.ReactNode; active?: boolean; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`grid h-8 min-w-8 place-items-center rounded-lg px-2 text-sm font-semibold transition-colors disabled:opacity-40 ${
        active ? "bg-brand-blue text-white" : "border border-border text-fg-muted hover:bg-bg-soft hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}

/** 1 … 4 5 [6] 7 8 … 41 — compact page list. */
function pageNumbers(cur: number, count: number): (number | "…")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const lo = Math.max(2, cur - 1);
  const hi = Math.min(count - 1, cur + 1);
  if (lo > 2) out.push("…");
  for (let i = lo; i <= hi; i++) out.push(i);
  if (hi < count - 1) out.push("…");
  out.push(count);
  return out;
}
