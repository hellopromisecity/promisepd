"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { stripLocale, swapLocale } from "@/lib/i18n";

/**
 * EN / BN language switcher — two real, separate versions (not a swap):
 *   • বাংলা  → root domain   (default)
 *   • EN     → /en prefix
 *
 * The English version is rolled out page-by-page; until it is fully
 * complete, set `EN_READY = false` and the EN pill shows a tasteful
 * "coming soon" state instead of linking to an unfinished page. Flip it
 * to `true` on the final push to make /en public everywhere.
 */
const EN_READY = true;

export default function LangSwitcher() {
  const pathname = usePathname() || "/";
  const { locale } = stripLocale(pathname);

  const base =
    "inline-flex h-7 items-center justify-center rounded-full px-3 text-xs font-bold transition-colors";
  const active = "bg-brand-blue text-white shadow-sm";
  const idle = "text-fg-soft hover:text-fg";

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-full border border-border bg-white p-0.5"
      role="group"
      aria-label="ভাষা / Language"
    >
      {/* Bengali — the default version (root) */}
      <Link
        href={swapLocale(pathname, "bn")}
        aria-current={locale === "bn" ? "true" : undefined}
        className={`${base} ${locale === "bn" ? active : idle}`}
      >
        বাং
      </Link>

      {/* English — /en. Disabled until the full English site is live. */}
      {EN_READY ? (
        <Link
          href={swapLocale(pathname, "en")}
          aria-current={locale === "en" ? "true" : undefined}
          className={`${base} ${locale === "en" ? active : idle}`}
        >
          EN
        </Link>
      ) : (
        <span
          className={`${base} cursor-not-allowed text-fg-faint/70`}
          title="English version coming soon · শীঘ্রই আসছে"
          aria-disabled="true"
        >
          EN
        </span>
      )}
    </div>
  );
}
