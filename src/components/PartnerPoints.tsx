"use client";

/** Points system + two annual rewards (Free Foreign Tour @ 20 pts,
 *  Free Umrah @ 25 pts).  Designed as a "ladder" so it's instantly
 *  clear how points stack toward each reward.
 *
 *  Each reward card now sits on top of an actual destination photo
 *  (Kaaba for Umrah, an iconic international landmark for the tour),
 *  with a brand-tinted gradient stack on top for readability.
 *  Same premium overlay system used on the Madina partner hero. */

import Image from "next/image";
import { motion } from "framer-motion";
import { Plane, Sparkles, Star } from "lucide-react";
import {
  POINT_RULES,
  PARTNER_AWARDS,
  PARTNER_PERIOD,
  bnNumber,
} from "@/lib/partner";
import { PARTNER_EN } from "@/lib/pages.en";
import { useLocale } from "./LocaleProvider";

const AWARD_ICONS = { red: Sparkles, blue: Plane } as const;

// Per-accent backdrop photo + bottom-gradient anchor tint.  Red
// accent → Kaaba (Umrah reward).  Blue accent → tour scene
// (Foreign Tour reward).  Photos are user-supplied Unsplash
// captures dropped into /public.
const AWARD_BACKDROP: Record<"red" | "blue", { src: string; alt: string }> = {
  red: { src: "/kaaba.webp", alt: "Kaaba, Makkah" },
  blue: { src: "/tour.webp", alt: "International tour destination" },
};

const ANCHOR_GRADIENT: Record<"red" | "blue", string> = {
  red: "bg-gradient-to-b from-brand-red-dark/30 via-brand-red-dark/65 to-brand-red-dark/92",
  blue: "bg-gradient-to-b from-brand-blue-dark/30 via-brand-blue-dark/65 to-brand-blue-dark/92",
};

export default function PartnerPoints() {
  const isEn = useLocale() === "en";
  const u = PARTNER_EN.ui;
  const periodStart = isEn ? PARTNER_EN.periodStart : PARTNER_PERIOD.startBn;
  const periodEnd = isEn ? PARTNER_EN.periodEnd : PARTNER_PERIOD.endBn;
  const num = (n: number) => (isEn ? String(n) : bnNumber(n));
  const points = isEn
    ? POINT_RULES.map((p, i) => ({ ...p, ...PARTNER_EN.points[i] }))
    : POINT_RULES;

  return (
    <section className="relative py-20 sm:py-28 bg-bg-soft">
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
              {isEn ? u.pointsEyebrow : "পয়েন্ট সিস্টেম"}
            </span>
          </div>
          <h2 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.15]">
            {isEn ? u.pointsH1A : "পয়েন্ট জমান —"}{" "}
            <span className="text-grad">
              {isEn ? u.pointsH1Grad : "পুরস্কার আনুন।"}
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-fg-muted leading-relaxed">
            {isEn
              ? u.pointsSub.replace("{start}", periodStart).replace("{end}", periodEnd)
              : `${periodStart} – ${periodEnd} পর্যন্ত পয়েন্ট অর্জন করুন। নির্দিষ্ট থ্রেশহোল্ডে পৌঁছালে কোম্পানির খরচে ফ্রি পুরস্কার।`}
          </p>
        </motion.div>

        {/* Awards ladder — each card a destination photo backed by a
            brand-tinted gradient stack for legibility. */}
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {PARTNER_AWARDS.map((award, i) => {
            const Icon = AWARD_ICONS[award.accent];
            const photo = AWARD_BACKDROP[award.accent];
            const anchor = ANCHOR_GRADIENT[award.accent];
            return (
              <motion.div
                key={award.titleEn}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative rounded-3xl overflow-hidden shadow-xl text-white ring-1 ring-white/10 min-h-[280px]"
              >
                {/* Destination photo — Kaaba for Umrah, tour landmark
                    for foreign trip. */}
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />

                {/* Overlay stack — same pattern as the Madina hero
                    so the two cards feel familial with the rest of
                    the page.  Bottom-heavy brand-colour gradient +
                    warm gold radial top-right + subtle vignette. */}
                <div className={`absolute inset-0 ${anchor}`} />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(255,196,107,0.22),transparent_55%)]" />
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-black/15" />

                {/* Content */}
                <div className="relative p-8">
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff7e6] shadow-lg ring-1 ring-amber-200/50">
                      <Icon className="h-7 w-7 text-fg" />
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-white/85">
                        {isEn ? u.target : "লক্ষ্য"}
                      </div>
                      <div className="text-3xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
                        {num(award.threshold)}{" "}
                        <span className="text-base font-semibold">
                          {isEn ? u.pointsWord : "পয়েন্ট"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <h3 className="mt-6 text-2xl sm:text-3xl font-bold leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
                    {isEn ? PARTNER_EN.awards[award.threshold]?.title ?? award.titleEn : award.titleBn}
                  </h3>
                  <p className="mt-2 text-sm text-white/90 leading-relaxed">
                    {isEn ? PARTNER_EN.awards[award.threshold]?.description ?? award.description : award.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Point earning table */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 card p-6 sm:p-8"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red text-white shadow-md">
              <Star className="h-5 w-5" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-fg">
              {isEn ? u.howToEarn : "পয়েন্ট কীভাবে অর্জন করবেন"}
            </h3>
          </div>

          <ul className="divide-y divide-border">
            {points.map((p) => (
              <li
                key={p.item}
                className="flex items-start justify-between gap-4 py-3.5"
              >
                <span className="text-sm sm:text-base text-fg-soft leading-relaxed">
                  {p.item}
                </span>
                <span className="shrink-0 text-sm sm:text-base font-bold text-grad-rb whitespace-nowrap">
                  {p.points}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
