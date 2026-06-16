"use client";

/** Rich investor self-service portal shown on /account for members ported
 *  from the old investment app — matches (and extends) the old mobile UI:
 *  header (name/UID/FID), balance, and three tabs (My Projects / All
 *  Projects / Transactions) with a date filter, search, a transaction
 *  details sheet, single-receipt download and a full statement PDF. */

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  PiggyBank,
  Settings,
  LogOut,
  Building2,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Download,
  X,
  Search,
  CalendarDays,
  BadgeCheck,
  FileText,
  ChevronRight,
  MapPin,
  Lock,
  User,
  Phone,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  Check,
  KeyRound,
} from "lucide-react";
import { useLocale } from "./LocaleProvider";
import { toBn } from "@/lib/bn";
import { logout } from "@/app/actions/auth";
import { updateMyProfile, changeMyPassword } from "@/app/actions/account";
import type { InvestorPortal as PortalData, PortalTxn, PortalProject } from "@/lib/investments";

type Tab = "my" | "all" | "txn";
export type PortalMember = { name: string; mobile: string; email: string | null };

export default function InvestorPortal({ data, member }: { data: PortalData; member?: PortalMember }) {
  const locale = useLocale();
  const en = locale === "en";
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("my");
  const [pendingOut, startOut] = useTransition();
  const [selId, setSelId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const avatar = (data.full_name || "?").trim().charAt(0).toUpperCase();

  // ── formatters ──────────────────────────────────────────────────
  const num = (n: number) => Math.round(Number(n) || 0).toLocaleString("en-US");
  const tk = (n: number) => `৳${en ? num(n) : toBn(num(n))}`;
  const pct = (n: number) => `${en ? n : toBn(String(n))}%`;
  const dOnly = (iso: string) => {
    if (!iso) return "—";
    const s = new Date(iso.includes("T") ? iso : `${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    return en ? s : toBn(s);
  };

  const L = {
    balance: en ? "Total Balance" : "মোট ব্যালেন্স",
    investment: en ? "Total Investment" : "মোট বিনিয়োগ",
    profit: en ? "Total Profit" : "মোট মুনাফা",
    my: en ? "My Projects" : "আমার প্রকল্প",
    all: en ? "All Projects" : "সব প্রকল্প",
    txn: en ? "Transactions" : "লেনদেন",
    invested: en ? "Invested" : "বিনিয়োগ",
    goal: en ? "Goal" : "লক্ষ্য",
    sharePrice: en ? "Share Price" : "শেয়ার মূল্য",
    start: en ? "Start" : "শুরু",
    end: en ? "End" : "শেষ",
    filteredTotal: en ? "Filtered Total" : "ফিল্টার করা মোট",
    exportPdf: en ? "Export PDF" : "PDF ডাউনলোড",
    search: en ? "Search type, project, receipt…" : "টাইপ, প্রকল্প, রসিদ খুঁজুন…",
    from: en ? "From" : "শুরু",
    to: en ? "To" : "শেষ",
    none: en ? "No transactions in this range." : "এই সময়ে কোনো লেনদেন নেই।",
    noProj: en ? "You haven’t invested in any project yet." : "আপনি এখনো কোনো প্রকল্পে বিনিয়োগ করেননি।",
    verified: en ? "Verified" : "ভেরিফাইড",
    logout: en ? "Logout" : "লগআউট",
  };

  function doLogout() {
    startOut(async () => {
      await logout();
      router.push(en ? "/en/login" : "/login");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-center gap-3 rounded-2xl border border-border bg-bg p-4 shadow-sm">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-blue to-brand-blue-dark text-lg font-extrabold text-white shadow-[var(--shadow-brand)]">
          {avatar}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-base font-extrabold text-fg">
            {data.full_name || "—"}
            {data.is_verified && <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-500" />}
          </p>
          <p className="truncate text-[11px] text-fg-muted">
            UID: {en ? data.uid : toBn(data.uid)}
            {data.fid ? ` · FID: ${en ? data.fid : toBn(data.fid)}` : ""}
          </p>
        </div>
        <button type="button" onClick={() => setSettingsOpen(true)} title={en ? "Settings" : "সেটিংস"} className="grid h-9 w-9 place-items-center rounded-xl text-fg-muted transition-colors hover:bg-bg-soft hover:text-brand-blue">
          <Settings className="h-5 w-5" />
        </button>
        <button type="button" onClick={doLogout} disabled={pendingOut} title={L.logout} className="grid h-9 w-9 place-items-center rounded-xl text-fg-muted transition-colors hover:bg-bg-soft hover:text-brand-red-dark disabled:opacity-50">
          {pendingOut ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
        </button>
      </motion.div>

      {/* Balance hero */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="overflow-hidden rounded-2xl border border-brand-blue/20 bg-gradient-to-br from-brand-blue-tint/60 to-bg p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">{L.balance}</p>
          <Wallet className="h-5 w-5 text-brand-blue/70" />
        </div>
        <p className="mt-1 text-3xl font-extrabold tabular-nums text-fg sm:text-4xl">{tk(data.balance.total_balance)}</p>
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border/70 pt-4">
          <div>
            <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-fg-faint"><TrendingUp className="h-3.5 w-3.5" /> {L.investment}</p>
            <p className="mt-0.5 text-lg font-extrabold tabular-nums text-fg">{tk(data.balance.total_investment)}</p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-fg-faint"><PiggyBank className="h-3.5 w-3.5" /> {L.profit}</p>
            <p className="mt-0.5 text-lg font-extrabold tabular-nums text-emerald-600">{tk(data.balance.total_profit)}</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-bg-soft p-1">
        {([["my", L.my], ["all", L.all], ["txn", L.txn]] as [Tab, string][]).map(([k, label]) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={`rounded-xl py-2 text-xs font-bold transition-colors sm:text-sm ${tab === k ? "bg-fg text-bg shadow" : "text-fg-muted hover:text-fg"}`}>
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          {tab === "my" && <MyProjects data={data} L={L} tk={tk} pct={pct} dOnly={dOnly} onOpen={setSelId} />}
          {tab === "all" && <AllProjects data={data} L={L} tk={tk} pct={pct} dOnly={dOnly} onOpen={setSelId} />}
          {tab === "txn" && <Transactions data={data} L={L} en={en} tk={tk} num={num} dOnly={dOnly} />}
        </motion.div>
      </AnimatePresence>

      <ProjectSheet selId={selId} data={data} L={L} en={en} tk={tk} pct={pct} dOnly={dOnly} onClose={() => setSelId(null)} />
      <SettingsSheet open={settingsOpen} en={en} member={member} fullName={data.full_name} phone={member?.mobile ?? ""} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

// ── My Projects ──────────────────────────────────────────────────
function MyProjects({ data, L, tk, pct, dOnly, onOpen }: any) {
  if (data.myProjects.length === 0) return <Empty msg={L.noProj} />;
  return (
    <div className="space-y-3">
      {data.myProjects.map((p: any) => (
        <button key={p.project_id} type="button" onClick={() => onOpen(p.project_id)} className="block w-full rounded-2xl border border-border bg-bg p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-blue/40 hover:shadow-md active:scale-[.99]">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-bold text-fg">{p.project_name}</p>
              <p className="text-[11px] text-fg-faint">PID: {p.project_id}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <StatusPill status={p.status} />
              <ChevronRight className="h-4 w-4 text-fg-faint" />
            </div>
          </div>
          {(p.start_date || p.end_date) && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-fg-muted">
              <span>{L.start}: {dOnly(p.start_date)}</span>
              <span>{L.end}: {dOnly(p.end_date)}</span>
            </div>
          )}
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-fg-faint">{L.invested}</p>
              <p className="font-extrabold tabular-nums text-fg">{tk(p.invested)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wide text-fg-faint">{L.profit}</p>
              <p className="font-extrabold tabular-nums text-emerald-600">{tk(p.profit)}</p>
            </div>
          </div>
          {p.goal > 0 && (
            <div className="mt-2.5">
              <div className="h-2 overflow-hidden rounded-full bg-bg-soft">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-blue to-emerald-500 transition-all" style={{ width: `${p.progress}%` }} />
              </div>
              <div className="mt-1 flex justify-between text-[11px] text-fg-muted">
                <span>{L.goal}: {tk(p.goal)}</span>
                <span className="font-semibold">{pct(p.progress)}</span>
              </div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// ── All Projects ─────────────────────────────────────────────────
function AllProjects({ data, L, tk, pct, dOnly, onOpen }: any) {
  return (
    <div className="space-y-3">
      {data.allProjects.map((p: any) => (
        <button key={p.project_id} type="button" onClick={() => onOpen(p.project_id)} className="block w-full rounded-2xl border border-border bg-bg p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-blue/40 hover:shadow-md active:scale-[.99]">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-bold text-fg">{p.project_name}</p>
              <p className="text-[11px] text-fg-faint">PID: {p.project_id}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <StatusPill status={p.status} />
              <ChevronRight className="h-4 w-4 text-fg-faint" />
            </div>
          </div>
          {(p.start_date || p.end_date) && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-fg-muted">
              <span>{L.start}: {dOnly(p.start_date)}</span>
              <span>{L.end}: {dOnly(p.end_date)}</span>
            </div>
          )}
          {p.share_price != null && (
            <p className="mt-2 text-sm font-semibold text-fg">{L.sharePrice}: <span className="tabular-nums">{tk(p.share_price)}</span></p>
          )}
          {p.progress > 0 && (
            <div className="mt-2.5">
              <div className="h-1.5 overflow-hidden rounded-full bg-bg-soft">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${p.progress}%` }} />
              </div>
              <p className="mt-1 text-right text-[11px] font-semibold text-fg-muted">{pct(p.progress)}</p>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Project detail popup (tap a project card) ────────────────────
function ProjectSheet({ selId, data, L, en, tk, pct, dOnly, onClose }: any) {
  const proj: PortalProject | undefined = data.allProjects.find((p: PortalProject) => p.project_id === selId);
  const mine = data.myProjects.find((p: any) => p.project_id === selId);
  const open = !!selId && !!proj;
  return (
    <AnimatePresence>
      {open && proj && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-end bg-black/40 backdrop-blur-sm sm:place-items-center" onClick={onClose}>
          <motion.div initial={{ y: 40, opacity: 0.6 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-bg shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between gap-2 border-b border-border bg-bg/95 px-5 py-4 backdrop-blur">
              <h3 className="min-w-0 truncate text-base font-extrabold text-fg">{proj.project_name}</h3>
              <button type="button" onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-fg-muted hover:bg-bg-soft"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex items-center gap-2"><StatusPill status={proj.status} /><span className="font-mono text-[11px] text-fg-faint">{proj.project_id}</span></div>
              {proj.details && <p className="whitespace-pre-line text-sm leading-relaxed text-fg-muted">{proj.details}</p>}
              {mine && (
                <div className="grid grid-cols-2 gap-3 rounded-2xl bg-gradient-to-br from-brand-blue-tint/60 to-bg p-3">
                  <div><p className="text-[10px] uppercase tracking-wide text-fg-faint">{L.invested}</p><p className="font-extrabold tabular-nums text-fg">{tk(mine.invested)}</p></div>
                  <div className="text-right"><p className="text-[10px] uppercase tracking-wide text-fg-faint">{L.profit}</p><p className="font-extrabold tabular-nums text-emerald-600">{tk(mine.profit)}</p></div>
                </div>
              )}
              {(mine?.goal > 0 || proj.progress > 0) && (
                <div>
                  <div className="h-2 overflow-hidden rounded-full bg-bg-soft"><div className="h-full rounded-full bg-gradient-to-r from-brand-blue to-emerald-500" style={{ width: `${mine?.progress ?? proj.progress}%` }} /></div>
                  <p className="mt-1 text-right text-[11px] font-semibold text-fg-muted">{pct(mine?.progress ?? proj.progress)}</p>
                </div>
              )}
              <dl className="space-y-2.5">
                {proj.address && <Detail icon={MapPin} k={en ? "Address" : "ঠিকানা"} v={proj.address} />}
                {proj.share_price != null && <Detail icon={Wallet} k={L.sharePrice} v={tk(proj.share_price)} />}
                {(proj.start_date || proj.end_date) && <Detail icon={CalendarDays} k={en ? "Period" : "সময়কাল"} v={`${dOnly(proj.start_date)} – ${dOnly(proj.end_date)}`} />}
              </dl>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Transactions ─────────────────────────────────────────────────
function Transactions({ data, L, en, tk, num, dOnly }: any) {
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sel, setSel] = useState<PortalTxn | null>(null);

  const rows: PortalTxn[] = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return data.transactions.filter((t: PortalTxn) => {
      const day = (t.date || "").slice(0, 10);
      if (from && day < from) return false;
      if (to && day > to) return false;
      if (ql) {
        const hay = `${t.type} ${t.project_name ?? ""} ${t.rashid_number ?? ""}`.toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      return true;
    });
  }, [data.transactions, q, from, to]);

  const net = rows.reduce((s, t) => s + (t.operator === "-" ? -t.amount : t.amount), 0);

  function fmtDateTime(iso: string) {
    const d = new Date(iso);
    const s = d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    return en ? s : toBn(s);
  }

  async function exportPdf() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const M = 40;
    doc.setFont("helvetica", "bold").setFontSize(16).text("Promise Proper Development", M, 48);
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(90);
    doc.text(`Investor: ${ascii(data.full_name)}  (UID ${data.uid}${data.fid ? `, FID ${data.fid}` : ""})`, M, 66);
    const range = from || to ? `Range: ${from || "…"} to ${to || "…"}` : "All transactions";
    doc.text(range, M, 80);
    doc.setTextColor(20).setFont("helvetica", "bold").setFontSize(11);
    doc.text(`Statement total (net): Tk ${num(net)}`, M, 98);
    // table head
    let y = 124;
    doc.setFontSize(9).setTextColor(120);
    doc.text("DATE", M, y); doc.text("TYPE", M + 80, y); doc.text("PROJECT", M + 180, y); doc.text("RECEIPT", M + 330, y);
    doc.text("AMOUNT", 555, y, { align: "right" });
    doc.setDrawColor(220).line(M, y + 5, 555, y + 5);
    doc.setTextColor(30).setFont("helvetica", "normal");
    for (const t of rows) {
      y += 18;
      if (y > 800) { doc.addPage(); y = 50; }
      const day = new Date(t.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      doc.setFontSize(9);
      doc.text(day, M, y);
      doc.text(ascii(t.type).slice(0, 16), M + 80, y);
      doc.text(ascii(t.project_name ?? "—").slice(0, 24), M + 180, y);
      doc.text(ascii(t.rashid_number ?? "—").slice(0, 14), M + 330, y);
      const amt = `${t.operator === "-" ? "-" : "+"} Tk ${num(t.amount)}`;
      doc.setTextColor(t.operator === "-" ? 200 : 20, t.operator === "-" ? 30 : 130, 40);
      doc.text(amt, 555, y, { align: "right" });
      doc.setTextColor(30);
    }
    doc.save(`statement-${data.uid}.pdf`);
  }

  async function downloadReceipt(t: PortalTxn) {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a5" });
    const M = 36;
    doc.setFont("helvetica", "bold").setFontSize(15).text("Promise Proper Development", M, 46);
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(110).text("Transaction Receipt", M, 62);
    doc.setDrawColor(220).line(M, 72, 384, 72);
    const lines: [string, string][] = [
      ["Investor", `${ascii(data.full_name)} (${data.uid})`],
      ["Type", ascii(t.type)],
      ["Amount", `${t.operator === "-" ? "-" : "+"} Tk ${num(t.amount)}`],
      ["Date & Time", new Date(t.date).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })],
      ["Transaction ID", t.transaction_id],
      ["Receipt No", t.rashid_number ?? "—"],
      ["Project", ascii(t.project_name ?? "—")],
      ["Description", ascii(t.description ?? "—")],
    ];
    let y = 96;
    for (const [k, v] of lines) {
      doc.setTextColor(120).setFont("helvetica", "normal").setFontSize(9).text(k.toUpperCase(), M, y);
      doc.setTextColor(20).setFont("helvetica", "bold").setFontSize(11);
      doc.text(doc.splitTextToSize(v, 250), M + 110, y);
      y += Math.max(20, doc.splitTextToSize(v, 250).length * 13);
    }
    doc.save(`receipt-${t.transaction_id}.pdf`);
  }

  return (
    <div className="space-y-3">
      {/* filters */}
      <div className="space-y-2 rounded-2xl border border-border bg-bg p-3">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-bg-soft px-3">
          <Search className="h-4 w-4 shrink-0 text-fg-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={L.search} className="h-9 w-full bg-transparent text-sm outline-none" />
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-fg-faint" />
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label={L.from} className="h-9 flex-1 rounded-xl border border-border bg-bg-soft px-2 text-xs outline-none focus:border-brand-blue/50" />
          <span className="text-fg-faint">–</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label={L.to} className="h-9 flex-1 rounded-xl border border-border bg-bg-soft px-2 text-xs outline-none focus:border-brand-blue/50" />
          {(from || to || q) && (
            <button type="button" onClick={() => { setFrom(""); setTo(""); setQ(""); }} className="rounded-lg px-2 py-1 text-xs font-semibold text-brand-blue hover:bg-brand-blue-tint">×</button>
          )}
        </div>
      </div>

      {/* filtered total + export */}
      <div className="flex items-center justify-between rounded-2xl border border-border bg-bg-soft px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{L.filteredTotal}</span>
        <span className="text-base font-extrabold tabular-nums text-fg">{tk(net)}</span>
      </div>

      {rows.length === 0 ? (
        <Empty msg={L.none} />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-border bg-bg">
            <ul className="divide-y divide-border">
              {rows.slice(0, 300).map((t) => {
                const minus = t.operator === "-";
                return (
                  <li key={t.transaction_id}>
                    <button type="button" onClick={() => setSel(t)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-soft">
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${minus ? "bg-brand-red-tint text-brand-red-dark" : "bg-emerald-50 text-emerald-600"}`}>
                        {minus ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold capitalize text-fg">{t.type.replace(/_/g, " ")}</p>
                        <p className="truncate text-[11px] text-fg-muted">
                          {t.project_name ? `${t.project_name} · ` : ""}{dOnly(t.date)}
                          {t.rashid_number ? ` · #${en ? t.rashid_number : toBn(t.rashid_number)}` : ""}
                        </p>
                      </div>
                      <span className={`shrink-0 text-sm font-bold tabular-nums ${minus ? "text-brand-red-dark" : "text-emerald-600"}`}>
                        {minus ? "−" : "+"}{tk(t.amount)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {rows.length > 300 && <p className="border-t border-border px-4 py-2 text-center text-[11px] text-fg-muted">{en ? `Showing 300 of ${rows.length}` : `${toBn(String(rows.length))}টির মধ্যে ৩০০টি`}</p>}
          </div>

          <button type="button" onClick={exportPdf} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-bg py-3 text-sm font-bold text-fg transition-colors hover:border-brand-blue/50 hover:text-brand-blue">
            <FileText className="h-4 w-4" /> {L.exportPdf}
          </button>
        </>
      )}

      {/* details sheet */}
      <AnimatePresence>
        {sel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-end bg-black/40 sm:place-items-center" onClick={() => setSel(null)}>
            <motion.div initial={{ y: 40, opacity: 0.6 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="w-full max-w-md rounded-t-3xl border border-border bg-bg p-5 shadow-xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-fg-muted uppercase tracking-wide">{en ? "Transaction Details" : "লেনদেনের বিবরণ"}</h3>
                <button type="button" onClick={() => setSel(null)} className="grid h-8 w-8 place-items-center rounded-full text-fg-muted hover:bg-bg-soft"><X className="h-5 w-5" /></button>
              </div>
              <div className={`rounded-2xl px-4 py-3 text-center text-sm font-bold ${sel.operator === "-" ? "bg-brand-red-tint text-brand-red-dark" : "bg-emerald-50 text-emerald-700"}`}>
                <span className="capitalize">{sel.type.replace(/_/g, " ")}</span>
                <p className="mt-1 text-2xl font-extrabold tabular-nums">{sel.operator === "-" ? "−" : "+"}{tk(sel.amount)}</p>
              </div>
              <dl className="mt-4 space-y-2.5 text-sm">
                <Detail icon={CalendarDays} k={en ? "Date & Time" : "তারিখ ও সময়"} v={fmtDateTime(sel.date)} />
                <Detail icon={Receipt} k={en ? "Transaction ID" : "ট্রানজেকশন আইডি"} v={en ? sel.transaction_id : toBn(sel.transaction_id)} />
                <Detail icon={FileText} k={en ? "Receipt No" : "রসিদ নম্বর"} v={sel.rashid_number ? (en ? sel.rashid_number : toBn(sel.rashid_number)) : "—"} />
                <Detail icon={Building2} k={en ? "Project" : "প্রকল্প"} v={sel.project_name ?? "—"} />
                {sel.description && <Detail icon={FileText} k={en ? "Description" : "বিবরণ"} v={sel.description} />}
              </dl>
              <button type="button" onClick={() => downloadReceipt(sel)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue py-3 text-sm font-bold text-white shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-blue-dark">
                <Download className="h-4 w-4" /> {en ? "Download Receipt" : "রসিদ ডাউনলোড"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Settings sheet (profile + password) ─────────────────────────
function SettingsSheet({ open, en, member, fullName, onClose }: any) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showPw, setShowPw] = useState(false);
  const inputCls = "w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand-blue/50";
  const labelCls = "mb-1 flex items-center gap-1.5 text-xs font-semibold text-fg-muted";
  const localPhone = (m: string) => (m && m.startsWith("880") ? `0${m.slice(3)}` : m || "");
  // The synthetic auth email (…@users.promisepd.app) is internal — never show
  // it as the member's contact email.
  const realEmail = member?.email && !/@users\.promisepd\.app$/i.test(member.email) ? member.email : "";

  function saveProfile(fd: FormData) {
    setMsg(null);
    start(async () => {
      const res = await updateMyProfile({ name: String(fd.get("name") || ""), email: String(fd.get("email") || ""), phone: String(fd.get("phone") || "") });
      setMsg(res.ok ? { ok: true, text: res.message } : { ok: false, text: res.error });
      if (res.ok) router.refresh();
    });
  }
  function savePassword(fd: FormData) {
    setMsg(null);
    start(async () => {
      const res = await changeMyPassword({ currentPassword: String(fd.get("cur") || ""), newPassword: String(fd.get("new") || "") });
      setMsg(res.ok ? { ok: true, text: res.message } : { ok: false, text: res.error });
    });
  }

  const T = {
    title: en ? "Settings" : "সেটিংস",
    profile: en ? "Profile" : "প্রোফাইল",
    name: en ? "Full name" : "পূর্ণ নাম",
    email: en ? "Email" : "ইমেইল",
    phone: en ? "Phone (login number)" : "মোবাইল (লগইন নম্বর)",
    save: en ? "Save changes" : "সংরক্ষণ করুন",
    security: en ? "Change password" : "পাসওয়ার্ড পরিবর্তন",
    cur: en ? "Current password" : "বর্তমান পাসওয়ার্ড",
    npw: en ? "New password" : "নতুন পাসওয়ার্ড",
    update: en ? "Update password" : "পাসওয়ার্ড আপডেট",
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-end bg-black/40 backdrop-blur-sm sm:place-items-center" onClick={() => !pending && onClose()}>
          <motion.div initial={{ y: 40, opacity: 0.6 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-bg shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-bg/95 px-5 py-4 backdrop-blur">
              <h3 className="flex items-center gap-2 text-base font-extrabold text-fg"><Settings className="h-5 w-5 text-brand-blue" /> {T.title}</h3>
              <button type="button" onClick={() => !pending && onClose()} className="grid h-8 w-8 place-items-center rounded-full text-fg-muted hover:bg-bg-soft"><X className="h-5 w-5" /></button>
            </div>

            {msg && <div className={`mx-5 mt-4 rounded-xl px-3 py-2 text-xs font-semibold ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-brand-red-tint text-brand-red-dark"}`}>{msg.text}</div>}

            <form action={saveProfile} className="space-y-3 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-fg-muted">{T.profile}</p>
              <div><label className={labelCls}><User className="h-3.5 w-3.5" /> {T.name}</label><input name="name" required defaultValue={fullName ?? member?.name ?? ""} className={inputCls} /></div>
              <div><label className={labelCls}><Mail className="h-3.5 w-3.5" /> {T.email}</label><input name="email" type="email" defaultValue={realEmail} placeholder="—" className={inputCls} /></div>
              <div><label className={labelCls}><Phone className="h-3.5 w-3.5" /> {T.phone}</label><input name="phone" defaultValue={localPhone(member?.mobile ?? "")} placeholder="01XXXXXXXXX" className={inputCls} /></div>
              <button type="submit" disabled={pending} className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-blue py-2.5 text-sm font-bold text-white shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-blue-dark disabled:opacity-60">
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {T.save}
              </button>
            </form>

            <div className="border-t border-border" />

            <form action={savePassword} className="space-y-3 p-5">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-fg-muted"><KeyRound className="h-3.5 w-3.5" /> {T.security}</p>
              <div><label className={labelCls}><Lock className="h-3.5 w-3.5" /> {T.cur}</label><input name="cur" type={showPw ? "text" : "password"} required className={inputCls} /></div>
              <div>
                <label className={labelCls}><Lock className="h-3.5 w-3.5" /> {T.npw}</label>
                <div className="relative">
                  <input name="new" type={showPw ? "text" : "password"} required minLength={6} className={`${inputCls} pr-10`} />
                  <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-fg-muted hover:text-fg">{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </div>
              <button type="submit" disabled={pending} className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-bg py-2.5 text-sm font-bold text-fg transition-colors hover:border-brand-blue/40 disabled:opacity-60">
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} {T.update}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── small bits ───────────────────────────────────────────────────
function Detail({ icon: Icon, k, v }: { icon: any; k: string; v: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-bg-soft text-fg-muted"><Icon className="h-4 w-4" /></span>
      <div className="min-w-0">
        <dt className="text-[10px] font-semibold uppercase tracking-wide text-fg-faint">{k}</dt>
        <dd className="break-words font-semibold text-fg">{v}</dd>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const v = (status || "").toLowerCase();
  const tone = v.includes("complete") ? "bg-emerald-50 text-emerald-700" : v.includes("ongoing") || v.includes("active") ? "bg-emerald-50 text-emerald-700" : v.includes("hold") ? "bg-amber-50 text-amber-700" : v.includes("cancel") ? "bg-brand-red-tint text-brand-red-dark" : "bg-bg-soft text-fg-muted";
  return <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${tone}`}>{status}</span>;
}

function Empty({ msg }: { msg: string }) {
  return <p className="rounded-2xl border border-dashed border-border bg-bg-soft px-4 py-8 text-center text-sm text-fg-muted">{msg}</p>;
}

/** jsPDF's default fonts are Latin-only — strip anything else so Bengali
 *  names/descriptions don't render as tofu in the PDF. */
function ascii(s: string): string {
  return (s || "").replace(/[^\x20-\x7E]/g, "").trim() || "-";
}
