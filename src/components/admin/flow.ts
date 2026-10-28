/** Money-flow helpers shared by the Dashboard, Transactionify and every
 *  project page: date presets, range → In/Out buckets, and the CSV export.
 *  Pure functions — safe in client and server components alike. */

export type FlowTxn = { date: string; op: string; amount: number };
export type FlowBar = { label: string; in: number; out: number };
/** `months` = how many calendar months the shown range covers (fractional for
 *  daily / weekly views), so "Avg / month" follows whatever filter is active. */
export type FlowResult = { gran: "day" | "week" | "month"; bars: FlowBar[]; count: number; inTotal: number; outTotal: number; months: number };

/** Months spanned by a day-count (30.44 days each), never below one. */
export const monthsOfDays = (days: number) => Math.max(1, (days + 1) / 30.4375);

export const FLOW_PRESETS = [
  { id: "12m", label: "Last 12 months" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "this_year", label: "This year" },
  { id: "last_year", label: "Last year" },
  { id: "custom", label: "Custom range" },
] as const;

export function presetRange(id: string): { from: string; to: string } {
  const now = new Date();
  const iso = (d: Date) => d.toLocaleDateString("en-CA");
  const y = now.getFullYear();
  if (id === "7d") { const f = new Date(now); f.setDate(f.getDate() - 6); return { from: iso(f), to: iso(now) }; }
  if (id === "30d") { const f = new Date(now); f.setDate(f.getDate() - 29); return { from: iso(f), to: iso(now) }; }
  if (id === "this_year") return { from: `${y}-01-01`, to: iso(now) };
  if (id === "last_year") return { from: `${y - 1}-01-01`, to: `${y - 1}-12-31` };
  return { from: "", to: "" }; // 12m / custom-empty → flow falls back to last 12 months
}

/** BD calendar day — identical on server (UTC) and browser (BD) so hydration
 *  never mismatches; raw slice(0,10) read midnight-stored rows (T18:00Z) as
 *  the previous day on the server. */
export const bdDay = (iso: string) => (iso ? new Date(new Date(iso).getTime() + 6 * 3600 * 1000).toISOString().slice(0, 10) : "");

/** Capital flow for a date range: In(+)/Out(−) per bucket, granularity follows
 *  the span (≤45d daily, ≤180d weekly, else monthly); empty range → last 12
 *  calendar months ending today, with empty edge months trimmed. */
export function computeFlow(txns: FlowTxn[], from: string, to: string): FlowResult {
  const empty: FlowResult = { gran: "month", bars: [], count: 0, inTotal: 0, outTotal: 0, months: 0 };
  if (!txns.length) return empty;
  const defaulted = !from || !to; // no explicit range → we may trim empty edges
  let fromS = from, toS = to;
  if (!fromS || !toS) {
    // Last 12 calendar months ending TODAY (BD day) — never anchored to the
    // latest transaction, so a future-dated entry can't drag the window forward.
    const today = bdDay(new Date().toISOString());
    const [ty, tm] = today.split("-").map(Number);
    toS = toS || today;
    fromS = fromS || new Date(Date.UTC(ty, tm - 12, 1)).toISOString().slice(0, 10);
  }
  const fromD = new Date(`${fromS}T00:00:00`), toD = new Date(`${toS}T00:00:00`);
  if (Number.isNaN(fromD.getTime()) || Number.isNaN(toD.getTime()) || fromD > toD) return empty;
  const span = (toD.getTime() - fromD.getTime()) / 86400000;
  const gran: "day" | "week" | "month" = span <= 45 ? "day" : span <= 180 ? "week" : "month";
  const keyOf = (iso: string) => {
    const ds = bdDay(iso);
    if (gran === "day") return ds;
    if (gran === "month") return ds.slice(0, 7);
    const d = new Date(`${ds}T00:00:00`); d.setDate(d.getDate() - d.getDay()); return d.toLocaleDateString("en-CA");
  };
  const acc = new Map<string, { in: number; out: number }>();
  let count = 0, inTotal = 0, outTotal = 0;
  for (const t of txns) {
    const d = bdDay(t.date); if (!d || d < fromS || d > toS) continue;
    count++; const amt = Number(t.amount) || 0;
    if (t.op === "-") outTotal += amt; else inTotal += amt;
    const k = keyOf(t.date); const e = acc.get(k) ?? { in: 0, out: 0 };
    if (t.op === "-") e.out += amt; else e.in += amt; acc.set(k, e);
  }
  const bars: FlowBar[] = [];
  const push = (key: string, label: string) => { const e = acc.get(key) ?? { in: 0, out: 0 }; bars.push({ label, ...e }); };
  if (gran === "day") {
    for (const d = new Date(fromD); d <= toD; d.setDate(d.getDate() + 1)) push(d.toLocaleDateString("en-CA"), String(d.getDate()));
  } else if (gran === "week") {
    const d = new Date(fromD); d.setDate(d.getDate() - d.getDay());
    for (; d <= toD; d.setDate(d.getDate() + 7)) push(d.toLocaleDateString("en-CA"), d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }));
  } else {
    const d = new Date(fromD.getFullYear(), fromD.getMonth(), 1), end = new Date(toD.getFullYear(), toD.getMonth(), 1);
    for (; d <= end; d.setMonth(d.getMonth() + 1)) push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, d.toLocaleDateString("en-GB", { month: "short" }));
  }
  // months covered: one per bar on the monthly view (after trimming, so the
  // average is over months that actually had activity at the edges), else the
  // day span in 30.44-day months
  const monthsFor = (b: FlowBar[]) => (gran === "month" ? Math.max(1, b.length) : monthsOfDays(span));
  if (defaulted) {
    // Trim empty edge buckets so the default view starts and ends on real
    // activity — no hollow months on either side of the graph.
    let s = 0, e = bars.length;
    while (s < e && bars[s].in === 0 && bars[s].out === 0) s++;
    while (e > s && bars[e - 1].in === 0 && bars[e - 1].out === 0) e--;
    const trimmed = bars.slice(s, e);
    return { gran, bars: trimmed, count, inTotal, outTotal, months: trimmed.length ? monthsFor(trimmed) : 0 };
  }
  return { gran, bars, count, inTotal, outTotal, months: monthsFor(bars) };
}

/** Download the buckets (+ TOTAL and, when `months` is known, AVG / MONTH rows) as a UTF-8 CSV. */
export function downloadFlowCsv(bars: FlowBar[], filename: string, months?: number) {
  const head = ["Period", "In (BDT)", "Out (BDT)", "Net (BDT)"];
  const inTotal = bars.reduce((s, b) => s + b.in, 0), outTotal = bars.reduce((s, b) => s + b.out, 0);
  const rows = bars.map((b) => [b.label, b.in, b.out, b.in - b.out]);
  const tail: (string | number)[][] = [["TOTAL", inTotal, outTotal, inTotal - outTotal]];
  if (months && months > 0) tail.push([`AVG / MONTH (${months % 1 ? months.toFixed(1) : months} months)`, Math.round(inTotal / months), Math.round(outTotal / months), Math.round((inTotal - outTotal) / months)]);
  const csv = [head, ...rows, ...tail].map((r) => r.join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}
