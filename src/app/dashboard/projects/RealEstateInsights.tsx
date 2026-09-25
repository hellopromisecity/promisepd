"use client";

/** Project dashboard block — the numbers behind a project at a glance, for
 *  all three kinds of project:
 *   • land   (Promise City): land sold in decimal / bigha / katha, avg price
 *            per decimal, biggest plots, plot sizes;
 *   • estate (towers / flats): collection ring (paid vs payable), top payers,
 *            payment-status split, largest dues;
 *   • deposit (GDA / GDB / Special / Monthly): deposits ring (still held vs
 *            deposited + profit), top depositors, member status split;
 *  plus, for every kind, new customers per month (last 12).
 *  Company land convention (owner, 2026-09-07): 1 decimal = 1 শতাংশ,
 *  1.5 decimal = 1 katha, 30 decimal = 1 bigha. */

import { useEffect, useMemo, useState } from "react";
import { LandPlot, Ruler, PieChart, Trophy, CalendarDays, Wallet, AlertCircle, Users } from "lucide-react";
import { StatCard } from "@/components/admin/ui";
import type { HubCustomer } from "@/lib/hub";
import { Donut, BarList } from "../finance/_ui";

const DEC_PER_KATHA = 1.5;
const DEC_PER_BIGHA = 30;

export type InsightMode = "land" | "estate" | "deposit";

const fmt = (n: number) => {
  n = Number(n) || 0;
  const a = Math.abs(n);
  if (a >= 1e7) return "৳" + (n / 1e7).toFixed(2).replace(/\.?0+$/, "") + " Cr";
  if (a >= 1e5) return "৳" + (n / 1e5).toFixed(2).replace(/\.?0+$/, "") + " L";
  return "৳" + (Math.round(n) || 0).toLocaleString("en-IN");
};
const num = (n: number, d = 2) => (Number.isInteger(n) ? String(n) : n.toFixed(d).replace(/\.?0+$/, ""));
const decOf = (c: HubCustomer): number | null => { const v = c.bio?.decimal ?? c.bio?.flat_size; const n = parseFloat(String(v ?? "")); return Number.isFinite(n) && n > 0 ? n : null; };
const firstName = (s: string) => (s || "").replace(/^(md\.?|mst\.?|muhammad|mohammad|muha:)\s*/i, "").split(/\s+/).slice(0, 2).join(" ");

export default function RealEstateInsights({ customers, mode, accrued = 0, details, activeMonth = null, onMonthClick }: {
  customers: HubCustomer[]; mode: InsightMode; accrued?: number; details: React.ReactNode;
  /** YYYY-MM of the selected "New customers" tower (highlighted). */
  activeMonth?: string | null;
  /** Tower click → (YYYY-MM, "Jan 2026"). Towers are plain bars without it. */
  onMonthClick?: (key: string, label: string) => void;
}) {
  const isLand = mode === "land";
  const isDeposit = mode === "deposit";
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 40); return () => clearTimeout(t); }, []);

  const s = useMemo(() => {
    const paid = customers.reduce((a, c) => a + c.total_paid, 0);
    const payable = customers.reduce((a, c) => a + (c.total_price > 0 ? c.total_price : 0), 0);
    const dues = customers.reduce((a, c) => a + (c.total_price > 0 ? Math.max(0, c.total_remaining) : 0), 0);
    const priced = customers.filter((c) => c.total_price > 0).length;
    const fullyPaid = customers.filter((c) => c.total_price > 0 && c.total_remaining <= 0).length;
    const pct = payable > 0 ? Math.min(100, (paid / payable) * 100) : 0;
    // deposit schemes: what members put in, what they were paid, what they took out
    const profitPaid = customers.reduce((a, c) => a + c.dividend, 0);
    const withdrawn = customers.reduce((a, c) => a + c.withdrawn, 0);
    const held = paid + profitPaid - withdrawn + accrued;
    const depositBase = paid + profitPaid + accrued;
    const heldPct = depositBase > 0 ? Math.max(0, Math.min(100, (held / depositBase) * 100)) : 0;
    const heldOf = (c: HubCustomer) => c.total_paid + c.dividend - c.withdrawn;
    const members = [
      { label: "Active", n: customers.filter((c) => c.total_paid > 0 && heldOf(c) > 0).length, color: "#10b981" },
      { label: "Closed / withdrawn", n: customers.filter((c) => c.total_paid > 0 && heldOf(c) <= 0).length, color: "#e11924" },
      { label: "No deposit yet", n: customers.filter((c) => !(c.total_paid > 0)).length, color: "#94a3b8" },
    ];
    // land
    const withDec = customers.map((c) => ({ c, d: decOf(c) })).filter((x): x is { c: HubCustomer; d: number } => x.d != null);
    const decimals = withDec.reduce((a, x) => a + x.d, 0);
    const pricedDec = withDec.filter((x) => x.c.total_price > 0);
    const decPriced = pricedDec.reduce((a, x) => a + x.d, 0);
    const pricePerDec = decPriced > 0 ? pricedDec.reduce((a, x) => a + x.c.total_price, 0) / decPriced : 0;
    // top lists
    const topPaid = [...customers].sort((a, b) => b.total_paid - a.total_paid).slice(0, 8).map((c) => ({ label: firstName(c.name), value: c.total_paid }));
    const topDec = [...withDec].sort((a, b) => b.d - a.d).slice(0, 8).map((x) => ({ label: firstName(x.c.name), value: x.d }));
    // dues spread (who owes the most)
    const topDues = customers.filter((c) => c.total_price > 0 && c.total_remaining > 0).sort((a, b) => b.total_remaining - a.total_remaining).slice(0, 6).map((c) => ({ label: firstName(c.name), value: c.total_remaining }));
    // joins per month, last 12
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1); return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleDateString("en-GB", { month: "short" }), long: d.toLocaleDateString("en-GB", { month: "short", year: "numeric" }), n: 0 }; });
    for (const c of customers) { const m = months.find((x) => (c.joining_date ?? "").startsWith(x.key)); if (m) m.n++; }
    const maxJoin = Math.max(1, ...months.map((m) => m.n));
    const sizes = isLand ? [
      { label: "≤ 1 decimal", n: withDec.filter((x) => x.d <= 1).length },
      { label: "1–3 decimal", n: withDec.filter((x) => x.d > 1 && x.d <= 3).length },
      { label: "3–10 decimal", n: withDec.filter((x) => x.d > 3 && x.d <= 10).length },
      { label: "10+ decimal", n: withDec.filter((x) => x.d > 10).length },
    ] : [];
    // payment status split (real estate without decimals)
    const status = [
      { label: "Fully paid", n: fullyPaid, color: "#10b981" },
      { label: "Partly paid", n: customers.filter((c) => c.total_price > 0 && c.total_paid > 0 && c.total_remaining > 0).length, color: "#1847A1" },
      { label: "Not started", n: customers.filter((c) => c.total_price > 0 && c.total_paid <= 0).length, color: "#f59e0b" },
      { label: "No price set", n: customers.filter((c) => !(c.total_price > 0)).length, color: "#94a3b8" },
    ];
    return { paid, payable, dues, priced, fullyPaid, pct, profitPaid, withdrawn, held, depositBase, heldPct, members, decimals, withDec: withDec.length, pricePerDec, topPaid, topDec, topDues, months, maxJoin, sizes, status };
  }, [customers, isLand, accrued]);

  const bigha = s.decimals / DEC_PER_BIGHA, katha = s.decimals / DEC_PER_KATHA;

  // the status-split list (third panel) — bars per bucket
  const split = isDeposit ? s.members : s.status;
  const splitUnit = isDeposit ? "member" : "file";

  return (
    <div className="space-y-3">
      {isLand && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Land sold" value={`${num(s.decimals)} decimal`} sub={`${num(bigha)} bigha · ${num(katha, 1)} katha · ${s.withDec} plots`} icon={LandPlot} tone="success" />
          <StatCard label="Avg price / decimal" value={fmt(s.pricePerDec)} sub={`${fmt(s.pricePerDec * DEC_PER_KATHA)} per katha · ${fmt(s.pricePerDec * DEC_PER_BIGHA)} per bigha`} icon={Ruler} tone="info" />
          <StatCard label="Payable" value={fmt(s.payable)} sub={`${s.priced} priced files · ${s.fullyPaid} fully paid`} icon={Wallet} tone="warning" />
          <StatCard label="Dues" value={fmt(s.dues)} sub={s.payable > 0 ? `${Math.round(100 - s.pct)}% still to collect` : "no contract prices yet"} icon={AlertCircle} tone={s.dues > 0 ? "danger" : "neutral"} />
        </div>
      )}

      {/* Project details sits compact on the left; the three insight panels
          take the rest — no more full-width box eating the page. */}
      <div className="grid gap-3 xl:grid-cols-4">
        <div className="xl:col-span-1">{details}</div>
        <div className="grid gap-3 md:grid-cols-3 xl:col-span-3">
        {/* ring: collection (estate / land) or deposits still held (deposit) */}
        <div className="rounded-2xl border border-border bg-bg p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-fg"><PieChart className="h-4 w-4 text-brand-blue" /> {isDeposit ? "Deposits" : "Collection"}</p>
          {isDeposit ? (
            <div className="flex items-center justify-around gap-2">
              <Donut mounted={mounted} pct={s.heldPct} color="#1847A1" label="still held" a={fmt(s.held)} b={`of ${fmt(s.depositBase)}`} size={96} />
              <div className="space-y-1.5 text-xs">
                <p className="flex items-center justify-between gap-3"><span className="text-fg-muted">Deposited</span><b className="tabular-nums text-brand-blue">{fmt(s.paid)}</b></p>
                <p className="flex items-center justify-between gap-3"><span className="text-fg-muted">Profit paid</span><b className="tabular-nums text-emerald-600">{fmt(s.profitPaid)}</b></p>
                {accrued > 0 && <p className="flex items-center justify-between gap-3"><span className="text-fg-muted">Accrued (live)</span><b className="tabular-nums text-emerald-600">{fmt(accrued)}</b></p>}
                <p className="flex items-center justify-between gap-3"><span className="text-fg-muted">Withdrawn</span><b className="tabular-nums text-brand-red-dark">{fmt(s.withdrawn)}</b></p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-around gap-2">
              <Donut mounted={mounted} pct={s.pct} color="#1847A1" label="collected" a={fmt(s.paid)} b={`of ${fmt(s.payable)}`} size={96} />
              <div className="space-y-1.5 text-xs">
                <p className="flex items-center justify-between gap-3"><span className="text-fg-muted">Paid</span><b className="tabular-nums text-brand-blue">{fmt(s.paid)}</b></p>
                <p className="flex items-center justify-between gap-3"><span className="text-fg-muted">Dues</span><b className="tabular-nums text-brand-red-dark">{fmt(s.dues)}</b></p>
                <p className="flex items-center justify-between gap-3"><span className="text-fg-muted">Fully paid</span><b className="tabular-nums text-fg">{s.fullyPaid}/{s.priced}</b></p>
              </div>
            </div>
          )}
          {mode === "estate" && (
            <div className="mt-3 border-t border-border pt-3">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-fg-faint">Largest dues</p>
              <BarList mounted={mounted} rows={s.topDues.slice(0, 4)} color="#e11924" total={s.dues} empty="No dues." />
            </div>
          )}
        </div>

        {/* top holders */}
        <div className="rounded-2xl border border-border bg-bg p-4">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-fg"><Trophy className="h-4 w-4 text-amber-500" /> {isLand ? "Biggest plots" : isDeposit ? "Top depositors" : "Top payers"}</p>
          {isLand ? (
            <BarListUnits mounted={mounted} rows={s.topDec} unit="dec" color="#10b981" empty="No decimals recorded yet." />
          ) : (
            <BarList mounted={mounted} rows={s.topPaid} color="#1847A1" total={s.paid} empty={isDeposit ? "No deposits yet." : "No payments yet."} />
          )}
        </div>

        {/* land sizes, member status or payment status */}
        <div className="rounded-2xl border border-border bg-bg p-4">
          {isLand ? (
            <>
              <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-fg"><LandPlot className="h-4 w-4 text-emerald-600" /> Plot sizes</p>
              <ul className="space-y-2.5">
                {s.sizes.map((b, i) => (
                  <li key={b.label}>
                    <div className="flex items-baseline justify-between text-sm"><span className="font-medium text-fg">{b.label}</span><span className="text-xs text-fg-muted">{b.n} plot{b.n === 1 ? "" : "s"}</span></div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-bg-soft"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-[width] duration-700" style={{ width: mounted ? `${s.withDec ? Math.max(2, (b.n / s.withDec) * 100) : 0}%` : "0%", transitionDelay: `${i * 60}ms` }} /></div>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-fg-faint">1 katha = {DEC_PER_KATHA} decimal · 1 bigha = {DEC_PER_BIGHA} decimal</p>
            </>
          ) : (
            <>
              <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-fg">
                {isDeposit ? <Users className="h-4 w-4 text-brand-blue" /> : <Wallet className="h-4 w-4 text-brand-blue" />} {isDeposit ? "Member status" : "Payment status"}
              </p>
              <ul className="space-y-2.5">
                {split.map((b, i) => (
                  <li key={b.label}>
                    <div className="flex items-baseline justify-between text-sm"><span className="font-medium text-fg">{b.label}</span><span className="text-xs text-fg-muted">{b.n} {splitUnit}{b.n === 1 ? "" : "s"}</span></div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-bg-soft"><div className="h-full rounded-full transition-[width] duration-700" style={{ width: mounted ? `${customers.length ? Math.max(b.n ? 2 : 0, (b.n / customers.length) * 100) : 0}%` : "0%", background: b.color, transitionDelay: `${i * 60}ms` }} /></div>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-fg-faint">{customers.length} {isDeposit ? "members" : "files"} in this project</p>
            </>
          )}
        </div>

        </div>
      </div>

      {/* joins per month — wide */}
      <div className="rounded-2xl border border-border bg-bg p-4">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-fg"><CalendarDays className="h-4 w-4 text-violet-500" /> New {isDeposit ? "members" : "customers"} <span className="text-[11px] font-normal text-fg-faint">· last 12 months · {customers.length} total{onMonthClick && " · click a month to list them below"}</span></p>
          <div className="flex h-24 items-end gap-1.5">
            {s.months.map((m, i) => {
              const active = activeMonth === m.key;
              const dim = activeMonth != null && !active;
              return (
                <button
                  key={m.key}
                  type="button"
                  disabled={!onMonthClick || m.n === 0}
                  onClick={() => onMonthClick?.(m.key, m.long)}
                  aria-pressed={active}
                  title={`${m.long}: ${m.n}${onMonthClick && m.n ? " — click to show" : ""}`}
                  className={`group relative flex h-full flex-1 items-end rounded-t transition-opacity ${onMonthClick && m.n ? "cursor-pointer hover:opacity-90" : "cursor-default"} ${dim ? "opacity-40" : ""}`}
                >
                  <div className={`w-full rounded-t transition-[height] duration-700 ${active ? "bg-gradient-to-t from-brand-blue to-brand-blue-soft ring-2 ring-brand-blue/40" : "bg-gradient-to-t from-violet-600 to-violet-400"}`} style={{ height: mounted ? `${m.n ? Math.max(4, (m.n / s.maxJoin) * 100) : 0}%` : "0%", transitionDelay: `${i * 40}ms` }} />
                  {m.n > 0 && <span className={`pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold ${active ? "text-brand-blue" : "text-fg"}`}>{m.n}</span>}
                </button>
              );
            })}
          </div>
          <div className="mt-1 flex gap-1.5">{s.months.map((m) => <span key={m.key} className={`flex-1 text-center text-[9px] ${activeMonth === m.key ? "font-bold text-brand-blue" : "text-fg-faint"}`}>{m.label}</span>)}</div>
      </div>
    </div>
  );
}

/** Bars with a unit suffix instead of money (decimals). */
function BarListUnits({ mounted, rows, unit, color, empty }: { mounted: boolean; rows: { label: string; value: number }[]; unit: string; color: string; empty: string }) {
  if (!rows.length) return <p className="py-8 text-center text-sm text-fg-muted">{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((r, i) => (
        <li key={r.label + i} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <span className="block truncate text-sm font-medium text-fg" title={r.label}>{r.label}</span>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-bg-soft"><div className="h-full rounded-full transition-[width] duration-700" style={{ width: mounted ? `${Math.max(2, (r.value / max) * 100)}%` : "0%", background: color, transitionDelay: `${i * 50}ms` }} /></div>
          </div>
          <span className="w-16 text-right text-sm font-bold tabular-nums text-fg">{num(r.value)} {unit}</span>
        </li>
      ))}
    </ul>
  );
}
