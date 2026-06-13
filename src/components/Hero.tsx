"use client";

import Link from "next/link";
import Image from "next/image";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Play,
  ShieldCheck,
  Award,
  MapPin,
  Wallet,
  Building2,
  Hammer,
  Landmark,
  Plane,
  Palette,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import AnimatedBlobs from "./AnimatedBlobs";
import PropertyBackdrop from "./PropertyBackdrop";
import TypeOnce from "./TypeOnce";
import PromoVideoButton from "./PromoVideoButton";
import { DIVISIONS, DIVISION_LOGO } from "@/lib/site";
import { DIVISION_EN } from "@/lib/site.en";
import { DICT, localizedPath } from "@/lib/i18n";
import { useLocale } from "./LocaleProvider";
import { toBn } from "@/lib/bn";

const ICONS: Record<string, LucideIcon> = {
  Building2,
  Hammer,
  Landmark,
  Plane,
  Palette,
};

/** Real photo per division for the hero showcase card.  Two are
 *  supplied so far; the rest fall back to the solid accent fill
 *  above until their images land in /public. */
const DIVISION_CARD_IMAGE: Record<string, string | undefined> = {
  "promise-city": "/promisecity.webp",
  "ahbab-real-estate": "/ahbab.webp",
  "promise-international": "/savings.webp",
  "ahbab-travels-tours": "/kaaba.webp",
  "interior-3d-design": "/interior3d.webp",
};

// The hero now reads in ONE brand colour — blue — across every
// division.  These maps used to vary by accent (red / ash), but the
// client wants the whole rotation unified on blue (kicker badge,
// tagline, dot indicators, typewriter cursor, and the showcase
// card).  Every key resolves to the blue variant so no usage site
// needs to change.
const ACCENT_SOLID_CLASS: Record<string, string> = {
  red: "bg-brand-blue",
  blue: "bg-brand-blue",
  ash: "bg-brand-blue",
  rb: "bg-brand-blue",
  ab: "bg-brand-blue",
  ar: "bg-brand-blue",
};

const ACCENT_TEXT: Record<string, string> = {
  red: "text-brand-blue",
  blue: "text-brand-blue",
  ash: "text-brand-blue",
  rb: "text-brand-blue",
  ab: "text-brand-blue",
  ar: "text-brand-blue",
};

/** Cursor color for the typewriter on the H1 — blue everywhere. */
const ACCENT_CURSOR: Record<string, string> = {
  red: "#1847a1",
  blue: "#1847a1",
  ash: "#1847a1",
  rb: "#1847a1",
  ab: "#1847a1",
  ar: "#1847a1",
};

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  // Parallax for the content column — the old `opacity` + `videoScale`
  // transforms came out with the promo-video layer.
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 100]);

  // Auto-rotate divisions every 7.5s. No pause-on-hover — hover was firing
  // immediately on page load (cursor naturally over hero) and freezing the
  // rotation forever. User can still jump via dot indicators below.
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(
      () => setIdx((i) => (i + 1) % DIVISIONS.length),
      7500,
    );
    return () => clearInterval(t);
  }, [reduce]);

  const locale = useLocale();
  const isEn = locale === "en";
  const tr = DICT[locale].home;

  const current = DIVISIONS[idx];
  const dx = isEn ? DIVISION_EN[current.slug] : null;
  const curName = dx?.name ?? current.nameBn;
  const curTagline = dx?.tagline ?? current.tagline;
  const curDesc = dx?.description ?? current.description;
  const curHeroTitle = dx?.heroTitle ?? current.heroTitle;
  const curHighlights = dx?.highlights ?? current.highlights;
  const Icon = ICONS[current.icon] ?? Building2;
  const accentSolidClass = ACCENT_SOLID_CLASS[current.accent];
  const accentText = ACCENT_TEXT[current.accent];

  // Title gets a split treatment: the first half fades in, the second
  // half types out (typewriter).  Both effects stay OFF on the very
  // first paint (LCP-safe) and play on every rotation after that.
  const playedRef = useRef(false);
  const playEffects = playedRef.current;
  useEffect(() => {
    playedRef.current = true;
  }, []);
  const titleWords = curHeroTitle.split(" ");
  const splitAt = Math.ceil(titleWords.length / 2);
  const titleFade = titleWords.slice(0, splitAt).join(" ");
  const titleType = titleWords.slice(splitAt).join(" ");

  return (
    <section
      id="home"
      ref={ref}
      className="relative isolate min-h-[100svh] overflow-hidden pt-24 sm:pt-28 pb-12 flex flex-col"
    >
      {/* Architectural backdrop — slideshow of three Fuzala Tower
          angles.  Auto-rotates every 7 s with a 1.4 s crossfade.
          Sits at -z-30, behind the mesh-bg + blobs, so the brand
          colours still ride on top.  Respects reduced-motion. */}
      <PropertyBackdrop
        src={[
          "/ftpics/ftt1.webp", // ফুজালা টাওয়ার
          "/ahbab2pics/ahbab2pics.jpeg", // আহবাব প্যালেস ০২
          "/ftpics/ft.webp", // ফুজালা টাওয়ার
          "/ftpics/fuzala-2-0.webp", // ফুজালা টাওয়ার
          "/ahbab1pics/ahbab1pics.webp", // আহবাব প্যালেস ০১
          "/fcpics/fc1.webp", // ফুজালা কমপ্লেক্স
        ]}
        alt={isEn ? "PromisePD projects" : "প্রমিস পিপিডি-র প্রকল্পসমূহ"}
        intensity={38}
        position="center"
        bluewash="soft"
        intervalMs={7000}
      />

      <div className="absolute inset-0 -z-10 mesh-bg" />
      <AnimatedBlobs />
      <div className="absolute inset-0 -z-10 grid-bg opacity-40" />
      <div className="noise" />

      {/* Main content */}
      <motion.div
        style={{ y }}
        className="relative z-10 flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 flex items-start lg:items-center"
      >
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 w-full items-center">
          {/* LEFT — content */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={idx}
                // Slide only — no opacity hiding — so the hero text paints
                // with first paint (huge LCP / Speed-Index win) instead of
                // waiting for JS to fade it in.
                initial={{ y: 16 }}
                animate={{ y: 0 }}
                exit={{ y: -12 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Service kicker */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full ${accentSolidClass} px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-white tracking-wider shadow-md`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    {isEn ? `${idx + 1} / 5` : `${toBn(idx + 1)} / ৫`} ·{" "}
                    {curName}
                  </span>
                  <span className="text-[11px] sm:text-xs uppercase tracking-[0.18em] text-brand-blue font-bold">
                    {current.nameEn}
                  </span>
                </div>

                {/* Big title — first half fades in, second half types
                    out (typewriter) on each rotation. */}
                <h1 className="mt-5 text-[clamp(1.875rem,4.6vw,3.75rem)] font-extrabold leading-[1.15] tracking-tight text-fg max-w-[22ch] min-h-[1.5em]">
                  <motion.span
                    initial={playEffects ? { opacity: 0 } : false}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                  >
                    {titleFade}
                    {titleType ? " " : ""}
                  </motion.span>
                  {titleType && (
                    <TypeOnce
                      text={titleType}
                      speed={45}
                      cursorColor={ACCENT_CURSOR[current.accent]}
                      animate={playEffects}
                    />
                  )}
                </h1>

                {/* Tagline — rendered immediately (no fade delay) for SI/LCP */}
                <p
                  className={`mt-4 text-[clamp(1.05rem,1.6vw,1.375rem)] font-bold ${accentText}`}
                >
                  {curTagline}
                </p>

                {/* Description */}
                <p className="mt-3 text-[clamp(0.95rem,1.2vw,1.0625rem)] text-fg-muted leading-relaxed max-w-2xl">
                  {curDesc}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* CTAs */}
            <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href={localizedPath(`/${current.slug}`, locale)}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-blue px-6 py-3.5 text-sm sm:text-base font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark hover:scale-[1.02] transition-all"
              >
                {tr.detailsBtn}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              {/* Click → opens the promo video in a lightbox modal. */}
              <PromoVideoButton>{tr.aboutBtn}</PromoVideoButton>
            </div>

            {/* Dot indicators */}
            <div className="mt-6 flex items-center gap-2.5">
              {DIVISIONS.map((d, i) => {
                const active = i === idx;
                return (
                  <button
                    key={d.slug}
                    onClick={() => setIdx(i)}
                    aria-label={isEn ? DIVISION_EN[d.slug]?.name ?? d.nameBn : d.nameBn}
                    // 24×24 hit area (a11y touch-target) with the small
                    // visual dot centred inside — negative margin keeps the
                    // dots visually tight.
                    className="group inline-flex h-6 w-6 -mx-1.5 items-center justify-center"
                  >
                    <span
                      className={`block transition-all duration-500 ease-out rounded-full ${
                        active
                          ? `w-9 h-1.5 ${ACCENT_SOLID_CLASS[d.accent]}`
                          : "w-1.5 h-1.5 bg-fg-faint/40 group-hover:bg-fg-faint/70"
                      }`}
                    />
                  </button>
                );
              })}
              <span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-fg-faint">
                {tr.autoRotate}
              </span>
            </div>

            {/* Trust chips */}
            <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-2xl">
              {[
                { icon: ShieldCheck, label: tr.trustChips[0], color: "text-brand-blue" },
                { icon: Award, label: tr.trustChips[1], color: "text-brand-blue" },
                { icon: MapPin, label: tr.trustChips[2], color: "text-brand-blue" },
                { icon: Wallet, label: tr.trustChips[3], color: "text-brand-blue" },
              ].map((feature, i) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.06 }}
                  className="flex items-center gap-2 rounded-xl bg-white/90 backdrop-blur-sm border border-border px-3 py-2 text-xs sm:text-sm shadow-sm"
                >
                  <feature.icon className={`h-4 w-4 shrink-0 ${feature.color}`} />
                  <span className="font-medium text-fg-soft truncate">
                    {feature.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* RIGHT — visual showcase card */}
          <div className="lg:col-span-5">
            <div className="relative">
              <div className="absolute -inset-4 sm:-inset-6 rounded-[2rem] bg-gradient-to-br from-white/40 to-white/0 -z-10" />

              {/* The card BOX stays fixed (solid brand-blue surface).
                  Only the photo crossfades and the text fades in when the
                  division rotates — no slide / scale / card rebuild. */}
              {(() => {
                const cardImage = DIVISION_CARD_IMAGE[current.slug];
                const logo = DIVISION_LOGO[current.slug];
                const hex = "#1847a1";
                const chipCls =
                  "bg-white/92 border border-white/60 text-fg font-semibold shadow-sm";
                return (
                  <div
                    className="relative rounded-[1.75rem] p-7 sm:p-9 overflow-hidden shadow-2xl"
                    style={{ backgroundColor: hex }}
                  >
                    {/* Crossfading photo layer — old fades out while the
                        new one fades in, over the static blue box. */}
                    <AnimatePresence>
                      {cardImage && (
                        <motion.div
                          key={cardImage}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.7, ease: "easeInOut" }}
                          className="absolute inset-0"
                        >
                          <Image
                            src={cardImage}
                            alt={isEn ? current.nameEn : current.nameBn}
                            fill
                            sizes="(min-width: 1024px) 440px, 100vw"
                            className="object-cover"
                            priority={idx === 0}
                          />
                          <div
                            className="absolute inset-0"
                            style={{
                              background: `linear-gradient(to bottom, ${hex}30 0%, ${hex}aa 50%, ${hex}f2 100%)`,
                            }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Content — keyed remount = simple fade-in, no
                        slide.  Sits at opacity 0 in layout first, so the
                        box height never collapses during the swap. */}
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="relative"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] uppercase tracking-[0.25em] font-semibold text-white/85">
                          {tr.divisionWord}{" "}
                          {isEn
                            ? String(idx + 1).padStart(2, "0")
                            : toBn(idx + 1).padStart(2, "০")}
                        </div>
                        <Sparkles className="h-5 w-5 text-white/70" />
                      </div>

                      <div className="mt-7 inline-flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-3xl bg-white/95 backdrop-blur-md shadow-xl overflow-hidden p-2 sm:p-2.5">
                        {logo ? (
                          <Image
                            src={logo}
                            alt={isEn ? current.nameEn : current.nameBn}
                            width={112}
                            height={112}
                            className="h-full w-full object-contain"
                            priority={idx === 0}
                          />
                        ) : (
                          <Icon className="h-12 w-12 sm:h-14 sm:w-14 text-fg" />
                        )}
                      </div>

                      <p className="mt-6 text-2xl sm:text-3xl font-bold leading-tight text-white drop-shadow-md">
                        {curName}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-white/95">
                        {curTagline}
                      </p>

                      <div className="mt-7 grid grid-cols-2 gap-2.5">
                        {curHighlights.slice(0, 4).map((h) => (
                          <div
                            key={h}
                            className={`rounded-xl px-3 py-2.5 text-[11px] sm:text-xs leading-snug ${chipCls}`}
                          >
                            {h}
                          </div>
                        ))}
                      </div>

                      <Link
                        href={localizedPath(`/${current.slug}`, locale)}
                        className="mt-7 inline-flex items-center gap-1.5 rounded-xl bg-white text-fg px-4 py-2.5 text-sm font-bold shadow-md hover:scale-[1.03] transition-transform"
                      >
                        {tr.viewDivision}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </motion.div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="relative z-10 flex justify-center mt-8 sm:mt-4 lg:mt-0 pt-4 pb-2"
      >
        <div className="flex flex-col items-center gap-1.5 text-fg-faint">
          <span className="text-[10px] uppercase tracking-[0.3em]">
            {isEn ? "Scroll down" : "নিচে নামুন"}
          </span>
          <div className="h-8 w-5 rounded-full border-2 border-fg-faint/40 flex justify-center p-1">
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="h-1.5 w-1 rounded-full bg-brand-red"
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
