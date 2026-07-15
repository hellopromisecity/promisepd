"use client";

/** All Customers — ONE ROW PER APP ACCOUNT (exactly like Investments → App
 *  Users; same count, two same-named people stay two rows). Each row carries
 *  that account's book holdings + app-only money; per-project detail lives on
 *  the individual project pages. Click a row to see the project breakdown. */

import { useEffect, useMemo, useState } from "react";
import {
  Search, Users, UserRound, BadgeCheck, Wallet, Download, FileText, Smartphone, Building2,
  ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight, Trophy, Phone, X, UserPlus, CreditCard, Link2,
} from "lucide-react";
import { StatCard } from "@/components/admin/ui";
import { taka, compact, fmtDate, localPhone, initial, avatarTint } from "@/app/dashboard/investments/users/shared";
import type { TypeOpt, ProjectOpt } from "@/app/dashboard/investments/users/shared";
import type { PersonRow, PersonHolding, AppHealth } from "@/lib/all-customers";
import type { HubCustomer } from "@/lib/hub";
import { CustomerFormModal, TransactionModal, LinkModal, type HubProject } from "./HubCustomerList";
import UserView from "@/app/dashboard/investments/users/UserView";
import UserTxns from "@/app/dashboard/investments/users/UserTxns";
import UserActive from "@/app/dashboard/investments/users/UserActive";
import InvestorEdit from "@/app/dashboard/investments/users/InvestorEdit";
import AddUser from "@/app/dashboard/investments/users/AddUser";

const fmt = (n: number) => "৳" + Math.round(Number(n) || 0).toLocaleString("en-IN");
const pdfMoney = (n: number) => "Tk " + Math.round(Number(n) || 0).toLocaleString("en-US");
const firstName = (n: string) => (n || "—").trim().split(/\s+/)[0];

type SortKey = "name" | "paid" | "profit" | "balance" | "joined";
type StatusFilter = "all" | "verified" | "unverified" | "active" | "inactive" | "paying" | "nonpaying";

export default function AllCustomersExplorer({
  people, projects, health, top, totals, investorTypes, investorProjects,
}: {
  people: PersonRow[];
  projects: HubProject[];
  health: AppHealth;
  top: { name: string; balance: number }[];
  totals: { collected: number; uniqueCount: number; appAccounts: number; payers: number };
  investorTypes: TypeOpt[];
  investorProjects: ProjectOpt[];
}) {
  const [q, setQ] = useState("");
  const [projFilter, setProjFilter] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("balance");
  const [asc, setAsc] = useState(false);
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [detail, setDetail] = useState<PersonRow | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 40); return () => clearTimeout(t); }, []);
  useEffect(() => { setPage(1); }, [q, status, projFilter, perPage]);

  const hubProjects = useMemo(() => projects.filter((p) => p.type !== "investment"), [projects]);
  const maxBal = Math.max(1, ...top.map((t) => t.balance));

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return people.filter((p) => {
      if (projFilter !== "all" && !p.projectKeys.includes(projFilter)) return false;
      const app = !!p.app;
      if (status === "verified" && !(app && p.is_verified)) return false;
      if (status === "unverified" && !(app && !p.is_verified)) return false;
      if (status === "active" && !(app && p.is_active)) return false;
      if (status === "inactive" && !(app && !p.is_active)) return false;
      if (status === "paying" && !(p.totalPaid > 0)) return false;
      if (status === "nonpaying" && p.totalPaid > 0) return false;
      if (!term) return true;
      return `${p.name} ${p.mobile ?? ""} ${p.uid ?? ""} ${p.email ?? ""} ${p.projectNames.join(" ")}`.toLowerCase().includes(term);
    });
  }, [people, q, projFilter, status]);

  const sorted = useMemo(() => {
    const dir = asc ? 1 : -1;
    return [...filtered].sort((a, b) => {
      let d = 0;
      if (sortKey === "name") d = a.name.localeCompare(b.name);
      else if (sortKey === "joined") d = (a.joined ?? "").localeCompare(b.joined ?? "");
      else if (sortKey === "paid") d = a.totalPaid - b.totalPaid;
      else if (sortKey === "profit") d = a.totalProfit - b.totalProfit;
      else d = a.totalBalance - b.totalBalance;
      return d * dir;
    });
  }, [filtered, sortKey, asc]);

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const curPage = Math.min(page, pageCount);
  const start = (curPage - 1) * perPage;
  const pageRows = sorted.slice(start, start + perPage);
  const setSort = (k: SortKey) => { if (sortKey === k) setAsc((v) => !v); else { setSortKey(k); setAsc(false); } };

  function exportCsv() {
    const head = ["#", "Name", "Mobile", "App UID", "Projects", "Paid", "Profit", "Balance", "Joined"];
    const lines = [head.join(",")];
    sorted.forEach((p, i) => {
      const cells = [i + 1, p.name, localPhone(p.mobile), p.uid ?? "", p.projectNames.join(" | "), Math.round(p.totalPaid), Math.round(p.totalProfit), Math.round(p.totalBalance), p.joined ?? ""];
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
      { k: "name", t: "Name", x: 40, w: 175 },
      { k: "phone", t: "Mobile", x: 215, w: 100 },
      { k: "proj", t: "Projects", x: 315, w: 130 },
      { k: "paid", t: "Paid", x: 445, w: 95, r: true },
      { k: "profit", t: "Profit", x: 540, w: 90, r: true },
      { k: "bal", t: "Balance", x: 630, w: 100, r: true },
    ];
    const drawHeader = () => {
      doc.setFillColor(24, 71, 161); doc.rect(0, 0, W, 50, "F");
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(15);
      doc.text("Promise City — All Customers", 40, 32);
      doc.setFontSize(9); doc.setFont("helvetica", "normal");
      doc.text(`${total} customers  •  collected ${pdfMoney(totals.collected)}`, W - 40, 32, { align: "right" });
      doc.setFillColor(238, 241, 246); doc.rect(0, 56, W, 20, "F");
      doc.setTextColor(60, 60, 60); doc.setFont("helvetica", "bold"); doc.setFontSize(8.5);
      for (const c of cols) doc.text(c.t, c.r ? c.x + c.w - 4 : c.x, 70, { align: c.r ? "right" : "left" });
    };
    drawHeader();
    let y = 92;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
    sorted.forEach((p, i) => {
      if (y > H - 30) { doc.addPage(); drawHeader(); y = 92; }
      if (i % 2 === 0) { doc.setFillColor(249, 250, 252); doc.rect(0, y - 10, W, 16, "F"); }
      doc.setTextColor(30, 30, 30);
      const cell: Record<string, string> = {
        name: (p.name || "").slice(0, 34), phone: localPhone(p.mobile), proj: p.projectNames.join(", ").slice(0, 24),
        paid: pdfMoney(p.totalPaid), profit: pdfMoney(p.totalProfit), bal: pdfMoney(p.totalBalance),
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

  return (
    <div className="space-y-5">
      {/* primary stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total collected" value={compact(totals.collected)} sub={`${totals.payers.toLocaleString("en-IN")} paying · ${(totals.uniqueCount - totals.payers).toLocaleString("en-IN")} non-paying`} icon={Wallet} tone="success" />
        <StatCard label="Customers" value={totals.uniqueCount.toLocaleString("en-IN")} sub="one row per account" icon={UserRound} tone="info" />
        <StatCard label="App accounts" value={totals.appAccounts.toLocaleString("en-IN")} sub={`${health.verified} verified`} icon={Smartphone} tone="warning" />
        <StatCard label="Projects" value={hubProjects.length.toLocaleString("en-IN")} sub="real estate + deposit" icon={Building2} tone="neutral" />
      </div>

      {/* app-account health + top holders */}
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-bg p-4">
          <p className="mb-3 text-sm font-bold text-fg">App account health</p>
          <div className="flex items-center justify-around">
            <Donut mounted={mounted} pct={health.verifiedPct} color="#1847A1" label="Verified" a={`${health.verified} yes`} b={`${health.unverified} no`} />
            <Donut mounted={mounted} pct={health.activePct} color="#10b981" label="Active" a={`${health.active} on`} b={`${health.inactive} off`} />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-bg p-4 lg:col-span-2">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-fg"><Trophy className="h-4 w-4 text-amber-500" /> Top holders by current balance <span className="text-[11px] font-normal text-fg-faint">(all projects combined)</span></p>
          {top.length === 0 ? <p className="py-8 text-center text-sm text-fg-muted">No data.</p> : (
            <>
              <div className="flex h-32 items-end gap-1.5">
                {top.map((u, i) => (
                  <div key={u.name + i} className="group relative flex h-full flex-1 items-end" title={`${u.name}: ${taka(u.balance)}`}>
                    <div className="w-full rounded-t bg-gradient-to-t from-brand-blue to-brand-blue/55 transition-[height] duration-700 group-hover:from-brand-blue-dark"
                      style={{ height: mounted ? `${Math.max(3, (u.balance / maxBal) * 100)}%` : "0%", transitionDelay: `${i * 60}ms` }} />
                    <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-fg px-1.5 py-0.5 text-[9px] font-semibold text-bg opacity-0 transition-opacity group-hover:opacity-100">{compact(u.balance)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-1.5 flex gap-1.5">
                {top.map((u, i) => <span key={u.name + i} className="flex-1 truncate text-center text-[9px] text-fg-faint">{firstName(u.name)}</span>)}
              </div>
            </>
          )}
        </div>
      </div>

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-brand-blue/30 bg-brand-blue-tint px-3 py-2.5 text-sm font-bold text-brand-blue">
          <Users className="h-4 w-4" /> {total.toLocaleString("en-IN")} <span className="font-medium text-brand-blue/70">of {people.length}</span>
        </span>
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, mobile, UID, project…"
            className="w-full rounded-xl border border-border bg-bg py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-blue/50" />
        </div>
        <select value={projFilter} onChange={(e) => setProjFilter(e.target.value)} className="rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-medium text-fg outline-none focus:border-brand-blue/50">
          <option value="all">All projects</option>
          {projects.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className="rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-medium text-fg outline-none focus:border-brand-blue/50">
          <option value="all">Any status</option>
          <option value="paying">Paying ({totals.payers})</option>
          <option value="nonpaying">Non-paying ({totals.uniqueCount - totals.payers})</option>
          <option value="verified">Verified ({health.verified})</option>
          <option value="unverified">Unverified ({health.unverified})</option>
          <option value="active">Active app ({health.active})</option>
          <option value="inactive">Inactive app ({health.inactive})</option>
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
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-bg-soft/95 backdrop-blur">
              <tr className="border-b border-border">
                <th className="w-10 px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-fg-muted">#</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-fg-muted"><SortH k="name" label="Customer" /></th>
                <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-fg-muted">Projects</th>
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
                <tr><td colSpan={9} className="px-3 py-12 text-center text-sm text-fg-muted">No people match.</td></tr>
              ) : pageRows.map((p, i) => {
                const tint = avatarTint(p.id);
                const isApp = !!p.app;
                return (
                  <tr key={p.id} className="border-b border-border/60 align-top transition-colors hover:bg-bg-soft/50">
                    <td className="px-3 py-3 text-fg-faint">{start + i + 1}</td>
                    <td className="px-3 py-3">
                      <button onClick={() => setDetail(p)} className="flex items-center gap-2.5 text-left">
                        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ${tint.bg} ${tint.fg}`}>{initial(p.name)}</span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-1 truncate font-semibold text-fg hover:text-brand-blue">
                            {p.name || "—"}
                            {isApp && p.is_verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-brand-blue" />}
                          </p>
                          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-fg-muted"><Phone className="h-3 w-3 text-fg-faint" /> {localPhone(p.mobile)}{isApp && p.uid ? <span className="ml-1 text-fg-faint">· {p.uid}</span> : null}</div>
                        </div>
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <button onClick={() => setDetail(p)} className="text-left text-fg-muted hover:text-brand-blue" title={p.projectNames.join(", ")}>
                        {p.projectNames.length <= 1 ? (p.projectNames[0] ?? "—") : <>{p.projectNames[0]} <span className="rounded-full bg-bg-soft px-1.5 py-0.5 text-[10px] font-semibold text-fg-muted">+{p.projectNames.length - 1}</span></>}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-right font-bold tabular-nums text-brand-blue">{fmt(p.totalPaid)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-emerald-600">{p.totalProfit ? fmt(p.totalProfit) : "—"}</td>
                    <td className={`px-3 py-3 text-right font-semibold tabular-nums ${p.totalBalance < 0 ? "text-brand-red-dark" : "text-fg"}`}>{fmt(p.totalBalance)}</td>
                    <td className="px-3 py-3">
                      {isApp ? (
                        <div className="flex flex-col gap-1">
                          <span className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${p.is_active ? "bg-emerald-500/15 text-emerald-600" : "bg-fg-faint/15 text-fg-muted"}`}>{p.is_active ? "Active" : "Inactive"}</span>
                          <span className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${p.is_verified ? "bg-brand-blue-tint text-brand-blue" : "bg-amber-500/15 text-amber-600"}`}>{p.is_verified ? "Verified" : "Unverified"}</span>
                        </div>
                      ) : (
                        <span className="w-fit rounded-full bg-bg-soft px-2 py-0.5 text-[10px] font-bold text-fg-muted">Book</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-xs text-fg-muted">{fmtDate(p.joined)}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setDetail(p)} title="View holdings" className="grid h-8 w-8 place-items-center rounded-lg border border-border text-fg-faint transition-colors hover:border-brand-blue/40 hover:text-brand-blue"><UserRound className="h-4 w-4" /></button>
                        {isApp && p.app && (
                          <>
                            <UserTxns user={p.app} types={investorTypes} projects={investorProjects} />
                            <InvestorEdit investor={{ uid: p.uid!, full_name: p.name, fid: p.fid ?? null, phone_number: p.mobile ?? "", email: p.email ?? null, is_active: !!p.is_active, is_verified: !!p.is_verified }} />
                            <UserActive uid={p.uid!} name={p.name} active={!!p.is_active} />
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

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2.5 text-sm">
          <p className="text-fg-muted">Showing <b className="text-fg">{total === 0 ? 0 : start + 1}–{Math.min(start + perPage, total)}</b> of <b className="text-fg">{total}</b>{total !== people.length && <span className="text-fg-faint"> (filtered from {people.length})</span>}</p>
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

      {detail && <PersonModal person={detail} onClose={() => setDetail(null)} />}
      {adding && <CustomerFormModal project={hubProjects[0] ?? { key: "", name: "", type: "real_estate", sort: 0 }} customer={null} projects={hubProjects} onClose={() => setAdding(false)} />}
    </div>
  );
}

function PersonModal({ person, onClose }: { person: PersonRow; onClose: () => void }) {
  const [txnH, setTxnH] = useState<PersonHolding | null>(null);
  const [linkH, setLinkH] = useState<PersonHolding | null>(null);
  // Rebuild a minimal book customer so the shared Transaction / Link modals work
  // (they only need id + project + name; the id drives the payment ledger + link).
  const asHub = (h: PersonHolding): HubCustomer => ({
    id: h.id, project_key: h.project_key, project_name: h.project_name, project_type: h.project_type,
    file_no: null, name: person.name, mobile: person.mobile, district: null, nid: null, reference: null,
    joining_date: person.joined, total_price: 0, total_paid: h.paid, total_remaining: 0, dividend: 0,
    withdrawn: 0, balance: h.balance, payments_count: 0, reference_officer_id: null, investor_uid: null, bio: {},
  });
  const hp = (h: PersonHolding): HubProject => ({ key: h.project_key, name: h.project_name, type: h.project_type, sort: 0 });

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-14" onClick={onClose}>
        <div className="w-full max-w-xl rounded-2xl bg-bg shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h3 className="flex items-center gap-1.5 text-lg font-bold text-fg">{person.name}{person.app && person.is_verified && <BadgeCheck className="h-4 w-4 text-brand-blue" />}</h3>
              <p className="text-xs text-fg-muted">{localPhone(person.mobile)}{person.uid ? ` · UID ${person.uid}` : ""}{person.fid ? ` · FID ${person.fid}` : ""}</p>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-fg-muted hover:bg-bg-soft"><X className="h-5 w-5" /></button>
          </div>
          <div className="px-5 py-4">
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Total paid" value={fmt(person.totalPaid)} tone="blue" />
              <Stat label="Profit" value={fmt(person.totalProfit)} tone="green" />
              <Stat label="Balance" value={fmt(person.totalBalance)} />
            </div>
            <div className="mt-4 mb-2 text-xs font-bold uppercase tracking-wide text-fg-muted">Holdings · {person.holdings.length} project{person.holdings.length > 1 ? "s" : ""}</div>
            <div className="space-y-1.5">
              {person.holdings.map((h, i) => (
                <div key={h.id + i} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-bg-soft px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 font-medium text-fg">
                      {h.project_name}
                      {h.source === "app" && <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-500/12 px-1.5 py-0.5 text-[10px] font-semibold text-violet-600"><Smartphone className="h-2.5 w-2.5" /> app</span>}
                    </div>
                    <div className="text-[11px] text-fg-faint">Paid {fmt(h.paid)}{h.profit ? ` · profit ${fmt(h.profit)}` : ""}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-bold tabular-nums text-fg">{fmt(h.balance)}</span>
                    {h.source === "hub" && (
                      <>
                        <button onClick={() => setTxnH(h)} title="Transactions" className="grid h-7 w-7 place-items-center rounded-lg border border-border text-fg-faint hover:border-emerald-300 hover:text-emerald-600"><CreditCard className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setLinkH(h)} title="Link to app account" className="grid h-7 w-7 place-items-center rounded-lg border border-border text-fg-faint hover:border-violet-300 hover:text-violet-600"><Link2 className="h-3.5 w-3.5" /></button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {person.app && (
              <div className="mt-4 flex justify-end">
                <UserView user={person.app} />
              </div>
            )}
          </div>
        </div>
      </div>
      {txnH && <TransactionModal customer={asHub(txnH)} project={hp(txnH)} onClose={() => setTxnH(null)} />}
      {linkH && <LinkModal customer={asHub(linkH)} onClose={() => setLinkH(null)} />}
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "blue" | "green" }) {
  const box = tone === "blue" ? "bg-brand-blue-tint" : tone === "green" ? "bg-emerald-50" : "bg-bg-soft";
  const txt = tone === "blue" ? "text-brand-blue-dark" : tone === "green" ? "text-emerald-700" : "text-fg";
  return <div className={`rounded-xl px-3 py-2 ${box}`}><div className="text-[10px] font-semibold uppercase tracking-wide text-fg-faint">{label}</div><div className={`text-sm font-extrabold tabular-nums ${txt}`}>{value}</div></div>;
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
