import Link from "next/link";
import { CalendarCheck, Clock, Car, MapPin } from "lucide-react";
import { SITE } from "@/lib/site";
import PropertyBackdrop from "./PropertyBackdrop";

/** Branded /booking page. Visitors stay on promisepd.com; the TidyCal
 *  scheduler is embedded below the hero (no tidycal/username shown in the
 *  address bar). Bilingual via `locale`. */

const COPY = {
  bn: {
    eyebrow: "প্রজেক্ট ভিজিট বুকিং",
    title: "নিজের চোখে দেখে আসুন আপনার ভবিষ্যতের ঠিকানা",
    sub: "স্বপ্নের ফ্ল্যাট, প্লট কিংবা প্রজেক্ট — নিজে গিয়ে দেখলে সিদ্ধান্ত সহজ হয়। নিচে আপনার সুবিধামতো সময় বেছে বুক করুন, বাকিটা আমাদের উপর ছেড়ে দিন।",
    points: [
      { icon: Clock, text: "সকাল ১১টা – ১২টা" },
      { icon: Car, text: "গাড়িতে করে নিয়ে যাবো" },
      { icon: MapPin, text: "সব প্রজেক্ট এক ভিজিটে" },
    ],
    pick: "সময় বেছে বুক করুন",
    note: "বুকিং কনফার্ম হলে আমাদের টিম আপনার সাথে যোগাযোগ করবে।",
    back: "← হোমে ফিরুন",
    homeHref: "/",
    alt: "প্রমিসের প্রজেক্ট",
    iframe: "প্রজেক্ট ভিজিট বুকিং",
  },
  en: {
    eyebrow: "Project Visit Booking",
    title: "See your future address with your own eyes",
    sub: "Your dream flat, plot or project — seeing it in person makes the decision easy. Pick a time below and book; leave the rest to us.",
    points: [
      { icon: Clock, text: "11 AM – 12 PM" },
      { icon: Car, text: "We'll drive you there" },
      { icon: MapPin, text: "All projects in one visit" },
    ],
    pick: "Pick a time & book",
    note: "Once you confirm, our team will reach out to you.",
    back: "← Back to home",
    homeHref: "/en",
    alt: "Promise projects",
    iframe: "Book a project visit",
  },
} as const;

export default function BookingView({ locale }: { locale: "bn" | "en" }) {
  const t = COPY[locale];
  return (
    <main className="relative">
      <section className="relative overflow-hidden">
        <PropertyBackdrop
          src={["/promisecityreal.webp", "/ahbab.webp", "/div-promise-city.webp"]}
          alt={t.alt}
          intensity={18}
          bluewash="soft"
        />
        <div className="relative mx-auto max-w-4xl px-4 pt-28 pb-10 text-center sm:pt-32">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-red/30 bg-brand-red-tint px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-red-dark">
            <CalendarCheck className="h-3.5 w-3.5" /> {t.eyebrow}
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight text-fg sm:text-4xl md:text-5xl">{t.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-fg-muted sm:text-lg">{t.sub}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            {t.points.map(({ icon: Icon, text }) => (
              <span key={text} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/75 px-3.5 py-1.5 text-sm font-semibold text-fg shadow-sm backdrop-blur">
                <Icon className="h-4 w-4 text-brand-blue" /> {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-fg">{t.pick}</h2>
          <Link href={t.homeHref} className="shrink-0 text-sm font-semibold text-fg-muted transition-colors hover:text-brand-blue">{t.back}</Link>
        </div>
        <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-[var(--shadow-brand)]">
          <iframe
            src={SITE.tidycalUrl}
            title={t.iframe}
            className="w-full"
            style={{ height: "clamp(700px, 88vh, 1060px)" }}
            loading="lazy"
          />
        </div>
        <p className="mt-3 text-center text-xs text-fg-faint">{t.note}</p>
      </section>
    </main>
  );
}
