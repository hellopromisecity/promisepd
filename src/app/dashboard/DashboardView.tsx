"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import FlowChart from "@/components/admin/FlowChart";
import DateRangeFilter, { DEFAULT_RANGE, type AppliedRange } from "@/components/admin/DateRangeFilter";
import { computeFlow, downloadFlowCsv } from "@/components/admin/flow";
import {
  Wallet, TrendingUp, Users, UserRound, Building2, ArrowUpRight, ArrowRight, Plus, Trophy,
  Receipt, MessageSquare, ArrowDownRight,
  Smartphone, Send, TrendingDown,
} from "lucide-react";

export type DashboardData = {
  investment: {
    aum: number; invested: number; profit: number; withdrawn: number;
    investors: number; paying: number; projects: number; raised: number; txnCount: number;
    txns: { date: string; op: string; amount: number }[];
    funding: { name: string; raised: number; goal: number; pct: number }[];
    topInvestors: { name: string; balance: number }[];
    recentTxns: { name: string; type: string; op: string; amount: number; date: string; project: string | null }[];
  };
  members: number;
  leads: number;
  blogCount: number;
  recentLeads: { name: string; interest: string | null; created_at: string }[];
  /** KhudeBarta snapshot for the dashboard SMS cards (null until configured). */
  sms: {
    estBalance: number; balance: number; remainingSms: number; rate: number;
    sent30d: number; sentToday: number; sent7d: number; cost30d: number; cost7d: number;
  } | null;
};

const compact = (n: number) => {
  const v = Number(n) || 0, a = Math.abs(v);
  if (a >= 1e7) return `৳${(v / 1e7).toFixed(2)} Cr`;
  if (a >= 1e5) return `৳${(v / 1e5).toFixed(2)} L`;
  return `৳${Math.round(v).toLocaleString("en-US")}`;
};
const taka = (n: number) => `৳${Math.round(Number(n) || 0).toLocaleString("en-US")}`;
const bdt = (n: number) => "৳" + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const firstName = (n: string) => (n || "—").trim().split(/\s+/)[0];
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Dhaka" });
const initial = (n: string) => (n?.trim()?.[0] ?? "?").toUpperCase();

/** Ease-out count-up that runs once when `on` flips true. */
function useCountUp(target: number, on: boolean, ms = 1000) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!on) return;
    let raf = 0, start = 0;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / ms);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, on, ms]);
  return v;
}

const KPI_TONES: Record<string, string> = {
  blue: "from-brand-blue/15 to-brand-blue/5 text-brand-blue",
  emerald: "from-emerald-500/15 to-emerald-500/5 text-emerald-600",
  violet: "from-violet-500/15 to-violet-500/5 text-violet-600",
  amber: "from-amber-500/15 to-amber-500/5 text-amber-600",
};

function Kpi({
  value, format, label, sub, icon: Icon, tone, href, i, on,
}: {
  value: number; format: (n: number) => string; label: string; sub: string;
  icon: React.ComponentType<{ className?: string }>; tone: string; href: string; i: number; on: boolean;
}) {
  const animated = useCountUp(value, on);
  return (
    <Link
      href={href}
      style={{ transitionDelay: `${i * 60}ms` }}
      className={`group rounded-2xl border border-border bg-gradient-to-br ${KPI_TONES[tone]} p-4 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg ${on ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
    >
      <div className="flex items-center justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-bg/70"><Icon className="h-5 w-5" /></span>
        <ArrowUpRight className="h-4 w-4 text-fg-faint transition-colors group-hover:text-brand-blue" />
      </div>
      <p className="mt-3 text-2xl font-extrabold tabular-nums text-fg sm:text-[28px]">{format(animated)}</p>
      <p className="text-[13px] font-bold text-fg">{label}</p>
      <p className="text-xs text-fg-muted">{sub}</p>
    </Link>
  );
}

export default function DashboardView({ data }: { data: DashboardData }) {
  const [on, setOn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setOn(true), 40); return () => clearTimeout(t); }, []);
  const d = data.investment;
  const maxBal = useMemo(() => Math.max(1, ...d.topInvestors.map((t) => t.balance)), [d.topInvestors]);

  // ── date-range filter → drives the capital-flow card ──
  const [applied, setApplied] = useState<AppliedRange>(DEFAULT_RANGE);
  const flow = useMemo(() => computeFlow(d.txns, applied.from, applied.to), [d.txns, applied]);
  const exportFlowCsv = () => downloadFlowCsv(flow.bars, `capital-flow-${applied.label.replace(/[^\w]+/g, "-")}.csv`);

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-fg sm:text-2xl">
            Dashboard
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
              <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" /></span>
              LIVE
            </span>
          </h1>
          <p className="mt-0.5 text-sm text-fg-muted">Real-time view of your investment platform.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* date-range filter — drives the capital flow */}
          <DateRangeFilter applied={applied} onApply={setApplied} />
          <Link href="/dashboard/projects" className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-all hover:-translate-y-0.5 hover:bg-brand-blue-dark">
            <Plus className="h-4 w-4" /> New project
          </Link>
        </div>
      </div>

      {/* hero KPIs — the same four cards as Projectify's All Customers
          (its 5th, App accounts, stays there) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi i={0} on={on} value={d.aum} format={compact} label="Final balance" sub={`${compact(d.invested)} collected · ${d.paying} paying`} icon={TrendingUp} tone="emerald" href="/dashboard/projects" />
        <Kpi i={1} on={on} value={d.raised} format={(v) => Math.round(v).toLocaleString("en-US")} label="Customers" sub="per project — one person can be several" icon={Users} tone="blue" href="/dashboard/projects" />
        <Kpi i={2} on={on} value={d.investors} format={(v) => Math.round(v).toLocaleString("en-US")} label="Unique people" sub="one row per account" icon={UserRound} tone="violet" href="/dashboard/projects" />
        <Kpi i={3} on={on} value={d.projects} format={(v) => Math.round(v).toLocaleString("en-US")} label="Projects" sub="real estate + deposit" icon={Building2} tone="amber" href="/dashboard/projects" />
      </div>

      {/* SMS at a glance — same card design as above; each opens the SMS page */}
      {data.sms && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi i={4} on={on} value={data.sms.estBalance} format={bdt} label="SMS balance (est.)" sub={`checkpoint ${bdt(data.sms.balance)}`} icon={Wallet} tone="emerald" href="/dashboard/sms" />
          <Kpi i={5} on={on} value={data.sms.remainingSms} format={(v) => Math.round(v).toLocaleString("en-IN")} label="Remaining SMS" sub={`at ${bdt(data.sms.rate)} / SMS`} icon={Smartphone} tone="blue" href="/dashboard/sms" />
          <Kpi i={6} on={on} value={data.sms.sent30d} format={(v) => Math.round(v).toLocaleString("en-IN")} label="Sent · 30 days" sub={`${data.sms.sentToday} today · ${data.sms.sent7d} in 7d`} icon={Send} tone="amber" href="/dashboard/sms" />
          <Kpi i={7} on={on} value={data.sms.cost30d} format={bdt} label="Cost · 30 days" sub={`7-day ${bdt(data.sms.cost7d)}`} icon={TrendingDown} tone="violet" href="/dashboard/sms" />
        </div>
      )}

      {/* capital flow */}
      <FlowChart flow={flow.bars} on={on} subtitle={applied.label} count={flow.count} onExport={exportFlowCsv} />

      {/* funding + top investors */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-bg p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-fg"><Building2 className="h-4 w-4 text-brand-blue" /> Project funding</h2>
            <Link href="/dashboard/projects" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline">All <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          {d.funding.length === 0 ? <p className="py-6 text-center text-sm text-fg-muted">No funded projects yet.</p> : (
            <div className="space-y-3.5">
              {d.funding.map((f, i) => (
                <div key={f.name}>
                  <div className="mb-1 flex items-center justify-between text-[13px]">
                    <span className="truncate pr-2 font-medium text-fg">{f.name}</span>
                    <span className="shrink-0 text-fg-muted">{compact(f.raised)} / {compact(f.goal)} · <b className="text-fg">{f.pct}%</b></span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-bg-soft">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-blue to-emerald-500 transition-[width] duration-700" style={{ width: on ? `${f.pct}%` : "0%", transitionDelay: `${i * 70}ms` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-bg p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-fg"><Trophy className="h-4 w-4 text-amber-500" /> Top customers</h2>
            <Link href="/dashboard/projects" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline">All <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          {d.topInvestors.length === 0 ? <p className="py-6 text-center text-sm text-fg-muted">No investors yet.</p> : (
            <>
              <div className="flex h-40 items-end gap-1.5">
                {d.topInvestors.map((t, i) => (
                  <div key={i} className="group relative flex h-full flex-1 items-end" title={`${t.name}: ${taka(t.balance)}`}>
                    <div className="w-full rounded-t bg-gradient-to-t from-brand-blue to-brand-blue/50 transition-[height] duration-700 group-hover:from-brand-blue-dark"
                      style={{ height: on ? `${Math.max(3, (t.balance / maxBal) * 100)}%` : "0%", transitionDelay: `${i * 60}ms` }} />
                    <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-fg px-1.5 py-0.5 text-[9px] font-semibold text-bg opacity-0 transition-opacity group-hover:opacity-100">{compact(t.balance)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-1.5 flex gap-1.5">
                {d.topInvestors.map((t, i) => <span key={i} className="flex-1 truncate text-center text-[9px] text-fg-faint">{firstName(t.name)}</span>)}
              </div>
            </>
          )}
        </div>
      </div>

      {/* recent transactions + enquiries */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-bg p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-fg"><Receipt className="h-4 w-4 text-brand-blue" /> Recent transactions</h2>
            <Link href="/dashboard/transactionify" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline">All <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          {d.recentTxns.length === 0 ? <p className="py-6 text-center text-sm text-fg-muted">No transactions yet.</p> : (
            <ul className="space-y-2.5">
              {d.recentTxns.map((t, i) => {
                const out = t.op === "-";
                return (
                  <li key={i} className="flex items-center gap-3">
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${out ? "bg-brand-red-tint text-brand-red" : "bg-emerald-500/15 text-emerald-600"}`}>
                      {out ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-fg">{t.name}</p>
                      <p className="truncate text-xs text-fg-muted">{t.type}{t.project ? ` · ${t.project}` : ""} · {fmtDate(t.date)}</p>
                    </div>
                    <span className={`shrink-0 text-sm font-bold tabular-nums ${out ? "text-brand-red-dark" : "text-emerald-600"}`}>{out ? "−" : "+"}{compact(t.amount)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-bg p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-fg"><MessageSquare className="h-4 w-4 text-brand-blue" /> Recent enquiries</h2>
            <Link href="/dashboard/marketing/followup" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline">All <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          {data.recentLeads.length === 0 ? <p className="py-6 text-center text-sm text-fg-muted">No enquiries yet — they’ll appear from the contact form.</p> : (
            <ul className="space-y-3">
              {data.recentLeads.map((r, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-blue-tint text-xs font-bold text-brand-blue">{initial(r.name)}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-fg">{r.name || "Unknown"}</p>
                    <p className="truncate text-xs text-fg-muted">{r.interest || "General enquiry"} · {fmtDate(r.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

    </div>
  );
}
