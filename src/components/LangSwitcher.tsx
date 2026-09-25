"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, ChevronDown, Check } from "lucide-react";
import { stripLocale, swapLocale } from "@/lib/i18n";

/**
 * Language dropdown — two real, separate versions (not a swap):
 *   • বাংলা  → root domain   (default)
 *   • EN     → /en prefix
 *
 * A compact pill ("বাং ▾") that opens a small menu, so the navbar keeps
 * room for the light/dark switch. Until the English version is fully
 * complete, set `EN_READY = false` and the EN item shows "coming soon".
 */
const EN_READY = true;

export default function LangSwitcher() {
  const pathname = usePathname() || "/";
  const { locale } = stripLocale(pathname);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  const items = [
    { code: "bn" as const, short: "বাং", label: "বাংলা", ready: true },
    { code: "en" as const, short: "EN", label: "English", ready: EN_READY },
  ];
  const cur = items.find((i) => i.code === locale) ?? items[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="ভাষা / Language"
        className="inline-flex h-8 items-center gap-1 rounded-full border border-border bg-bg pl-2 pr-1.5 text-xs font-bold text-fg transition-colors hover:border-brand-blue/50"
      >
        <Globe className="h-3.5 w-3.5 text-brand-blue" />
        {cur.short}
        <ChevronDown className={`h-3.5 w-3.5 text-fg-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-1.5 w-36 overflow-hidden rounded-xl border border-border bg-bg py-1 shadow-xl">
          {items.map((it) =>
            it.ready ? (
              <Link
                key={it.code}
                role="menuitem"
                href={swapLocale(pathname, it.code)}
                onClick={() => setOpen(false)}
                aria-current={locale === it.code ? "true" : undefined}
                className={`flex items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-bg-soft ${locale === it.code ? "font-bold text-brand-blue" : "text-fg"}`}
              >
                <span>{it.label} <span className="text-[10px] text-fg-faint">{it.short}</span></span>
                {locale === it.code && <Check className="h-3.5 w-3.5" />}
              </Link>
            ) : (
              <span key={it.code} role="menuitem" aria-disabled="true" title="English version coming soon · শীঘ্রই আসছে" className="flex cursor-not-allowed items-center justify-between px-3 py-2 text-sm text-fg-faint/70">
                {it.label}
              </span>
            ),
          )}
        </div>
      )}
    </div>
  );
}
