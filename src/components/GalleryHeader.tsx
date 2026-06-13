"use client";

/** Localized hero header for the gallery index — self-detects locale via
 *  LocaleProvider (bn at root, en under /en). Used by /gallery and
 *  /en/gallery. */

import { Images } from "lucide-react";
import PropertyBackdrop from "./PropertyBackdrop";
import { GALLERY_EN } from "@/lib/pages.en";
import { useLocale } from "./LocaleProvider";

export default function GalleryHeader() {
  const isEn = useLocale() === "en";
  const g = GALLERY_EN;

  return (
    <section className="relative isolate overflow-hidden pt-32 pb-12 sm:pt-36 sm:pb-14">
      <PropertyBackdrop
        src="/ftpics/ft.webp"
        alt="Promise City"
        intensity={26}
        bluewash="soft"
      />
      <div className="absolute inset-0 -z-10 mesh-bg-soft" />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-white border border-border px-4 py-1.5 text-xs shadow-sm">
          <Images className="h-3.5 w-3.5 text-brand-blue" />
          <span className="font-semibold uppercase tracking-[0.18em] text-fg-muted">
            {isEn ? g.eyebrow : "গ্যালারি"}
          </span>
        </span>
        <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08]">
          {isEn ? g.h1Plain : "আমাদের কাজের"}{" "}
          <span className="text-grad">{isEn ? g.h1Accent : "ঝলক।"}</span>
        </h1>
        <p className="mt-5 text-base sm:text-lg text-fg-muted leading-relaxed max-w-2xl mx-auto">
          {isEn
            ? g.sub
            : "ফুজালা টাওয়ার, ফুজালা কমপ্লেক্স, আহবাব প্যালেস — আমাদের চলমান ও সম্পন্ন প্রকল্পের সর্বশেষ ছবি এবং YouTube চ্যানেলের নতুন ভিডিও, সব এক জায়গায়।"}
        </p>
      </div>
    </section>
  );
}
