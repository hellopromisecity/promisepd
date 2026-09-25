"use client";

/** Light / dark switch — ONE round button. While the site is light it shows
 *  a moon (tap → dark); while dark it shows a sun (tap → light). The choice
 *  is stored in localStorage ("pc-theme") and applied as `data-theme` on
 *  <html>; the inline script in layout.tsx re-applies it before first paint
 *  so there is no flash. Used on the public navbar (desktop + mobile menu)
 *  and the dashboard topbar. */

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export const THEME_KEY = "pc-theme";
type Theme = "light" | "dark";

export function applyTheme(t: Theme) {
  const root = document.documentElement;
  if (t === "dark") root.setAttribute("data-theme", "dark");
  else root.removeAttribute("data-theme");
  try { localStorage.setItem(THEME_KEY, t); } catch { /* private mode */ }
}

/** Read the live theme from <html data-theme> — re-renders when it changes
 *  (via the toggle or another tab). Use it where a colour must be set in JS,
 *  e.g. framer-motion animate() values. */
export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    const read = () => setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);
  return theme;
}

export default function ThemeToggle({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  const theme = useTheme();
  const dark = theme === "dark";
  const next: Theme = dark ? "light" : "dark";
  const label = dark ? "Switch to light mode" : "Switch to dark mode";
  return (
    <button
      type="button"
      onClick={() => applyTheme(next)}
      aria-label={label}
      title={label}
      aria-pressed={dark}
      className={`inline-flex items-center justify-center rounded-full border border-border bg-bg text-fg transition-colors hover:border-brand-blue/50 hover:text-brand-blue ${compact ? "h-7 w-7" : "h-8 w-8"} ${className}`}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
