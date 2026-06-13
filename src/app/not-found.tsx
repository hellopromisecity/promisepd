/** 404 page — fired by `notFound()` calls and any URL Next.js
 *  can't resolve to a route.  Server component so it works with
 *  Next.js metadata exports (animations come from the existing
 *  CSS keyframes in globals.css — no client bundle needed).
 *
 *  Layout-level <Navbar /> and <Footer /> are inherited
 *  automatically since this lives below the root layout. */

import type { Metadata } from "next";
import Link from "next/link";
import {
  Home,
  LogIn,
  Compass,
  Building2,
  Newspaper,
  Trophy,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import ReportToDeveloper from "@/components/ReportToDeveloper";

export const metadata: Metadata = {
  title: "পেজ পাওয়া যায়নি — 404",
  description: "এই পেজটি খুঁজে পাওয়া যায়নি।",
  robots: { index: false, follow: false },
};

type QuickLink = {
  href: string;
  label: string;
  desc: string;
  Icon: LucideIcon;
  accent: "red" | "blue" | "ash";
};

// 4 high-value destinations in a card grid — more inviting than a
// row of small pill links.
const QUICK_LINKS: QuickLink[] = [
  {
    href: "/#divisions",
    label: "আমাদের বিভাগ",
    desc: "৫টি বিভাগ এক ছাদের নিচে",
    Icon: Building2,
    accent: "blue",
  },
  {
    href: "/partner",
    label: "পার্টনার হোন",
    desc: "নিজের আয়ের লক্ষ্য সেট করুন",
    Icon: Trophy,
    accent: "red",
  },
  {
    href: "/blog",
    label: "প্রমিস জার্নাল",
    desc: "রিয়েল এস্টেট গাইড ও নোটিশ",
    Icon: Newspaper,
    accent: "ash",
  },
  {
    href: "/team",
    label: "আমাদের টিম",
    desc: "যাঁদের কাজ আপনার স্বপ্ন গড়ে",
    Icon: Users,
    accent: "blue",
  },
];

const ACCENT_BG: Record<QuickLink["accent"], string> = {
  red: "bg-brand-red text-white",
  blue: "bg-brand-blue text-white",
  ash: "bg-brand-ash text-fg",
};

export default function NotFound() {
  return (
    <section className="relative isolate overflow-hidden min-h-[88svh] pt-32 pb-20 sm:pt-36">
      {/* Atmospheric background — blue-led mesh + a soft animated
          blob at each corner to give the page some life without
          needing a client bundle. */}
      <div className="absolute inset-0 -z-10 mesh-bg-soft" />
      <div
        aria-hidden
        className="absolute -top-32 -left-32 h-[40vw] w-[40vw] rounded-full bg-[radial-gradient(circle,rgba(24,71,161,0.18),transparent_60%)] blur-3xl animate-blob"
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -right-32 h-[44vw] w-[44vw] rounded-full bg-[radial-gradient(circle,rgba(192,199,209,0.16),transparent_60%)] blur-3xl animate-blob-slow"
      />
      <div className="absolute inset-0 -z-10 grid-bg opacity-40" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Hero block — giant gradient "৪০৪" with a soft float */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-border px-4 py-1.5 text-xs shadow-sm">
            <Compass className="h-3.5 w-3.5 text-brand-blue" />
            <span className="font-semibold uppercase tracking-[0.18em] text-fg-muted">
              পেজ পাওয়া যায়নি
            </span>
          </div>

          <div
            // animate-float (defined in globals.css) gives a gentle
            // 7-second up-down — premium feel without distraction.
            className="mt-4 text-[clamp(6.5rem,22vw,12rem)] font-extrabold leading-[0.9] text-grad tracking-tighter animate-float"
            aria-label="404"
          >
            ৪০৪
          </div>

          <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
            এই ঠিকানায় <span className="text-grad">কিছুই নেই।</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-fg-muted leading-relaxed max-w-2xl mx-auto">
            আপনি যে পেজটি খুঁজছেন সেটি সরিয়ে নেওয়া হয়েছে, নাম বদলেছে,
            অথবা কখনোই ছিল না। নিচ থেকে যেখানে যেতে চান সেখানে চলে
            যান — অথবা ডেভেলপারকে রিপোর্ট করুন।
          </p>

          {/* Two primary CTAs — Home (filled brand-blue) + Login
              (white ghost with brand-blue accent). */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-7 py-3.5 text-base font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark hover:scale-[1.02] transition-all"
            >
              <Home className="h-4 w-4" />
              হোমপেজে যান
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-2xl bg-white border border-border px-7 py-3.5 text-base font-semibold text-fg hover:border-brand-blue/50 hover:text-brand-blue hover:shadow-lg transition-all"
            >
              <LogIn className="h-4 w-4 text-brand-blue" />
              লগইন করুন
            </Link>
          </div>
        </div>

        {/* Quick destinations grid — 2×2 on mobile, 4 cols on
            desktop.  Cards (not pills) make each option feel more
            substantial. */}
        <div className="mt-14">
          <div className="text-center mb-5">
            <div className="text-[11px] uppercase tracking-[0.22em] text-fg-faint font-bold">
              অথবা এই পেজগুলো দেখুন
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="card group p-4 flex flex-col items-center text-center hover:-translate-y-1 transition-transform"
              >
                <div
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${ACCENT_BG[link.accent]} shadow-md group-hover:scale-110 transition-transform`}
                >
                  <link.Icon className="h-5 w-5" />
                </div>
                <div className="mt-3 text-sm font-bold text-fg leading-tight">
                  {link.label}
                </div>
                <div className="mt-1 text-[11px] text-fg-muted leading-snug">
                  {link.desc}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Developer report card — visible escape hatch if the 404
            itself feels wrong (broken internal link etc.). */}
        <div className="mt-12 flex items-center justify-center gap-2 text-xs text-fg-muted mb-4">
          <Wrench className="h-3.5 w-3.5 text-brand-blue" />
          <span>
            এই লিঙ্কটা থাকার কথা ছিল? ডেভেলপারকে জানান —
          </span>
        </div>
        <ReportToDeveloper errorMessage="404 — Page not found" />
      </div>
    </section>
  );
}
