"use client";

/** Partner-page hero — leads with the "25 referrals → free Umrah + ৳5L
 *  in prizes" hook and a single primary CTA that scrolls down to the
 *  interactive calculator. */

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Trophy, Wallet, Calculator } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import AnimatedBlobs from "./AnimatedBlobs";
import PropertyBackdrop from "./PropertyBackdrop";
import { PARTNER_HEADLINE, PARTNER_PERIOD } from "@/lib/partner";
import { PARTNER_EN } from "@/lib/pages.en";
import { useLocale } from "./LocaleProvider";

export default function PartnerHero() {
  const isEn = useLocale() === "en";
  const u = PARTNER_EN.ui;
  const lp = (href: string) => (isEn ? `/en${href}` : href);
  const periodStart = isEn ? PARTNER_EN.periodStart : PARTNER_PERIOD.startBn;
  const periodEnd = isEn ? PARTNER_EN.periodEnd : PARTNER_PERIOD.endBn;
  const target = isEn
    ? String(PARTNER_HEADLINE.referralsTarget)
    : new Intl.NumberFormat("bn-BD").format(PARTNER_HEADLINE.referralsTarget);
  const cashMin = isEn ? PARTNER_EN.headline.cashMin : PARTNER_HEADLINE.cashMinBn;
  const umrahValue = isEn ? PARTNER_EN.headline.umrahValue : PARTNER_HEADLINE.umrahValueBn;
  const totalValue = isEn ? PARTNER_EN.headline.totalValue : PARTNER_HEADLINE.totalValueBn;

  return (
    <section className="relative isolate flex min-h-[88svh] items-center overflow-hidden pt-28 pb-16">
      {/* Fuzala Complex street view — the partner program funnels
          partners into selling these homes, so it's fitting that
          the hero shows the actual product. */}
      <PropertyBackdrop
        src="/fcpics/fc1.webp"
        alt="Promise City residences"
        intensity={28}
        bluewash="soft"
      />
      <div className="absolute inset-0 -z-10 mesh-bg" />
      <AnimatedBlobs />
      <div className="absolute inset-0 -z-10 grid-bg opacity-50" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          {/* Left column — copy + CTA */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-7"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-border px-4 py-1.5 text-xs shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-red animate-pulse" />
              <span className="font-semibold uppercase tracking-[0.18em] text-fg-muted">
                {isEn ? u.heroEyebrow : "পার্টনার প্রোগ্রাম"} · {periodStart}
              </span>
            </div>

            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08]">
              {isEn ? (
                <>
                  {u.heroH1A} <span className="text-grad">{u.heroH1Grad}</span>{" "}
                  {u.heroH1B}
                </>
              ) : (
                <>
                  নিজের আয়ের <span className="text-grad">লক্ষ্য</span> নিজেই ঠিক
                  করুন।
                </>
              )}
            </h1>

            <p className="mt-5 text-lg sm:text-xl text-fg-soft leading-relaxed font-medium">
              {isEn ? (
                <>
                  {u.heroLeadA}{" "}
                  <span className="font-bold text-brand-red">{u.heroLeadBrand}</span>{" "}
                  {u.heroLeadMid}{" "}
                  <span className="font-bold text-brand-blue">{u.heroLeadBlue}</span>
                </>
              ) : (
                <>
                  মানুষের কাছে{" "}
                  <span className="font-bold text-brand-red">প্রমিস সিটি</span>{" "}
                  পৌঁছে দিন — কারণ প্রমিস সিটি মানেই{" "}
                  <span className="font-bold text-brand-blue">
                    আপনার স্বপ্ন যেখানে বাস্তব।
                  </span>
                </>
              )}
            </p>

            <p className="mt-3 text-base text-fg-muted leading-relaxed max-w-2xl">
              {isEn
                ? u.heroSub
                : "ক্যালকুলেটরে আয়ের লক্ষ্য সেট করুন, প্ল্যান বানান — কোন প্রকল্প থেকে কত সেলস করলে সেই লক্ষ্যে পৌঁছাবেন, লাইভ দেখুন।"}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="#calculator"
                className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-7 py-3.5 text-base font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark hover:scale-[1.02] transition-all"
              >
                <Calculator className="h-4 w-4" />
                {isEn ? u.openCalc : "ক্যালকুলেটর খুলুন"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={lp("/#contact")}
                className="inline-flex items-center gap-2 rounded-2xl bg-white border border-border px-7 py-3.5 text-base font-semibold text-fg hover:border-brand-blue/40 transition-all"
              >
                {isEn ? u.contactBtn : "পার্টনার হতে যোগাযোগ"}
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-fg-muted">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-border px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-red" />
                {isEn ? u.chip1 : "রিয়েল এস্টেট কমিশন"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-border px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-blue" />
                {isEn ? u.chip2 : "টিম বিল্ডিং বোনাস"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-border px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-ash-dark" />
                {isEn ? u.chip3 : "হজ্জ · উমরাহ কমিশন"}
              </span>
            </div>
          </motion.div>

          {/* Right column — the "25 referrals" hook card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              {/* Madina golden-hour photo — Masjid an-Nabawi at
                  sunset.  Sets the reverent tone for the "free
                  Umrah" hook far better than a solid colour ever
                  could. */}
              <Image
                src="/madina.webp"
                alt="Masjid an-Nabawi, Madina"
                fill
                sizes="(min-width: 1024px) 480px, 100vw"
                className="object-cover object-[60%_40%]"
                priority
              />

              {/* Overlay stack — three layers, each doing one job:
                  1. Bottom-heavy navy gradient for content legibility
                  2. Warm gold radial that picks up the photo's own
                     sunset tones (top-right)
                  3. Brand-blue bloom in the lower-left to keep the
                     card visibly Promise-branded */}
              <div className="absolute inset-0 bg-gradient-to-b from-brand-blue-dark/35 via-brand-blue-dark/65 to-brand-blue-dark/92" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(255,196,107,0.28),transparent_55%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_90%,rgba(24,71,161,0.38),transparent_55%)]" />

              {/* Subtle dome-tone vignette to keep the photo's
                  iconic green dome from competing with text. */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-black/15" />

              {/* Content */}
              <div className="relative p-8 sm:p-10 text-white">
                {/* Signature offer pill — warm cream tone instead of
                    pure white, echoes the photo's sandstone palette. */}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff7e6] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-red shadow-md ring-1 ring-amber-200/50">
                  <Sparkles className="h-3 w-3" />
                  {isEn ? u.offerPill : "সিগনেচার অফার"}
                </span>

                <h2 className="mt-5 text-3xl sm:text-4xl font-bold leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                  {isEn ? (
                    <>
                      {u.hookH2A}{" "}
                      <span className="text-[#FFD27A]">
                        {target} {u.hookH2People}
                      </span>{" "}
                      {u.hookH2B}
                    </>
                  ) : (
                    <>
                      মাত্র{" "}
                      <span className="text-[#FFD27A]">{target} জন</span>{" "}
                      রেফার করে
                    </>
                  )}
                </h2>
                <div className="mt-1 text-2xl sm:text-3xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                  {isEn ? u.hookSubPlain : "নিশ্চিত"}{" "}
                  <span className="underline decoration-[#FFD27A] decoration-2 underline-offset-4">
                    {isEn ? u.hookSubAccent : "ফ্রি উমরাহ"}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/12 border border-white/25 backdrop-blur-md px-3 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.15)]">
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff7e6] text-brand-red mb-2 shadow-sm">
                      <Wallet className="h-4 w-4" />
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-white/80">
                      {isEn ? u.minCash : "ন্যূনতম ক্যাশ"}
                    </div>
                    <div className="mt-0.5 text-lg font-bold text-white">
                      ৳ {cashMin}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/12 border border-white/25 backdrop-blur-md px-3 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.15)]">
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff7e6] text-brand-red mb-2 shadow-sm">
                      <Trophy className="h-4 w-4" />
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-white/80">
                      {isEn ? u.umrahValue : "উমরাহ ভ্যালু"}
                    </div>
                    <div className="mt-0.5 text-lg font-bold text-white">
                      ৳ {umrahValue}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-white px-4 py-3 flex items-baseline justify-between shadow-lg">
                  <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
                    {isEn ? u.totalReward : "মোট পুরস্কার"}
                  </span>
                  <span className="text-2xl font-bold text-grad-rb">
                    ~ ৳ {totalValue}
                  </span>
                </div>

                <p className="mt-4 text-[11px] leading-relaxed text-white/85">
                  {isEn
                    ? u.heroFootnote
                        .replace("{start}", periodStart)
                        .replace("{end}", periodEnd)
                    : `* বছরের সর্বোচ্চ ২৫ পয়েন্টে ফ্রি উমরাহ, ২০ পয়েন্টে ফ্রি বিদেশ ট্যুর। ${periodStart} – ${periodEnd} পর্যন্ত।`}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
