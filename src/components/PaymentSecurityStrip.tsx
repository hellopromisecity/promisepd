/** Payment methods + security trust strip — footer column 4.
 *
 *  Uses real, official brand logos (downloaded + WebP-optimised via
 *  scripts/download-payment-logos.mjs).  Visitors recognise the
 *  actual marks — that's the trust signal a solid colour chip can't
 *  carry.
 *
 *  All logos render at a uniform visual height inside white pill
 *  cards so the strip reads as a tidy grid no matter how each
 *  wordmark's aspect ratio differs. */

import Image from "next/image";
import { ShieldCheck } from "lucide-react";

type LogoEntry = {
  name: string;
  src: string;
  /** Aspect-ratio anchor for next/image to lay out without CLS. */
  width: number;
  height: number;
};

// Mobile financial services + card networks.  Width/height pairs are
// the cropped WebP's native dimensions at 96 px tall (computed at
// download time) — feeding them to next/image avoids layout shift.
const PAYMENT_LOGOS: LogoEntry[] = [
  { name: "bKash", src: "/payments/bkash.webp", width: 200, height: 96 },
  { name: "Nagad", src: "/payments/nagad.webp", width: 200, height: 96 },
  { name: "Rocket / Dutch-Bangla Bank", src: "/payments/rocket.webp", width: 300, height: 96 },
  { name: "Upay", src: "/payments/upay.webp", width: 100, height: 96 },
  { name: "Visa", src: "/payments/visa.webp", width: 180, height: 96 },
  { name: "Mastercard", src: "/payments/mastercard.webp", width: 130, height: 96 },
];

export default function PaymentSecurityStrip({ isEn = false }: { isEn?: boolean }) {
  return (
    <div className="space-y-5">
      {/* ── Payment methods ────────────────────────────────────── */}
      <div>
        <h4 className="text-sm font-bold uppercase tracking-wider text-grad-rb mb-3">
          {isEn ? "Payment methods" : "পেমেন্ট মেথড"}
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_LOGOS.map((logo) => (
            <div
              key={logo.name}
              title={`${logo.name} accepted`}
              className="bg-white border border-border rounded-md h-11 flex items-center justify-center px-2 hover:border-brand-blue/30 transition-colors"
            >
              <Image
                src={logo.src}
                alt={logo.name}
                width={logo.width}
                height={logo.height}
                className="max-h-7 w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Security / trust badges ──────────────────────────────
          SSLCommerz is the highest-recognition online-payment trust
          mark in Bangladesh — gets its own logo card.  SSL Secured
          pairs as a glyph badge since it has no single wordmark. */}
      <div>
        <h4 className="text-sm font-bold uppercase tracking-wider text-grad-rb mb-3">
          {isEn ? "Secure payment" : "সুরক্ষিত পেমেন্ট"}
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 rounded-lg bg-white border border-border px-3 py-2">
            <div className="shrink-0 h-8 w-20 flex items-center">
              <Image
                src="/payments/sslcommerz.webp"
                alt="SSLCommerz"
                width={200}
                height={96}
                className="max-h-7 w-auto object-contain"
              />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="text-xs font-bold text-fg">
                Secure Gateway
              </div>
              <div className="text-[10px] text-fg-faint uppercase tracking-wider">
                Bangladesh&apos;s #1
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-lg bg-white border border-border px-3 py-2">
            <ShieldCheck className="h-5 w-5 text-brand-blue shrink-0" />
            <div className="min-w-0 leading-tight">
              <div className="text-xs font-bold text-fg truncate">
                SSL Secured
              </div>
              <div className="text-[10px] text-fg-faint truncate uppercase tracking-wider">
                256-bit Encrypted
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
