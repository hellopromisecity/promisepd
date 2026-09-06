"use client";

/** Finance → Overview: the office book at a glance. Period picker, income /
 *  expense / net / cash-position cards, a 12-month income-vs-expense chart,
 *  the two head breakdowns (each with its total), the bank & cash split and
 *  the latest entries — with quick links into the ledgers. */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, Scale, Landmark, ArrowRight, Tag, Clock } from "lucide-react";
import { StatCard } from "@/components/admin/ui";
import type { FinanceData, FinTxn } from "@/lib/finance";
import { taka, compact, fmtDate, txnHead, PERIODS, periodRange, inPeriod, last12Months, type Period, selectCls, Donut, BarList, byHead, accountTypeLabel } from "./_ui";

export default function FinanceOverview({ data }: { data: FinanceData }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 40); return () => clearTimeout(t); }, []);
  const [period, setPeriod] = useState<Period>("month");
  const range = useMemo(() => periodRange(period), [period]);
  const inRange = useMemo(() => data.txns.filter((t) => inPeriod(t, range)), [data.txns, range]);
  const income = inRange.filter((t) => t.type === "income");
  const expense = inRange.filter((t) => t.type === "expense");
  const sum = (rows: FinTxn[]) => rows.reduce((s, t) => s + t.amount, 0);
  const inc = sum(income), exp = sum(expense), net = inc - exp;
  const incHeads = useMemo(() => byHead(income), [income]);
  const expHeads = useMemo(() => byHead(expense), [expense]);
  const accName = useMemo(() => new Map(data.accounts.map((a) => [a.id, a.name])), [data.accounts]);

  // cash position (all time) + split by account type
  const position = data.accounts.reduce((s, a) => s + (data.balances[a.id] ?? 0), 0);
  const byType = ["cash", "bank", "mobile"].map((t) => ({ type: t, value: data.accounts.filter((a) => a.type === t).reduce((s, a) => s + (data.balances[a.id] ?? 0), 0) }));

  // 12-month series
  const months = useMemo(() => last12Months(), []);
  const series = useMemo(() => months.map((m) => {
    const rows = data.txns.filter((t) => t.txn_date.startsWith(m.key));
    return { ...m, income: sum(rows.filter((t) => t.type === "income")), expense: sum(rows.filter((t) => t.type === "expense")) };
  }), [data.txns, months]);
  const maxBar = Math.max(1, ...series.flatMap((s) => [s.income, s.expense]));
  const recent = data.txns.slice(0, 10);
  const share = inc + exp > 0 ? Math.round((inc / (inc + exp)) * 100) : 0;

  return (
    <div className="space-y-5">
      {!data.ready && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Finance heads aren&apos;t set up yet — run <b>supabase/migrations/0033_finance_heads.sql</b> in the Supabase SQL Editor, then reload.
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-fg-muted">Showing <b className="text-fg">{range.label}</b> · {inRange.length} entr{inRange.length === 1 ? "y" : "ies"}</p>
        <select value={period} onChange={(e) => setPeriod(e.target.value as Period)} className={selectCls}>
          {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Income" value={compact(inc)} sub={`${income.length} entr${income.length === 1 ? "y" : "ies"} · ${incHeads.length} head${incHeads.length === 1 ? "" : "s"}`} icon={TrendingUp} tone="success" />
        <StatCard label="Expense" value={compact(exp)} sub={`${expense.length} entr${expense.length === 1 ? "y" : "ies"} · ${expHeads.length} head${expHeads.length === 1 ? "" : "s"}`} icon={TrendingDown} tone="danger" />
        <StatCard label={net >= 0 ? "Net surplus" : "Net deficit"} value={compact(Math.abs(net))} sub={net >= 0 ? "income − expense" : "expense exceeded income"} icon={Scale} tone={net >= 0 ? "info" : "warning"} />
        <StatCard label="Bank & cash" value={compact(position)} sub={`${data.accounts.length} account${data.accounts.length === 1 ? "" : "s"} · all time`} icon={Landmark} tone="neutral" />
      </div>

      {/* 12-month chart + split */}
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-bg p-4 lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-fg">Income vs expense <span className="text-[11px] font-normal text-fg-faint">· last 12 months</span></p>
            <div className="flex items-center gap-3 text-[11px] font-semibold"><span className="flex items-center gap-1 text-emerald-600"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Income</span><span className="flex items-center gap-1 text-brand-red-dark"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-brand-red" /> Expense</span></div>
          </div>
          <div className="flex h-40 items-end gap-2">
            {series.map((s, i) => (
              <div key={s.key} className="group relative flex h-full flex-1 items-end justify-center gap-0.5" title={`${s.label}: income ${taka(s.income)} · expense ${taka(s.expense)}`}>
                <div className="w-1/2 rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400 transition-[height] duration-700" style={{ height: mounted ? `${Math.max(s.income > 0 ? 3 : 0, (s.income / maxBar) * 100)}%` : "0%", transitionDelay: `${i * 40}ms` }} />
                <div className="w-1/2 rounded-t bg-gradient-to-t from-brand-red to-red-400 transition-[height] duration-700" style={{ height: mounted ? `${Math.max(s.expense > 0 ? 3 : 0, (s.expense / maxBar) * 100)}%` : "0%", transitionDelay: `${i * 40 + 20}ms` }} />
                <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-fg px-1.5 py-0.5 text-[9px] font-semibold text-bg opacity-0 transition-opacity group-hover:opacity-100">{compact(s.income)} / {compact(s.expense)}</span>
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex gap-2">{series.map((s) => <span key={s.key} className="flex-1 text-center text-[9px] text-fg-faint">{s.label}</span>)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-bg p-4">
          <p className="mb-3 text-sm font-bold text-fg">This period</p>
          <div className="flex items-center justify-around">
            <Donut mounted={mounted} pct={share} color="#10b981" label="Income share" a={compact(inc)} b={`vs ${compact(exp)} out`} />
            <div className="space-y-2">
              {byType.map((b) => (
                <div key={b.type} className="flex items-center justify-between gap-4 text-xs">
                  <span className="text-fg-muted">{accountTypeLabel(b.type)}</span>
                  <span className="font-bold tabular-nums text-fg">{compact(b.value)}</span>
                </div>
              ))}
              <Link href="/dashboard/finance/bank" className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-blue hover:underline">Bank &amp; Cash <ArrowRight className="h-3 w-3" /></Link>
            </div>
          </div>
        </div>
      </div>

      {/* head breakdowns */}
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-bg p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm font-bold text-fg"><Tag className="h-4 w-4 text-emerald-600" /> Income by head</p>
            <Link href="/dashboard/finance/income" className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-blue hover:underline">Open ledger <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <BarList mounted={mounted} rows={incHeads} color="#10b981" total={inc} empty="No income in this period." />
          <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5 text-sm"><span className="font-semibold text-fg-muted">Total income</span><span className="font-extrabold tabular-nums text-emerald-700">{taka(inc)}</span></div>
        </div>
        <div className="rounded-2xl border border-border bg-bg p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm font-bold text-fg"><Tag className="h-4 w-4 text-brand-red" /> Expense by head</p>
            <Link href="/dashboard/finance/expense" className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-blue hover:underline">Open ledger <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <BarList mounted={mounted} rows={expHeads} color="#e11924" total={exp} empty="No expense in this period." />
          <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5 text-sm"><span className="font-semibold text-fg-muted">Total expense</span><span className="font-extrabold tabular-nums text-brand-red-dark">{taka(exp)}</span></div>
        </div>
      </div>

      {/* latest entries */}
      <div className="rounded-2xl border border-border bg-bg">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <p className="flex items-center gap-1.5 text-sm font-bold text-fg"><Clock className="h-4 w-4 text-brand-blue" /> Latest entries</p>
          <span className="text-[11px] text-fg-faint">newest 10 · all time</span>
        </div>
        {recent.length === 0 ? <p className="px-4 py-10 text-center text-sm text-fg-muted">Nothing recorded yet — start from Income or Expense.</p> : (
          <ul className="divide-y divide-border/60">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${t.type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-brand-red-tint text-brand-red-dark"}`}>{t.type === "income" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-fg">{txnHead(t)}{t.party ? <span className="font-normal text-fg-muted"> · {t.party}</span> : null}</p>
                  <p className="text-[11px] text-fg-faint">{fmtDate(t.txn_date)}{t.account_id ? ` · ${accName.get(t.account_id) ?? ""}` : ""}{t.created_by_name ? ` · by ${t.created_by_name}` : ""}</p>
                </div>
                <span className={`shrink-0 font-bold tabular-nums ${t.type === "income" ? "text-emerald-600" : "text-brand-red-dark"}`}>{t.type === "income" ? "+" : "−"}{taka(t.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
