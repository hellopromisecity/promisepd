"use client";

/** Light / dark switch — two icons, click the sun for light, the moon for
 *  dark. The choice is stored in localStorage ("pc-theme") and applied as
 *  `data-theme` on <html>; the inline script in layout.tsx re-applies it
 *  before first paint so there is no flash. Used on the public navbar
 *  (desktop + mobile menu) and the dashboard topbar. */

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

export default function ThemeToggle({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
  }, []);
  const set = (t: Theme) => { applyTheme(t); setTheme(t); };
  const base = `inline-flex items-center justify-center rounded-full transition-colors ${compact ? "h-7 w-7" : "h-7 w-8"}`;
  const on = "bg-brand-blue text-white shadow-sm";
  const off = "text-fg-soft hover:text-fg";
  return (
    <div className={`inline-flex items-center gap-0.5 rounded-full border border-border bg-bg p-0.5 ${className}`} role="group" aria-label="Light / dark">
      <button type="button" onClick={() => set("light")} aria-pressed={theme === "light"} title="Light" className={`${base} ${theme === "light" ? on : off}`}>
        <Sun className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={() => set("dark")} aria-pressed={theme === "dark"} title="Dark" className={`${base} ${theme === "dark" ? on : off}`}>
        <Moon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
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
