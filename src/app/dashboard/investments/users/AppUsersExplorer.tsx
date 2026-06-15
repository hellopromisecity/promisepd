"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search, Users, BadgeCheck, TrendingUp, Wallet, Download, FileText,
  ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight, Trophy,
} from "lucide-react";
import { taka, compact, fmtDate, localPhone, initial, avatarTint, type AppUser, type TypeOpt, type ProjectOpt } from "./shared";
import UserView from "./UserView";
import UserTxns from "./UserTxns";
import UserActive from "./UserActive";
import InvestorEdit from "./InvestorEdit";
import AddUser from "./AddUser";

type SortKey = "name" | "invested" | "profit" | "balance" | "joined";
type StatusFilter = "all" | "verified" | "unverified" | "active" | "inactive";

const firstName = (n: string) => (n || "—").trim().split(/\s+/)[0];
const pdfMoney = (n: number) => "Tk " + Math.round(Number(n) || 0).toLocaleString("en-US");

export default function AppUsersExplorer({
  users, types, projects,
}: { users: AppUser[]; types: TypeOpt[]; projects: ProjectOpt[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("balance");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 40); return () => clearTimeout(t); }, []);
  useEffect(() => { setPage(1); }, [q, status, perPage]);

  // ── headline stats (over ALL users, not the filter) ──
  const s = useMemo(() => {
    let verified = 0, active = 0, invested = 0, profit = 0, aum = 0;
    for (const u of users) {
      if (u.is_verified) verified++;
      if (u.is_active) active++;
      invested += u.invested; profit += u.profit; aum += u.balance;
    }
    const total = users.length || 1;
    return {
      total: users.length, verified, unverified: users.length - verified,
      active, inactive: users.length - active, invested, profit, aum,
      verifiedPct: Math.round((verified / total) * 100),
      activePct: Math.round((active / total) * 100),
    };
  }, [users]);

  const top = useMemo(() => [...users].sort((a, b) => b.balance - a.balance).slice(0, 8), [users]);
  const maxBal = Math.max(1, ...top.map((t) => t.balance));

  // ── filter + sort + paginate ──
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return users.filter((u) => {
      if (status === "verified" && !u.is_verified) return false;
      if (status === "unverified" && u.is_verified) return false;
      if (status === "active" && !u.is_active) return false;
      if (status === "inactive" && u.is_active) return false;
      if (!needle) return true;
      return (
        u.full_name.toLowerCase().includes(needle) ||
        u.uid.toLowerCase().includes(needle) ||
        (u.fid ?? "").toLowerCase().includes(needle) ||
        (u.phone_number ?? "").toLowerCase().includes(needle) ||
        (u.email ?? "").toLowerCase().includes(needle)
      );
    });
  }, [users, q, status]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    const num = (u: AppUser) => (sortKey === "invested" ? u.invested : sortKey === "profit" ? u.profit : u.balance);
    arr.sort((a, b) => {
      if (sortKey === "name") return a.full_name.localeCompare(b.full_name) * dir;
      if (sortKey === "joined") return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
      return (num(a) - num(b)) * dir;
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
    else { setSortKey(k); setSortDir(k === "name" ? "asc" : "desc"); }
  }

  // ── exports (operate on the current filtered + sorted set) ──
  function exportCSV() {
    const head = ["UID", "FID", "Name", "Phone", "Email", "Verified", "Active", "Invested", "Profit", "Withdrawn", "Balance", "Joined"];
    const rows = sorted.map((u) => [u.uid, u.fid ?? "", u.full_name, localPhone(u.phone_number), u.email ?? "", u.is_verified ? "Yes" : "No", u.is_active ? "Yes" : "No", u.invested, u.profit, u.withdrawn, u.balance, fmtDate(u.created_at)]);
    const csv = [head, ...rows].map((r) => r.map((c) => { const v = String(c ?? ""); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; }).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `app-users-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  async function exportPDF() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
    const cols = [
      { k: "uid", t: "UID", x: 40, w: 60 },
      { k: "name", t: "Name", x: 100, w: 190 },
      { k: "phone", t: "Phone", x: 290, w: 110 },
      { k: "invested", t: "Invested", x: 400, w: 95, r: true },
      { k: "profit", t: "Profit", x: 495, w: 85, r: true },
      { k: "balance", t: "Balance", x: 580, w: 100, r: true },
      { k: "status", t: "Status", x: 700, w: 100 },
    ];
    const drawHeader = () => {
      doc.setFillColor(24, 71, 161); doc.rect(0, 0, W, 50, "F");
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(15);
      doc.text("PromisePD — App Users", 40, 32);
      doc.setFontSize(9); doc.setFont("helvetica", "normal");
      doc.text(`${s.total} users  •  ${s.verified} verified  •  ${s.active} active  •  AUM ${pdfMoney(s.aum)}`, W - 40, 32, { align: "right" });
      doc.setFillColor(238, 241, 246); doc.rect(0, 56, W, 20, "F");
      doc.setTextColor(60, 60, 60); doc.setFont("helvetica", "bold"); doc.setFontSize(8.5);
      for (const c of cols) doc.text(c.t, c.r ? c.x + c.w - 4 : c.x, 70, { align: c.r ? "right" : "left" });
    };
    drawHeader();
    let y = 92;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
    sorted.forEach((u, i) => {
      if (y > H - 30) { doc.addPage(); drawHeader(); y = 92; }
      if (i % 2 === 0) { doc.setFillColor(249, 250, 252); doc.rect(0, y - 10, W, 16, "F"); }
      doc.setTextColor(30, 30, 30);
      const cell: Record<string, string> = {
        uid: u.uid, name: (u.full_name || "").slice(0, 40), phone: localPhone(u.phone_number),
        invested: pdfMoney(u.invested), profit: pdfMoney(u.profit), balance: pdfMoney(u.balance),
        status: `${u.is_active ? "Active" : "Inactive"}/${u.is_verified ? "Verified" : "Unverified"}`,
      };
      for (const c of cols) doc.text(cell[c.k], c.r ? c.x + c.w - 4 : c.x, y, { align: c.r ? "right" : "left" });
      y += 16;
    });
    const pages = doc.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p); doc.setTextColor(150, 150, 150); doc.setFontSize(8);
      doc.text(`Generated ${new Date().toLocaleString("en-GB")}  •  Page ${p}/${pages}`, W / 2, H - 14, { align: "center" });
    }
    doc.save(`app-users-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // ── small inline pieces ──
  const tones: Record<string, string> = {
    blue: "from-brand-blue/10 to-brand-blue/5 text-brand-blue",
    emerald: "from-emerald-500/10 to-emerald-500/5 text-emerald-600",
    amber: "from-amber-500/10 to-amber-500/5 text-amber-600",
    violet: "from-violet-500/10 to-violet-500/5 text-violet-600",
  };
  function Stat({ i, label, value, sub, icon: Icon, tone }: { i: number; label: string; value: string; sub: string; icon: React.ComponentType<{ className?: string }>; tone: string }) {
    return (
      <div
        style={{ transitionDelay: `${i * 50}ms` }}
        className={`rounded-2xl border border-border bg-gradient-to-br ${tones[tone]} p-4 transition-all duration-500 ${mounted ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">{label}</span>
          <Icon className="h-4 w-4" />
        </div>
        <p className="mt-1.5 text-2xl font-extrabold tabular-nums text-fg">{value}</p>
        <p className="text-xs text-fg-muted">{sub}</p>
      </div>
    );
  }

  function Donut({ pct, color, label, a, b }: { pct: number; color: string; label: string; a: string; b: string }) {
    const r = 30, c = 2 * Math.PI * r;
    const off = c * (1 - pct / 100);
    return (
      <div className="flex flex-col items-center gap-1.5">
        <div className="relative" style={{ width: 88, height: 88 }}>
          <svg viewBox="0 0 80 80" width={88} height={88} className="-rotate-90">
            <circle cx="40" cy="40" r={r} fill="none" stroke="var(--color-border)" strokeWidth="9" />
            <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
              strokeDasharray={c} strokeDashoffset={mounted ? off : c} style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)" }} />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-base font-extrabold tabular-nums text-fg">{pct}%</span>
          </div>
        </div>
        <p className="text-xs font-semibold text-fg">{label}</p>
        <p className="text-[11px] text-fg-muted">{a} · {b}</p>
      </div>
    );
  }

  const SortTh = ({ k, label, right }: { k: SortKey; label: string; right?: boolean }) => (
    <th className={`whitespace-nowrap px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-fg-muted ${right ? "text-right" : "text-left"}`}>
      <button type="button" onClick={() => toggleSort(k)} className={`inline-flex items-center gap-1 hover:text-fg ${right ? "flex-row-reverse" : ""}`}>
        {label}
        {sortKey !== k ? <ArrowUpDown className="h-3 w-3 opacity-40" /> : sortDir === "asc" ? <ArrowUp className="h-3 w-3 text-brand-blue" /> : <ArrowDown className="h-3 w-3 text-brand-blue" />}
      </button>
    </th>
  );

  return (
    <div className="space-y-5">
      {/* headline stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat i={0} label="Total users" value={s.total.toLocaleString("en-US")} sub="app accounts" icon={Users} tone="blue" />
        <Stat i={1} label="Verified" value={s.verified.toLocaleString("en-US")} sub={`${s.unverified} unverified`} icon={BadgeCheck} tone="emerald" />
        <Stat i={2} label="Total invested" value={compact(s.invested)} sub="principal in" icon={TrendingUp} tone="amber" />
        <Stat i={3} label="Total balance" value={compact(s.aum)} sub="across all users" icon={Wallet} tone="violet" />
      </div>

      {/* charts */}
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-bg p-4">
          <p className="mb-3 text-sm font-bold text-fg">Account health</p>
          <div className="flex items-center justify-around">
            <Donut pct={s.verifiedPct} color="#1847A1" label="Verified" a={`${s.verified} yes`} b={`${s.unverified} no`} />
            <Donut pct={s.activePct} color="#10b981" label="Active" a={`${s.active} on`} b={`${s.inactive} off`} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-bg p-4 lg:col-span-2">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-fg"><Trophy className="h-4 w-4 text-amber-500" /> Top investors by balance</p>
          {top.length === 0 ? (
            <p className="py-8 text-center text-sm text-fg-muted">No data.</p>
          ) : (
            <>
              <div className="flex h-36 items-end gap-1.5">
                {top.map((u, i) => (
                  <div key={u.uid} className="group relative flex h-full flex-1 items-end" title={`${u.full_name}: ${taka(u.balance)}`}>
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-brand-blue to-brand-blue/55 transition-[height] duration-700 group-hover:from-brand-blue-dark"
                      style={{ height: mounted ? `${Math.max(3, (u.balance / maxBal) * 100)}%` : "0%", transitionDelay: `${i * 60}ms` }}
                    />
                    <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-fg px-1.5 py-0.5 text-[9px] font-semibold text-bg opacity-0 transition-opacity group-hover:opacity-100">
                      {compact(u.balance)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-1.5 flex gap-1.5">
                {top.map((u) => <span key={u.uid} className="flex-1 truncate text-center text-[9px] text-fg-faint">{firstName(u.full_name)}</span>)}
              </div>
            </>
          )}
        </div>
      </div>

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, UID, phone, FID, email…"
            className="w-full rounded-xl border border-border bg-bg py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-brand-blue/50"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className="rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-medium text-fg outline-none focus:border-brand-blue/50">
          <option value="all">All users</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-medium text-fg outline-none focus:border-brand-blue/50">
          {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
        </select>
        <button type="button" onClick={exportCSV} title="Export CSV" className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-semibold text-fg transition-all hover:-translate-y-0.5 hover:border-emerald-500/40 hover:text-emerald-600">
          <Download className="h-4 w-4" /> CSV
        </button>
        <button type="button" onClick={exportPDF} title="Export PDF" className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-semibold text-fg transition-all hover:-translate-y-0.5 hover:border-brand-red/40 hover:text-brand-red">
          <FileText className="h-4 w-4" /> PDF
        </button>
        <AddUser />
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-bg">
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-bg-soft/95 backdrop-blur">
              <tr className="border-b border-border">
                <SortTh k="name" label="User" />
                <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-fg-muted">Contact</th>
                <SortTh k="invested" label="Invested" right />
                <SortTh k="profit" label="Profit" right />
                <SortTh k="balance" label="Balance" right />
                <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-fg-muted">Status</th>
                <SortTh k="joined" label="Joined" />
                <th className="px-3 py-2.5 text-right text-[11px] font-bold uppercase tracking-wide text-fg-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((u) => {
                const tint = avatarTint(u.uid);
                return (
                  <tr key={u.uid} className="border-b border-border/60 transition-colors hover:bg-bg-soft/50">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ${tint.bg} ${tint.fg}`}>{initial(u.full_name)}</span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-1 truncate font-semibold text-fg">
                            {u.full_name || "Unnamed"}
                            {u.is_verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-brand-blue" />}
                          </p>
                          <p className="truncate font-mono text-[11px] text-fg-faint">{u.uid}{u.fid ? ` · ${u.fid}` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="text-fg">{localPhone(u.phone_number)}</p>
                      <p className="truncate text-xs text-fg-faint">{u.email || "No email"}</p>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-fg-muted">{taka(u.invested)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-emerald-600">{taka(u.profit)}</td>
                    <td className={`px-3 py-2.5 text-right font-bold tabular-nums ${u.balance < 0 ? "text-brand-red-dark" : "text-fg"}`}>{taka(u.balance)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col gap-1">
                        <span className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${u.is_active ? "bg-emerald-500/15 text-emerald-600" : "bg-fg-faint/15 text-fg-muted"}`}>{u.is_active ? "Active" : "Inactive"}</span>
                        <span className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${u.is_verified ? "bg-brand-blue-tint text-brand-blue" : "bg-amber-500/15 text-amber-600"}`}>{u.is_verified ? "Verified" : "Unverified"}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs text-fg-muted">{fmtDate(u.created_at)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1.5">
                        <UserView user={u} />
                        <UserTxns user={u} types={types} projects={projects} />
                        <InvestorEdit investor={{ uid: u.uid, full_name: u.full_name, fid: u.fid, phone_number: u.phone_number, email: u.email, is_active: u.is_active, is_verified: u.is_verified }} />
                        <UserActive uid={u.uid} name={u.full_name} active={u.is_active} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-12 text-center text-sm text-fg-muted">No users match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* pagination */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2.5 text-sm">
          <p className="text-fg-muted">
            Showing <b className="text-fg">{total === 0 ? 0 : start + 1}–{Math.min(start + perPage, total)}</b> of <b className="text-fg">{total}</b>
            {total !== s.total && <span className="text-fg-faint"> (filtered from {s.total})</span>}
          </p>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={curPage <= 1} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-fg-muted transition-colors hover:border-brand-blue/40 hover:text-brand-blue disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            {Array.from({ length: pageCount }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pageCount || Math.abs(p - curPage) <= 1)
              .map((p, idx, arr) => (
                <span key={p} className="flex items-center">
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-fg-faint">…</span>}
                  <button type="button" onClick={() => setPage(p)} className={`grid h-8 min-w-8 place-items-center rounded-lg border px-2 text-sm font-semibold transition-colors ${p === curPage ? "border-brand-blue bg-brand-blue text-white" : "border-border text-fg-muted hover:border-brand-blue/40 hover:text-brand-blue"}`}>{p}</button>
                </span>
              ))}
            <button type="button" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={curPage >= pageCount} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-fg-muted transition-colors hover:border-brand-blue/40 hover:text-brand-blue disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
