"use client";

import { useState } from "react";
import { Building2, Phone, ChevronDown } from "lucide-react";
import { toBn } from "@/lib/bn";
import { DICT, type Locale } from "@/lib/i18n";

type Filter = "available" | "booked" | "all";

/** Fuzala-Tower-style limited-share map.  `total` numbered shares,
 *  the first `sold` are gone, the rest are open & tap-to-book. */
export default function ShareAvailability({
  total,
  sold,
  note,
  phone,
  locale = "bn",
}: {
  total: number;
  sold: number;
  note?: string;
  phone: string;
  locale?: Locale;
}) {
  const [filter, setFilter] = useState<Filter>("available");
  const remaining = total - sold;
  const isEn = locale === "en";
  const t = DICT[locale].projDetail.share;
  const num = (n: number) => (isEn ? String(n) : toBn(n));

  // Numbers to render, based on the current filter.
  const numbers: number[] = [];
  for (let n = 1; n <= total; n++) {
    const isAvailable = n > sold;
    if (
      filter === "all" ||
      (filter === "available" && isAvailable) ||
      (filter === "booked" && !isAvailable)
    ) {
      numbers.push(n);
    }
  }

  return (
    <section className="relative py-12 sm:py-16 bg-bg-soft">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="h-6 w-6 text-brand-blue" />
          <h2 className="text-2xl sm:text-3xl font-bold">
            {t.headA} <span className="text-grad">{t.headB}</span>
          </h2>
        </div>
        <p className="text-sm sm:text-base text-fg-muted mb-5">
          {t.total(num(total))} · {t.soldCount(num(sold))} ·{" "}
          <span className="font-bold text-brand-red">{t.remaining(num(remaining))}</span>
        </p>

        {/* Filter dropdown + legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <label className="relative inline-flex items-center">
            <span className="sr-only">{t.headA}</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as Filter)}
              aria-label={t.headA}
              className="appearance-none rounded-xl border border-border bg-white pl-4 pr-10 py-2.5 text-sm font-semibold text-fg shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30 cursor-pointer"
            >
              <option value="available">{t.filterOpen(num(remaining))}</option>
              <option value="booked">{t.filterSold(num(sold))}</option>
              <option value="all">{t.filterAll(num(total))}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-fg-muted" />
          </label>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-fg-soft">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 rounded bg-brand-blue/15 border border-brand-blue/50" />
              {t.legendOpen}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 rounded bg-brand-red/10 border border-brand-red/30" />
              {t.legendSold}
            </span>
          </div>
        </div>

        {/* Share grid */}
        <div className="rounded-2xl border border-border bg-white p-3 sm:p-4">
          <div className="grid grid-cols-6 sm:grid-cols-10 lg:grid-cols-12 gap-1.5 sm:gap-2">
            {numbers.map((n) => {
              const isAvailable = n > sold;
              if (isAvailable) {
                return (
                  <a
                    key={n}
                    href={`tel:${phone}`}
                    title={`#${num(n)} — ${t.openLabel}`}
                    className="group relative inline-flex flex-col items-center justify-center rounded-lg border-2 border-brand-blue/50 bg-gradient-to-b from-brand-blue/12 to-brand-blue/5 py-1.5 text-brand-blue shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:scale-110 hover:border-brand-blue hover:bg-brand-blue hover:text-white hover:shadow-[var(--shadow-brand)]"
                  >
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-80" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    </span>
                    <span className="text-xs font-extrabold leading-none">
                      {num(n)}
                    </span>
                    <span className="mt-0.5 text-[7px] font-bold uppercase leading-none opacity-85 group-hover:opacity-100">
                      {t.openLabel}
                    </span>
                  </a>
                );
              }
              return (
                <span
                  key={n}
                  className="relative inline-flex flex-col items-center justify-center rounded-lg border border-brand-red/25 bg-brand-red/10 py-1.5 text-brand-red/80"
                >
                  <span className="text-xs font-bold leading-none line-through">
                    {num(n)}
                  </span>
                  <span className="mt-0.5 text-[7px] font-bold uppercase leading-none">
                    {t.soldLabel}
                  </span>
                </span>
              );
            })}
          </div>

          {numbers.length === 0 && (
            <p className="py-8 text-center text-sm text-fg-muted">{t.empty}</p>
          )}
        </div>

        <div className="mt-5 grad-border p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 text-sm text-fg-muted leading-relaxed">{note}</div>
          <a
            href={`tel:${phone}`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-red px-6 py-3 text-sm font-bold text-white shadow-md hover:scale-[1.02] transition-transform whitespace-nowrap"
          >
            <Phone className="h-4 w-4" />
            {t.bookBtn}
          </a>
        </div>
      </div>
    </section>
  );
}
