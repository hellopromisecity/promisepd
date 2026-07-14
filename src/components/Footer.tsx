"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, Phone, MapPin, Clock, CreditCard } from "lucide-react";
import { FOOTER_QUICK_LINKS, SITE } from "@/lib/site";
import { toBn } from "@/lib/bn";
import { DICT, stripLocale, localizedPath } from "@/lib/i18n";
import ReportToDeveloper from "./ReportToDeveloper";
import PaymentSecurityStrip from "./PaymentSecurityStrip";

// ============= Brand-colored social icons (full color, full opacity) =============

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        fill="#1877F2"
        d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.412c0-3.017 1.792-4.683 4.533-4.683 1.312 0 2.686.235 2.686.235v2.971h-1.513c-1.49 0-1.955.93-1.955 1.886v2.262h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073Z"
      />
    </svg>
  );
}

function YouTubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        fill="#FF0000"
        d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8Z"
      />
      <path fill="#FFF" d="M9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
    </svg>
  );
}

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        fill="#25D366"
        d="M.06 24l1.69-6.16A11.87 11.87 0 0 1 .14 11.9C.14 5.34 5.48 0 12.05 0a11.87 11.87 0 0 1 8.44 3.5 11.86 11.86 0 0 1 3.5 8.44c0 6.57-5.34 11.91-11.91 11.91h-.01a11.92 11.92 0 0 1-5.7-1.45L.06 24Z"
      />
      <path
        fill="#FFF"
        d="M9.03 6.92c-.22-.49-.45-.5-.66-.51l-.56-.01a1.08 1.08 0 0 0-.78.36c-.27.3-1.03 1-1.03 2.45 0 1.45 1.05 2.85 1.2 3.05.15.2 2.04 3.27 5.05 4.45 2.5.99 3 .79 3.55.74.55-.05 1.77-.72 2.02-1.43.25-.7.25-1.31.18-1.43-.07-.13-.27-.2-.56-.35-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.66.15-.2.3-.76.97-.94 1.17-.17.2-.34.22-.64.07-.3-.15-1.27-.47-2.42-1.49a9.04 9.04 0 0 1-1.67-2.08c-.18-.3 0-.46.13-.61.13-.13.3-.34.45-.5.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.65-1.57-.9-2.15Z"
      />
    </svg>
  );
}

function TelegramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <circle cx="12" cy="12" r="12" fill="#229ED9" />
      <path
        fill="#FFF"
        d="M5.49 11.77 16.4 7.56c.51-.18.95.12.79.88l-1.86 8.76c-.13.62-.5.77-1.01.48l-2.78-2.05-1.34 1.29c-.15.15-.27.27-.56.27l.2-2.84 5.18-4.68c.23-.2-.05-.31-.35-.12l-6.4 4.03-2.76-.86c-.6-.19-.61-.6.14-.9Z"
      />
    </svg>
  );
}

export default function Footer() {
  const pathname = usePathname() || "/";
  const { locale } = stripLocale(pathname);
  const t = DICT[locale];
  const isEn = locale === "en";
  const lp = (href: string) => localizedPath(href, locale);

  const SOCIALS = [
    { name: "Facebook", url: SITE.socials.facebook, Icon: FacebookIcon, ring: "ring-[#1877F2]/30" },
    { name: "YouTube", url: SITE.socials.youtube, Icon: YouTubeIcon, ring: "ring-[#FF0000]/30" },
    { name: "WhatsApp", url: SITE.socials.whatsapp, Icon: WhatsAppIcon, ring: "ring-[#25D366]/30" },
    { name: "Telegram", url: SITE.socials.telegram, Icon: TelegramIcon, ring: "ring-[#229ED9]/30" },
  ];

  return (
    <footer className="relative isolate overflow-hidden bg-bg-soft">
      <div className="absolute inset-0 -z-10 mesh-bg-soft" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-blue/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        {/* Four equal columns on desktop — symmetric, compact, and
            each column intentionally sized to fit a single screen
            without scroll on a 1280-wide viewport. */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* ── Col 1 · Brand + description + socials ───────────── */}
          <div>
            <Link href={lp("/#home")} className="flex items-center gap-3">
              <Image
                src="/logo-tight.webp"
                alt={SITE.shortName}
                width={463}
                height={482}
                className="h-14 w-auto shrink-0"
              />
              <div className="leading-tight">
                <div className="text-base font-bold text-grad-rb">
                  {t.footer.brand}
                </div>
                <div className="text-xs tracking-wider text-fg-muted">
                  {t.footer.tagline}
                </div>
              </div>
            </Link>
            <p className="mt-4 text-sm text-fg-muted leading-relaxed">
              {t.footer.about}
            </p>

            <div className="mt-5">
              <h4 className="text-sm font-bold uppercase tracking-wider text-grad-rb mb-3">
                {t.footer.follow}
              </h4>
              <div className="flex gap-2">
                {SOCIALS.map(({ name, url, Icon, ring }) => (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={name}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-border hover:ring-2 hover:${ring} hover:scale-110 hover:-translate-y-0.5 transition-all`}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ── Col 2 · Quick links (curated top-5 only) ────────── */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-grad-rb mb-3">
              {t.footer.quickLinks}
            </h4>
            <ul className="space-y-2">
              {FOOTER_QUICK_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={lp(item.href)}
                    className="text-sm text-fg-muted hover:text-brand-blue transition-colors"
                  >
                    {isEn ? item.labelEn : item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Col 3 · Contact info ────────────────────────────── */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-grad-rb mb-3">
              {t.footer.contact}
            </h4>
            <ul className="space-y-3 text-sm text-fg-muted">
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 mt-0.5 text-brand-red shrink-0" />
                <span className="leading-relaxed">
                  {isEn ? SITE.addressEn : SITE.address}
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-brand-blue shrink-0" />
                <a
                  href={`tel:${SITE.phone}`}
                  className="hover:text-fg transition-colors"
                >
                  {isEn ? SITE.phoneDisplayEn : SITE.phoneDisplay}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-brand-red shrink-0" />
                <a
                  href={`mailto:${SITE.email}`}
                  className="hover:text-fg transition-colors break-all"
                >
                  {SITE.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-brand-blue shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <div>{isEn ? SITE.hoursEn : SITE.hours}</div>
                  <div className="text-xs text-fg-faint mt-0.5">
                    {isEn ? SITE.weeklyOffEn : SITE.weeklyOff}
                  </div>
                </div>
              </li>
              {/* Payment Method — sits under the contact block so anyone
                  ready to pay finds our bank details right here. */}
              <li className="flex items-center gap-2.5 pt-1">
                <CreditCard className="h-4 w-4 text-brand-red shrink-0" />
                <Link
                  href={lp("/payment")}
                  className="font-semibold text-brand-blue hover:text-brand-blue-dark transition-colors"
                >
                  {isEn ? "Payment Method" : "পেমেন্ট মেথড"}
                </Link>
              </li>
            </ul>
          </div>

          {/* ── Col 4 · Payment + security ──────────────────────── */}
          <PaymentSecurityStrip isEn={isEn} />
        </div>

        {/* Bottom strip — copyright + credit + report-bug, all on one
            line on desktop so we keep vertical footprint minimal. */}
        <div className="mt-8 pt-5 border-t border-border flex flex-col lg:flex-row items-center justify-between gap-3">
          <p className="text-xs text-fg-muted text-center lg:text-left">
            © {isEn ? new Date().getFullYear() : toBn(new Date().getFullYear())}{" "}
            {SITE.name}. {t.footer.rights}
          </p>
          <div className="flex items-center gap-3 text-xs">
            <ReportToDeveloper variant="inline" />
            <span className="text-fg-faint hidden sm:inline">·</span>
            <a
              href={SITE.credit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-grad-rb hover:opacity-80 transition-opacity"
            >
              {SITE.credit.label}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
