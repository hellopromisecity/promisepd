"use client";

import { useState } from "react";
import { Landmark, Copy, Check, ShieldCheck, Phone, ReceiptText, Building2 } from "lucide-react";
import { SITE } from "@/lib/site";
import { BANK_ACCOUNTS } from "@/lib/payment";

/** Public /payment page — the company's bank accounts for direct transfers,
 *  with one-tap copy for each account/routing number. Bilingual via `locale`. */

const COPY = {
  bn: {
    eyebrow: "পেমেন্ট মেথড",
    title: "আমাদের ব্যাংক অ্যাকাউন্টে পেমেন্ট পাঠান",
    sub: "নিচের যেকোনো অ্যাকাউন্টে পেমেন্ট পাঠাতে পারেন। নম্বর কপি করতে পাশের বাটনে ক্লিক করুন।",
    holder: "অ্যাকাউন্টের নাম",
    accNo: "অ্যাকাউন্ট নম্বর",
    routing: "রাউটিং নম্বর",
    copy: "কপি",
    copied: "কপি হয়েছে",
    noteTitle: "পেমেন্টের পর",
    note: "পেমেন্ট পাঠানোর পর রশিদ / স্ক্রিনশটসহ আমাদের সাথে যোগাযোগ করুন — দ্রুত নিশ্চিত করে দিবো।",
    call: "কল করুন",
    secure: "আপনার লেনদেন নিরাপদ ও সম্পূর্ণ গোপন",
  },
  en: {
    eyebrow: "Payment Method",
    title: "Send your payment to our bank accounts",
    sub: "You can send payment to any of the accounts below. Tap the copy button to copy a number.",
    holder: "Account name",
    accNo: "Account number",
    routing: "Routing number",
    copy: "Copy",
    copied: "Copied",
    noteTitle: "After payment",
    note: "After sending payment, contact us with the receipt / screenshot — we'll confirm it quickly.",
    call: "Call us",
    secure: "Your transaction is safe and fully confidential",
  },
} as const;

function CopyBtn({ value, labelCopy, labelCopied }: { value: string; labelCopy: string; labelCopied: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={labelCopy}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard blocked — no-op */
        }
      }}
      className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${done ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-border bg-bg text-fg-muted hover:border-brand-blue/40 hover:text-brand-blue"}`}
    >
      {done ? <><Check className="h-3.5 w-3.5" /> {labelCopied}</> : <><Copy className="h-3.5 w-3.5" /> {labelCopy}</>}
    </button>
  );
}

function Row({ label, value, copy, copied, big }: { label: string; value: string; copy: string; copied: string; big?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg-soft px-3.5 py-2.5">
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-fg-faint">{label}</div>
        <div className={`break-all font-bold tabular-nums tracking-wide text-fg ${big ? "text-base sm:text-lg" : "text-sm"}`}>{value}</div>
      </div>
      <CopyBtn value={value} labelCopy={copy} labelCopied={copied} />
    </div>
  );
}

export default function PaymentView({ locale }: { locale: "bn" | "en" }) {
  const t = COPY[locale];
  return (
    <main className="relative">
      <section className="border-b border-border bg-bg-soft">
        <div className="mx-auto max-w-5xl px-4 pt-28 pb-10 text-center sm:pt-32">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-blue/25 bg-brand-blue-tint px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-blue-dark">
            <Landmark className="h-3.5 w-3.5" /> {t.eyebrow}
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight text-fg sm:text-4xl">{t.title}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-fg-muted">{t.sub}</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-5 sm:grid-cols-2">
          {BANK_ACCOUNTS.map((b, i) => (
            <div key={i} className="group overflow-hidden rounded-2xl border border-border bg-bg shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center gap-3 px-5 py-4 text-white" style={{ backgroundImage: `linear-gradient(120deg, ${b.accent}, ${b.accent}cc)` }}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/20"><Landmark className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <div className="truncate text-base font-extrabold leading-tight">{b.bank}</div>
                  <div className="truncate text-xs text-white/85">{b.branch}</div>
                </div>
                <span className="ml-auto shrink-0 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold tabular-nums">{i + 1}</span>
              </div>
              <div className="space-y-3 px-5 py-4">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                  <Building2 className="h-4 w-4 shrink-0 text-fg-faint" />
                  <span className="text-fg-faint">{t.holder}:</span>
                  <span className="font-bold text-fg">{b.holder}</span>
                </div>
                <Row label={t.accNo} value={b.account} copy={t.copy} copied={t.copied} big />
                <Row label={t.routing} value={b.routing} copy={t.copy} copied={t.copied} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-brand-blue/20 bg-brand-blue-tint/40 p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-brand-blue-dark"><ReceiptText className="h-4 w-4" /> {t.noteTitle}</div>
            <p className="mt-2 text-sm text-fg-muted">{t.note}</p>
            <a href={`tel:${SITE.phone}`} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-blue-dark">
              <Phone className="h-4 w-4" /> {t.call} · {locale === "en" ? SITE.phoneDisplayEn : SITE.phoneDisplay}
            </a>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><ShieldCheck className="h-6 w-6" /></span>
            <p className="text-sm font-semibold text-emerald-800">{t.secure}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
