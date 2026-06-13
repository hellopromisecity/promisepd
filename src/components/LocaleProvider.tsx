"use client";

import { createContext, useContext } from "react";
import type { Locale } from "@/lib/i18n";

/** Page-body locale. The Bengali pages render without a provider
 *  (default "bn"); the English `/en/*` pages wrap their content in
 *  <LocaleProvider locale="en"> via app/en/layout.tsx. Navbar/Footer
 *  detect locale from the pathname instead (they live in the root
 *  layout, outside this provider). */
const LocaleContext = createContext<Locale>("bn");

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}
