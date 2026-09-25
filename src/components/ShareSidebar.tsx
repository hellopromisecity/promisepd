"use client";

/** Floating social dock — a round button pinned bottom-left; tap it and a
 *  vertical bar slides up with the company's pages (Facebook, YouTube,
 *  WhatsApp channel), then share-this-page links (Facebook / WhatsApp /
 *  Telegram / X) and copy-link. Tap the button again (or anywhere else) to
 *  hide it. Works on every screen size; the installed PWA hides it via the
 *  parent `.pwa-hide` wrapper in layout.tsx. lucide dropped brand icons, so
 *  the social marks are inlined as SVG. */

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Link2, Check, Share2, X } from "lucide-react";
import { stripLocale } from "@/lib/i18n";
import { SITE } from "@/lib/site";

type IconProps = React.SVGProps<SVGSVGElement>;
const Fb = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);
const Wa = (p: IconProps) => (
  <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden {...p}>
    <path d="M16 .5C7.45.5.55 7.4.55 15.95c0 2.82.74 5.56 2.14 7.97L.5 31.5l7.78-2.04a15.4 15.4 0 0 0 7.72 1.97h.01c8.55 0 15.45-6.9 15.45-15.45 0-4.12-1.6-8-4.52-10.92A15.36 15.36 0 0 0 16 .5Zm0 28.34c-2.36 0-4.67-.63-6.7-1.83l-.48-.28-4.62 1.21 1.23-4.5-.31-.5a12.84 12.84 0 1 1 10.88 5.9Zm7.05-9.61c-.39-.2-2.28-1.12-2.63-1.25-.35-.13-.6-.2-.86.2-.26.39-1 1.25-1.22 1.51-.22.26-.45.29-.84.1-.39-.2-1.63-.6-3.1-1.92a11.69 11.69 0 0 1-2.16-2.69c-.22-.39-.02-.6.17-.79.17-.17.39-.45.58-.68.2-.23.26-.39.39-.65.13-.26.07-.49-.03-.68-.1-.2-.86-2.07-1.18-2.83-.31-.74-.62-.64-.86-.65l-.74-.01c-.26 0-.68.1-1.03.49s-1.35 1.32-1.35 3.2 1.38 3.71 1.57 3.97c.2.26 2.7 4.13 6.55 5.79.92.4 1.63.63 2.19.81.92.29 1.75.25 2.42.15.74-.11 2.28-.93 2.6-1.83.32-.9.32-1.67.22-1.83-.1-.16-.36-.26-.74-.45Z" />
  </svg>
);
const Tg = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.329-.913.49-1.302.481-.428-.009-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.015 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);
const XLogo = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const Yt = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export default function ShareSidebar() {
  const pathname = usePathname() || "/";
  const isEn = stripLocale(pathname).locale === "en";
  const [origin, setOrigin] = useState("");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const url = `${origin}${pathname}`;
  const e = encodeURIComponent(url);
  const social = SITE.socials as { facebook?: string; youtube?: string; whatsapp?: string };
  const pages = [
    social.facebook && { key: "fbp", label: isEn ? "Facebook page" : "ফেসবুক পেজ", color: "#1877F2", Icon: Fb, href: social.facebook },
    social.youtube && { key: "yt", label: isEn ? "YouTube channel" : "ইউটিউব চ্যানেল", color: "#FF0000", Icon: Yt, href: social.youtube },
    social.whatsapp && { key: "wac", label: isEn ? "WhatsApp channel" : "হোয়াটসঅ্যাপ চ্যানেল", color: "#25D366", Icon: Wa, href: social.whatsapp },
  ].filter(Boolean) as { key: string; label: string; color: string; Icon: (p: IconProps) => React.JSX.Element; href: string }[];
  const shares = [
    { key: "fb", label: isEn ? "Share on Facebook" : "ফেসবুকে শেয়ার", color: "#1877F2", Icon: Fb, href: `https://www.facebook.com/sharer/sharer.php?u=${e}` },
    { key: "wa", label: isEn ? "Share on WhatsApp" : "হোয়াটসঅ্যাপে শেয়ার", color: "#25D366", Icon: Wa, href: `https://wa.me/?text=${e}` },
    { key: "tg", label: isEn ? "Share on Telegram" : "টেলিগ্রামে শেয়ার", color: "#229ED9", Icon: Tg, href: `https://t.me/share/url?url=${e}` },
    { key: "x", label: isEn ? "Share on X" : "X-এ শেয়ার", color: "var(--color-fg)", Icon: XLogo, href: `https://twitter.com/intent/tweet?url=${e}` },
  ];

  async function copyLink() {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ }
  }

  const item = "grid h-9 w-9 place-items-center rounded-full transition-transform hover:scale-110 hover:bg-bg-soft";

  return (
    <div ref={ref} className="fixed bottom-5 left-4 z-40 flex flex-col items-center gap-2 sm:bottom-6 sm:left-5">
      {/* the bar — slides up from the button */}
      <div
        className={`flex flex-col items-center gap-1 rounded-2xl border border-border bg-bg p-1.5 shadow-xl transition-all duration-300 ease-out ${open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
        aria-hidden={!open}
      >
        <span className="text-[8px] font-bold uppercase tracking-wider text-fg-faint">{isEn ? "Follow" : "ফলো"}</span>
        {pages.map(({ key, label, color, Icon, href }) => (
          <a key={key} href={href} target="_blank" rel="noopener noreferrer" title={label} aria-label={label} className={item} style={{ color }}>
            <Icon className="h-5 w-5" />
          </a>
        ))}
        <span className="my-0.5 h-px w-5 bg-border" />
        <span className="text-[8px] font-bold uppercase tracking-wider text-fg-faint">{isEn ? "Share" : "শেয়ার"}</span>
        {shares.map(({ key, label, color, Icon, href }) => (
          <a key={key} href={href} target="_blank" rel="noopener noreferrer" title={label} aria-label={label} className={item} style={{ color }}>
            <Icon className="h-5 w-5" />
          </a>
        ))}
        <button type="button" onClick={copyLink} title={isEn ? "Copy link" : "লিংক কপি করুন"} aria-label="Copy link" className={`${item} text-brand-blue`}>
          {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Link2 className="h-5 w-5" />}
        </button>
      </div>

      {/* the round button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={isEn ? (open ? "Hide social links" : "Social links") : open ? "সোশ্যাল বার লুকান" : "সোশ্যাল লিংক"}
        title={isEn ? "Social & share" : "সোশ্যাল ও শেয়ার"}
        className={`grid h-12 w-12 place-items-center rounded-full shadow-[0_10px_30px_-8px_rgba(24,71,161,0.6)] transition-all duration-300 hover:scale-105 ${open ? "bg-fg text-bg" : "bg-brand-blue text-white animate-pulse-ring"}`}
      >
        {open ? <X className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
      </button>
    </div>
  );
}
