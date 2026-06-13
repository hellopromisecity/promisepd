"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Ruler, Check, ArrowRight } from "lucide-react";
import AnimatedBlobs from "./AnimatedBlobs";
import { PROJECTS } from "@/lib/site";
import { PROJECT_EN } from "@/lib/site.en";
import { DICT, localizedPath } from "@/lib/i18n";
import { useLocale } from "./LocaleProvider";

const STATUS_DOT: Record<string, string> = {
  red: "bg-brand-red",
  blue: "bg-brand-blue",
  ash: "bg-brand-ash-dark",
};

export default function Projects() {
  const locale = useLocale();
  const isEn = locale === "en";
  const t = DICT[locale].home;
  return (
    <section
      id="projects"
      className="relative isolate overflow-hidden py-24 sm:py-32"
    >
      <AnimatedBlobs
        blobs={[
          {
            className:
              "left-[-15%] top-[20%] w-[45vw] h-[45vw] bg-[radial-gradient(circle,rgba(192,199,209,0.16),transparent_60%)]",
            parallax: -120,
          },
          {
            className:
              "right-[-10%] bottom-[20%] w-[50vw] h-[50vw] bg-[radial-gradient(circle,rgba(24,71,161,0.18),transparent_60%)]",
            parallax: 100,
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
          className="max-w-3xl mx-auto text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-border px-4 py-1.5 text-xs shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-red animate-pulse" />
            <span className="font-semibold uppercase tracking-[0.18em] text-fg-muted">
              {t.projects.eyebrow}
            </span>
          </div>
          <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1]">
            {t.projects.headA}{" "}
            <span className="text-grad">{t.projects.headB}</span>
          </h2>
          <p className="mt-5 text-base sm:text-lg text-fg-muted leading-relaxed">
            {t.projects.sub}
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PROJECTS.map((project, i) => (
            <motion.article
              key={project.slug}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.55, delay: (i % 3) * 0.1 }}
              whileHover={{ y: -8 }}
              className="card group relative h-full overflow-hidden flex flex-col"
            >
              {/* Header — real project photo with a dark scrim so the
                  name + status read clearly on any image. */}
              <Link
                href={localizedPath(`/projects/${project.slug}`, locale)}
                className="relative block h-48 overflow-hidden"
                aria-label={isEn ? PROJECT_EN[project.slug].name : project.name}
              >
                <Image
                  src={project.cover}
                  alt={project.name}
                  fill
                  sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-fg/85 via-fg/25 to-transparent" />

                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md px-3 py-1 text-[11px] font-semibold tracking-wide text-fg shadow-sm">
                    <span
                      className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                        STATUS_DOT[project.accent] ?? STATUS_DOT.red
                      }`}
                    />
                    {isEn ? PROJECT_EN[project.slug].status : project.status}
                  </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-6">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md">
                    {isEn ? PROJECT_EN[project.slug].name : project.name}
                  </h3>
                  {project.size && (
                    <span className="mt-1 inline-flex items-center gap-1 text-xs text-white/95">
                      <Ruler className="h-3 w-3" />
                      {isEn ? PROJECT_EN[project.slug].size : project.size}
                    </span>
                  )}
                </div>
              </Link>

              <div className="relative p-6 flex-1 flex flex-col">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-sm text-fg-muted min-w-0">
                    <MapPin className="h-4 w-4 text-brand-red shrink-0" />
                    {isEn ? PROJECT_EN[project.slug].location : project.location}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] uppercase tracking-wider text-fg-faint">
                      {t.fromPrice}
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-grad-rb whitespace-nowrap">
                      {isEn ? PROJECT_EN[project.slug].price : project.price}
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-sm text-fg-muted leading-relaxed">
                  {isEn ? PROJECT_EN[project.slug].description : project.description}
                </p>

                <ul className="mt-5 space-y-2">
                  {(isEn ? PROJECT_EN[project.slug].highlights : project.highlights).map((h) => (
                    <li
                      key={h}
                      className="flex items-center gap-2 text-xs text-fg-soft"
                    >
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-red-tint text-brand-red">
                        <Check className="h-3 w-3" />
                      </span>
                      {h}
                    </li>
                  ))}
                </ul>

                <Link
                  href={localizedPath(`/projects/${project.slug}`, locale)}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-grad-rb group/btn"
                >
                  {t.detailsBtn}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
