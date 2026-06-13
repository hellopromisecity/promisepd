"use client";

import { motion } from "framer-motion";
import {
  Building2,
  Hammer,
  Landmark,
  Plane,
  Palette,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import AnimatedBlobs from "./AnimatedBlobs";
import PropertyBackdrop from "./PropertyBackdrop";
import { DIVISION_IMAGE, DIVISION_LOGO, type Division } from "@/lib/site";
import { DIVISION_EN } from "@/lib/site.en";
import { DICT, localizedPath, type Locale } from "@/lib/i18n";

/** Per-division architectural backdrop.  Each slug gets a different
 *  photo so visitors flipping between divisions see distinct
 *  scenery — keeps the "city / luxury real-estate" feel from
 *  flattening into one repeated image. */
const DIVISION_BACKDROP: Record<string, string | undefined> = {
  "promise-city": "/ftpics/ft.webp",
  "ahbab-real-estate": "/ahbab1pics/ahbab1pics.webp",
  "promise-international": "/fcpics/fc2.webp",
  "ahbab-travels-tours": "/ftpics/fuzala-2-0.webp",
  "interior-3d-design": "/fcpics/fc3.webp",
};

const ICONS: Record<string, LucideIcon> = {
  Building2,
  Hammer,
  Landmark,
  Plane,
  Palette,
};

/** Solid brand color per division accent (no gradients). */
const ACCENT_SOLID_HEX: Record<string, string> = {
  red: "#e11924",
  blue: "#1847a1",
  ash: "#c0c7d1",
  rb: "#e11924",
  ab: "#1847a1",
  ar: "#e11924",
};

export default function DivisionHero({
  division,
  locale = "bn",
}: {
  division: Division;
  locale?: Locale;
}) {
  const Icon = ICONS[division.icon] ?? Building2;
  const isEn = locale === "en";
  const dx = isEn ? DIVISION_EN[division.slug] : null;
  const dName = dx?.name ?? division.nameBn;
  const dTagline = dx?.tagline ?? division.tagline;
  const dDesc = dx?.description ?? division.description;
  const dHi = dx?.highlights ?? division.highlights;
  const t = DICT[locale].divDetail;
  const lp = (href: string) => localizedPath(href, locale);

  const backdrop = DIVISION_BACKDROP[division.slug];
  const image = DIVISION_IMAGE[division.slug];
  const logo = DIVISION_LOGO[division.slug];
  // Brand-blue scrim over the photo so the card reads on-brand (matches
  // the homepage hero showcase card) instead of a flat red panel.
  const hex = "#1847a1";

  return (
    <section className="relative isolate flex min-h-[80svh] items-center overflow-hidden pt-28 pb-16">
      {backdrop && (
        <PropertyBackdrop
          src={backdrop}
          alt={division.nameEn}
          intensity={30}
          bluewash="soft"
        />
      )}
      <div className="absolute inset-0 -z-10 mesh-bg" />
      <AnimatedBlobs />
      <div className="absolute inset-0 -z-10 grid-bg opacity-50" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-7"
          >
            <Link
              href={lp("/#divisions")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted hover:text-fg transition-colors"
            >
              ← {t.backToDivisions}
            </Link>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white border border-border px-4 py-1.5 text-xs shadow-sm">
              <span className="font-semibold uppercase tracking-[0.18em] text-fg-muted">
                {division.nameEn}
              </span>
            </div>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1]">
              <span className="text-grad">{dName}</span>
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-fg-soft leading-relaxed font-medium">
              {dTagline}
            </p>
            <p className="mt-4 text-base sm:text-lg text-fg-muted leading-relaxed max-w-2xl">
              {dDesc}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href={lp("/#contact")}
                className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-7 py-3.5 text-base font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark hover:scale-[1.02] transition-all"
              >
                {t.consult}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={lp("/#divisions")}
                className="inline-flex items-center gap-2 rounded-2xl bg-white border border-border px-7 py-3.5 text-base font-semibold text-fg hover:border-brand-blue/40 transition-all"
              >
                {t.otherDivisions}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -4 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5"
          >
            <div
              className="relative rounded-3xl p-10 sm:p-12 overflow-hidden shadow-2xl"
              style={image ? undefined : { backgroundColor: ACCENT_SOLID_HEX[division.accent] }}
            >
              {image ? (
                <>
                  {/* Real division photo + brand-blue scrim */}
                  <Image
                    src={image}
                    alt={dName}
                    fill
                    sizes="(min-width:1024px) 440px, 100vw"
                    className="object-cover"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(to bottom, ${hex}59 0%, ${hex}c4 55%, ${hex}f2 100%)`,
                    }}
                  />
                </>
              ) : (
                <>
                  <div className="absolute inset-0 opacity-25 mix-blend-overlay grid-bg" />
                  <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-white/20 blur-3xl animate-blob" />
                  <div className="absolute -top-12 -left-12 h-48 w-48 rounded-full bg-white/15 blur-2xl animate-blob-slow" />
                </>
              )}

              <div className="relative">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-white/95 backdrop-blur-md shadow-xl overflow-hidden p-2.5">
                  {logo ? (
                    <Image
                      src={logo}
                      alt={dName}
                      width={80}
                      height={80}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Icon className="h-10 w-10 text-fg" />
                  )}
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3">
                  {dHi.slice(0, 4).map((h) => (
                    <div
                      key={h}
                      className="rounded-xl px-3 py-2.5 text-xs sm:text-sm font-medium backdrop-blur-md border bg-white/15 border-white/25 text-white"
                    >
                      {h}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
