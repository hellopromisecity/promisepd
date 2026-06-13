"use client";

import Image from "next/image";
import Link from "next/link";
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
import AnimatedBlobs from "./AnimatedBlobs";
import { DIVISIONS, DIVISION_IMAGE, DIVISION_LOGO } from "@/lib/site";
import { DIVISION_EN } from "@/lib/site.en";
import { DICT, localizedPath } from "@/lib/i18n";
import { useLocale } from "./LocaleProvider";

const ICONS: Record<string, LucideIcon> = {
  Building2,
  Hammer,
  Landmark,
  Plane,
  Palette,
};

/** Photo scrim — ONE brand-blue tint over every division photo.  Red
 *  scrims were drowning the real images and looked harsh; a single,
 *  lighter blue keeps the photos clearly visible and on-brand. */
const PHOTO_SCRIM =
  "linear-gradient(135deg, rgba(24,71,161,0.72), rgba(24,71,161,0.38))";

const ACCENT_SOLID: Record<string, string> = {
  red: "bg-brand-red",
  blue: "bg-brand-blue",
  ash: "bg-brand-ash",
  rb: "bg-brand-red",
  ab: "bg-brand-blue",
  ar: "bg-brand-red",
};

const ACCENT_GLOW: Record<string, string> = {
  red: "rgba(225, 25, 36, 0.13)",
  blue: "rgba(24,71,161,0.25)",
  ash: "rgba(192,199,209,0.25)",
  rb: "rgba(225, 25, 36, 0.13)",
  ab: "rgba(24,71,161,0.25)",
  ar: "rgba(225, 25, 36, 0.13)",
};

export default function Divisions() {
  const locale = useLocale();
  const isEn = locale === "en";
  const t = DICT[locale].home;
  return (
    <section
      id="divisions"
      className="relative isolate overflow-hidden py-24 sm:py-32 bg-bg-soft"
    >
      <AnimatedBlobs
        blobs={[
          {
            className:
              "left-[-10%] top-[10%] w-[45vw] h-[45vw] bg-[radial-gradient(circle,rgba(192,199,209,0.16),transparent_60%)]",
            parallax: -100,
          },
          {
            className:
              "right-[-15%] bottom-[10%] w-[50vw] h-[50vw] bg-[radial-gradient(circle,rgba(24,71,161,0.18),transparent_60%)]",
            parallax: 120,
            delay: 5,
          },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-border px-4 py-1.5 text-xs shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-blue animate-pulse" />
            <span className="font-semibold uppercase tracking-[0.18em] text-fg-muted">
              {t.divisions.eyebrow}
            </span>
          </div>
          <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1]">
            {t.divisions.headA}{" "}
            <span className="text-grad">{t.divisions.headB}</span>
          </h2>
          <p className="mt-5 text-base sm:text-lg text-fg-muted leading-relaxed">
            {t.divisions.sub}
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DIVISIONS.map((division, i) => {
            const Icon = ICONS[division.icon] ?? Building2;
            const image = DIVISION_IMAGE[division.slug];
            const logo = DIVISION_LOGO[division.slug];
            const dx = isEn ? DIVISION_EN[division.slug] : null;
            const dName = dx?.name ?? division.nameBn;
            const dDesc = dx?.description ?? division.description;
            const dHi = dx?.highlights ?? division.highlights;
            const isLarge = i === 0; // Promise City featured larger
            return (
              <motion.article
                key={division.slug}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.55, delay: (i % 3) * 0.1 }}
                whileHover={{ y: -8 }}
                className={`card group relative overflow-hidden ${
                  isLarge ? "sm:col-span-2 lg:col-span-2 lg:row-span-1" : ""
                }`}
                style={{ "--glow": ACCENT_GLOW[division.accent] } as React.CSSProperties}
              >
                <div
                  className={`relative ${isLarge ? "min-h-[280px]" : "min-h-[260px]"} flex flex-col`}
                >
                  {/* Header — real project photo (with an accent scrim
                      so it stays on-brand) where we have one, otherwise
                      the solid brand colour. */}
                  <div className="relative h-32 overflow-hidden">
                    {image ? (
                      <>
                        <Image
                          src={image}
                          alt={dName}
                          fill
                          sizes="(min-width:1024px) 420px, (min-width:640px) 50vw, 100vw"
                          className="object-cover"
                        />
                        <div
                          className="absolute inset-0"
                          style={{ background: PHOTO_SCRIM }}
                        />
                      </>
                    ) : (
                      <>
                        <div
                          className={`absolute inset-0 ${
                            ACCENT_SOLID[division.accent] ?? ACCENT_SOLID.red
                          }`}
                        />
                        <div className="absolute inset-0 opacity-25 mix-blend-overlay grid-bg" />
                        <div className="absolute -bottom-12 -right-12 h-40 w-40 rounded-full bg-white/20 blur-3xl animate-blob" />
                        <div className="absolute -top-6 -left-6 h-32 w-32 rounded-full bg-white/15 blur-2xl animate-blob-slow" />
                      </>
                    )}

                    <div className="absolute inset-0 p-5 flex items-center justify-between">
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/95 backdrop-blur-md shadow-lg overflow-hidden p-2">
                        {logo ? (
                          <Image
                            src={logo}
                            alt={dName}
                            width={56}
                            height={56}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Icon className="h-7 w-7 text-fg" />
                        )}
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-[10px] uppercase tracking-[0.2em] ${
                            division.accent === "ash" && !image
                              ? "text-fg-soft"
                              : "text-white/85"
                          }`}
                        >
                          {t.divisionWord} {String(i + 1).padStart(2, "0")}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative flex-1 p-6">
                    <h3 className="text-xl sm:text-2xl font-bold text-fg leading-tight">
                      {dName}
                    </h3>
                    {!isEn && (
                      <div className="text-[11px] uppercase tracking-wider text-fg-faint mt-0.5">
                        {division.nameEn}
                      </div>
                    )}

                    <p className="mt-3 text-sm text-fg-muted leading-relaxed">
                      {dDesc}
                    </p>

                    {isLarge && (
                      <ul className="mt-4 grid grid-cols-2 gap-1.5">
                        {dHi.slice(0, 4).map((h) => (
                          <li
                            key={h}
                            className="text-xs text-fg-soft flex items-center gap-1.5"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-blue" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    )}

                    <Link
                      href={localizedPath(`/${division.slug}`, locale)}
                      className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-grad-rb group/btn"
                    >
                      {t.detailsBtn}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
