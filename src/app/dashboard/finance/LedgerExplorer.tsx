"use client";

/** Income / Expense ledger — one explorer, two kinds. Stat cards, head
 *  breakdown bars, search + head/account/period filters, sortable table with
 *  pagination, CSV export, and the add / edit entry modal (heads picker with
 *  "+ new head" and the "Others → what exactly" rule). */

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, Pencil, Trash2, Loader2, Download, ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, CalendarRange, Hash, Crown, Tag, Landmark, Save,
} from "lucide-react";
import { StatCard } from "@/components/admin/ui";
import { toast } from "@/components/ui/Toast";
import { confirmDialog } from "@/components/ui/Dialog";
import type { FinanceData, FinHead, FinKind, FinTxn } from "@/lib/finance";
import { addEntry, updateEntry, deleteEntry, type EntryInput } from "@/app/actions/finance";
import { taka, compact, fmtDate, todayIso, headLabel, txnHead, METHODS, PERIODS, periodRange, inPeriod, type Period, inputCls, labelCls, selectCls, Modal, BarList, byHead } from "./_ui";

type SortKey = "date" | "head" | "party" | "account" | "amount" | "by";

export default function LedgerExplorer({ kind, data, canManageHeads }: { kind: FinKind; data: FinanceData; canManageHeads: boolean }) {
  const router = useRouter();
  const isIncome = kind === "income";
  const color = isIncome ? "#10b981" : "#e11924";
  const all = useMemo(() => data.txns.filter((t) => t.type === kind), [data.txns, kind]);
  const heads = useMemo(() => data.heads.filter((h) => h.kind === kind), [data.heads, kind]);
  const accName = useMemo(() => new Map(data.accounts.map((a) => [a.id, a.name])), [data.accounts]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 40); return () => clearTimeout(t); }, []);

  const [period, setPeriod] = useState<Period>("month");
  const [q, setQ] = useState("");
  const [head, setHead] = useState("all");
  const [account, setAccount] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [asc, setAsc] = useState(false);
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<FinTxn | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  useEffect(() => { setPage(1); }, [q, head, account, period, perPage]);

  const range = useMemo(() => periodRange(period), [period]);
  const inRange = useMemo(() => all.filter((t) => inPeriod(t, range)), [all, range]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const r = inRange.filter((t) => {
      if (head !== "all" && t.category !== head) return false;
      if (account !== "all" && (t.account_id ?? "none") !== account) return false;
      if (!term) return true;
      return `${t.category} ${t.head_detail ?? ""} ${t.party ?? ""} ${t.reference ?? ""} ${t.description ?? ""} ${t.method ?? ""} ${accName.get(t.account_id ?? "") ?? ""} ${t.created_by_name ?? ""}`.toLowerCase().includes(term);
    });
    return [...r].sort((a, b) => {
      let d = 0;
      if (sortKey === "date") d = a.txn_date.localeCompare(b.txn_date) || a.created_at.localeCompare(b.created_at);
      else if (sortKey === "head") d = txnHead(a).localeCompare(txnHead(b));
      else if (sortKey === "party") d = (a.party ?? "").localeCompare(b.party ?? "");
      else if (sortKey === "account") d = (accName.get(a.account_id ?? "") ?? "").localeCompare(accName.get(b.account_id ?? "") ?? "");
      else if (sortKey === "amount") d = a.amount - b.amount;
      else if (sortKey === "by") d = (a.created_by_name ?? "").localeCompare(b.created_by_name ?? "");
      return asc ? d : -d;
    });
  }, [inRange, q, head, account, sortKey, asc, accName]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const curPage = Math.min(page, pageCount);
  const start = (curPage - 1) * perPage;
  const pageRows = filtered.slice(start, start + perPage);

  const sum = (rows: FinTxn[]) => rows.reduce((s, t) => s + t.amount, 0);
  const periodTotal = sum(inRange);
  const shownTotal = sum(filtered);
  const monthTotal = sum(all.filter((t) => inPeriod(t, periodRange("month"))));
  const breakdown = useMemo(() => byHead(inRange), [inRange]);
  const topHead = breakdown[0];

  const setSort = (k: SortKey) => { if (sortKey === k) setAsc((v) => !v); else { setSortKey(k); setAsc(k === "head" || k === "party" || k === "by"); } };
  const SortH = ({ k, label, right }: { k: SortKey; label: string; right?: boolean }) => (
    <button onClick={() => setSort(k)} className={`inline-flex items-center gap-1 ${right ? "justify-end" : ""} font-bold uppercase tracking-wide hover:text-brand-blue`}>
      {sortKey === k ? (asc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />} {label}
    </button>
  );

  async function remove(t: FinTxn) {
    const ok = await confirmDialog({ title: `Delete this ${kind}?`, message: `${taka(t.amount)} · ${txnHead(t)} · ${fmtDate(t.txn_date)}${t.party ? ` · ${t.party}` : ""}. This removes it from the ledger and the account balance. There is no undo.`, confirmText: "Delete" });
    if (!ok) return;
    setDeletingId(t.id);
    const r = await deleteEntry(t.id);
    setDeletingId(null);
    if (r.ok) { toast(r.message || "Deleted.", "success"); router.refresh(); } else toast(r.error, "error");
  }

  function exportCsv() {
    const headRow = ["#", "Date", "Head", "Detail", "Party", "Account", "Method", "Reference", "Description", "Amount", "Recorded by"];
    const lines = [headRow.join(",")];
    filtered.forEach((t, i) => {
      const cells = [i + 1, t.txn_date, t.category, t.head_detail ?? "", t.party ?? "", accName.get(t.account_id ?? "") ?? "", t.method ?? "", t.reference ?? "", t.description ?? "", Math.round(t.amount), t.created_by_name ?? ""];
      lines.push(cells.map((x) => `"${String(x ?? "").replace(/"/g, '""')}"`).join(","));
    });
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const u = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = `${kind}-${range.label.replace(/\s+/g, "-")}.csv`; a.click(); URL.revokeObjectURL(u);
  }

  const Icon = isIncome ? TrendingUp : TrendingDown;
  const headOptions = useMemo(() => [...new Set(inRange.map((t) => t.category))].sort(), [inRange]);

  return (
    <div className="space-y-5">
      {!data.ready && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Finance heads aren&apos;t set up yet — run <b>supabase/migrations/0033_finance_heads.sql</b> in the Supabase SQL Editor, then reload.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={`${isIncome ? "Income" : "Expense"} · ${range.label}`} value={compact(periodTotal)} sub={`${inRange.length} entr${inRange.length === 1 ? "y" : "ies"}`} icon={Icon} tone={isIncome ? "success" : "danger"} />
        <StatCard label="This month" value={compact(monthTotal)} sub={periodRange("month").label} icon={CalendarRange} tone="info" />
        <StatCard label="Top head" value={topHead ? topHead.label : "—"} sub={topHead ? `${compact(topHead.value)} · ${topHead.count} entr${topHead.count === 1 ? "y" : "ies"}` : "no entries in this period"} icon={Crown} tone="warning" />
        <StatCard label="All time" value={compact(sum(all))} sub={`${all.length} entries · ${heads.filter((h) => h.is_active).length} heads`} icon={Hash} tone="neutral" />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-bg p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm font-bold text-fg"><Tag className="h-4 w-4" style={{ color }} /> By head <span className="text-[11px] font-normal text-fg-faint">({range.label})</span></p>
            <span className="text-sm font-extrabold tabular-nums text-fg">{taka(periodTotal)}</span>
          </div>
          <BarList mounted={mounted} rows={breakdown.slice(0, 10)} color={color} total={periodTotal} empty={`No ${kind} in this period.`} />
          {breakdown.length > 10 && <p className="mt-2 text-[11px] text-fg-faint">+{breakdown.length - 10} more heads — filter the table below to see each.</p>}
        </div>
        <div className="rounded-2xl border border-border bg-bg p-4">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-fg"><Landmark className="h-4 w-4 text-brand-blue" /> By account</p>
          <BarList mounted={mounted} color="#1847A1" total={periodTotal} empty="Nothing in this period."
            rows={(() => { const m = new Map<string, { value: number; count: number }>(); for (const t of inRange) { const k = accName.get(t.account_id ?? "") ?? "No account"; const c = m.get(k) ?? { value: 0, count: 0 }; c.value += t.amount; c.count++; m.set(k, c); } return [...m.entries()].map(([label, v]) => ({ label, ...v })).sort((a, b) => b.value - a.value); })()} />
        </div>
      </div>

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-brand-blue/30 bg-brand-blue-tint px-3 py-2.5 text-sm font-bold text-brand-blue">
          {total.toLocaleString("en-IN")} <span className="font-medium text-brand-blue/70">of {inRange.length}</span>
          <span className="ml-1 border-l border-brand-blue/20 pl-2 tabular-nums">{taka(shownTotal)}</span>
        </span>
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search head, party, reference, note…" className="w-full rounded-xl border border-border bg-bg py-2.5 pl-9 pr-3 text-sm text-fg outline-none focus:border-brand-blue/50" />
        </div>
        <select value={period} onChange={(e) => setPeriod(e.target.value as Period)} className={selectCls}>
          {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select value={head} onChange={(e) => setHead(e.target.value)} className={selectCls}>
          <option value="all">All heads</option>
          {headOptions.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
        <select value={account} onChange={(e) => setAccount(e.target.value)} className={selectCls}>
          <option value="all">All accounts</option>
          {data.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          <option value="none">No account</option>
        </select>
        <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className={selectCls}>
          {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
        </select>
        <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-semibold text-fg hover:border-brand-blue/40 hover:text-brand-blue"><Download className="h-4 w-4" /> CSV</button>
        <button onClick={() => setAdding(true)} disabled={!data.ready} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark disabled:opacity-50"><Plus className="h-4 w-4" /> Add {kind}</button>
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-bg">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-bg-soft/95 backdrop-blur">
              <tr className="border-b border-border">
                <th className="w-10 px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-fg-muted">#</th>
                <th className="px-3 py-2.5 text-left text-[11px] text-fg-muted"><SortH k="date" label="Date" /></th>
                <th className="px-3 py-2.5 text-left text-[11px] text-fg-muted"><SortH k="head" label="Head" /></th>
                <th className="px-3 py-2.5 text-left text-[11px] text-fg-muted"><SortH k="party" label={isIncome ? "From" : "Paid to"} /></th>
                <th className="px-3 py-2.5 text-left text-[11px] text-fg-muted"><SortH k="account" label="Account" /></th>
                <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-fg-muted">Ref / method</th>
                <th className="px-3 py-2.5 text-right text-[11px] text-fg-muted"><SortH k="amount" label="Amount" right /></th>
                <th className="px-3 py-2.5 text-left text-[11px] text-fg-muted"><SortH k="by" label="By" /></th>
                <th className="px-3 py-2.5 text-right text-[11px] font-bold uppercase tracking-wide text-fg-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr><td colSpan={9} className="px-3 py-12 text-center text-sm text-fg-muted">{all.length === 0 ? `No ${kind} recorded yet — add the first one.` : "Nothing matches these filters."}</td></tr>
              ) : pageRows.map((t, i) => (
                <tr key={t.id} className="border-b border-border/60 align-top transition-colors hover:bg-bg-soft/50">
                  <td className="px-3 py-3 text-fg-faint">{start + i + 1}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-fg">{fmtDate(t.txn_date)}</td>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-fg">{t.category}</p>
                    {t.head_detail && <p className="text-[11px] text-fg-muted">{t.head_detail}</p>}
                    {t.description && <p className="mt-0.5 max-w-xs truncate text-[11px] italic text-fg-faint" title={t.description}>{t.description}</p>}
                  </td>
                  <td className="px-3 py-3 text-fg">{t.party || <span className="text-fg-faint">—</span>}</td>
                  <td className="px-3 py-3 text-fg-muted">{accName.get(t.account_id ?? "") ?? <span className="text-fg-faint">—</span>}</td>
                  <td className="px-3 py-3 text-xs text-fg-muted">{[t.method, t.reference].filter(Boolean).join(" · ") || <span className="text-fg-faint">—</span>}</td>
                  <td className={`whitespace-nowrap px-3 py-3 text-right font-bold tabular-nums ${isIncome ? "text-emerald-600" : "text-brand-red-dark"}`}>{isIncome ? "+" : "−"}{taka(t.amount)}</td>
                  <td className="px-3 py-3 text-xs text-fg-muted">{t.created_by_name || "—"}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => setEditing(t)} title="Edit" className="grid h-8 w-8 place-items-center rounded-lg border border-border text-fg-faint transition-colors hover:border-brand-blue/40 hover:text-brand-blue"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => remove(t)} disabled={deletingId === t.id} title="Delete" className="grid h-8 w-8 place-items-center rounded-lg border border-border text-fg-faint transition-colors hover:border-brand-red/40 hover:text-brand-red disabled:opacity-40">{deletingId === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {pageRows.length > 0 && (
              <tfoot>
                <tr className="bg-bg-soft/70">
                  <td colSpan={6} className="px-3 py-2.5 text-right text-xs font-semibold text-fg-muted">Total of {total} shown</td>
                  <td className={`px-3 py-2.5 text-right font-extrabold tabular-nums ${isIncome ? "text-emerald-700" : "text-brand-red-dark"}`}>{taka(shownTotal)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2.5 text-sm">
          <p className="text-fg-muted">Showing <b className="text-fg">{total === 0 ? 0 : start + 1}–{Math.min(start + perPage, total)}</b> of <b className="text-fg">{total}</b></p>
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
      </div>

      {(adding || editing) && (
        <EntryModal kind={kind} heads={heads} accounts={data.accounts} entry={editing} canManageHeads={canManageHeads} onClose={() => { setAdding(false); setEditing(null); }} />
      )}
    </div>
  );
}

/** Add / edit one entry. Head picker: active heads for this ledger, "+ New
 *  head…" (admin) and the "Others → what exactly" rule. */
export function EntryModal({ kind, heads, accounts, entry, canManageHeads, onClose }: {
  kind: FinKind; heads: FinHead[]; accounts: FinanceData["accounts"]; entry: FinTxn | null; canManageHeads: boolean; onClose: () => void;
}) {
  const router = useRouter();
  const editing = !!entry;
  const active = heads.filter((h) => h.is_active || h.id === entry?.head_id);
  const NEW = "__new__";
  const [headId, setHeadId] = useState(entry?.head_id ?? active.find((h) => !/^others?$/i.test(h.name))?.id ?? "");
  const [newHead, setNewHead] = useState("");
  const [detail, setDetail] = useState(entry?.head_detail ?? "");
  const [amount, setAmount] = useState(entry ? String(entry.amount) : "");
  const [date, setDate] = useState(entry?.txn_date ?? todayIso());
  const [accountId, setAccountId] = useState(entry?.account_id ?? accounts[0]?.id ?? "");
  const [party, setParty] = useState(entry?.party ?? "");
  const [method, setMethod] = useState(entry?.method ?? "Cash");
  const [reference, setReference] = useState(entry?.reference ?? "");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const chosen = active.find((h) => h.id === headId);
  const isOthers = !!chosen && /^others?$/i.test(chosen.name);
  const isNew = headId === NEW;

  function submit() {
    setErr(null);
    if (!(Number(amount) > 0)) return setErr("Amount must be greater than 0.");
    if (isNew && !newHead.trim()) return setErr("Type the new head's name.");
    if (!isNew && !headId) return setErr("Pick a head.");
    if (isOthers && !detail.trim()) return setErr("“Others” needs a short note of what it was.");
    const input: EntryInput = {
      amount: Number(amount), head_id: isNew ? null : headId, newHead: isNew ? { name: newHead } : null,
      head_detail: detail, txn_date: date, account_id: accountId || null, party, method, reference, description,
    };
    start(async () => {
      const r = editing ? await updateEntry(entry!.id, input) : await addEntry(kind, input);
      if (r.ok) { toast(r.message || "Saved.", "success"); router.refresh(); onClose(); } else setErr(r.error);
    });
  }

  return (
    <Modal title={editing ? `Edit ${kind}` : `Add ${kind}`} subtitle={kind === "income" ? "Money in — which head, and where it was deposited" : "Money out — which head, and which account paid"} onClose={onClose}>
      {err && <div className="mb-3 rounded-xl border border-brand-red/30 bg-brand-red-tint px-3 py-2 text-sm text-brand-red-dark">{err}</div>}
      <div className="space-y-3">
        <div>
          <label className={labelCls}>Head *</label>
          <select className={inputCls} value={headId} onChange={(e) => setHeadId(e.target.value)}>
            {active.map((h) => <option key={h.id} value={h.id}>{headLabel(h)}</option>)}
            {canManageHeads && <option value={NEW}>＋ New head…</option>}
          </select>
        </div>
        {isNew && (
          <div className="rounded-xl border border-dashed border-brand-blue/40 bg-brand-blue-tint/40 p-3">
            <label className={labelCls}>New head name *</label><input className={inputCls} value={newHead} onChange={(e) => setNewHead(e.target.value)} placeholder="e.g. Legal fees" autoFocus />
            <p className="mt-1.5 text-[11px] text-fg-muted">Saved to the head list — it will be in the picker for every future entry.</p>
          </div>
        )}
        {(isOthers || detail) && (
          <div><label className={labelCls}>What exactly {isOthers ? "*" : <span className="font-normal normal-case text-fg-faint">(optional)</span>}</label><input className={inputCls} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="e.g. Eid gift for staff" /></div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Amount ৳ *</label><input type="number" min={0} step="any" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" /></div>
          <div><label className={labelCls}>Date *</label><input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>{kind === "income" ? "Deposited to" : "Paid from"}</label>
            <select className={inputCls} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">— no account —</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Method</label>
            <select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value)}>
              {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>{kind === "income" ? "From (client / source)" : "Paid to (vendor / person)"}</label><input className={inputCls} value={party} onChange={(e) => setParty(e.target.value)} placeholder={kind === "income" ? "Customer or source" : "Vendor, staff, landlord…"} /></div>
          <div><label className={labelCls}>Reference</label><input className={inputCls} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Cheque no / TXN id / voucher" /></div>
        </div>
        <div><label className={labelCls}>Description <span className="font-normal normal-case text-fg-faint">(optional)</span></label><textarea rows={2} className={`${inputCls} resize-none`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Anything worth remembering later" /></div>
        {accounts.length === 0 && <p className="text-[11px] text-amber-700">No bank / cash account yet — add one under Finance → Bank &amp; Cash so balances track automatically.</p>}
        <button onClick={submit} disabled={pending} className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark disabled:opacity-60">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {editing ? "Save changes" : `Record ${kind}`}
        </button>
      </div>
    </Modal>
  );
}
