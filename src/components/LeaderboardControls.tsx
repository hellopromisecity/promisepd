"use client";

/** Leaderboard search + role filter + time-period sort row.
 *
 *  Sits between the rewards strip and the rank table on /leaderboard.
 *  Currently a client-only UI scaffold — the partner-program data
 *  source isn't live yet, so none of the controls filter anything
 *  below them.  When the Supabase query lands, lift `query` +
 *  `role` + `period` state up (or move into URL params) and pass
 *  them into the rank query — UI stays as-is.
 *
 *  Layout: search on the left taking available width, then two
 *  pill dropdowns on the right (role first, then time-period). */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Calendar,
  ChevronDown,
  Users,
} from "lucide-react";
import {
  PARTNER_ROLES,
  PARTNER_TOTAL_COUNT,
  bnNumber,
  type PartnerRoleKey,
} from "@/lib/partner";
import { LEADERBOARD_EN, PARTNER_EN } from "@/lib/pages.en";
import { useLocale } from "./LocaleProvider";

type Period = "30d" | "year" | "last-year" | "lifetime";

type Role = "all" | PartnerRoleKey;

const PERIOD_KEYS: Period[] = ["30d", "year", "last-year", "lifetime"];
const PERIODS_BN: Record<Period, string> = {
  "30d": "শেষ ৩০ দিন",
  year: "এই বছর",
  "last-year": "গত বছর",
  lifetime: "সর্বকালীন",
};

export default function LeaderboardControls() {
  const isEn = useLocale() === "en";
  const L = LEADERBOARD_EN;
  const num = (n: number) => (isEn ? String(n) : bnNumber(n));

  // Time-period options — Bengali inline / English from the overlay.
  const PERIODS: { key: Period; label: string }[] = PERIOD_KEYS.map(
    (key, i) => ({ key, label: isEn ? L.periods[i] : PERIODS_BN[key] }),
  );

  // Role options — built from the single source of truth in
  // src/lib/partner.ts so the per-role partner counts (the badges) stay
  // in sync with the program data. English labels/subs overlay from
  // PARTNER_EN.roles when the locale is "en".
  const ROLE_OPTIONS: {
    key: Role;
    label: string;
    sub: string;
    count: number;
  }[] = [
    {
      key: "all",
      label: isEn ? L.allRoles : "সকল ভূমিকা",
      sub: isEn ? L.allRolesSub : "সব পার্টনার",
      count: PARTNER_TOTAL_COUNT,
    },
    ...PARTNER_ROLES.map((r) => ({
      key: r.key,
      label: isEn ? PARTNER_EN.roles[r.key]?.label ?? r.bn : r.bn,
      sub: isEn ? PARTNER_EN.roles[r.key]?.sub ?? r.sub : r.sub,
      count: r.count,
    })),
  ];

  const [query, setQuery] = useState("");
  const [role, setRole] = useState<Role>("all");
  const [period, setPeriod] = useState<Period>("year");
  const [roleOpen, setRoleOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);

  const currentRole = ROLE_OPTIONS.find((r) => r.key === role);
  const currentRoleLabel = currentRole?.label ?? (isEn ? L.allRoles : "সকল ভূমিকা");
  const currentRoleCount = currentRole?.count ?? PARTNER_TOTAL_COUNT;
  const currentPeriodLabel =
    PERIODS.find((p) => p.key === period)?.label ?? (isEn ? L.periods[1] : "এই বছর");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.4 }}
      className="card p-3 sm:p-4 flex flex-col sm:flex-row gap-3"
    >
      {/* Search — left, takes available width. */}
      <div className="flex-1 flex items-center gap-2 rounded-xl bg-bg-soft px-4">
        <Search className="h-4 w-4 text-fg-muted shrink-0" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isEn ? L.searchPh : "ইউজারনেম, ইমেইল, মোবাইল বা ID দিয়ে নিজের অবস্থান খুঁজুন…"}
          className="w-full bg-transparent py-3 text-sm text-fg placeholder:text-fg-faint outline-none"
          aria-label={isEn ? L.searchAria : "লিডারবোর্ডে খুঁজুন"}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-[11px] font-bold uppercase tracking-wider text-fg-muted hover:text-brand-blue transition-colors"
          >
            {isEn ? L.clear : "ক্লিয়ার"}
          </button>
        )}
      </div>

      {/* Role dropdown — left of the time-period select.  Filter by
          the partner-program role hierarchy. */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setRoleOpen((v) => !v);
            setPeriodOpen(false);
          }}
          className="w-full sm:w-auto flex items-center justify-between gap-2 rounded-xl bg-bg-soft px-4 py-3 text-sm font-semibold text-fg hover:bg-bg-soft-2 transition-colors"
          aria-haspopup="listbox"
          aria-expanded={roleOpen}
        >
          <span className="inline-flex items-center gap-2">
            <Users className="h-4 w-4 text-fg-muted" />
            {currentRoleLabel}
            {/* Live count for the selected role, right on the trigger
                so it's visible without opening the menu. */}
            <span className="inline-flex items-center justify-center min-w-[1.4rem] rounded-full bg-brand-blue/10 px-1.5 py-0.5 text-[11px] font-bold text-brand-blue">
              {num(currentRoleCount)}
            </span>
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              roleOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        <AnimatePresence>
          {roleOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setRoleOpen(false)}
                aria-hidden
              />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-full sm:w-72 z-30 glass-strong rounded-2xl p-2 shadow-2xl"
                role="listbox"
              >
                {ROLE_OPTIONS.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    role="option"
                    aria-selected={role === r.key}
                    onClick={() => {
                      setRole(r.key);
                      setRoleOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      role === r.key ? "bg-bg-soft" : "hover:bg-bg-soft"
                    }`}
                  >
                    <div className="min-w-0">
                      <div
                        className={`text-sm leading-tight ${
                          role === r.key
                            ? "font-bold text-fg"
                            : "text-fg-soft"
                        }`}
                      >
                        {r.label}
                      </div>
                      {r.sub && (
                        <div className="mt-0.5 text-[11px] text-fg-faint">
                          {r.sub}
                        </div>
                      )}
                    </div>
                    {/* Per-role partner count — the "kojon under this
                        role" badge.  Active option gets the solid
                        brand-blue treatment, others a soft tint. */}
                    <span
                      className={`shrink-0 inline-flex items-center justify-center min-w-[1.6rem] rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                        role === r.key
                          ? "bg-brand-blue text-white"
                          : "bg-brand-blue/10 text-brand-blue"
                      }`}
                    >
                      {num(r.count)}
                    </span>
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Time-period dropdown — rightmost. */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setPeriodOpen((v) => !v);
            setRoleOpen(false);
          }}
          className="w-full sm:w-auto flex items-center justify-between gap-2 rounded-xl bg-bg-soft px-4 py-3 text-sm font-semibold text-fg hover:bg-bg-soft-2 transition-colors"
          aria-haspopup="listbox"
          aria-expanded={periodOpen}
        >
          <span className="inline-flex items-center gap-2">
            <Calendar className="h-4 w-4 text-fg-muted" />
            {currentPeriodLabel}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              periodOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        <AnimatePresence>
          {periodOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setPeriodOpen(false)}
                aria-hidden
              />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 top-full mt-2 w-full sm:w-56 z-30 glass-strong rounded-2xl p-2 shadow-2xl"
                role="listbox"
              >
                {PERIODS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    role="option"
                    aria-selected={period === p.key}
                    onClick={() => {
                      setPeriod(p.key);
                      setPeriodOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                      period === p.key
                        ? "bg-bg-soft font-bold text-fg"
                        : "text-fg-soft hover:bg-bg-soft"
                    }`}
                  >
                    <span>{p.label}</span>
                    {period === p.key && (
                      <span className="h-2 w-2 rounded-full bg-brand-blue" />
                    )}
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
