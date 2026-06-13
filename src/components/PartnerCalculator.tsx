"use client";

/** Interactive income-goal calculator for the partner program.
 *
 *  Flow:
 *   1. User sets a target income (slider + number input, bi-directional).
 *   2. User allocates sales across products via per-row +/- counters
 *      OR taps "এই প্রকল্পেই পূরণ" to auto-fill the count needed to hit
 *      the goal using ONLY that product.
 *   3. Live summary updates: total income, total points, gap to goal,
 *      and animated progress bars toward Free Foreign Tour (20 pts) and
 *      Free Umrah (25 pts).
 *
 *  All numbers render via Intl bn-BD so they show with Bengali digits
 *  and the lakh/crore comma grouping Bangladeshi users expect. */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Minus, Plus, Target, Trophy, Wallet, Sparkles } from "lucide-react";
import {
  PARTNER_AWARDS,
  PARTNER_COMMISSIONS,
  bnNumber,
} from "@/lib/partner";
import { PARTNER_EN } from "@/lib/pages.en";
import { useLocale } from "./LocaleProvider";

const ACCENT_BG: Record<string, string> = {
  red: "bg-brand-red",
  blue: "bg-brand-blue",
  ash: "bg-brand-ash",
};

const ACCENT_TINT: Record<string, string> = {
  red: "bg-brand-red-tint",
  blue: "bg-brand-blue-tint",
  ash: "bg-brand-ash-tint",
};

const ACCENT_TEXT: Record<string, string> = {
  red: "text-brand-red",
  blue: "text-brand-blue",
  ash: "text-fg-soft",
};

const GOAL_MIN = 50_000;
const GOAL_MAX = 10_00_000; // 10 lakh
const GOAL_STEP = 5_000;
const GOAL_DEFAULT = 1_50_000;

export default function PartnerCalculator() {
  const isEn = useLocale() === "en";
  const u = PARTNER_EN.ui;
  const num = (n: number) => (isEn ? String(n) : bnNumber(n));
  const unitOf = (c: { id: string; unit: string }) =>
    isEn ? PARTNER_EN.commissions[c.id]?.unit ?? c.unit : c.unit;
  const ptWord = (n: number) =>
    isEn ? (n > 1 ? u.pointsWord : u.pointWord) : "পয়েন্ট";

  const [goal, setGoal] = useState<number>(GOAL_DEFAULT);
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(PARTNER_COMMISSIONS.map((c) => [c.id, 0])),
  );

  const { totalIncome, totalPoints } = useMemo(() => {
    let income = 0;
    let points = 0;
    for (const c of PARTNER_COMMISSIONS) {
      const n = counts[c.id] ?? 0;
      income += n * c.commission;
      points += n * c.points;
    }
    return { totalIncome: income, totalPoints: points };
  }, [counts]);

  const goalHit = totalIncome >= goal;
  const gap = Math.max(0, goal - totalIncome);

  const setCount = (id: string, value: number) =>
    setCounts((p) => ({ ...p, [id]: Math.max(0, Math.min(999, value)) }));

  const inc = (id: string) =>
    setCounts((p) => ({ ...p, [id]: Math.min(999, (p[id] ?? 0) + 1) }));

  const dec = (id: string) =>
    setCounts((p) => ({ ...p, [id]: Math.max(0, (p[id] ?? 0) - 1) }));

  /** "Fill with only this product" — replaces all counts with the count
   *  of just this product needed to hit (or exceed) the goal. */
  const fillSolo = (id: string) => {
    const c = PARTNER_COMMISSIONS.find((x) => x.id === id);
    if (!c) return;
    const needed = Math.ceil(goal / c.commission);
    const next = Object.fromEntries(
      PARTNER_COMMISSIONS.map((x) => [x.id, 0]),
    ) as Record<string, number>;
    next[id] = Math.min(999, needed);
    setCounts(next);
  };

  const reset = () =>
    setCounts(
      Object.fromEntries(PARTNER_COMMISSIONS.map((c) => [c.id, 0])) as Record<
        string,
        number
      >,
    );

  return (
    <section
      id="calculator"
      className="relative py-20 sm:py-28 bg-bg-soft scroll-mt-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-border px-4 py-1.5 text-xs shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-blue animate-pulse" />
            <span className="font-semibold uppercase tracking-[0.18em] text-fg-muted">
              {isEn ? u.calcEyebrow : "আয়ের ক্যালকুলেটর"}
            </span>
          </div>
          <h2 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.15]">
            {isEn ? u.calcH1A : "আপনার"}{" "}
            <span className="text-grad">{isEn ? u.calcH1Grad : "লক্ষ্য"}</span>{" "}
            {isEn ? u.calcH1B : "নিজেই ঠিক করুন"}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-fg-muted leading-relaxed">
            {isEn
              ? u.calcSub
              : "স্লাইডার টেনে আয়ের লক্ষ্য সেট করুন, তারপর দেখুন কোন প্রকল্প থেকে কতটা সেলস করলে লক্ষ্যে পৌঁছাবেন।"}
          </p>
        </motion.div>

        <div className="mt-12 grid lg:grid-cols-3 gap-6">
          {/* LEFT (2 cols): goal setter + product mix */}
          <div className="lg:col-span-2 space-y-6">
            {/* Goal card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="card p-6 sm:p-8"
            >
              <div className="flex items-center gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-red text-white shadow-md">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-fg-faint">
                    Step 1
                  </div>
                  <h3 className="text-lg font-bold text-fg">
                    {isEn ? u.goalLabel : "আপনার আয়ের লক্ষ্য"}
                  </h3>
                </div>
              </div>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-fg">৳</span>
                <input
                  type="number"
                  min={GOAL_MIN}
                  max={GOAL_MAX}
                  step={GOAL_STEP}
                  value={goal}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (Number.isFinite(v)) setGoal(Math.max(0, v));
                  }}
                  className="w-full bg-transparent text-3xl sm:text-4xl font-bold text-grad-rb outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  aria-label={isEn ? u.goalAria : "আয়ের লক্ষ্য"}
                />
              </div>
              <div className="mt-1 text-sm text-fg-muted">
                <span className="font-semibold">৳ {num(goal)}</span>
                <span className="text-fg-faint">
                  {isEn ? u.goalPeriod : " · মাসিক / নির্দিষ্ট সময়সীমার মধ্যে"}
                </span>
              </div>

              <input
                type="range"
                min={GOAL_MIN}
                max={GOAL_MAX}
                step={GOAL_STEP}
                value={Math.min(GOAL_MAX, Math.max(GOAL_MIN, goal))}
                onChange={(e) => setGoal(Number(e.target.value))}
                className="mt-5 w-full accent-brand-red cursor-pointer"
                aria-label={isEn ? u.goalSliderAria : "আয়ের লক্ষ্য স্লাইডার"}
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-fg-faint">
                <span>৳ {num(GOAL_MIN)}</span>
                <span>৳ {num(GOAL_MAX)}</span>
              </div>
            </motion.div>

            {/* Product mix card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="card p-6 sm:p-8"
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blue text-white shadow-md">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-fg-faint">
                      Step 2
                    </div>
                    <h3 className="text-lg font-bold text-fg">
                      {isEn ? u.planLabel : "আপনার সেলস প্ল্যান"}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="text-xs font-semibold uppercase tracking-wider text-fg-muted hover:text-brand-red transition-colors"
                >
                  {isEn ? u.reset : "রিসেট"}
                </button>
              </div>

              <div className="mt-6 grid sm:grid-cols-2 gap-3">
                {PARTNER_COMMISSIONS.map((c) => {
                  const n = counts[c.id] ?? 0;
                  const rowIncome = n * c.commission;
                  const rowPoints = n * c.points;
                  return (
                    <div
                      key={c.id}
                      className="rounded-2xl border border-border p-4 hover:border-border-strong transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-fg leading-tight">
                            {isEn ? c.nameEn : c.nameBn}
                          </div>
                          <div className="mt-0.5 text-[11px] text-fg-faint">
                            ৳ {num(c.commission)} · {unitOf(c)}
                            {c.points > 0 ? ` · ${num(c.points)} ${ptWord(c.points)}` : ""}
                          </div>
                        </div>
                        <span
                          className={`shrink-0 inline-flex h-2 w-2 rounded-full ${
                            ACCENT_BG[c.accent]
                          }`}
                          aria-hidden
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="inline-flex items-center rounded-xl bg-bg-soft border border-border">
                          <button
                            type="button"
                            onClick={() => dec(c.id)}
                            className="h-9 w-9 inline-flex items-center justify-center text-fg-muted hover:text-brand-red disabled:opacity-40 disabled:hover:text-fg-muted transition-colors"
                            disabled={n === 0}
                            aria-label={isEn ? `${u.decrease} ${c.nameEn}` : `${c.nameBn} কমান`}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={999}
                            value={n}
                            onChange={(e) =>
                              setCount(c.id, Number(e.target.value) || 0)
                            }
                            className="w-12 bg-transparent text-center text-sm font-bold text-fg outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            aria-label={isEn ? `${c.nameEn} ${u.count}` : `${c.nameBn} সংখ্যা`}
                          />
                          <button
                            type="button"
                            onClick={() => inc(c.id)}
                            className="h-9 w-9 inline-flex items-center justify-center text-fg-muted hover:text-brand-red transition-colors"
                            aria-label={isEn ? `${u.increase} ${c.nameEn}` : `${c.nameBn} বাড়ান`}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => fillSolo(c.id)}
                          className={`text-[11px] font-semibold uppercase tracking-wider ${
                            ACCENT_TEXT[c.accent]
                          } hover:underline`}
                          title={isEn ? u.fillSoloTitle : "শুধু এই প্রকল্প দিয়ে লক্ষ্য পূরণ করুন"}
                        >
                          {isEn ? u.fillSolo : "এই প্রকল্পেই পূরণ →"}
                        </button>
                      </div>

                      {n > 0 && (
                        <motion.div
                          layout
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className={`mt-3 rounded-lg px-3 py-2 text-xs ${
                            ACCENT_TINT[c.accent]
                          }`}
                        >
                          <span className="font-bold text-fg">
                            ৳ {num(rowIncome)}
                          </span>
                          {rowPoints > 0 && (
                            <span className="text-fg-muted">
                              {" "}
                              · {num(rowPoints)} {ptWord(rowPoints)}
                            </span>
                          )}
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* RIGHT (1 col, sticky on desktop): live summary */}
          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="lg:sticky lg:top-28 self-start"
          >
            <div className="grad-border p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-red text-white shadow-md">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-fg-faint">
                    Step 3
                  </div>
                  <h3 className="text-lg font-bold text-fg">
                    {isEn ? u.achievement : "আপনার অর্জন"}
                  </h3>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-[11px] uppercase tracking-[0.2em] text-fg-faint">
                  {isEn ? u.totalIncome : "মোট আয়"}
                </div>
                <div className="mt-1 text-3xl sm:text-4xl font-bold text-grad-rb">
                  ৳ {num(totalIncome)}
                </div>
                <div className="mt-2 text-sm">
                  {goalHit ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-red-tint px-3 py-1 text-xs font-bold text-brand-red">
                      <Trophy className="h-3.5 w-3.5" />
                      {isEn ? u.goalHit : "লক্ষ্য পূর্ণ — মাশাআল্লাহ!"}
                    </span>
                  ) : (
                    <span className="text-fg-muted">
                      {isEn ? u.goalGapPrefix : "লক্ষ্য থেকে বাকি"}{" "}
                      <span className="font-bold text-fg">
                        ৳ {num(gap)}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-bg-soft p-3">
                  <div className="text-[10px] uppercase tracking-wider text-fg-faint">
                    {isEn ? u.totalPoints : "মোট পয়েন্ট"}
                  </div>
                  <div className="mt-1 text-xl font-bold text-fg">
                    {num(totalPoints)}
                  </div>
                </div>
                <div className="rounded-xl bg-bg-soft p-3">
                  <div className="text-[10px] uppercase tracking-wider text-fg-faint">
                    {isEn ? u.totalSales : "মোট সেলস"}
                  </div>
                  <div className="mt-1 text-xl font-bold text-fg">
                    {num(Object.values(counts).reduce((a, b) => a + b, 0))}
                  </div>
                </div>
              </div>

              {/* Awards progress */}
              <div className="mt-6 space-y-4">
                {PARTNER_AWARDS.map((award) => {
                  const pct = Math.min(
                    100,
                    Math.round((totalPoints / award.threshold) * 100),
                  );
                  const won = totalPoints >= award.threshold;
                  return (
                    <div key={award.titleEn}>
                      <div className="flex items-baseline justify-between">
                        <div className="text-sm font-bold text-fg">
                          {isEn ? PARTNER_EN.awards[award.threshold]?.title ?? award.titleEn : award.titleBn}
                        </div>
                        <div className="text-[11px] text-fg-muted">
                          {num(Math.min(totalPoints, award.threshold))} /{" "}
                          {num(award.threshold)} {isEn ? u.pointsWord : "পয়েন্ট"}
                        </div>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-bg-soft-2 overflow-hidden">
                        <motion.div
                          initial={false}
                          animate={{ width: `${pct}%` }}
                          transition={{
                            duration: 0.4,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className={`h-full ${
                            won ? "bg-brand-red" : ACCENT_BG[award.accent]
                          }`}
                        />
                      </div>
                      {won && (
                        <div className="mt-1 text-[11px] font-bold text-brand-red">
                          {isEn ? u.achievedNote : "✓ অর্জন হয়েছে — আলহামদুলিল্লাহ"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="mt-5 text-[11px] leading-relaxed text-fg-faint">
                {isEn
                  ? u.calcFootnote
                  : "* কমিশন পেতে অবশ্যই ক্লায়েন্টের জমা টাকার ১০% হারে কমিশন হতে হবে। গণনা ইনডিকেটিভ — চূড়ান্ত হিসাব মার্কেটিং অফিসের সাথে।"}
              </p>
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  );
}
