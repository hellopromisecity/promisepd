"use client";

/** Renders the public site chrome (navbar, footer, FABs) everywhere
 *  except the /admin dashboard, which supplies its own shell.  Wrapping
 *  the chrome here (rather than early-returning inside each component)
 *  keeps every child's hook order intact. */

import { usePathname } from "next/navigation";

export default function SiteChrome({ children, extra = [] }: { children: React.ReactNode; extra?: string[] }) {
  const pathname = usePathname() || "/";
  // Chrome (navbar + footer + FABs) shows on every page — in the browser AND
  // the installed PWA — EXCEPT:
  //   • /dashboard … — the admin panel supplies its own shell
  //   • /login, /signup — kept clean (auth screens), both bn + en
  // Everything else (home, /account investor portal, projects, blog, …) keeps
  // the full site chrome.  `extra` can hide chrome on a few more paths.
  const NO_CHROME = new Set(["/login", "/en/login", "/signup", "/en/signup"]);
  const isApp =
    pathname.startsWith("/dashboard") ||
    NO_CHROME.has(pathname) ||
    extra.includes(pathname);
  if (isApp) return null;
  return <>{children}</>;
}
