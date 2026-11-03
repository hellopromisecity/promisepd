/** Daily-report leaderboard maths (the owner's ask, 2026-11-03): who files
 *  their report, and how promptly. Pure functions over YYYY-MM-DD strings so
 *  the server and the browser agree (no local-timezone drift); "today" is the
 *  Bangladesh calendar day and is passed in by the page.
 *
 *  Points per reported day — filed the same day 3 · the next day 2 · later 1.
 *  Ranking: points, then same-day count, then days reported. */

export type ReportLite = { member_id: string; report_date: string; created_at: string };
export type TeamMember = { id: string; name: string; role: string; avatarUrl: string | null };
export type RangeKey = "month" | "lastmonth" | "year" | "lastyear" | "all";

export const RANGES: { key: RangeKey; label: string }[] = [
  { key: "month", label: "This month" },
  { key: "lastmonth", label: "Last month" },
  { key: "year", label: "This year" },
  { key: "lastyear", label: "Last year" },
  { key: "all", label: "Lifetime" },
];

export type MemberStats = {
  member: TeamMember;
  /** Distinct days with at least one report in the range. */
  days: number;
  onTime: number;
  nextDay: number;
  late: number;
  score: number;
  /** Calendar days of the range that have happened so far (the office files
   *  on Fridays too, so every day counts). */
  periodDays: number;
  /** days / periodDays, capped at 1. */
  coverage: number;
  /** Days in a row with a report, counted back from the range's last day
   *  (today for current ranges; today itself may still be pending). A Friday
   *  without a report — the weekly holiday — is skipped, not a break. */
  streak: number;
  lastReport: string | null;
};

const ms = (ymd: string) => Date.UTC(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10));
export const dayDiff = (a: string, b: string) => Math.round((ms(b) - ms(a)) / 86400000);
export const addDays = (ymd: string, n: number) => new Date(ms(ymd) + n * 86400000).toISOString().slice(0, 10);
/** Friday is the weekly holiday in Bangladesh. */
export const isFriday = (ymd: string) => new Date(ms(ymd)).getUTCDay() === 5;
/** Bangladesh calendar day of a timestamp. */
export const bdDay = (iso: string) => new Date(new Date(iso).getTime() + 6 * 3600 * 1000).toISOString().slice(0, 10);
export const todayBD = () => bdDay(new Date().toISOString());

const pad = (n: number) => String(n).padStart(2, "0");

export function rangeBounds(key: RangeKey, today: string): { from: string; to: string } {
  const y = +today.slice(0, 4), m = +today.slice(5, 7);
  if (key === "month") return { from: `${y}-${pad(m)}-01`, to: today };
  if (key === "lastmonth") {
    const py = m === 1 ? y - 1 : y, pm = m === 1 ? 12 : m - 1;
    const last = new Date(Date.UTC(py, pm, 0)).getUTCDate();
    return { from: `${py}-${pad(pm)}-01`, to: `${py}-${pad(pm)}-${pad(last)}` };
  }
  if (key === "year") return { from: `${y}-01-01`, to: today };
  if (key === "lastyear") return { from: `${y - 1}-01-01`, to: `${y - 1}-12-31` };
  return { from: "", to: today }; // lifetime: from the first report ever (filled in by computeLeaderboard)
}

export const daysBetweenInclusive = (from: string, to: string) => (from <= to ? dayDiff(from, to) + 1 : 0);

export function computeLeaderboard(team: TeamMember[], reports: ReportLite[], key: RangeKey, today: string): MemberStats[] {
  const bounds = rangeBounds(key, today);
  let from = bounds.from;
  const to = bounds.to;
  if (!from) {
    const first = reports.reduce<string>((m, r) => (!m || r.report_date < m ? r.report_date : m), "");
    from = first || today;
  }
  const until = to < today ? to : today; // only days that have actually happened count
  const periodDays = daysBetweenInclusive(from, until);

  // earliest filing per member per day (a second report on the same day
  // doesn't change how promptly the day was reported)
  const firstFiling = new Map<string, Map<string, string>>();
  for (const r of reports) {
    if (r.report_date < from || r.report_date > to) continue;
    let m = firstFiling.get(r.member_id);
    if (!m) firstFiling.set(r.member_id, (m = new Map()));
    const prev = m.get(r.report_date);
    if (!prev || r.created_at < prev) m.set(r.report_date, r.created_at);
  }

  const out = team.map<MemberStats>((member) => {
    const days = firstFiling.get(member.id) ?? new Map<string, string>();
    let onTime = 0, nextDay = 0, late = 0, lastReport: string | null = null;
    for (const [date, created] of days) {
      const lag = dayDiff(date, bdDay(created));
      if (lag <= 0) onTime++; else if (lag === 1) nextDay++; else late++;
      if (!lastReport || date > lastReport) lastReport = date;
    }
    const n = days.size;
    const score = onTime * 3 + nextDay * 2 + late;
    let streak = 0;
    let d = days.has(until) ? until : addDays(until, -1);
    while (d >= from) {
      if (!days.has(d)) {
        if (isFriday(d)) { d = addDays(d, -1); continue; } // holiday — not a break
        break;
      }
      streak++;
      d = addDays(d, -1);
    }
    return { member, days: n, onTime, nextDay, late, score, periodDays, coverage: periodDays ? Math.min(1, n / periodDays) : 0, streak, lastReport };
  });

  return out.sort((a, b) => b.score - a.score || b.onTime - a.onTime || b.days - a.days || a.member.name.localeCompare(b.member.name));
}
