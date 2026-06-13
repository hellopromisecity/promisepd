"use client";

/** Localized page header for the blog index. Self-detects locale via
 *  LocaleProvider (defaults to "bn" at the root, "en" under /en), so the
 *  same component drives both /blog and /en/blog. */

import { BookOpen } from "lucide-react";
import { DICT } from "@/lib/i18n";
import { useLocale } from "./LocaleProvider";

export default function BlogHeader() {
  const locale = useLocale();
  const t = DICT[locale].blog;

  return (
    <section className="relative pt-32 pb-10 sm:pt-36 sm:pb-12">
      <div className="absolute inset-0 -z-10 mesh-bg-soft" />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-white border border-border px-4 py-1.5 text-xs shadow-sm">
          <BookOpen className="h-3.5 w-3.5 text-brand-red" />
          <span className="font-semibold uppercase tracking-[0.18em] text-fg-muted">
            {t.journal}
          </span>
        </span>
        <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08]">
          <span className="text-grad">{t.headA}</span> {t.headB}
        </h1>
        <p className="mt-5 text-base sm:text-lg text-fg-muted leading-relaxed max-w-2xl mx-auto">
          {t.sub}
        </p>
      </div>
    </section>
  );
}
