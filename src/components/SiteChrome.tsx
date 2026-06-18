"use client";

/** Renders the public site chrome (navbar, footer, FABs) everywhere
 *  except the /admin dashboard, which supplies its own shell.  Wrapping
 *  the chrome here (rather than early-returning inside each component)
 *  keeps every child's hook order intact. */

import { usePathname } from "next/navigation";

export default function SiteChrome({ children, extra = [] }: { children: React.ReactNode; extra?: string[] }) {
  const pathname = usePathname() || "/";
  // The /admin dashboard supplies its own shell — never any public chrome.
  // /account (the investor portal) now KEEPS the public navbar + footer in the
  // browser (so investors can navigate the site), but they're wrapped in
  // `.pwa-hide` (see layout.tsx) so the installed PWA still feels like a real
  // app with no chrome.  `extra` lets a specific chrome (e.g. the footer + FABs)
  // hide on a few more paths — used to keep /login clean.
  const isApp =
    pathname.startsWith("/dashboard") ||
    extra.includes(pathname);
  if (isApp) return null;
  return <>{children}</>;
}
