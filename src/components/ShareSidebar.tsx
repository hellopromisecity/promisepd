"use client";

/** Fixed left-edge social share rail.  Shares whatever page the visitor is
 *  currently on (URL built live from the pathname) to Facebook / WhatsApp /
 *  Telegram / X, plus a copy-link button for sharing the exact URL anywhere.
 *  Desktop + tablet only (md+); the installed PWA hides it via the parent
 *  `.pwa-hide` wrapper in layout.tsx.  lucide dropped brand icons, so the
 *  social marks are inlined as SVG. */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Link2, Check } from "lucide-react";
import { stripLocale } from "@/lib/i18n";

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

export default function ShareSidebar() {
  const pathname = usePathname() || "/";
  const isEn = stripLocale(pathname).locale === "en";
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);

  const url = `${origin}${pathname}`;
  const e = encodeURIComponent(url);
  const items = [
    { key: "fb", label: "Facebook", color: "#1877F2", Icon: Fb, href: `https://www.facebook.com/sharer/sharer.php?u=${e}` },
    { key: "wa", label: "WhatsApp", color: "#25D366", Icon: Wa, href: `https://wa.me/?text=${e}` },
    { key: "tg", label: "Telegram", color: "#229ED9", Icon: Tg, href: `https://t.me/share/url?url=${e}` },
    { key: "x", label: "X", color: "#0f1419", Icon: XLogo, href: `https://twitter.com/intent/tweet?url=${e}` },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  return (
    <div className="fixed left-0 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-1.5 rounded-r-2xl border border-l-0 border-border bg-white/95 p-2 shadow-lg backdrop-blur md:flex">
      <span className="text-[8px] font-bold uppercase tracking-wider text-fg-faint">
        {isEn ? "Share" : "শেয়ার"}
      </span>
      {items.map(({ key, label, color, Icon, href }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title={isEn ? `Share on ${label}` : `${label}-এ শেয়ার করুন`}
          aria-label={`Share on ${label}`}
          className="grid h-9 w-9 place-items-center rounded-full transition-transform hover:scale-110 hover:bg-bg-soft"
          style={{ color }}
        >
          <Icon className="h-5 w-5" />
        </a>
      ))}
      <span className="my-0.5 h-px w-5 bg-border" />
      <button
        type="button"
        onClick={copyLink}
        title={isEn ? "Copy link" : "লিংক কপি করুন"}
        aria-label={isEn ? "Copy link" : "Copy link"}
        className="grid h-9 w-9 place-items-center rounded-full text-brand-blue transition-transform hover:scale-110 hover:bg-bg-soft"
      >
        {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Link2 className="h-5 w-5" />}
      </button>
    </div>
  );
}
