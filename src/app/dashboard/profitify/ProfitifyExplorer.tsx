"use client";

/** Profitify — the company's profit-payout story in one view.
 *  Hero stats → lifetime mix donut + per-year towers → the 4 schemes' cycle
 *  cards (paid this year or not, next payout) → filterable payment history
 *  (scheme × year × search) with yearly totals and full pagination. */

import { useEffect, useMemo, useState } from "react";
import {
  HandCoins, CalendarCheck2, Landmark, Users, Search, ChevronLeft, ChevronRight,
  TrendingUp, CheckCircle2, MinusCircle,
} from "lucide-react";
import { StatCard } from "@/components/admin/ui";
import { fmtDate } from "@/app/dashboard/investments/users/shared";
import type { ProfitifyData, ProfitPaymentRow } from "@/lib/profitify";

const fmt = (n: number) => "৳" + Math.round(Number(n) || 0).toLocaleString("en-IN");
const compact = (n: number) => {
  n = Number(n) || 0;
  if (n >= 1e7) return "৳" + (n / 1e7).toFixed(2).replace(/\.?0+$/, "") + " Cr";
  if (n >= 1e5) return "৳" + (n / 1e5).toFixed(2).replace(/\.?0+$/, "") + " L";
  return fmt(n);
};

const SCHEME_COLORS = ["#1847a1", "#f59e0b", "#e11924", "#10b981"];
type SortKey = "date" | "amount";

export default function ProfitifyExplorer({ data }: { data: ProfitifyData }) {
  const [scheme, setScheme] = useState("all");
  const [year, setYear] = useState("all");
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const colorOf = new Map(data.schemes.map((s, i) => [s.key, SCHEME_COLORS[i % SCHEME_COLORS.length]]));

  // per-year totals for the towers (always ALL data — the big picture)
  const yearBars = useMemo(() => {
    const m = new Map<number, number>();
    for (const p of data.payments) m.set(p.year, (m.get(p.year) ?? 0) + p.amount);
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [data.payments]);
  const maxYear = Math.max(1, ...yearBars.map(([, v]) => v));

  // filtered rows
  const term = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    let rows = data.payments;
    if (scheme !== "all") rows = rows.filter((p) => p.project_key === scheme);
    if (year !== "all") rows = rows.filter((p) => p.year === Number(year));
    if (term) rows = rows.filter((p) => `${p.customer_name} ${p.file_no ?? ""} ${p.project_name}`.toLowerCase().includes(term));
    return [...rows].sort((a, b) => (sortKey === "date" ? b.date.localeCompare(a.date) : b.amount - a.amount));
  }, [data.payments, scheme, year, term, sortKey]);
  const filteredTotal = filtered.reduce((s, p) => s + p.amount, 0);

  // yearly breakdown of the current selection (scheme × year totals)
  const breakdown = useMemo(() => {
    const m = new Map<string, { year: number; name: string; amount: number; n: number }>();
    for (const p of filtered) {
      const k = `${p.year}·${p.project_key}`;
      const cur = m.get(k) ?? { year: p.year, name: p.project_name, amount: 0, n: 0 };
      cur.amount += p.amount; cur.n++;
      m.set(k, cur);
    }
    return [...m.values()].sort((a, b) => b.year - a.year || b.amount - a.amount);
  }, [filtered]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const curPage = Math.min(page, pageCount);
  const pageRows = filtered.slice((curPage - 1) * perPage, curPage * perPage);

  // lifetime mix donut
  const segTotal = Math.max(1, data.totals.lifetime);
  const R = 30, C = 2 * Math.PI * R;
  let acc = 0;

  return (
    <div className="space-y-5">
      {/* hero stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Lifetime profit paid" value={compact(data.totals.lifetime)} sub="all 4 deposit schemes combined" icon={HandCoins} tone="success" />
        <StatCard label={`Paid in ${data.thisYear}`} value={compact(data.totals.thisYear)} sub={data.totals.schemesPaidThisYear.length ? data.totals.schemesPaidThisYear.join(" + ") : "no scheme paid yet"} icon={CalendarCheck2} tone="info" />
        <StatCard label="Schemes paid this year" value={`${data.totals.schemesPaidThisYear.length} of ${data.schemes.length}`} sub="Special yearly · A/B 2-yearly · Monthly 5-yearly" icon={Landmark} tone="warning" />
        <StatCard label="Members received" value={data.totals.members.toLocaleString("en-IN")} sub="unique profit receivers, lifetime" icon={Users} tone="neutral" />
      </div>

      {/* mix donut + per-year towers */}
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-bg p-4">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-fg"><HandCoins className="h-4 w-4 text-emerald-500" /> Lifetime mix</p>
          <div className="flex items-center justify-around gap-3">
            <div className="relative" style={{ width: 96, height: 96 }}>
              <svg viewBox="0 0 80 80" width={96} height={96} className="-rotate-90">
                <circle cx="40" cy="40" r={R} fill="none" stroke="var(--color-border)" strokeWidth="9" />
                {data.schemes.map((s) => {
                  const frac = s.lifetime / segTotal;
                  const el = (
                    <circle key={s.key} cx="40" cy="40" r={R} fill="none" stroke={colorOf.get(s.key)} strokeWidth="9" strokeLinecap="butt"
                      strokeDasharray={`${mounted ? frac * C : 0} ${C}`} strokeDashoffset={-acc * C}
                      style={{ transition: "stroke-dasharray 1.1s cubic-bezier(.22,1,.36,1)" }} />
                  );
                  acc += frac;
                  return el;
                })}
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center">
                <div><div className="text-sm font-extrabold tabular-nums text-fg">{compact(data.totals.lifetime)}</div><div className="-mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-fg-faint">lifetime</div></div>
              </div>
            </div>
            <div className="space-y-1.5">
              {data.schemes.map((s) => (
                <div key={s.key} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colorOf.get(s.key) }} />
                  <span className="text-fg-muted">{s.name}</span>
                  <span className="font-bold tabular-nums text-fg">{s.lifetime ? compact(s.lifetime) : "—"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-bg p-4 lg:col-span-2">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-fg"><TrendingUp className="h-4 w-4 text-brand-blue" /> Profit paid per year <span className="text-[11px] font-normal text-fg-faint">(all schemes)</span></p>
          <div className="flex h-32 items-end justify-around gap-4 px-2">
            {yearBars.map(([y, amt]) => (
              <div key={y} className="flex h-full w-full max-w-[110px] flex-col items-center justify-end gap-1">
                <span className="text-xs font-bold tabular-nums text-fg">{compact(amt)}</span>
                <div
                  className="w-full rounded-t-lg transition-all duration-1000 ease-out"
                  style={{
                    height: mounted ? `${Math.max(8, (amt / maxYear) * 100)}%` : "2%",
                    background: y === data.thisYear ? "linear-gradient(180deg,#10b981,#86efac)" : "linear-gradient(180deg,#1847a1,#93b4e8)",
                  }}
                />
                <span className={`text-[11px] font-semibold ${y === data.thisYear ? "text-emerald-600" : "text-fg-faint"}`}>{y}{y === data.thisYear ? " ●" : ""}</span>
              </div>
            ))}
            {yearBars.length === 0 && <p className="self-center text-sm text-fg-muted">No profit payouts recorded yet.</p>}
          </div>
        </div>
      </div>

      {/* the 4 schemes' cycle cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {data.schemes.map((s) => (
          <div key={s.key} className="rounded-2xl border border-border bg-bg p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
              <p className="font-bold text-fg">{s.name}</p>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colorOf.get(s.key) }} />
            </div>
            <p className="mt-0.5 text-[11px] text-fg-muted">{s.cycleText}</p>
            <div className="mt-3">
              {s.paidThisYear ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> {data.thisYear} — paid {compact(s.thisYear)}</span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-bg-soft px-2.5 py-1 text-[11px] font-bold text-fg-muted"><MinusCircle className="h-3.5 w-3.5" /> not this year</span>
              )}
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-fg-faint">Lifetime</p>
                <p className="text-lg font-extrabold tabular-nums text-fg">{s.lifetime ? compact(s.lifetime) : "—"}</p>
              </div>
              <p className="text-[11px] text-fg-muted">Next: <span className="font-bold text-brand-blue">{s.nextYear ?? "—"}</span></p>
            </div>
          </div>
        ))}
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2">
          <Search className="h-4 w-4 text-fg-faint" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search member name or file…" className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-faint" />
        </div>
        <select value={scheme} onChange={(e) => { setScheme(e.target.value); setPage(1); }} className="rounded-xl border border-border bg-bg px-3 py-2 text-sm font-medium text-fg">
          <option value="all">All schemes</option>
          {data.schemes.map((s) => <option key={s.key} value={s.key}>{s.name}</option>)}
        </select>
        <select value={year} onChange={(e) => { setYear(e.target.value); setPage(1); }} className="rounded-xl border border-border bg-bg px-3 py-2 text-sm font-medium text-fg">
          <option value="all">All years</option>
          {data.years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="rounded-xl border border-border bg-bg px-3 py-2 text-sm font-medium text-fg">
          <option value="date">Newest first</option>
          <option value="amount">Biggest amount first</option>
        </select>
        <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} className="rounded-xl border border-border bg-bg px-3 py-2 text-sm font-medium text-fg">
          <option value={10}>10 / page</option>
          <option value={25}>25 / page</option>
          <option value={50}>50 / page</option>
        </select>
        <span className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm font-bold tabular-nums text-emerald-700">Total: {fmt(filteredTotal)}</span>
      </div>

      {/* yearly breakdown of the selection */}
      {breakdown.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-bg">
          <div className="border-b border-border bg-bg-soft px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-fg-muted">Year-by-year — current selection</div>
          <div className="grid gap-x-6 px-4 py-2 sm:grid-cols-2 lg:grid-cols-3">
            {breakdown.map((b) => (
              <div key={`${b.year}-${b.name}`} className="flex items-center justify-between border-b border-border/40 py-2 text-sm last:border-0">
                <span className="text-fg-muted"><span className="font-bold text-fg">{b.year}</span> · {b.name} <span className="text-[10px] text-fg-faint">({b.n})</span></span>
                <span className="font-bold tabular-nums text-fg">{fmt(b.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* payment history */}
      <div className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-bg">
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-emerald-500/10 px-4 py-3">
          <HandCoins className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-fg">Profit payments</h3>
          <span className="text-xs text-fg-muted">every member's payout — booked entries plus the engine's computed shares for paid-out cycles</span>
        </div>
        {pageRows.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-fg-muted">{term || scheme !== "all" || year !== "all" ? "Nothing matches this selection." : "No profit payouts recorded yet."}</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {pageRows.map((p: ProfitPaymentRow, i) => (
              <li key={`${p.customer_name}-${p.date}-${i}`} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-fg">
                    {p.customer_name}
                    <span className="ml-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${colorOf.get(p.project_key)}1a`, color: colorOf.get(p.project_key) }}>{p.project_name}</span>
                  </p>
                  <p className="text-[11px] text-fg-muted">{p.file_no ? `File ${p.file_no} · ` : ""}{fmtDate(p.date)}{p.source === "engine" ? " · engine share" : ""}</p>
                </div>
                <span className="text-sm font-bold tabular-nums text-emerald-600">+{fmt(p.amount)}</span>
              </li>
            ))}
          </ul>
        )}
        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-sm">
            <p className="tabular-nums text-fg-muted">Showing <b className="text-fg">{(curPage - 1) * perPage + 1}–{Math.min(curPage * perPage, filtered.length)}</b> of <b className="text-fg">{filtered.length}</b> payments</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={curPage <= 1} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-fg-muted hover:border-brand-blue/40 hover:text-brand-blue disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).filter((p) => p === 1 || p === pageCount || Math.abs(p - curPage) <= 1).map((p, idx, arr) => (
                <span key={p} className="flex items-center">
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-fg-faint">…</span>}
                  <button onClick={() => setPage(p)} className={`grid h-8 min-w-8 place-items-center rounded-lg border px-2 text-sm font-semibold ${p === curPage ? "border-brand-blue bg-brand-blue text-white" : "border-border text-fg-muted hover:border-brand-blue/40 hover:text-brand-blue"}`}>{p}</button>
                </span>
              ))}
              <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={curPage >= pageCount} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-fg-muted hover:border-brand-blue/40 hover:text-brand-blue disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
