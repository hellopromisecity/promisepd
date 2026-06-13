"use client";

/** Per-route-segment error boundary.  Next.js shows this when any
 *  React tree below a route segment throws during render — keeps the
 *  rest of the app (layout, nav, footer) intact.
 *
 *  Pairs with global-error.tsx (which handles root-layout errors). */

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, Home, AlertTriangle } from "lucide-react";
import ReportToDeveloper from "@/components/ReportToDeveloper";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to whatever monitoring is plugged in (Vercel Logs etc).
    console.error("[route-error]", error);
  }, [error]);

  return (
    <section className="relative min-h-[80svh] pt-32 pb-20 sm:pt-36">
      <div className="absolute inset-0 -z-10 mesh-bg-soft" />
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-red-tint text-brand-red shadow-md">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl sm:text-4xl font-bold leading-tight">
            একটি <span className="text-grad">সমস্যা ঘটেছে।</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-fg-muted leading-relaxed">
            পেজ লোড করতে গিয়ে অপ্রত্যাশিত ত্রুটি হয়েছে। আবার চেষ্টা করে
            দেখুন — বা হোমপেজে ফিরে যান।
          </p>

          {error.digest && (
            <p className="mt-2 text-[11px] font-mono text-fg-faint">
              ref · {error.digest}
            </p>
          )}

          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark hover:scale-[1.02] transition-all"
            >
              <RotateCcw className="h-4 w-4" />
              আবার চেষ্টা করুন
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-2xl bg-white border border-border px-6 py-3 text-sm font-semibold text-fg hover:border-brand-blue/40 transition-colors"
            >
              <Home className="h-4 w-4" />
              হোমপেজ
            </Link>
          </div>
        </div>

        <div className="mt-10">
          <ReportToDeveloper
            errorMessage={error.message}
            errorDigest={error.digest}
          />
        </div>
      </div>
    </section>
  );
}
