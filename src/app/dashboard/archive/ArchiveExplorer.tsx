"use client";

/** Archive center — Users / Projects / Transactions in one recycle bin.
 *  Everything here is soft-deleted, waits 30 days (auto-purged lazily on
 *  page load), and restores in one click. The hero mirrors the dashboard's
 *  look: stat cards, a mix donut and an expiry "tower" chart. */

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Archive, Users, Building2, ReceiptText, RotateCcw, Trash2, Loader2, Search,
  ChevronLeft, ChevronRight, Hourglass, Wallet,
} from "lucide-react";
import { StatCard } from "@/components/admin/ui";
import { fmtDate, localPhone } from "@/app/dashboard/investments/users/shared";
import {
  restorePerson, purgePerson, restoreHubHolding, purgeHubHolding,
  restoreArchivedTxn, purgeArchivedTxn,
  type ArchiveData, type ArchiveUserRow, type ArchivedHoldingRow, type ArchivedTxnRow,
} from "@/app/actions/hub";
import { TypeConfirm } from "@/app/dashboard/projects/AllCustomersExplorer";
import { toast } from "@/components/ui/Toast";

const fmt = (n: number) => "৳" + Math.round(Number(n) || 0).toLocaleString("en-IN");
const compact = (n: number) => {
  n = Number(n) || 0;
  if (n >= 1e7) return "৳" + (n / 1e7).toFixed(2).replace(/\.?0+$/, "") + " Cr";
  if (n >= 1e5) return "৳" + (n / 1e5).toFixed(2).replace(/\.?0+$/, "") + " L";
  return fmt(n);
};

type Tab = "users" | "projects" | "transactions";
type SortKey = "deleted" | "expiry" | "amount";

export default function ArchiveExplorer({ data }: { data: ArchiveData }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("users");
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("deleted");
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [purgeTarget, setPurgeTarget] = useState<{ tab: Tab; id: string; name: string; detail: string } | null>(null);
  const [purgeErr, setPurgeErr] = useState<string | null>(null);
  useEffect(() => setMounted(true), []);

  const usersValue = data.users.reduce((s, u) => s + u.balance, 0);
  const holdingsValue = data.holdings.reduce((s, h) => s + h.value, 0);
  const txnsValue = data.txns.reduce((s, t) => s + t.amount, 0);
  const totalItems = data.users.length + data.holdings.length + data.txns.length;

  // expiry "tower" — how much of the bin empties in each 5-day window
  const buckets = useMemo(() => {
    const b = [
      { label: "≤ 5d", from: -99, to: 5, count: 0 },
      { label: "6–10d", from: 6, to: 10, count: 0 },
      { label: "11–15d", from: 11, to: 15, count: 0 },
      { label: "16–20d", from: 16, to: 20, count: 0 },
      { label: "21–25d", from: 21, to: 25, count: 0 },
      { label: "26–30d", from: 26, to: 99, count: 0 },
    ];
    const all = [...data.users.map((u) => u.daysLeft), ...data.holdings.map((h) => h.daysLeft), ...data.txns.map((t) => t.daysLeft)];
    for (const d of all) { const hit = b.find((x) => d >= x.from && d <= x.to); if (hit) hit.count++; }
    return b;
  }, [data]);
  const maxBucket = Math.max(1, ...buckets.map((b) => b.count));

  // filter + sort per tab
  const term = q.trim().toLowerCase();
  const users = useMemo(() => sortRows(
    data.users.filter((u) => !term || `${u.name} ${u.mobile ?? ""} ${u.fid ?? ""} ${u.uid}`.toLowerCase().includes(term)),
    sortKey, (u) => u.deletedAt, (u) => u.daysLeft, (u) => u.balance,
  ), [data.users, term, sortKey]);
  const holdings = useMemo(() => sortRows(
    data.holdings.filter((h) => !term || `${h.name} ${h.mobile ?? ""} ${h.file_no ?? ""} ${h.project_name}`.toLowerCase().includes(term)),
    sortKey, (h) => h.deletedAt, (h) => h.daysLeft, (h) => h.value,
  ), [data.holdings, term, sortKey]);
  const txns = useMemo(() => sortRows(
    data.txns.filter((t) => !term || `${t.customer_name} ${t.project_name ?? ""} ${t.kind} ${t.amount}`.toLowerCase().includes(term)),
    sortKey, (t) => t.deletedAt, (t) => t.daysLeft, (t) => t.amount,
  ), [data.txns, term, sortKey]);

  const list = tab === "users" ? users : tab === "projects" ? holdings : txns;
  const pageCount = Math.max(1, Math.ceil(list.length / perPage));
  const curPage = Math.min(page, pageCount);
  const pageRows = list.slice((curPage - 1) * perPage, curPage * perPage);

  function switchTab(t: Tab) { setTab(t); setPage(1); }

  function run(fn: () => Promise<{ ok: boolean; message?: string; error?: string }>, id: string) {
    setBusy(id);
    start(async () => {
      const r = await fn();
      setBusy(null);
      if (r.ok) { toast(r.message || "Done.", "success"); setPurgeTarget(null); setPurgeErr(null); router.refresh(); }
      else setPurgeErr(r.error ?? "Failed.");
    });
  }
  function restore(id: string) {
    if (tab === "users") run(() => restorePerson(id), id);
    else if (tab === "projects") run(() => restoreHubHolding(id), id);
    else run(() => restoreArchivedTxn(id), id);
  }
  function purge(t: { tab: Tab; id: string }) {
    if (t.tab === "users") run(() => purgePerson(t.id), t.id);
    else if (t.tab === "projects") { const h = data.holdings.find((x) => x.id === t.id); run(() => purgeHubHolding(t.id, h?.project_key ?? ""), t.id); }
    else run(() => purgeArchivedTxn(t.id), t.id);
  }

  const daysChip = (d: number) => (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${d <= 7 ? "bg-brand-red-tint text-brand-red-dark" : "bg-amber-500/15 text-amber-600"}`}>{d} days left</span>
  );
  const restoreBtn = (id: string) => (
    <button type="button" onClick={() => restore(id)} disabled={pending} className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-bg px-3 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/10 disabled:opacity-50">
      {busy === id && pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Restore
    </button>
  );
  const deleteBtn = (id: string, name: string, detail: string) => (
    <button type="button" onClick={() => { setPurgeErr(null); setPurgeTarget({ tab, id, name, detail }); }} disabled={pending} title="Delete instantly — no restore" className="inline-flex items-center gap-1.5 rounded-xl border border-brand-red/40 bg-bg px-3 py-2 text-sm font-semibold text-brand-red-dark transition-colors hover:bg-brand-red-tint disabled:opacity-50">
      <Trash2 className="h-4 w-4" /> Delete
    </button>
  );

  // donut segments (Users / Projects / Transactions)
  const segs = [
    { n: data.users.length, color: "#1847a1", label: "Users" },
    { n: data.holdings.length, color: "#f59e0b", label: "Projects" },
    { n: data.txns.length, color: "#e11924", label: "Transactions" },
  ];
  const segTotal = Math.max(1, totalItems);
  const R = 30, C = 2 * Math.PI * R;
  let acc = 0;

  return (
    <div className="space-y-5">
      {/* hero stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="In the bin" value={totalItems.toLocaleString("en-IN")} sub="every item waits 30 days" icon={Archive} tone="warning" />
        <StatCard label="Users" value={data.users.length.toLocaleString("en-IN")} sub={`${compact(usersValue)} balance parked`} icon={Users} tone="info" />
        <StatCard label="Project holdings" value={data.holdings.length.toLocaleString("en-IN")} sub={`${compact(holdingsValue)} value parked`} icon={Building2} tone="info" />
        <StatCard label="Transactions" value={data.txns.length.toLocaleString("en-IN")} sub={data.txnsReady ? `${compact(txnsValue)} parked` : "needs migration 0031"} icon={ReceiptText} tone="neutral" />
      </div>

      {/* mix donut + expiry towers */}
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-bg p-4">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-fg"><Archive className="h-4 w-4 text-amber-500" /> What&apos;s inside</p>
          <div className="flex items-center justify-around gap-3">
            <div className="relative" style={{ width: 96, height: 96 }}>
              <svg viewBox="0 0 80 80" width={96} height={96} className="-rotate-90">
                <circle cx="40" cy="40" r={R} fill="none" stroke="var(--color-border)" strokeWidth="9" />
                {segs.map((s) => {
                  const frac = s.n / segTotal;
                  const el = (
                    <circle key={s.label} cx="40" cy="40" r={R} fill="none" stroke={s.color} strokeWidth="9" strokeLinecap="butt"
                      strokeDasharray={`${mounted ? frac * C : 0} ${C}`} strokeDashoffset={-acc * C}
                      style={{ transition: "stroke-dasharray 1.1s cubic-bezier(.22,1,.36,1)" }} />
                  );
                  acc += frac;
                  return el;
                })}
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center">
                <div><div className="text-lg font-extrabold tabular-nums text-fg">{totalItems}</div><div className="-mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-fg-faint">items</div></div>
              </div>
            </div>
            <div className="space-y-1.5">
              {segs.map((s) => (
                <div key={s.label} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-fg-muted">{s.label}</span>
                  <span className="font-bold tabular-nums text-fg">{s.n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-bg p-4 lg:col-span-2">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-fg"><Hourglass className="h-4 w-4 text-brand-blue" /> Time left before auto-delete <span className="text-[11px] font-normal text-fg-faint">(items per window)</span></p>
          <div className="flex h-32 items-end justify-around gap-3 px-2">
            {buckets.map((b) => (
              <div key={b.label} className="flex h-full w-full max-w-[90px] flex-col items-center justify-end gap-1">
                <span className="text-xs font-bold tabular-nums text-fg">{b.count || ""}</span>
                <div
                  className="w-full rounded-t-lg transition-all duration-1000 ease-out"
                  style={{
                    height: mounted ? `${Math.max(b.count ? 8 : 2, (b.count / maxBucket) * 100)}%` : "2%",
                    background: b.to <= 5 ? "linear-gradient(180deg,#e11924,#f87171)" : "linear-gradient(180deg,#1847a1,#93b4e8)",
                    opacity: b.count ? 1 : 0.25,
                  }}
                />
                <span className="text-[10px] font-semibold text-fg-faint">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* tabs */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-2xl border border-border bg-bg p-1 shadow-sm">
          {([["users", "Users", data.users.length], ["projects", "Projects", data.holdings.length], ["transactions", "Transactions", data.txns.length]] as [Tab, string, number][]).map(([t, label, n]) => (
            <button key={t} onClick={() => switchTab(t)} className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${tab === t ? "bg-brand-blue text-white shadow-[var(--shadow-brand)]" : "text-fg-muted hover:text-fg"}`}>
              {label} <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${tab === t ? "bg-white/20" : "bg-bg-soft"}`}>{n}</span>
            </button>
          ))}
        </div>
      </div>

      {/* controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2">
          <Search className="h-4 w-4 text-fg-faint" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search name, mobile, file, project…" className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-faint" />
        </div>
        <select value={sortKey} onChange={(e) => { setSortKey(e.target.value as SortKey); setPage(1); }} className="rounded-xl border border-border bg-bg px-3 py-2 text-sm font-medium text-fg">
          <option value="deleted">Newest deleted first</option>
          <option value="expiry">Expiring soonest first</option>
          <option value="amount">Biggest amount first</option>
        </select>
        <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} className="rounded-xl border border-border bg-bg px-3 py-2 text-sm font-medium text-fg">
          <option value={10}>10 / page</option>
          <option value={25}>25 / page</option>
          <option value={50}>50 / page</option>
        </select>
        <span className="text-sm tabular-nums text-fg-muted">{list.length} item{list.length !== 1 ? "s" : ""}</span>
      </div>

      {/* list */}
      <div className="overflow-hidden rounded-2xl border border-amber-400/40 bg-bg">
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-amber-500/10 px-4 py-3">
          <Archive className="h-4 w-4 text-amber-600" />
          <h3 className="text-sm font-bold text-fg">{tab === "users" ? "Deleted users" : tab === "projects" ? "Deleted project holdings" : "Deleted transactions"}</h3>
          <span className="text-xs text-fg-muted">restore brings everything back exactly as it was · 30 days, then gone for good</span>
        </div>

        {tab === "transactions" && !data.txnsReady ? (
          <p className="px-4 py-12 text-center text-sm text-fg-muted">The transaction recycle bin needs migration <span className="font-mono font-bold">0031_archived_transactions.sql</span> — run it in the Supabase SQL editor and reload. Until then, deleting a transaction stays instant (no archive copy).</p>
        ) : pageRows.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-fg-muted">{term ? "Nothing here matches the search." : "This bin is empty — deleted items will wait here for 30 days."}</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {tab === "users" && (pageRows as ArchiveUserRow[]).map((a) => (
              <li key={a.uid} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-fg">{a.name}</p>
                  <p className="text-[11px] text-fg-muted">{localPhone(a.mobile)}{a.fid ? ` · File ${a.fid}` : ""} · {a.uid} · deleted {fmtDate(a.deletedAt.slice(0, 10))}</p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-fg">{fmt(a.balance)}</span>
                {daysChip(a.daysLeft)}
                {restoreBtn(a.uid)}
                {deleteBtn(a.uid, a.name, "account, book rows, payments, transactions and app login")}
              </li>
            ))}
            {tab === "projects" && (pageRows as ArchivedHoldingRow[]).map((h) => (
              <li key={h.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-fg">{h.name} <span className="ml-1 rounded-full bg-brand-blue-tint px-2 py-0.5 text-[10px] font-bold text-brand-blue">{h.project_name}</span></p>
                  <p className="text-[11px] text-fg-muted">{localPhone(h.mobile)}{h.file_no ? ` · File ${h.file_no}` : ""} · paid {fmt(h.paid)} · deleted {fmtDate(h.deletedAt.slice(0, 10))}</p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-fg">{fmt(h.value)}</span>
                {daysChip(h.daysLeft)}
                {restoreBtn(h.id)}
                {deleteBtn(h.id, `${h.name} — ${h.project_name}`, "holding and its whole payment ledger")}
              </li>
            ))}
            {tab === "transactions" && (pageRows as ArchivedTxnRow[]).map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-fg">{t.customer_name}{t.project_name ? <span className="ml-1.5 rounded-full bg-brand-blue-tint px-2 py-0.5 text-[10px] font-bold text-brand-blue">{t.project_name}</span> : null}</p>
                  <p className="text-[11px] text-fg-muted">{t.kind}{t.txnDate ? ` · dated ${fmtDate(t.txnDate.slice(0, 10))}` : ""} · deleted {fmtDate(t.deletedAt.slice(0, 10))}</p>
                </div>
                <span className={`text-sm font-bold tabular-nums ${t.kind === "withdrawal" ? "text-brand-red" : "text-brand-blue"}`}>{t.kind === "withdrawal" ? "−" : "+"}{fmt(t.amount)}</span>
                {daysChip(t.daysLeft)}
                {restoreBtn(t.id)}
                {deleteBtn(t.id, `${t.customer_name} — ${fmt(t.amount)}`, "archived transaction copy")}
              </li>
            ))}
          </ul>
        )}

        {list.length > 0 && (tab !== "transactions" || data.txnsReady) && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-sm">
            <p className="tabular-nums text-fg-muted">Showing <b className="text-fg">{(curPage - 1) * perPage + 1}–{Math.min(curPage * perPage, list.length)}</b> of <b className="text-fg">{list.length}</b></p>
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

      <p className="flex items-center gap-1.5 text-xs text-fg-faint"><Wallet className="h-3.5 w-3.5" /> Restoring puts the money back on every page — the book, All Customers and the member&apos;s app all agree again.</p>

      {purgeTarget && (
        <TypeConfirm
          kind="purge"
          name={purgeTarget.name}
          message={`“${purgeTarget.name}” will be erased PERMANENTLY — the ${purgeTarget.detail}. This is an instant delete: there is NO restore after this. Be sure.`}
          pending={pending && busy === purgeTarget.id}
          err={purgeErr}
          onCancel={() => { if (!pending) { setPurgeTarget(null); setPurgeErr(null); } }}
          onConfirm={() => purge(purgeTarget)}
        />
      )}
    </div>
  );
}

function sortRows<T>(rows: T[], key: SortKey, deleted: (r: T) => string, days: (r: T) => number, amount: (r: T) => number): T[] {
  return [...rows].sort((a, b) =>
    key === "deleted" ? deleted(b).localeCompare(deleted(a)) : key === "expiry" ? days(a) - days(b) : amount(b) - amount(a));
}
