"use client";

/** Live, locale-aware Leaderboard — ranks marketing officers by points,
 *  with a working role filter, time-period filter and an income (আয়)
 *  column.  Rendered by /leaderboard (bn) and /en/leaderboard (en). */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Trophy, Crown, Medal, Award, Sparkles, ArrowRight, Plane } from "lucide-react";
import LeaderboardControls, { type Period, type RoleOption } from "./LeaderboardControls";
import PropertyBackdrop from "./PropertyBackdrop";
import { PARTNER_AWARDS, PARTNER_PERIOD } from "@/lib/partner";
import { LEADERBOARD_EN, PARTNER_EN } from "@/lib/pages.en";
import { useLocale } from "./LocaleProvider";

export type LbOfficer = {
  id: string; name: string; code: string | null; mobile: string | null;
  type: string; sub: string; points: number; income: number;
};
export type LbEntry = { officer_id: string; points: number; income: number; created_at: string };

const RANK_DECOR: Record<number, { icon: typeof Trophy; bg: string; ring: string; text: string }> = {
  1: { icon: Crown, bg: "bg-brand-blue", ring: "ring-brand-blue/30", text: "text-white" },
  2: { icon: Medal, bg: "bg-brand-ash", ring: "ring-brand-ash/40", text: "text-fg" },
  3: { icon: Award, bg: "bg-brand-red", ring: "ring-brand-red/30", text: "text-white" },
};

const TYPE_LABEL: Record<string, { bn: string; en: string }> = {
  HM: { bn: "হেড অফ মার্কেটিং", en: "Head of Marketing" },
  MD: { bn: "মার্কেটিং ডিরেক্টর", en: "Marketing Director" },
  AMO: { bn: "অ্যাক্টিভ মার্কেটিং অফিসার", en: "Active Marketing Officer" },
  MO: { bn: "মার্কেটিং অফিসার", en: "Marketing Officer" },
};
const TYPE_ORDER = ["HM", "MD", "AMO", "MO"];

function periodBounds(p: Period): [number | null, number | null] {
  const now = new Date();
  if (p === "30d") return [Date.now() - 30 * 86400000, null];
  if (p === "year") return [new Date(now.getFullYear(), 0, 1).getTime(), null];
  if (p === "last-year") return [new Date(now.getFullYear() - 1, 0, 1).getTime(), new Date(now.getFullYear(), 0, 1).getTime()];
  return [null, null];
}

function fmtBDT(n: number) {
  n = Number(n) || 0;
  if (n <= 0) return "—";
  if (n >= 1e7) return "৳ " + (n / 1e7).toFixed(2).replace(/\.?0+$/, "") + " Cr";
  if (n >= 1e5) return "৳ " + (n / 1e5).toFixed(2).replace(/\.?0+$/, "") + " L";
  return "৳ " + Math.round(n).toLocaleString("en-IN");
}

export default function LeaderboardView({
  officers = [], entries = [],
}: {
  officers?: LbOfficer[]; entries?: LbEntry[];
}) {
  const isEn = useLocale() === "en";
  const L = LEADERBOARD_EN;
  const lp = (href: string) => (isEn ? `/en${href}` : href);
  const num = (n: number) => (isEn ? String(n) : new Intl.NumberFormat("bn-BD").format(Math.round(n * 100) / 100));

  const periodStart = isEn ? PARTNER_EN.periodStart : PARTNER_PERIOD.startBn;
  const periodEnd = isEn ? PARTNER_EN.periodEnd : PARTNER_PERIOD.endBn;

  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [period, setPeriod] = useState<Period>("year");

  // Period totals per officer (lifetime uses the running totals).
  const computed = useMemo(() => {
    let map: Map<string, { points: number; income: number }> | null = null;
    if (period !== "lifetime") {
      const [start, end] = periodBounds(period);
      map = new Map();
      for (const e of entries) {
        const t = new Date(e.created_at).getTime();
        if (start != null && t < start) continue;
        if (end != null && t >= end) continue;
        const cur = map.get(e.officer_id) || { points: 0, income: 0 };
        cur.points += Number(e.points) || 0;
        cur.income += Number(e.income) || 0;
        map.set(e.officer_id, cur);
      }
    }
    return officers.map((o) => {
      const p = map ? map.get(o.id) : null;
      return {
        ...o,
        rPoints: period === "lifetime" ? o.points : p?.points ?? 0,
        rIncome: period === "lifetime" ? o.income : p?.income ?? 0,
      };
    });
  }, [officers, entries, period]);

  const roleOptions: RoleOption[] = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of officers) counts[o.type] = (counts[o.type] || 0) + 1;
    return [
      { key: "all", label: isEn ? L.allRoles : "সকল ভূমিকা", sub: isEn ? L.allRolesSub : "সব অফিসার", count: officers.length },
      ...TYPE_ORDER.map((t) => ({ key: t, label: isEn ? TYPE_LABEL[t].en : TYPE_LABEL[t].bn, count: counts[t] || 0 })),
    ];
  }, [officers, isEn, L]);

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return computed
      .filter((o) => (role === "all" || o.type === role))
      .filter((o) => !term || `${o.name} ${o.code ?? ""} ${o.mobile ?? ""}`.toLowerCase().includes(term))
      .sort((a, b) => b.rPoints - a.rPoints);
  }, [computed, role, query]);

  const hasData = officers.length > 0;

  return (
    <>
      <section className="relative isolate overflow-hidden pt-32 pb-12 sm:pt-36 sm:pb-16">
        <PropertyBackdrop src="/award.webp" alt={isEn ? "Partner rewards" : "পার্টনার পুরস্কার"} intensity={22} bluewash="soft" />
        <div className="absolute inset-0 -z-10 mesh-bg-soft" />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white border border-border px-4 py-1.5 text-xs shadow-sm">
            <Trophy className="h-3.5 w-3.5 text-brand-blue" />
            <span className="font-semibold uppercase tracking-[0.18em] text-fg-muted">{isEn ? L.eyebrowPrefix : "পার্টনার লিডারবোর্ড"} · {periodStart}</span>
          </span>
          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08]">
            {isEn ? L.h1Plain : "শীর্ষে যাঁরা —"} <span className="text-grad">{isEn ? L.h1Accent : "তাঁদের পুরস্কার।"}</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-fg-muted leading-relaxed max-w-2xl mx-auto">
            {isEn ? L.sub.replace("{start}", periodStart).replace("{end}", periodEnd) : `${periodStart} থেকে ${periodEnd} পর্যন্ত সর্বোচ্চ পয়েন্ট অর্জনকারী পার্টনারদের লাইভ র‍্যাঙ্কিং। শীর্ষ পারফরমারদের জন্য ফ্রি উমরাহ ও আন্তর্জাতিক ট্যুর।`}
          </p>
        </div>
      </section>

      <section className="relative pb-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 gap-4">
            {PARTNER_AWARDS.map((award) => {
              const Icon = award.accent === "red" ? Sparkles : Plane;
              const en = PARTNER_EN.awards[award.threshold];
              const title = isEn ? en?.title ?? award.titleEn : award.titleBn;
              const desc = isEn ? en?.description ?? award.description : award.description;
              return (
                <div key={award.titleEn} className="card p-5 flex items-center gap-4">
                  <div className={`shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-xl ${award.accent === "red" ? "bg-brand-red" : "bg-brand-blue"} text-white shadow-md`}><Icon className="h-6 w-6" /></div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-fg-faint">{num(award.threshold)} {isEn ? L.pointsWord : "পয়েন্ট"}</div>
                    <div className="text-base font-bold text-fg">{title}</div>
                    <p className="text-xs text-fg-muted leading-relaxed">{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative pb-6">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <LeaderboardControls query={query} setQuery={setQuery} role={role} setRole={setRole} period={period} setPeriod={setPeriod} roleOptions={roleOptions} isEn={isEn} />
        </div>
      </section>

      <section className="relative pb-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="card overflow-hidden">
            {/* Internal scroll so the long roster scrolls inside the box,
                with the column header pinned at the top. */}
            <div className="max-h-[65vh] overflow-y-auto [scrollbar-gutter:stable]">
            <div className="sticky top-0 z-10 bg-bg-soft px-5 sm:px-6 py-3 grid grid-cols-[3rem_1fr_5rem_6rem] sm:grid-cols-[3rem_1fr_8rem_8rem] gap-3 text-[10px] uppercase tracking-[0.18em] font-bold text-fg-muted">
              <div>{isEn ? L.thRank : "র‍্যাঙ্ক"}</div>
              <div>{isEn ? L.thPartner : "পার্টনার"}</div>
              <div className="text-right">{isEn ? L.thPoints : "পয়েন্ট"}</div>
              <div className="text-right">{isEn ? L.thEarnings : "আয়"}</div>
            </div>

            {!hasData ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="px-5 sm:px-6 py-4 grid grid-cols-[3rem_1fr_5rem_6rem] sm:grid-cols-[3rem_1fr_8rem_8rem] gap-3 items-center border-t border-border">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-bg-soft text-fg-muted font-bold text-sm">{num(i + 1)}</div>
                  <div className="space-y-1.5"><div className="h-3 w-32 rounded-full bg-bg-soft-2" /><div className="h-2.5 w-20 rounded-full bg-bg-soft" /></div>
                  <div className="ml-auto h-4 w-12 rounded-full bg-bg-soft-2" />
                  <div className="ml-auto h-4 w-16 rounded-full bg-bg-soft-2" />
                </div>
              ))
            ) : rows.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-fg-muted border-t border-border">
                {isEn ? "No officers match your filters." : "কোনো অফিসার মেলেনি।"}
              </div>
            ) : (
              rows.map((o, idx) => {
                const rank = idx + 1;
                const decor = RANK_DECOR[rank];
                return (
                  <div key={o.id} className="px-5 sm:px-6 py-4 grid grid-cols-[3rem_1fr_5rem_6rem] sm:grid-cols-[3rem_1fr_8rem_8rem] gap-3 items-center border-t border-border">
                    <div>
                      {decor ? (
                        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${decor.bg} ${decor.text} ring-4 ${decor.ring} shadow-sm`}><decor.icon className="h-4 w-4" /></div>
                      ) : (
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-bg-soft text-fg-muted font-bold text-sm">{num(rank)}</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-fg">{o.name}</div>
                      <div className="truncate text-xs text-fg-muted">{o.sub}</div>
                    </div>
                    <div className="ml-auto text-right font-bold text-fg">{num(o.rPoints)}</div>
                    <div className="ml-auto text-right text-sm font-semibold text-emerald-700">{fmtBDT(o.rIncome)}</div>
                  </div>
                );
              })
            )}
            </div>
          </div>
        </div>
      </section>

      <section className="relative pb-20 sm:pb-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grad-border p-8 sm:p-12 text-center">
            <Trophy className="h-12 w-12 mx-auto text-brand-blue" />
            <h2 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.15]">
              {isEn ? L.ctaHeadPlain : "এই তালিকায়"} <span className="text-grad">{isEn ? L.ctaHeadAccent : "আপনার নাম দেখতে চান?"}</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-fg-muted max-w-2xl mx-auto">
              {isEn ? L.ctaBody : "পার্টনার প্রোগ্রামে যোগ দিন, ক্যালকুলেটরে আয়ের লক্ষ্য সেট করুন, এবং বছর শেষে শীর্ষ পারফরমারদের তালিকায় উঠে আসুন।"}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href={lp("/partner")} className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-7 py-3.5 text-base font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark hover:scale-[1.02] transition-all">
                {isEn ? L.ctaPartnerBtn : "পার্টনার পেজে যান"}<ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={lp("/contact")} className="inline-flex items-center gap-2 rounded-2xl bg-white border border-border px-7 py-3.5 text-base font-semibold text-fg hover:border-brand-blue/40 hover:shadow-lg transition-all">
                {isEn ? L.ctaContactBtn : "সরাসরি যোগাযোগ"}
              </Link>
            </div>
            {!hasData && (
              <p className="mt-6 text-[11px] text-fg-faint">{isEn ? L.note : "* লাইভ র‍্যাঙ্কিং ডেটা শীঘ্রই সংযুক্ত হবে — পার্টনার প্রোগ্রাম সক্রিয় হলে।"}</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
