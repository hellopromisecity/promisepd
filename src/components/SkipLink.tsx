"use client";

/** Accessibility skip-link, localized. Lives in the root layout (outside
 *  the LocaleProvider), so it self-detects locale from the pathname like
 *  the Navbar / Footer. */

import { usePathname } from "next/navigation";
import { stripLocale } from "@/lib/i18n";

export default function SkipLink() {
  const isEn = stripLocale(usePathname() || "/").locale === "en";
  return (
    <a
      href="#home"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-brand-blue focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg focus:outline-none"
    >
      {isEn ? "Skip to main content" : "মূল কনটেন্টে যান"}
    </a>
  );
}
