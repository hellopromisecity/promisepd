"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Star,
  BookOpen,
  Moon,
  BookOpenCheck,
  Coins,
  GraduationCap,
  Award,
  School,
  Trophy,
  Building2,
  Quote,
  Heart,
  Sparkles,
  ArrowRight,
  Phone,
  CalendarDays,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { SITE } from "@/lib/site";
import { STORY_EN } from "@/lib/pages.en";
import { useLocale } from "./LocaleProvider";

type Milestone = {
  year: string;
  title: string;
  desc: string;
  icon: LucideIcon;
};

/** Chronological journey of হাফেজ মাওলানা মুফতি কামরুল হাসান —
 *  birth → deeni education → first business → today's group. */
const MILESTONES: Milestone[] = [
  {
    year: "১৯৮৬",
    title: "জন্ম — ফরিদপুর",
    desc: "১৭ জুলাই ১৯৮৬, বৃহস্পতিবার — ফরিদপুরের সালথা থানার উত্তর চন্ডিবরদী গ্রামে জন্মগ্রহণ। শৈশব থেকেই দ্বীনি শিক্ষা, নৈতিকতা ও অধ্যবসায়ের পথচলা শুরু।",
    icon: Star,
  },
  {
    year: "শৈশব",
    title: "প্রাথমিক শিক্ষা",
    desc: "বল্লভদী প্রাথমিক বিদ্যালয় থেকে প্রাথমিক শিক্ষা সম্পন্ন; এরপর মুকসুদপুর এস জে উচ্চ বিদ্যালয়ে ভর্তি।",
    icon: BookOpen,
  },
  {
    year: "ক্লাস ৭",
    title: "দ্বীনের পথে যাত্রা",
    desc: "সপ্তম শ্রেণিতে অধ্যয়নকালে দ্বীনি শিক্ষার প্রতি গভীর অনুরাগ সৃষ্টি হয় — কাইচাইল হাফেজিয়া মাদরাসায় ভর্তি।",
    icon: Moon,
  },
  {
    year: "২০০৫",
    title: "হিফজুল কুরআন সম্পন্ন",
    desc: "খড়িয়া নুরানিয়া হাফেজিয়া মাদরাসা থেকে সফলভাবে হিফজ সম্পন্ন। একই বছর জামিআ রাহমানিয়া আরাবিয়ার তাইসির বিভাগে ভর্তি হয়ে উচ্চতর দ্বীনি শিক্ষার পথে অগ্রসর।",
    icon: BookOpenCheck,
  },
  {
    year: "২০১০",
    title: "মাত্র ৮,০০০ টাকায় শুরু",
    desc: "শিক্ষাজীবনের পাশাপাশি মাত্র ৮,০০০ টাকা পুঁজি নিয়ে ক্ষুদ্র পরিসরে ব্যবসায়িক যাত্রা শুরু — সততা, পরিশ্রম ও দূরদর্শিতার প্রথম পদক্ষেপ।",
    icon: Coins,
  },
  {
    year: "২০১৩",
    title: "দাখিল উত্তীর্ণ",
    desc: "ঢাকা মোহাম্মদিয়া দাখিল মাদ্রাসা থেকে দাখিল পরীক্ষায় উত্তীর্ণ; উচ্চশিক্ষার জন্য ঢাকা কলেজে ভর্তি।",
    icon: GraduationCap,
  },
  {
    year: "২০১৫",
    title: "তাকমীল — মাস্টার্স সমমান",
    desc: "জামিআ রাহমানিয়া আরাবিয়া থেকে বেফাকুল মাদারিসিল আরাবিয়ার অধীনে তাকমীল (মাস্টার্স সমমান) সম্পন্ন।",
    icon: Award,
  },
  {
    year: "২০১৬",
    title: "এইচএসসি ও বিশ্ববিদ্যালয়",
    desc: "ঢাকা কলেজ থেকে এইচএসসি পাস করে জগন্নাথ বিশ্ববিদ্যালয়ে ভর্তি।",
    icon: School,
  },
  {
    year: "২০২১",
    title: "অনার্স ও মাস্টার্স — সমাজবিজ্ঞান",
    desc: "জগন্নাথ বিশ্ববিদ্যালয়ের সমাজবিজ্ঞান বিভাগ থেকে অনার্স ও মাস্টার্স ডিগ্রি সম্পন্ন।",
    icon: Trophy,
  },
  {
    year: "২০২৬",
    title: "স্বপ্নের সাম্রাজ্য",
    desc: "আজ প্রমিস সিটি, আহবাব রিয়েল এস্টেট ও আহবাব ট্রাভেলস অ্যান্ড ট্যুরসসহ একাধিক সফল প্রতিষ্ঠানের কর্ণধার — হাজারো পরিবারের স্বপ্নের কারিগর।",
    icon: Building2,
  },
];

const IDENTITY: { label: string; value: string }[] = [
  { label: "পিতা", value: "মরহুম হারেছ শেখ" },
  { label: "মাতা", value: "ফয়জরা খাতুন" },
  { label: "গ্রাম", value: "উত্তর চন্ডিবরদী" },
  { label: "থানা", value: "সালথা" },
  { label: "জেলা", value: "ফরিদপুর" },
  { label: "জন্ম", value: "১৭ জুলাই ১৯৮৬ · বৃহস্পতিবার" },
];

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
};

export default function StoryView() {
  const locale = useLocale();
  const isEn = locale === "en";
  const s = STORY_EN;
  // Overlay English text onto the Bengali milestones/identity, preserving
  // each icon, order and structure.
  const milestones = isEn
    ? MILESTONES.map((m, i) => ({ ...m, ...s.milestones[i] }))
    : MILESTONES;
  const identity = isEn ? s.identity : IDENTITY;

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden pt-28 sm:pt-32 pb-16 sm:pb-20">
        <div className="absolute inset-0 -z-10 mesh-bg" />
        <div className="absolute inset-0 -z-10 grid-bg opacity-40" />
        <div className="absolute -top-24 -right-24 -z-10 h-80 w-80 rounded-full bg-brand-blue/15 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 -z-10 h-80 w-80 rounded-full bg-brand-red/10 blur-3xl" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 text-center lg:text-left"
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-white border border-border px-4 py-1.5 text-xs shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-brand-blue" />
                <span className="font-semibold uppercase tracking-[0.18em] text-fg-muted">
                  {isEn ? s.heroEyebrow : "পেছনের গল্প · The Story Behind"}
                </span>
              </span>

              <h1 className="mt-6 text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-[1.12] tracking-tight">
                {isEn ? s.heroTitlePlain : "যাঁর স্বপ্নে আজ"}{" "}
                <span className="text-grad">
                  {isEn ? s.heroTitleAccent : "হাজারো পরিবারের ঠিকানা"}
                </span>
              </h1>

              <p className="mt-5 text-base sm:text-lg text-fg-muted leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {isEn ? (
                  <>
                    {s.heroLead}{" "}
                    <span className="font-bold text-fg">{s.ceoFullName}</span>.
                  </>
                ) : (
                  <>
                    ভাড়ার ঘরে স্বপ্ন দেখা হাজারো মানুষের কষ্টের সঞ্চয় যাঁর হাতে
                    আমানত — তিনি আমাদের প্রিয়{" "}
                    <span className="font-bold text-fg">
                      হাফেজ মাওলানা মুফতি কামরুল হাসান
                    </span>
                    ।
                  </>
                )}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <a
                  href="#journey"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-blue px-6 py-3.5 text-sm sm:text-base font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark hover:scale-[1.02] transition-all"
                >
                  {isEn ? s.journeyReadBtn : "জীবনের গল্প পড়ুন"}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  href={isEn ? "/en/partner" : "/partner"}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white border border-border px-6 py-3.5 text-sm sm:text-base font-semibold text-fg hover:border-brand-blue/40 hover:shadow-lg transition-all"
                >
                  {isEn ? s.joinBtn : "প্রমিস পরিবারে যোগ দিন"}
                </Link>
              </div>
            </motion.div>

            {/* Portrait */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              whileHover={{ y: -6 }}
              className="lg:col-span-5"
            >
              <div className="group relative mx-auto w-[min(22rem,100%)]">
                <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-brand-blue/30 via-transparent to-brand-red/20 blur-md -z-10 transition-opacity duration-500 group-hover:opacity-80" />
                <div className="grad-border overflow-hidden shadow-2xl bg-white transition-shadow duration-500 group-hover:shadow-[0_30px_60px_-15px_rgba(24,71,161,0.45)]">
                  <div className="relative aspect-[4/5]">
                    <Image
                      src="/ceo-v2.webp"
                      alt={isEn ? s.ceoFullName : "হাফেজ মাওলানা মুফতি কামরুল হাসান"}
                      fill
                      priority
                      sizes="(min-width:1024px) 352px, 100vw"
                      className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-fg/70 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                      <div className="text-xl font-bold drop-shadow">
                        {isEn ? s.ceoName : "কামরুল হাসান"}
                      </div>
                      <div className="text-sm text-white/85">
                        {isEn
                          ? s.ceoRole
                          : "প্রতিষ্ঠাতা ও ব্যবস্থাপনা পরিচালক · প্রমিস গ্রুপ"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── EMOTIONAL LEAD + IDENTITY ────────────────────────── */}
      <section className="relative py-14 sm:py-20 bg-bg-soft">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div {...reveal} className="space-y-5 text-base sm:text-lg text-fg-soft leading-relaxed">
            {isEn ? (
              <>
                <p>{s.leadPara1}</p>
                <p>
                  {s.leadPara2A}{" "}
                  <span className="font-bold text-fg">{s.ceoName}</span>.
                </p>
              </>
            ) : (
              <>
                <p>
                  কে এই মানুষ — যাঁর সাফল্যের জন্য দেশ-বিদেশের হাজারো মানুষ মন থেকে
                  দু&apos;আ করেন, যেন তিনি তাঁর স্বপ্ন পূরণ করতে পারেন? কারণ তাঁর
                  স্বপ্ন পূরণ হলেই যে পূরণ হয় হাজারো পরিবারের স্বপ্ন।
                </p>
                <p>
                  কেউ প্রবাসের কষ্টার্জিত আয়, কেউ সারা জীবনের সঞ্চয়, কেউ বা শখের
                  গহনা বিক্রির টাকা — এক টুকরো নিজের ঠিকানার আশায় তাঁর হাতে আমানত
                  রেখেছেন। সমাজের নানা শ্রেণি-পেশা ও নানা প্রান্তের এই মানুষগুলোর
                  আস্থার নাম তিনি — আমাদের সবার প্রিয়{" "}
                  <span className="font-bold text-fg">কামরুল হাসান</span>।
                </p>
              </>
            )}
          </motion.div>

          {/* Identity card */}
          <motion.div
            {...reveal}
            className="mt-10 grad-border p-6 sm:p-8"
          >
            <div className="flex items-center gap-2 mb-5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-blue text-white shadow-md">
                <MapPin className="h-5 w-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold">
                {isEn ? s.identityHeadPlain : "পরিচিতি"}{" "}
                <span className="text-grad">
                  {isEn ? s.identityHeadAccent : "এক নজরে"}
                </span>
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {identity.map((row) => (
                <div
                  key={row.label}
                  className="rounded-xl bg-bg-soft border border-border px-4 py-3"
                >
                  <div className="text-[11px] uppercase tracking-wider font-bold text-fg-faint">
                    {row.label}
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-fg">
                    {row.value}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── JOURNEY TIMELINE ─────────────────────────────────── */}
      <section id="journey" className="relative py-16 sm:py-24 scroll-mt-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-brand-red">
              {isEn ? s.journeyEyebrow : "দুই দশকের পথচলা"}
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.12]">
              {isEn ? s.journeyHeadPlain : "মাইলফলকে গাঁথা"}{" "}
              <span className="text-grad">
                {isEn ? s.journeyHeadAccent : "একটি স্বপ্নযাত্রা"}
              </span>
            </h2>
            <p className="mt-4 text-base text-fg-muted max-w-2xl mx-auto leading-relaxed">
              {isEn
                ? s.journeySub
                : "একটি গ্রামের সাধারণ ছেলে থেকে হাজারো পরিবারের আস্থার নাম — প্রতিটি ধাপে পরিশ্রম, সততা আর আল্লাহর রহমত।"}
            </p>
          </div>

          <div className="relative">
            {/* Spine */}
            <div
              aria-hidden
              className="absolute top-2 bottom-2 left-[1.15rem] lg:left-1/2 w-px lg:-translate-x-1/2 bg-gradient-to-b from-brand-blue via-brand-blue/30 to-brand-red"
            />

            <div className="space-y-7 lg:space-y-0">
              {milestones.map((m, i) => {
                const Icon = m.icon;
                const isLeft = i % 2 === 0;
                return (
                  <motion.div
                    key={m.year + m.title}
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-70px" }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="relative pl-14 lg:pl-0 lg:grid lg:grid-cols-2 lg:gap-x-14 lg:items-center"
                  >
                    {/* Dot + icon on the spine */}
                    <span className="absolute left-0 top-0.5 lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-brand-blue text-white shadow-[var(--shadow-brand)]">
                      <Icon className="h-4 w-4" />
                    </span>

                    {/* Card */}
                    <div
                      className={
                        isLeft
                          ? "lg:col-start-1 lg:pr-14 lg:text-right"
                          : "lg:col-start-2 lg:pl-14"
                      }
                    >
                      <div className="group rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-brand-blue/30">
                        <div
                          className={`flex items-center gap-2 ${
                            isLeft ? "lg:flex-row-reverse" : ""
                          }`}
                        >
                          <span className="text-2xl sm:text-3xl font-extrabold text-grad leading-none">
                            {m.year}
                          </span>
                        </div>
                        <h3 className="mt-2 text-lg font-bold text-fg">
                          {m.title}
                        </h3>
                        <p className="mt-2 text-sm text-fg-muted leading-relaxed">
                          {m.desc}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── PULL QUOTE / IMPACT BAND ─────────────────────────── */}
      <section
        className="relative overflow-hidden py-16 sm:py-24"
        style={{
          background:
            "linear-gradient(135deg, #1847a1 0%, #133680 55%, #0f2a66 100%)",
        }}
      >
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-brand-red" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center text-white">
          <motion.div {...reveal}>
            <Quote className="mx-auto h-10 w-10 text-white/40" />
            <p className="mt-6 text-2xl sm:text-3xl lg:text-[2.5rem] font-bold leading-[1.3]">
              {isEn ? (
                <>
                  {s.quotePlain}{" "}
                  <span className="text-brand-ash">{s.quoteAccent}</span>.
                </>
              ) : (
                <>
                  তিনি হেরে গেলে হেরে যাবে হাজারো-লাখো মানুষের স্বপ্ন — আর তিনি জিতে
                  গেলে জিতে যাবে অসংখ্য মানুষের{" "}
                  <span className="text-brand-ash">ক্ষুদ্র সঞ্চয়</span>।
                </>
              )}
            </p>
            <p className="mt-8 text-base sm:text-lg text-white/85 leading-relaxed max-w-2xl mx-auto">
              {isEn
                ? s.quoteSub
                : "তাই আসুন — আপনি, আমি, আমরা সবাই মিলে প্রমিসকে সামনে এগিয়ে নিই। তাহলে জিতে যাব আমরা সবাই।"}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── DUA + CLOSING ────────────────────────────────────── */}
      <section className="relative py-16 sm:py-24 bg-bg-soft">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...reveal}>
            <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md">
              <Heart className="h-7 w-7 text-brand-red" />
            </span>
            <h2 className="mt-6 text-2xl sm:text-3xl font-bold leading-snug">
              {isEn ? s.duaHeadPlain : "আমাদের"}{" "}
              <span className="text-grad">{isEn ? s.duaHeadAccent : "দু'আ"}</span>
            </h2>
            <p className="mt-5 text-base sm:text-lg text-fg-soft leading-relaxed">
              {isEn
                ? s.duaBody
                : "দয়াময় রব যেন তাঁকে সমস্ত হিংসা-হাসাদ ও বিপদ-আপদ থেকে মুক্ত রেখে তাঁর রহমতের চাদরে সদা আবৃত রাখেন। আল্লাহ তাআলা আমাদের সবাইকে প্রমিসের সাথে এগিয়ে যাওয়ার ও স্বপ্ন পূরণের তাওফিক দান করুন — আমীন।"}
            </p>
            <p className="mt-6 text-lg sm:text-xl font-bold text-grad-rb">
              {isEn ? s.duaTagline : "কারণ প্রমিস মানেই — স্বপ্ন যেখানে বাস্তব।"}
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div {...reveal} className="mt-10">
            <div className="grad-border p-6 sm:p-8">
              <div className="flex items-center justify-center gap-2 text-brand-blue mb-2">
                <CalendarDays className="h-5 w-5" />
                <span className="text-sm font-bold uppercase tracking-wider">
                  {isEn ? s.ctaEyebrow : "আপনার পথচলা শুরু হোক আজই"}
                </span>
              </div>
              <p className="text-base text-fg-muted leading-relaxed">
                {isEn
                  ? s.ctaBody
                  : "স্বপ্নের ঠিকানা হোক, কিংবা প্রমিস পরিবারের অংশীদার — আমরা আপনার পাশে আছি।"}
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={isEn ? "/en/contact" : "/contact"}
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-7 py-3.5 text-base font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark hover:scale-[1.02] transition-all"
                >
                  {isEn ? s.ctaContact : "যোগাযোগ করুন"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={`tel:${SITE.phone}`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white border border-border px-7 py-3.5 text-base font-semibold text-fg hover:border-brand-blue/40 hover:shadow-lg transition-all"
                >
                  <Phone className="h-4 w-4 text-brand-blue" />
                  {isEn ? SITE.phoneDisplayEn : SITE.phoneDisplay}
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
