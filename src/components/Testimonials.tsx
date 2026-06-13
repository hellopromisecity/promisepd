"use client";

import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { TESTIMONIALS } from "@/lib/site";
import { TESTIMONIALS_EN } from "@/lib/site.en";
import { DICT } from "@/lib/i18n";
import { useLocale } from "./LocaleProvider";

/** DiceBear placeholder avatar — swap for real client photos later. */
function avatarUrl(name: string) {
  const seed = encodeURIComponent(name);
  return `https://api.dicebear.com/9.x/lorelei/svg?seed=${seed}&backgroundColor=f1f5f9`;
}

export default function Testimonials() {
  const locale = useLocale();
  const t = DICT[locale].home.testimonials;
  const source = locale === "en" ? TESTIMONIALS_EN : TESTIMONIALS;
  // Two rows: duplicated so the marquee loop is seamless.
  const row = [...source, ...source];

  return (
    <section
      id="testimonials"
      className="relative isolate overflow-hidden py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-border px-4 py-1.5 text-xs shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-ash animate-pulse" />
            <span className="font-semibold uppercase tracking-[0.18em] text-fg-muted">
              {t.eyebrow}
            </span>
          </div>
          <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1]">
            {t.headA}{" "}
            <span className="text-grad">{t.headB}</span>
          </h2>
        </motion.div>
      </div>

      <div className="relative space-y-5">
        {/* Edge fades */}
        <div className="absolute inset-y-0 left-0 w-24 sm:w-32 z-10 bg-gradient-to-r from-bg to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 sm:w-32 z-10 bg-gradient-to-l from-bg to-transparent pointer-events-none" />

        {/* Row 1 — right → left */}
        <div className="overflow-hidden">
          <div className="flex gap-6 w-max animate-marquee">
            {row.map((t, i) => (
              <TestimonialCard key={`r1-${i}`} t={t} />
            ))}
          </div>
        </div>

        {/* Row 2 — left → right */}
        <div className="overflow-hidden">
          <div className="flex gap-6 w-max animate-marquee-reverse">
            {row.map((t, i) => (
              <TestimonialCard key={`r2-${i}`} t={t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({
  t,
}: {
  t: { name: string; role: string; quote: string };
}) {
  return (
    <article className="grad-border w-[min(380px,85vw)] shrink-0 p-6 sm:p-7">
      <div className="flex items-center justify-between mb-3">
        <Quote className="h-8 w-8 text-brand-red/50" />
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, idx) => (
            <Star
              key={idx}
              className="h-3.5 w-3.5 fill-brand-red text-brand-red"
            />
          ))}
        </div>
      </div>
      <p className="text-sm sm:text-base text-fg-soft leading-relaxed">
        &ldquo;{t.quote}&rdquo;
      </p>
      <div className="mt-5 pt-4 border-t border-border flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl(t.name)}
          alt={t.name}
          className="h-10 w-10 rounded-full bg-brand-ash-tint ring-1 ring-border shrink-0"
          loading="lazy"
        />
        <div className="min-w-0">
          <div className="text-sm font-bold text-fg truncate">{t.name}</div>
          <div className="text-xs text-fg-muted truncate">{t.role}</div>
        </div>
      </div>
    </article>
  );
}
