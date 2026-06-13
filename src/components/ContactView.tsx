"use client";

/** Shared, locale-aware body for the Contact page. Rendered by both
 *  /contact (bn) and /en/contact (en). Self-detects locale via
 *  LocaleProvider. The rich contact form (<Contact/>) is already
 *  locale-aware via DICT, so it's reused as-is. */

import Image from "next/image";
import { Phone, Mail, MapPin, Clock, MessageCircle, Navigation } from "lucide-react";
import Contact from "./Contact";
import PropertyBackdrop from "./PropertyBackdrop";
import { SITE } from "@/lib/site";
import { TEAM_MEMBERS } from "@/lib/team";
import { CONTACT_EN, TEAM_EN } from "@/lib/pages.en";
import { useLocale } from "./LocaleProvider";

type Accent = "red" | "blue" | "ash";
const ACCENT_BG: Record<Accent, string> = {
  red: "bg-brand-red text-white",
  blue: "bg-brand-blue text-white",
  ash: "bg-brand-ash text-fg",
};

function InfoTile({
  icon: Icon,
  label,
  value,
  href,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
  accent: Accent;
}) {
  const Wrapper = (href ? "a" : "div") as "a" | "div";
  return (
    <Wrapper
      href={href}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      className="card p-5 group flex items-start gap-4 hover:scale-[1.01] transition-transform"
    >
      <div
        className={`shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-xl ${ACCENT_BG[accent]} shadow-md`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.2em] text-fg-faint">
          {label}
        </div>
        <div className="mt-1 text-sm font-semibold text-fg break-words">
          {value}
        </div>
      </div>
    </Wrapper>
  );
}

export default function ContactView() {
  const isEn = useLocale() === "en";
  const c = CONTACT_EN;
  const ceo = TEAM_MEMBERS.find((m) => m.role.includes("CEO"));

  const phoneDisplay = isEn ? SITE.phoneDisplayEn : SITE.phoneDisplay;
  const address = isEn ? SITE.addressEn : SITE.address;
  const hours = isEn ? `${SITE.hoursEn} · ${SITE.weeklyOffEn}` : `${SITE.hours} · ${SITE.weeklyOff}`;
  const ceoName = isEn && ceo ? ceo.nameEn : ceo?.name;
  const ceoBio = isEn && ceo ? TEAM_EN.bios[ceo.slug] ?? ceo.bio : ceo?.bio;

  return (
    <>
      {/* Header */}
      <section className="relative isolate overflow-hidden pt-32 pb-12 sm:pt-36 sm:pb-16">
        <PropertyBackdrop
          src="/fcpics/fc2.webp"
          alt="Promise City avenue"
          intensity={28}
          bluewash="soft"
        />
        <div className="absolute inset-0 -z-10 mesh-bg-soft" />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white border border-border px-4 py-1.5 text-xs shadow-sm">
            <MessageCircle className="h-3.5 w-3.5 text-brand-blue" />
            <span className="font-semibold uppercase tracking-[0.18em] text-fg-muted">
              {isEn ? c.eyebrow : "যোগাযোগ"}
            </span>
          </span>
          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08]">
            {isEn ? (
              <>
                {c.h1Plain} <span className="text-grad">{c.h1Accent}</span>
              </>
            ) : (
              <>
                <span className="text-grad">যেকোনো প্রশ্নে</span> আমরা পাশে।
              </>
            )}
          </h1>
          <p className="mt-5 text-base sm:text-lg text-fg-muted leading-relaxed max-w-2xl mx-auto">
            {isEn
              ? c.sub
              : "ফোন, ইমেইল, অফিস ভিজিট বা বার্তা — যেভাবে স্বাচ্ছন্দ্য বোধ করেন, আমাদের জানান। আমরা খুব শীঘ্রই আপনার সাথে যোগাযোগ করি।"}
          </p>
        </div>
      </section>

      {/* CEO direct-line card — premium VIP touch */}
      {ceo && (
        <section className="relative pb-12">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grad-border p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-2xl overflow-hidden ring-4 ring-white shadow-lg">
                  <Image
                    src={ceo.photo}
                    alt={ceoName ?? ceo.name}
                    fill
                    sizes="(min-width: 640px) 112px, 96px"
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-fg-faint">
                    {isEn ? c.ceoCardLabel : "সরাসরি কথা বলুন"}
                  </div>
                  <div className="mt-1 text-xl sm:text-2xl font-bold text-fg">
                    {ceoName}
                  </div>
                  <div className="text-sm font-semibold text-brand-blue">
                    {ceo.role} · Promise Group
                  </div>
                  {ceoBio && (
                    <p className="mt-2 text-sm text-fg-muted leading-relaxed line-clamp-2 sm:line-clamp-none">
                      {ceoBio}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2 w-full sm:w-auto sm:shrink-0">
                  {ceo.phone && (
                    <a
                      href={`tel:${ceo.phone}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-blue-dark transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      {ceo.phone}
                    </a>
                  )}
                  {ceo.email && (
                    <a
                      href={`mailto:${ceo.email}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-border px-5 py-3 text-sm font-semibold text-fg hover:border-brand-blue/40 transition-colors"
                    >
                      <Mail className="h-4 w-4 text-brand-blue" />
                      {isEn ? c.emailBtn : "ইমেইল"}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick-info strip — phone, email, office, hours */}
      <section className="relative pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <InfoTile
              icon={Phone}
              label={isEn ? c.tilePhone : "ফোন"}
              value={phoneDisplay}
              href={`tel:${SITE.phone}`}
              accent="blue"
            />
            <InfoTile
              icon={Mail}
              label={isEn ? c.tileEmail : "ইমেইল"}
              value={SITE.email}
              href={`mailto:${SITE.email}`}
              accent="blue"
            />
            <InfoTile
              icon={MapPin}
              label={isEn ? c.tileOffice : "অফিস"}
              value={address}
              href="https://maps.google.com/?q=Kazi+Tower+South+Jatrabari+Dhaka"
              accent="red"
            />
            <InfoTile
              icon={Clock}
              label={isEn ? c.tileHours : "সময়সূচী"}
              value={hours}
              accent="ash"
            />
          </div>
        </div>
      </section>

      {/* Office location · Google Map */}
      <section className="relative pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-white border border-border px-4 py-1.5 text-xs shadow-sm">
              <MapPin className="h-3.5 w-3.5 text-brand-red" />
              <span className="font-semibold uppercase tracking-[0.18em] text-fg-muted">
                {isEn ? c.mapEyebrow : "আমাদের অফিস"}
              </span>
            </span>
            <h2 className="mt-4 text-2xl sm:text-3xl font-bold leading-tight">
              {isEn ? (
                <>
                  {c.mapHeadPlain}{" "}
                  <span className="text-grad">{c.mapHeadAccent}</span>
                </>
              ) : (
                <>
                  ঢাকার <span className="text-grad">দক্ষিণ যাত্রাবাড়ী</span>-তে
                  আমরা।
                </>
              )}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-fg-muted">{address}</p>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-xl ring-1 ring-border bg-bg-soft">
            <div className="relative aspect-[4/5] sm:aspect-[16/9]">
              <iframe
                title="PromisePD office location — Kazi Tower, South Jatrabari, Dhaka"
                src="https://maps.google.com/maps?q=Kazi+Tower+South+Jatrabari+Dhaka&t=&z=16&ie=UTF8&iwloc=&output=embed"
                className="absolute inset-0 w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=Kazi+Tower+South+Jatrabari+Dhaka"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark hover:scale-[1.02] transition-all"
            >
              <Navigation className="h-4 w-4" />
              {isEn ? c.directionsBtn : "দিকনির্দেশনা পান"}
            </a>
            <a
              href="https://maps.google.com/?q=Kazi+Tower+South+Jatrabari+Dhaka"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-white border border-border px-6 py-3 text-sm font-semibold text-fg hover:border-brand-blue/40 transition-colors"
            >
              <MapPin className="h-4 w-4 text-brand-red" />
              {isEn ? c.openInMapsBtn : "Google Maps-এ খুলুন"}
            </a>
          </div>
        </div>
      </section>

      {/* Existing rich contact form, reused as-is (locale-aware via DICT) */}
      <Contact />
    </>
  );
}
