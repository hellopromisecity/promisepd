"use client";

/** Shared, locale-aware detail wrapper for a single form. Rendered by
 *  both /forms/[slug] (bn) and /en/forms/[slug] (en). The chrome (back
 *  link, "coming soon" block) localizes, but the FormFiller — the actual
 *  official form being filled — stays Bengali in both versions. */

import Image from "next/image";
import Link from "next/link";
import { Clock, ArrowLeft, Phone } from "lucide-react";
import FormFiller from "./FormFiller";
import { type FormDef } from "@/lib/forms";
import { SITE } from "@/lib/site";
import { FORMS_EN } from "@/lib/pages.en";
import { useLocale } from "./LocaleProvider";

export default function FormDetail({ form }: { form: FormDef }) {
  const isEn = useLocale() === "en";
  const t = FORMS_EN;
  const name = isEn ? t.names[form.slug]?.name ?? form.nameBn : form.nameBn;

  return (
    <section className="relative pt-28 sm:pt-32 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          href={isEn ? "/en/forms" : "/forms"}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg-muted hover:text-brand-blue transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {isEn ? t.backToForms : "সব ফরম"}
        </Link>
      </div>

      {form.ready ? (
        <FormFiller form={form} />
      ) : (
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 text-center">
          <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md">
            <Clock className="h-7 w-7 text-brand-blue" />
          </span>
          <h1 className="mt-6 text-2xl sm:text-3xl font-bold">{name}</h1>
          <p className="mt-3 text-fg-muted leading-relaxed max-w-xl mx-auto">
            {isEn
              ? t.notReadyBody
              : "এই ফরমটি অনলাইনে পূরণের সুবিধা খুব শীঘ্রই যুক্ত হচ্ছে — ইন শা আল্লাহ। এখনই আবেদন করতে আমাদের অফিসে যোগাযোগ করুন।"}
          </p>
          <a
            href={`tel:${SITE.phone}`}
            className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-6 py-3.5 text-sm font-bold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark transition-colors"
          >
            <Phone className="h-4 w-4" />
            {isEn ? SITE.phoneDisplayEn : SITE.phoneDisplay}
          </a>

          <div className="mt-10 rounded-2xl border border-border bg-white shadow-lg overflow-hidden max-w-md mx-auto">
            <Image
              src={form.pages[0]}
              alt={name}
              width={760}
              height={1075}
              className="w-full h-auto"
            />
          </div>
        </div>
      )}
    </section>
  );
}
