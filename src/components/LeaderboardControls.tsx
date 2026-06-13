"use client";

/** Leaderboard search + role filter + time-period row — controlled by
 *  the parent LeaderboardView (which owns the data + filtering).  Role
 *  options + counts come from the real marketing-officer data. */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Calendar, ChevronDown, Users } from "lucide-react";
import { bnNumber } from "@/lib/partner";
import { LEADERBOARD_EN } from "@/lib/pages.en";

export type Period = "30d" | "year" | "last-year" | "lifetime";

const PERIOD_KEYS: Period[] = ["30d", "year", "last-year", "lifetime"];
const PERIODS_BN: Record<Period, string> = {
  "30d": "শেষ ৩০ দিন",
  year: "এই বছর",
  "last-year": "গত বছর",
  lifetime: "সর্বকালীন",
};

export type RoleOption = { key: string; label: string; sub?: string; count: number };

export default function LeaderboardControls({
  query, setQuery, role, setRole, period, setPeriod, roleOptions, isEn,
}: {
  query: string;
  setQuery: (v: string) => void;
  role: string;
  setRole: (v: string) => void;
  period: Period;
  setPeriod: (v: Period) => void;
  roleOptions: RoleOption[];
  isEn: boolean;
}) {
  const L = LEADERBOARD_EN;
  const num = (n: number) => (isEn ? String(n) : bnNumber(n));

  const PERIODS: { key: Period; label: string }[] = PERIOD_KEYS.map((key, i) => ({
    key,
    label: isEn ? L.periods[i] : PERIODS_BN[key],
  }));

  const [roleOpen, setRoleOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);

  const currentRole = roleOptions.find((r) => r.key === role) ?? roleOptions[0];
  const currentPeriodLabel = PERIODS.find((p) => p.key === period)?.label ?? PERIODS[1].label;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.4 }}
      className="card p-3 sm:p-4 flex flex-col sm:flex-row gap-3"
    >
      <div className="flex-1 flex items-center gap-2 rounded-xl bg-bg-soft px-4">
        <Search className="h-4 w-4 text-fg-muted shrink-0" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isEn ? L.searchPh : "নাম বা ID দিয়ে নিজের অবস্থান খুঁজুন…"}
          className="w-full bg-transparent py-3 text-sm text-fg placeholder:text-fg-faint outline-none"
          aria-label={isEn ? L.searchAria : "লিডারবোর্ডে খুঁজুন"}
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} className="text-[11px] font-bold uppercase tracking-wider text-fg-muted hover:text-brand-blue transition-colors">
            {isEn ? L.clear : "ক্লিয়ার"}
          </button>
        )}
      </div>

      {/* Role filter */}
      <div className="relative">
        <button
          type="button"
          onClick={() => { setRoleOpen((v) => !v); setPeriodOpen(false); }}
          className="w-full sm:w-auto flex items-center justify-between gap-2 rounded-xl bg-bg-soft px-4 py-3 text-sm font-semibold text-fg hover:bg-bg-soft-2 transition-colors"
          aria-haspopup="listbox" aria-expanded={roleOpen}
        >
          <span className="inline-flex items-center gap-2">
            <Users className="h-4 w-4 text-fg-muted" />
            {currentRole?.label}
            <span className="inline-flex items-center justify-center min-w-[1.4rem] rounded-full bg-brand-blue/10 px-1.5 py-0.5 text-[11px] font-bold text-brand-blue">
              {num(currentRole?.count ?? 0)}
            </span>
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${roleOpen ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {roleOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setRoleOpen(false)} aria-hidden />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-full sm:w-72 z-30 glass-strong rounded-2xl p-2 shadow-2xl" role="listbox"
              >
                {roleOptions.map((r) => (
                  <button
                    key={r.key} type="button" role="option" aria-selected={role === r.key}
                    onClick={() => { setRole(r.key); setRoleOpen(false); }}
                    className={`w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${role === r.key ? "bg-bg-soft" : "hover:bg-bg-soft"}`}
                  >
                    <div className="min-w-0">
                      <div className={`text-sm leading-tight ${role === r.key ? "font-bold text-fg" : "text-fg-soft"}`}>{r.label}</div>
                      {r.sub && <div className="mt-0.5 text-[11px] text-fg-faint">{r.sub}</div>}
                    </div>
                    <span className={`shrink-0 inline-flex items-center justify-center min-w-[1.6rem] rounded-full px-1.5 py-0.5 text-[11px] font-bold ${role === r.key ? "bg-brand-blue text-white" : "bg-brand-blue/10 text-brand-blue"}`}>
                      {num(r.count)}
                    </span>
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Time-period */}
      <div className="relative">
        <button
          type="button"
          onClick={() => { setPeriodOpen((v) => !v); setRoleOpen(false); }}
          className="w-full sm:w-auto flex items-center justify-between gap-2 rounded-xl bg-bg-soft px-4 py-3 text-sm font-semibold text-fg hover:bg-bg-soft-2 transition-colors"
          aria-haspopup="listbox" aria-expanded={periodOpen}
        >
          <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4 text-fg-muted" />{currentPeriodLabel}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${periodOpen ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {periodOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setPeriodOpen(false)} aria-hidden />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 top-full mt-2 w-full sm:w-56 z-30 glass-strong rounded-2xl p-2 shadow-2xl" role="listbox"
              >
                {PERIODS.map((p) => (
                  <button
                    key={p.key} type="button" role="option" aria-selected={period === p.key}
                    onClick={() => { setPeriod(p.key); setPeriodOpen(false); }}
                    className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors ${period === p.key ? "bg-bg-soft font-bold text-fg" : "text-fg-soft hover:bg-bg-soft"}`}
                  >
                    <span>{p.label}</span>
                    {period === p.key && <span className="h-2 w-2 rounded-full bg-brand-blue" />}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
