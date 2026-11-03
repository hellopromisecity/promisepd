"use client";

/** The Report page's showpiece (the owner's ask, 2026-11-03): a podium of the
 *  three best reporters — best in the middle, second left, third right —
 *  ranked on how promptly the daily reports come in, with everyone else
 *  listed below, and a period filter. Profile photos in the circles. All the
 *  maths lives in ./leaderboard.ts; this file only draws. */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Crown, Medal, Flame, CalendarCheck, Clock, ChevronDown, Calendar, type LucideIcon } from "lucide-react";
import MemberAvatar from "@/components/admin/MemberAvatar";
import { StatCard } from "@/components/admin/ui";
import { computeLeaderboard, RANGES, type MemberStats, type RangeKey, type ReportLite, type TeamMember } from "./leaderboard";

type Rank = 1 | 2 | 3;
const PODIUM: Record<Rank, { label: string; rgb: string; ring: string; icon: LucideIcon; badge: string }> = {
  1: { label: "Best employee", rgb: "245, 158, 11", ring: "#f59e0b", icon: Crown, badge: "bg-amber-400 text-amber-950" },
  2: { label: "Second", rgb: "100, 116, 139", ring: "#94a3b8", icon: Medal, badge: "bg-slate-300 text-slate-900" },
  3: { label: "Third", rgb: "205, 127, 50", ring: "#cd7f32", icon: Medal, badge: "bg-[#e0a26a] text-[#4a2b0f]" },
};

const pct = (s: MemberStats) => (s.days ? Math.round((s.onTime / s.days) * 100) : 0);

function RangeSelect({ value, onChange }: { value: RangeKey; onChange: (v: RangeKey) => void }) {
  return (
    <div className="relative">
      <Calendar className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" />
      <select value={value} onChange={(e) => onChange(e.target.value as RangeKey)} className="appearance-none rounded-lg border border-border bg-bg py-1.5 pl-8 pr-8 text-sm font-medium text-fg outline-none focus:border-brand-blue/50">
        {RANGES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" />
    </div>
  );
}

function MiniStat({ icon: Icon, value, label }: { icon: LucideIcon; value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-xl bg-bg/70 px-2 py-1.5">
      <p className="flex items-center justify-center gap-1 text-sm font-extrabold tabular-nums text-fg"><Icon className="h-3.5 w-3.5 text-fg-muted" /> {value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-fg-muted">{label}</p>
    </div>
  );
}

/** Same day / next day / later as one stacked bar, with the counts under it. */
function Breakdown({ s }: { s: MemberStats }) {
  const w = (n: number) => (s.days ? `${(n / s.days) * 100}%` : "0%");
  return (
    <div className="mt-3 w-full">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-bg/70">
        <span className="bg-emerald-500" style={{ width: w(s.onTime) }} title="Filed the same day" />
        <span className="bg-amber-400" style={{ width: w(s.nextDay) }} title="Filed the next day" />
        <span className="bg-brand-red" style={{ width: w(s.late) }} title="Filed later" />
      </div>
      <p className="mt-1.5 text-[11px] text-fg-muted">
        <span className="font-semibold text-emerald-600">{s.onTime}</span> same day · <span className="font-semibold text-amber-600">{s.nextDay}</span> next day · <span className="font-semibold text-brand-red-dark">{s.late}</span> later
      </p>
      <p className="text-[11px] text-fg-faint">{s.days} of {s.periodDays} day{s.periodDays === 1 ? "" : "s"} reported ({Math.round(s.coverage * 100)}%)</p>
    </div>
  );
}

function PodiumCard({ rank, s, delay }: { rank: Rank; s: MemberStats | null; delay: number }) {
  const p = PODIUM[rank];
  const Icon = p.icon;
  const tall = rank === 1;
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`relative flex flex-col items-center rounded-2xl border p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${tall ? "border-amber-400/60 md:-mt-6 md:pb-7 md:shadow-md" : "border-border"}`}
      style={{ backgroundImage: `linear-gradient(160deg, rgba(${p.rgb}, ${tall ? 0.22 : 0.14}), rgba(${p.rgb}, 0.03))` }}
    >
      <span className={`absolute left-4 top-4 grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold ${p.badge}`}>{rank}</span>
      <span className="absolute right-4 top-4" style={{ color: p.ring }}><Icon className={tall ? "h-6 w-6" : "h-5 w-5"} /></span>
      <div className="mt-2 rounded-full p-1" style={{ boxShadow: `0 0 0 3px ${p.ring}`, background: "var(--color-bg)" }}>
        <MemberAvatar name={s?.member.name ?? "—"} src={s?.member.avatarUrl ?? null} size={tall ? 92 : 70} />
      </div>
      <p className={`mt-3 font-extrabold text-fg ${tall ? "text-lg" : "text-base"}`}>{s ? s.member.name : "—"}</p>
      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: p.ring }}>{p.label}</p>
      {s ? (
        <>
          <p className={`mt-3 font-black tabular-nums text-fg ${tall ? "text-4xl" : "text-3xl"}`}>{s.score}<span className="ml-1 text-xs font-semibold text-fg-muted">pts</span></p>
          <div className="mt-3 grid w-full grid-cols-3 gap-1.5">
            <MiniStat icon={CalendarCheck} value={s.days} label="days" />
            <MiniStat icon={Clock} value={`${pct(s)}%`} label="on time" />
            <MiniStat icon={Flame} value={s.streak} label="streak" />
          </div>
          <Breakdown s={s} />
        </>
      ) : (
        <p className="mt-6 text-xs text-fg-muted">No reports in this period yet</p>
      )}
    </motion.div>
  );
}

export default function ReportLeaderboard({ team, reports, today }: { team: TeamMember[]; reports: ReportLite[]; today: string }) {
  const [range, setRange] = useState<RangeKey>("month");
  const ranked = useMemo(() => computeLeaderboard(team, reports, range, today), [team, reports, range, today]);
  const label = RANGES.find((r) => r.key === range)?.label ?? "";
  // a slot is only "won" with at least one report in the period
  const slot = (i: number): MemberStats | null => (ranked[i] && ranked[i].days > 0 ? ranked[i] : null);
  const rest = ranked.slice(3);
  const top = ranked.filter((s) => s.days > 0).length;

  return (
    <section className="rounded-2xl border border-border bg-bg p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600"><Trophy className="h-5 w-5" /></span>
          <div>
            <h2 className="text-base font-bold text-fg">Team leaderboard</h2>
            <p className="text-xs text-fg-muted">Who files the daily report, and how promptly — {label.toLowerCase()}{top ? ` · ${top} reporting` : ""}</p>
          </div>
        </div>
        <RangeSelect value={range} onChange={setRange} />
      </div>

      {/* podium: 2nd · 1st · 3rd (the best stands in the middle, a step higher) */}
      <div className="grid gap-3 md:mt-6 md:grid-cols-3 md:items-start">
        <div className="order-2 md:order-1"><PodiumCard rank={2} s={slot(1)} delay={0.1} /></div>
        <div className="order-1 md:order-2"><PodiumCard rank={1} s={slot(0)} delay={0} /></div>
        <div className="order-3"><PodiumCard rank={3} s={slot(2)} delay={0.2} /></div>
      </div>

      {rest.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-border">
          {rest.map((s, i) => (
            <div key={s.member.id} className="flex items-center gap-3 border-b border-border/60 px-4 py-2.5 last:border-b-0 hover:bg-bg-soft/60">
              <span className="w-6 text-center text-sm font-bold text-fg-muted">{i + 4}</span>
              <MemberAvatar name={s.member.name} src={s.member.avatarUrl} size={34} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-fg">{s.member.name}</p>
                <div className="mt-1 flex h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-bg-soft">
                  <span className="bg-emerald-500" style={{ width: s.days ? `${(s.onTime / s.days) * 100}%` : 0 }} />
                  <span className="bg-amber-400" style={{ width: s.days ? `${(s.nextDay / s.days) * 100}%` : 0 }} />
                  <span className="bg-brand-red" style={{ width: s.days ? `${(s.late / s.days) * 100}%` : 0 }} />
                </div>
              </div>
              <span className="hidden text-xs text-fg-muted sm:block">{s.days} day{s.days === 1 ? "" : "s"} · {pct(s)}% on time · streak {s.streak}</span>
              <span className="text-sm font-extrabold tabular-nums text-fg">{s.score} <span className="text-[11px] font-semibold text-fg-muted">pts</span></span>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-fg-faint">
        Points per reported day: filed the same day <b className="text-emerald-600">3</b> · the next day <b className="text-amber-600">2</b> · later <b className="text-brand-red-dark">1</b>.
        Streak = days in a row with a report (a Friday without one doesn&apos;t break it; today may still be pending). Days count up to today only.
      </p>
    </section>
  );
}

/** For staff who only see their own reports: the same numbers, for them. */
export function PersonalStats({ me, reports, today }: { me: TeamMember; reports: ReportLite[]; today: string }) {
  const [range, setRange] = useState<RangeKey>("month");
  const s = useMemo(() => computeLeaderboard([me], reports, range, today)[0], [me, reports, range, today]);
  return (
    <section className="rounded-2xl border border-border bg-bg p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <MemberAvatar name={me.name} src={me.avatarUrl} size={36} />
          <div>
            <h2 className="text-base font-bold text-fg">Your reporting</h2>
            <p className="text-xs text-fg-muted">Same day 3 pts · next day 2 · later 1</p>
          </div>
        </div>
        <RangeSelect value={range} onChange={setRange} />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Days reported" value={s.days} sub={`of ${s.periodDays} days`} icon={CalendarCheck} tone="info" />
        <StatCard label="On time" value={`${pct(s)}%`} sub={`${s.onTime} same day · ${s.nextDay} next day · ${s.late} later`} icon={Clock} tone="success" />
        <StatCard label="Streak" value={s.streak} sub="days in a row" icon={Flame} tone="warning" />
        <StatCard label="Points" value={s.score} sub="this period" icon={Trophy} tone="neutral" />
      </div>
    </section>
  );
}
