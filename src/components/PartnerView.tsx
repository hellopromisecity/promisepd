"use client";

/** Shared, locale-aware body for the Partner page. Composes the four
 *  partner sections (all already locale-aware) and the final CTA.
 *  Rendered by both /partner (bn) and /en/partner (en). */

import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { SITE } from "@/lib/site";
import { PARTNER_EN } from "@/lib/pages.en";
import PartnerHero from "./PartnerHero";
import PartnerCalculator from "./PartnerCalculator";
import PartnerRules from "./PartnerRules";
import PartnerPoints from "./PartnerPoints";
import { useLocale } from "./LocaleProvider";

export default function PartnerView() {
  const isEn = useLocale() === "en";
  const lp = (href: string) => (isEn ? `/en${href}` : href);

  return (
    <>
      <PartnerHero />
      <PartnerCalculator />
      <PartnerRules />
      <PartnerPoints />

      {/* Final CTA */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grad-border p-8 sm:p-12 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white border border-border px-4 py-1.5 text-xs shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-red animate-pulse" />
              <span className="font-semibold uppercase tracking-[0.18em] text-fg-muted">
                {isEn ? PARTNER_EN.ctaEyebrow : "আজই শুরু করুন"}
              </span>
            </span>
            <h2 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.15]">
              {isEn ? (
                <>
                  {PARTNER_EN.ctaHeadPlain}{" "}
                  <span className="text-grad">{PARTNER_EN.ctaHeadAccent}</span>
                </>
              ) : (
                <>
                  আপনার <span className="text-grad">পার্টনারশিপ</span> যাত্রা এক
                  ফোনকল দূরে।
                </>
              )}
            </h2>
            <p className="mt-4 text-base sm:text-lg text-fg-muted max-w-2xl mx-auto">
              {isEn
                ? PARTNER_EN.ctaBody
                : "ক্যালকুলেটরে দেখা প্ল্যান নিয়ে সরাসরি আমাদের মার্কেটিং টিমের সাথে কথা বলুন — অনবোর্ডিং, ট্রেনিং ও কমিশন স্ট্রাকচার বিস্তারিত বুঝে নিন।"}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={`tel:${SITE.phone}`}
                className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-7 py-3.5 text-base font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark hover:scale-[1.02] transition-all"
              >
                <Phone className="h-4 w-4" />
                {isEn ? SITE.phoneDisplayEn : SITE.phoneDisplay}
              </a>
              <Link
                href={lp("/#contact")}
                className="inline-flex items-center gap-2 rounded-2xl bg-white border border-border px-7 py-3.5 text-base font-semibold text-fg hover:border-brand-blue/40 hover:shadow-lg transition-all"
              >
                <Mail className="h-4 w-4 text-brand-red" />
                {isEn ? PARTNER_EN.sendMsg : "বার্তা পাঠান"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
