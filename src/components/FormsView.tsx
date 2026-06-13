"use client";

/** Shared, locale-aware forms index. Rendered by both /forms (bn) and
 *  /en/forms (en). Chrome + form NAMES localize, but the official form
 *  document itself (FormFiller) stays Bengali in both versions. */

import Image from "next/image";
import Link from "next/link";
import { FileText, ArrowRight, Clock } from "lucide-react";
import { FORMS } from "@/lib/forms";
import { FORMS_EN } from "@/lib/pages.en";
import { useLocale } from "./LocaleProvider";

export default function FormsView() {
  const isEn = useLocale() === "en";
  const t = FORMS_EN;
  const lp = (href: string) => (isEn ? `/en${href}` : href);
  const nameOf = (slug: string, bn: string) =>
    isEn ? t.names[slug]?.name ?? bn : bn;
  const descOf = (slug: string, bn: string) =>
    isEn ? t.names[slug]?.description ?? bn : bn;

  return (
    <>
      <section className="relative pt-32 pb-10 sm:pt-36 sm:pb-12">
        <div className="absolute inset-0 -z-10 mesh-bg-soft" />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white border border-border px-4 py-1.5 text-xs shadow-sm">
            <FileText className="h-3.5 w-3.5 text-brand-blue" />
            <span className="font-semibold uppercase tracking-[0.18em] text-fg-muted">
              {isEn ? t.eyebrow : "অনলাইন ফর্ম"}
            </span>
          </span>
          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08]">
            {isEn ? t.h1Plain : "অফিসিয়াল ফরম,"}{" "}
            <span className="text-grad">
              {isEn ? t.h1Accent : "অনলাইনেই পূরণ"}
            </span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-fg-muted leading-relaxed max-w-2xl mx-auto">
            {isEn
              ? t.sub
              : "পছন্দের ফরমটি বেছে নিন, তথ্য দিন — পূরণকৃত ফরমটি হুবহু অফিসিয়াল ডিজাইনে তৈরি হয়ে সরাসরি আমাদের অফিসে পৌঁছে যাবে।"}
          </p>
        </div>
      </section>

      <section className="relative pb-20 sm:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FORMS.map((f) => {
              const name = nameOf(f.slug, f.nameBn);
              const Card = (
                <div className="group card overflow-hidden flex flex-col h-full">
                  <div className="relative aspect-[1/1.1] overflow-hidden bg-bg-soft border-b border-border">
                    <Image
                      src={f.pages[0]}
                      alt={name}
                      fill
                      sizes="(min-width:1024px) 380px, (min-width:640px) 50vw, 100vw"
                      className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    {!f.ready && (
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-fg/80 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                        <Clock className="h-3 w-3" />
                        {isEn ? t.soonBadge : "শীঘ্রই"}
                      </span>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-fg group-hover:text-brand-blue transition-colors">
                      {name}
                    </h3>
                    <p className="mt-2 text-sm text-fg-muted leading-relaxed flex-1">
                      {descOf(f.slug, f.description)}
                    </p>
                    <span
                      className={`mt-4 inline-flex items-center gap-1.5 text-sm font-bold ${
                        f.ready ? "text-brand-blue" : "text-fg-faint"
                      }`}
                    >
                      {f.ready
                        ? isEn
                          ? t.fillBtn
                          : "ফরম পূরণ করুন"
                        : isEn
                          ? t.comingBtn
                          : "প্রস্তুত হচ্ছে"}
                      {f.ready && (
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      )}
                    </span>
                  </div>
                </div>
              );
              return f.ready ? (
                <Link key={f.slug} href={lp(`/forms/${f.slug}`)} className="block h-full">
                  {Card}
                </Link>
              ) : (
                <div key={f.slug} className="h-full cursor-default opacity-90">
                  {Card}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
