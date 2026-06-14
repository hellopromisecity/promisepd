"use client";

/** "Something broke — let the developer know" card.
 *
 *  Surfaced from /error.tsx, /global-error.tsx, /not-found.tsx, and
 *  anywhere else the site puts up an unhappy-path screen.  Gives the
 *  visitor three friction-free ways to report:
 *
 *    - Call (tel:)
 *    - WhatsApp (wa.me, opens chat with empty input)
 *    - Email — subject + body pre-filled with the page URL, the
 *      error message (if any), the user agent, and a timestamp so
 *      the developer doesn't have to ask follow-up questions.
 *
 *  Renders a small inline footer by default; pass `variant="card"`
 *  for the more prominent boxed version used on full-page error
 *  screens.
 */

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Phone, Mail, MessageCircle, Bug } from "lucide-react";
import { DEVELOPER } from "@/lib/team";
import { stripLocale } from "@/lib/i18n";

const COPY = {
  bn: {
    inlineLead: "সমস্যা দেখলে রিপোর্ট করুন →",
    call: "কল",
    callBtn: "কল করুন",
    email: "ইমেইল",
    cardEyebrow: "ডেভেলপারকে রিপোর্ট করুন",
    cardBody:
      "এই পেজে কোনো বাগ, ভাঙা লিংক, বা অস্বাভাবিক আচরণ দেখলে নিচের যেকোনো উপায়ে জানান। সাধারণত কয়েক ঘণ্টার মধ্যে সমাধান।",
  },
  en: {
    inlineLead: "Spotted a problem? Report it →",
    call: "Call",
    callBtn: "Call",
    email: "Email",
    cardEyebrow: "Report to the developer",
    cardBody:
      "Spotted a bug, a broken link, or anything unusual on this page? Let us know any of the ways below — usually fixed within a few hours.",
  },
};

export type ReportToDeveloperProps = {
  /** Visual treatment. `inline` is small + low-key (good for footers),
   *  `card` is a full panel (good for error pages). */
  variant?: "inline" | "card";
  /** Optional error message to include in the pre-filled email body. */
  errorMessage?: string;
  /** Optional Next.js error digest (useful for production logs). */
  errorDigest?: string;
};

export default function ReportToDeveloper({
  variant = "card",
  errorMessage,
  errorDigest,
}: ReportToDeveloperProps) {
  const T = COPY[stripLocale(usePathname() || "/").locale];

  // Render a STABLE href (the plain default) on both server and client so
  // hydration matches — the URL / UA / timestamp would otherwise differ
  // between the two renders.  The rich, context-filled body is swapped in
  // on click, just before the mail client opens, via onMailClick below.
  const staticMail = DEVELOPER.reportMailUrl();
  const buildMailLink = () => {
    if (typeof window === "undefined") {
      return staticMail;
    }
    const ts = new Date().toISOString();
    const lines = [
      "Hi Inzamul,",
      "",
      "I ran into an issue on the PromisePD site:",
      "",
      `URL:        ${window.location.href}`,
      `Time:       ${ts}`,
      `User agent: ${navigator.userAgent}`,
    ];
    if (errorMessage) lines.push(`Error:      ${errorMessage}`);
    if (errorDigest) lines.push(`Digest:     ${errorDigest}`);
    lines.push("", "What I was trying to do:", "", "<your note here>");
    return DEVELOPER.reportMailUrl(
      `PromisePD — Site Issue (${ts.slice(0, 10)})`,
      lines.join("\n"),
    );
  };

  // Swap the static href for the context-rich one the instant the link is
  // activated — keeps render deterministic but the email pre-filled.
  const onMailClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.href = buildMailLink();
  };

  if (variant === "inline") {
    return (
      <div className="flex items-center justify-center gap-2 flex-wrap text-xs text-fg-muted">
        <Bug className="h-3.5 w-3.5 text-brand-blue" />
        <span>{T.inlineLead}</span>
        <a
          href={`tel:${DEVELOPER.phone}`}
          className="font-semibold text-fg hover:text-brand-blue transition-colors"
        >
          {T.call}
        </a>
        <span className="text-fg-faint">·</span>
        <a
          href={DEVELOPER.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-fg hover:text-brand-blue transition-colors"
        >
          WhatsApp
        </a>
        <span className="text-fg-faint">·</span>
        <a
          href={staticMail}
          onClick={onMailClick}
          className="font-semibold text-fg hover:text-brand-blue transition-colors"
        >
          {T.email}
        </a>
      </div>
    );
  }

  return (
    <div className="grad-border p-6 sm:p-7">
      <div className="flex items-start gap-4">
        <div className="relative shrink-0 h-14 w-14 rounded-2xl overflow-hidden ring-2 ring-white shadow-md">
          <Image
            src={DEVELOPER.photo}
            alt={DEVELOPER.name}
            fill
            sizes="56px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Bug className="h-3.5 w-3.5 text-brand-blue shrink-0" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-fg-muted">
              {T.cardEyebrow}
            </span>
          </div>
          <div className="mt-1 text-base font-bold text-fg">
            {DEVELOPER.name}
          </div>
          <div className="text-[11px] text-fg-muted">{DEVELOPER.role}</div>
        </div>
      </div>

      <p className="mt-4 text-sm text-fg-muted leading-relaxed">
        {T.cardBody}
      </p>

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <a
          href={`tel:${DEVELOPER.phone}`}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-brand-blue-dark transition-colors"
        >
          <Phone className="h-4 w-4" />
          {T.callBtn}
        </a>
        <a
          href={DEVELOPER.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-md hover:opacity-90 transition-opacity"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
        <a
          href={staticMail}
          onClick={onMailClick}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-border px-4 py-3 text-sm font-bold text-fg hover:border-brand-blue/40 transition-colors"
        >
          <Mail className="h-4 w-4 text-brand-blue" />
          {T.email}
        </a>
      </div>
    </div>
  );
}
