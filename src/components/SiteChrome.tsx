"use client";

/** Renders the public site chrome (navbar, footer, FABs) everywhere
 *  except the /admin dashboard, which supplies its own shell.  Wrapping
 *  the chrome here (rather than early-returning inside each component)
 *  keeps every child's hook order intact. */

import { usePathname } from "next/navigation";

export default function SiteChrome({ children, extra = [] }: { children: React.ReactNode; extra?: string[] }) {
  const pathname = usePathname() || "/";
  // The /admin dashboard and the member /account app both supply their own
  // shell — no public navbar / footer / FABs there (so the member PWA feels
  // like a real app, not a marketing page with a login button on top).
  // `extra` lets a specific chrome (e.g. the footer + FABs) hide on a few more
  // paths — used to keep /login clean (no footer / WhatsApp / scroll-to-top).
  const isApp =
    pathname.startsWith("/dashboard") ||
    pathname === "/account" ||
    pathname === "/en/account" ||
    extra.includes(pathname);
  if (isApp) return null;
  return <>{children}</>;
}
