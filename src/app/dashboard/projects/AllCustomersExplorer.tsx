"use client";

/** All Customers — the single unified customer view for Projectify.
 *
 *  Rows are either real hub customers OR live app/investment accounts surfaced
 *  in place (deduped by mobile, never copied into the DB). It keeps every hub
 *  feature (project filter, bio history, payments, reference officer, Add
 *  customer) and layers on the App-Users feature set (health stats, status
 *  filters, verified/active signals, invested/profit/balance, PDF, paging, and
 *  the per-account view / transactions / edit / active-toggle actions). */

import { useEffect, useMemo, useState } from "react";
import {
  Search, Users, BadgeCheck, TrendingUp, Wallet, Download, FileText, Smartphone,
  ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight, Trophy,
  Phone, MapPin, UserCheck, Eye, Pencil, CreditCard, UserPlus,
} from "lucide-react";
import { StatCard } from "@/components/admin/ui";
import { taka, compact, fmtDate, localPhone, initial, avatarTint } from "@/app/dashboard/investments/users/shared";
import type { AppUser, TypeOpt, ProjectOpt } from "@/app/dashboard/investments/users/shared";
import type { UnifiedCustomer, AppStats } from "@/lib/all-customers";
import { HistoryModal, CustomerFormModal, TransactionModal, DeleteBtn, type HubProject } from "./HubCustomerList";
import UserView from "@/app/dashboard/investments/users/UserView";
import UserTxns from "@/app/dashboard/investments/users/UserTxns";
import UserActive from "@/app/dashboard/investments/users/UserActive";
import InvestorEdit from "@/app/dashboard/investments/users/InvestorEdit";
import AddUser from "@/app/dashboard/investments/users/AddUser";

const APP_KEY = "app-users";
const fmt = (n: number) => "৳" + Math.round(Number(n) || 0).toLocaleString("en-IN");
const pdfMoney = (n: number) => "Tk " + Math.round(Number(n) || 0).toLocaleString("en-US");
const firstName = (n: string) => (n || "—").trim().split(/\s+/)[0];

type SortKey = "name" | "paid" | "profit" | "balance" | "joined";
type StatusFilter = "all" | "verified" | "unverified" | "active" | "inactive" | "paying" | "nonpaying";

/** Per-row money semantics: app → invested/profit/balance; deposit → paid/dividend/held; real-estate → paid/—/due.
 *  Deposit "held" = deposits + dividends − withdrawals (money still in the company). */
function money(c: UnifiedCustomer) {
  const paid = c.total_paid;
  if (c.source === "app") return { paid, profit: c.profit ?? 0, hasProfit: true, balance: c.balance, balLabel: "balance" as const };
  if (c.project_type === "deposit") return { paid, profit: c.dividend, hasProfit: true, balance: c.total_paid + c.dividend - c.withdrawn, balLabel: "held" as const };
  return { paid, profit: 0, hasProfit: false, balance: c.total_remaining, balLabel: "due" as const };
}
const rowPaying = (c: UnifiedCustomer) =>
  c.source === "app" ? (c.invested! > 0 || c.profit! > 0 || c.withdrawn > 0 || c.balance !== 0) : c.total_paid > 0;

export default function AllCustomersExplorer({
  rows, projects, appStats, investorTypes, investorProjects, hub,
}: {
  rows: UnifiedCustomer[];
  projects: HubProject[];
  appStats: AppStats;
  investorTypes: TypeOpt[];
  investorProjects: ProjectOpt[];
  hub: { collected: number; customers: number; payers: number; payments: number };
}) {
  const [q, setQ] = useState("");
  const [projFilter, setProjFilter] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("paid");
  const [asc, setAsc] = useState(false);
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [mounted, setMounted] = useState(false);

  // hub-row modal state (app rows use their own self-contained components)
  const [view, setView] = useState<UnifiedCustomer | null>(null);
  const [edit, setEdit] = useState<UnifiedCustomer | null>(null);
  const [txn, setTxn] = useState<UnifiedCustomer | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 40); return () => clearTimeout(t); }, []);
  useEffect(() => { setPage(1); }, [q, status, projFilter, perPage]);

  const hubProjects = useMemo(() => projects.filter((p) => p.key !== APP_KEY), [projects]);
  const custProj = (c: UnifiedCustomer): HubProject => ({ key: c.project_key, name: c.project_name, type: c.project_type, sort: 0 });

  const maxBal = Math.max(1, ...appStats.top.map((t) => t.balance));

  // ── filter + sort ──
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((c) => {
      if (projFilter !== "all" && c.project_key !== projFilter) return false;
      const app = c.source === "app";
      if (status === "verified" && !(app && c.is_verified)) return false;
      if (status === "unverified" && !(app && !c.is_verified)) return false;
      if (status === "active" && !(app && c.is_active)) return false;
      if (status === "inactive" && !(app && !c.is_active)) return false;
      if (status === "paying" && !rowPaying(c)) return false;
      if (status === "nonpaying" && rowPaying(c)) return false;
      if (!term) return true;
      return `${c.name} ${c.file_no ?? ""} ${c.uid ?? ""} ${c.mobile ?? ""} ${c.district ?? ""} ${c.reference ?? ""} ${c.email ?? ""} ${c.project_name}`.toLowerCase().includes(term);
    });
  }, [rows, q, projFilter, status]);

  const sorted = useMemo(() => {
    const dir = asc ? 1 : -1;
    return [...filtered].sort((a, b) => {
      let d = 0;
      if (sortKey === "name") d = a.name.localeCompare(b.name);
      else if (sortKey === "joined") d = (a.joining_date ?? "").localeCompare(b.joining_date ?? "");
      else if (sortKey === "paid") d = a.total_paid - b.total_paid;
      else if (sortKey === "profit") d = money(a).profit - money(b).profit;
      else d = money(a).balance - money(b).balance;
      return d * dir;
    });
  }, [filtered, sortKey, asc]);

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const curPage = Math.min(page, pageCount);
  const start = (curPage - 1) * perPage;
  const pageRows = sorted.slice(start, start + perPage);

  const setSort = (k: SortKey) => { if (sortKey === k) setAsc((v) => !v); else { setSortKey(k); setAsc(false); } };

  // ── exports (over the current filtered + sorted set) ──
  function exportCsv() {
    const head = ["#", "Name", "Source", "File/UID", "Mobile", "District", "Reference", "Paid", "Profit", "Balance/Due", "Verified", "Active", "Joined"];
    const lines = [head.join(",")];
    sorted.forEach((c, i) => {
      const m = money(c);
      const cells = [
        i + 1, c.name, c.source === "app" ? "App" : c.project_name, c.file_no ?? c.uid ?? "",
        localPhone(c.mobile), c.district ?? "", c.reference ?? "",
        Math.round(m.paid), m.hasProfit ? Math.round(m.profit) : "", Math.round(m.balance),
        c.source === "app" ? (c.is_verified ? "Yes" : "No") : "", c.source === "app" ? (c.is_active ? "Yes" : "No") : "",
        c.joining_date ?? "",
      ];
      lines.push(cells.map((x) => `"${String(x ?? "").replace(/"/g, '""')}"`).join(","));
    });
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = u; a.download = `all-customers-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(u);
  }

  async function exportPdf() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
    const cols = [
      { k: "name", t: "Name", x: 40, w: 170 },
      { k: "src", t: "Source / Project", x: 210, w: 150 },
      { k: "phone", t: "Mobile", x: 360, w: 95 },
      { k: "paid", t: "Paid", x: 455, w: 95, r: true },
      { k: "profit", t: "Profit", x: 550, w: 85, r: true },
      { k: "bal", t: "Balance", x: 635, w: 95, r: true },
      { k: "status", t: "Status", x: 745, w: 60 },
    ];
    const drawHeader = () => {
      doc.setFillColor(24, 71, 161); doc.rect(0, 0, W, 50, "F");
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(15);
      doc.text("Promise City — All Customers", 40, 32);
      doc.setFontSize(9); doc.setFont("helvetica", "normal");
      doc.text(`${total} rows  •  collected ${pdfMoney(hub.collected)}  •  ${appStats.total} app accounts`, W - 40, 32, { align: "right" });
      doc.setFillColor(238, 241, 246); doc.rect(0, 56, W, 20, "F");
      doc.setTextColor(60, 60, 60); doc.setFont("helvetica", "bold"); doc.setFontSize(8.5);
      for (const c of cols) doc.text(c.t, c.r ? c.x + c.w - 4 : c.x, 70, { align: c.r ? "right" : "left" });
    };
    drawHeader();
    let y = 92;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
    sorted.forEach((c, i) => {
      if (y > H - 30) { doc.addPage(); drawHeader(); y = 92; }
      if (i % 2 === 0) { doc.setFillColor(249, 250, 252); doc.rect(0, y - 10, W, 16, "F"); }
      doc.setTextColor(30, 30, 30);
      const m = money(c);
      const cell: Record<string, string> = {
        name: (c.name || "").slice(0, 34), src: (c.source === "app" ? "App / Investment" : c.project_name).slice(0, 26),
        phone: localPhone(c.mobile), paid: pdfMoney(m.paid), profit: m.hasProfit ? pdfMoney(m.profit) : "—",
        bal: pdfMoney(m.balance), status: c.source === "app" ? (c.is_active ? "Active" : "Off") : "Cust.",
      };
      for (const col of cols) doc.text(cell[col.k], col.r ? col.x + col.w - 4 : col.x, y, { align: col.r ? "right" : "left" });
      y += 16;
    });
    const pages = doc.getNumberOfPages();
    for (let p = 1; p <= pages; p++) { doc.setPage(p); doc.setTextColor(150, 150, 150); doc.setFontSize(8); doc.text(`Generated ${new Date().toLocaleString("en-GB")}  •  Page ${p}/${pages}`, W / 2, H - 14, { align: "center" }); }
    doc.save(`all-customers-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  const SortH = ({ k, label, right }: { k: SortKey; label: string; right?: boolean }) => (
    <button onClick={() => setSort(k)} className={`inline-flex items-center gap-1 ${right ? "flex-row-reverse" : ""} ${sortKey === k ? "text-brand-blue" : "hover:text-fg"}`}>
      {label}{sortKey !== k ? <ArrowUpDown className="h-3 w-3 opacity-40" /> : asc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
    </button>
  );

  const iconBtn = "grid h-8 w-8 place-items-center rounded-lg border border-border text-fg-faint transition-colors";

  return (
    <div className="space-y-5">
      {/* primary stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total collected" value={compact(hub.collected)} sub={`${hub.payers} have paid`} icon={Wallet} tone="success" />
        <StatCard label="Customers" value={hub.customers.toLocaleString("en-IN")} sub={`${hub.payments.toLocaleString("en-IN")} payments`} icon={Users} tone="info" />
        <StatCard label="App accounts" value={appStats.total.toLocaleString("en-IN")} sub={`${appStats.merged} added here · ${appStats.verified} verified`} icon={Smartphone} tone="warning" />
        <StatCard label="App balance" value={compact(appStats.aum)} sub={`invested ${compact(appStats.invested)}`} icon={TrendingUp} tone="neutral" />
      </div>

      {/* app-account health */}
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-bg p-4">
          <p className="mb-3 text-sm font-bold text-fg">App account health</p>
          <div className="flex items-center justify-around">
            <Donut mounted={mounted} pct={appStats.verifiedPct} color="#1847A1" label="Verified" a={`${appStats.verified} yes`} b={`${appStats.unverified} no`} />
            <Donut mounted={mounted} pct={appStats.activePct} color="#10b981" label="Active" a={`${appStats.active} on`} b={`${appStats.inactive} off`} />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-bg p-4 lg:col-span-2">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-fg"><Trophy className="h-4 w-4 text-amber-500" /> Top investors by balance</p>
          {appStats.top.length === 0 ? <p className="py-8 text-center text-sm text-fg-muted">No data.</p> : (
            <>
              <div className="flex h-32 items-end gap-1.5">
                {appStats.top.map((u, i) => (
                  <div key={u.uid} className="group relative flex h-full flex-1 items-end" title={`${u.name}: ${taka(u.balance)}`}>
                    <div className="w-full rounded-t bg-gradient-to-t from-brand-blue to-brand-blue/55 transition-[height] duration-700 group-hover:from-brand-blue-dark"
                      style={{ height: mounted ? `${Math.max(3, (u.balance / maxBal) * 100)}%` : "0%", transitionDelay: `${i * 60}ms` }} />
                    <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-fg px-1.5 py-0.5 text-[9px] font-semibold text-bg opacity-0 transition-opacity group-hover:opacity-100">{compact(u.balance)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-1.5 flex gap-1.5">
                {appStats.top.map((u) => <span key={u.uid} className="flex-1 truncate text-center text-[9px] text-fg-faint">{firstName(u.name)}</span>)}
              </div>
            </>
          )}
        </div>
      </div>

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-brand-blue/30 bg-brand-blue-tint px-3 py-2.5 text-sm font-bold text-brand-blue">
          <Users className="h-4 w-4" /> {total.toLocaleString("en-IN")} <span className="font-medium text-brand-blue/70">of {rows.length}</span>
        </span>
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, file/UID, mobile, district, officer, email…"
            className="w-full rounded-xl border border-border bg-bg py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-blue/50" />
        </div>
        <select value={projFilter} onChange={(e) => setProjFilter(e.target.value)} className="rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-medium text-fg outline-none focus:border-brand-blue/50">
          <option value="all">All projects</option>
          {projects.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className="rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-medium text-fg outline-none focus:border-brand-blue/50">
          <option value="all">Any status</option>
          <option value="paying">Paying ({appStats.paying + hub.payers})</option>
          <option value="nonpaying">Non-paying</option>
          <option value="verified">Verified ({appStats.verified})</option>
          <option value="unverified">Unverified ({appStats.unverified})</option>
          <option value="active">Active app ({appStats.active})</option>
          <option value="inactive">Inactive app ({appStats.inactive})</option>
        </select>
        <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-medium text-fg outline-none focus:border-brand-blue/50">
          {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
        </select>
        <button onClick={exportCsv} title="Export CSV" className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-semibold text-fg hover:border-emerald-500/40 hover:text-emerald-600"><Download className="h-4 w-4" /> CSV</button>
        <button onClick={exportPdf} title="Export PDF" className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-semibold text-fg hover:border-brand-red/40 hover:text-brand-red"><FileText className="h-4 w-4" /> PDF</button>
        <AddUser />
        <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-3 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark"><UserPlus className="h-4 w-4" /> Add customer</button>
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-bg">
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-bg-soft/95 backdrop-blur">
              <tr className="border-b border-border">
                <th className="w-10 px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-fg-muted">#</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-fg-muted"><SortH k="name" label="Customer" /></th>
                <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-fg-muted">Source / Project</th>
                <th className="px-3 py-2.5 text-right text-[11px] font-bold uppercase tracking-wide text-fg-muted"><SortH k="paid" label="Paid" right /></th>
                <th className="px-3 py-2.5 text-right text-[11px] font-bold uppercase tracking-wide text-fg-muted"><SortH k="profit" label="Profit" right /></th>
                <th className="px-3 py-2.5 text-right text-[11px] font-bold uppercase tracking-wide text-fg-muted"><SortH k="balance" label="Balance" right /></th>
                <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-fg-muted">Status</th>
                <th className="px-3 py-2.5 text-right text-[11px] font-bold uppercase tracking-wide text-fg-muted"><SortH k="joined" label="Joined" right /></th>
                <th className="px-3 py-2.5 text-right text-[11px] font-bold uppercase tracking-wide text-fg-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr><td colSpan={9} className="px-3 py-12 text-center text-sm text-fg-muted">No customers match.</td></tr>
              ) : pageRows.map((c, i) => {
                const m = money(c);
                const tint = avatarTint(c.id);
                const isApp = c.source === "app";
                return (
                  <tr key={c.id} className="border-b border-border/60 align-top transition-colors hover:bg-bg-soft/50">
                    <td className="px-3 py-3 text-fg-faint">{start + i + 1}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ${tint.bg} ${tint.fg}`}>{initial(c.name)}</span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-1 truncate font-semibold text-fg">
                            {c.name || "—"}
                            {isApp && c.is_verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-brand-blue" />}
                          </p>
                          <div className="mt-0.5 space-y-0.5 text-[11px] text-fg-muted">
                            <div className="flex items-center gap-1"><Phone className="h-3 w-3 text-fg-faint" /> {localPhone(c.mobile)}</div>
                            {isApp ? (
                              <div className="truncate text-fg-faint">{c.email || `UID ${c.uid}`}</div>
                            ) : (
                              <>
                                <div className="flex items-center gap-1"><MapPin className="h-3 w-3 text-fg-faint" /> {c.district ?? "—"}</div>
                                <div className="flex items-center gap-1"><UserCheck className="h-3 w-3 text-fg-faint" /> {c.reference ?? "—"}</div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {isApp ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/12 px-2 py-0.5 text-[11px] font-semibold text-violet-600"><Smartphone className="h-3 w-3" /> App / Investment</span>
                      ) : (
                        <span className="text-fg-muted">{c.project_name}</span>
                      )}
                      <div className="mt-0.5 text-[11px] text-fg-faint">{isApp ? (c.file_no ? `FID ${c.file_no}` : "") : `File ${c.file_no ?? "—"}`}</div>
                    </td>
                    <td className="px-3 py-3 text-right font-bold tabular-nums text-brand-blue">{fmt(m.paid)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-emerald-600">{m.hasProfit ? fmt(m.profit) : "—"}</td>
                    <td className={`px-3 py-3 text-right tabular-nums font-semibold ${m.balLabel === "due" ? (m.balance > 0 ? "text-brand-red-dark" : "text-fg-faint") : m.balance < 0 ? "text-brand-red-dark" : "text-fg"}`}
                      title={m.balLabel === "due" ? "Remaining / due" : m.balLabel === "held" ? "Money held" : "App balance"}>
                      {m.balLabel === "due" && m.balance <= 0 ? "—" : fmt(m.balance)}
                    </td>
                    <td className="px-3 py-3">
                      {isApp ? (
                        <div className="flex flex-col gap-1">
                          <span className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${c.is_active ? "bg-emerald-500/15 text-emerald-600" : "bg-fg-faint/15 text-fg-muted"}`}>{c.is_active ? "Active" : "Inactive"}</span>
                          <span className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${c.is_verified ? "bg-brand-blue-tint text-brand-blue" : "bg-amber-500/15 text-amber-600"}`}>{c.is_verified ? "Verified" : "Unverified"}</span>
                        </div>
                      ) : c.project_type === "deposit" ? (
                        <span className="w-fit rounded-full bg-brand-blue-tint px-2 py-0.5 text-[10px] font-bold text-brand-blue">Deposit</span>
                      ) : (
                        <span className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${c.total_remaining > 0 ? "bg-amber-500/15 text-amber-600" : "bg-emerald-500/15 text-emerald-600"}`}>{c.total_remaining > 0 ? "Due" : "Cleared"}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-xs text-fg-muted">{fmtDate(c.joining_date)}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {isApp ? (
                          <>
                            <UserView user={c.app as AppUser} />
                            <UserTxns user={c.app as AppUser} types={investorTypes} projects={investorProjects} />
                            <InvestorEdit investor={{ uid: c.uid!, full_name: c.name, fid: c.file_no, phone_number: c.mobile ?? "", email: c.email ?? null, is_active: !!c.is_active, is_verified: !!c.is_verified }} />
                            <UserActive uid={c.uid!} name={c.name} active={!!c.is_active} />
                          </>
                        ) : (
                          <>
                            <button onClick={() => setView(c)} title="View history" className={`${iconBtn} hover:border-brand-blue/40 hover:text-brand-blue`}><Eye className="h-4 w-4" /></button>
                            <button onClick={() => setEdit(c)} title="Edit" className={`${iconBtn} hover:border-brand-blue/40 hover:text-brand-blue`}><Pencil className="h-4 w-4" /></button>
                            <DeleteBtn customer={c} project={custProj(c)} className={iconBtn} />
                            <button onClick={() => setTxn(c)} title="Transactions" className={`${iconBtn} hover:border-emerald-300 hover:text-emerald-600`}><CreditCard className="h-4 w-4" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* pagination */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2.5 text-sm">
          <p className="text-fg-muted">Showing <b className="text-fg">{total === 0 ? 0 : start + 1}–{Math.min(start + perPage, total)}</b> of <b className="text-fg">{total}</b>{total !== rows.length && <span className="text-fg-faint"> (filtered from {rows.length})</span>}</p>
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

      {/* hub-row modals */}
      {view && <HistoryModal customer={view} isDeposit={view.project_type === "deposit"} onClose={() => setView(null)} />}
      {txn && <TransactionModal customer={txn} project={custProj(txn)} onClose={() => setTxn(null)} />}
      {(adding || edit) && <CustomerFormModal project={edit ? custProj(edit) : (hubProjects[0] ?? { key: "", name: "", type: "real_estate", sort: 0 })} customer={edit} projects={!edit ? hubProjects : undefined} onClose={() => { setAdding(false); setEdit(null); }} />}
    </div>
  );
}

function Donut({ mounted, pct, color, label, a, b }: { mounted: boolean; pct: number; color: string; label: string; a: string; b: string }) {
  const r = 30, c = 2 * Math.PI * r;
  const off = c * (1 - pct / 100);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: 88, height: 88 }}>
        <svg viewBox="0 0 80 80" width={88} height={88} className="-rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" stroke="var(--color-border)" strokeWidth="9" />
          <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={mounted ? off : c} style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)" }} />
        </svg>
        <div className="absolute inset-0 grid place-items-center"><span className="text-base font-extrabold tabular-nums text-fg">{pct}%</span></div>
      </div>
      <p className="text-xs font-semibold text-fg">{label}</p>
      <p className="text-[11px] text-fg-muted">{a} · {b}</p>
    </div>
  );
}
