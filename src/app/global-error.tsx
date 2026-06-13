"use client";

/** Root-layout error boundary.  Fires when the root layout itself
 *  throws — so we can't rely on <html>, <body>, fonts, or globals.css
 *  being mounted.  Must render the full document shell ourselves.
 *
 *  Per Next.js spec, this file replaces the entire HTML response on
 *  error, so it lives below /app and has no shared chrome. */

import { useEffect } from "react";
import { DEVELOPER } from "@/lib/team";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  // Inline mailto so we don't have to import client components — at
  // this point even the layout has failed.
  const mailto = `mailto:${DEVELOPER.email}?subject=${encodeURIComponent(
    "PromisePD — Critical Site Error",
  )}&body=${encodeURIComponent(
    `URL: ${typeof window !== "undefined" ? window.location.href : ""}\n` +
      `Error: ${error.message}\n` +
      (error.digest ? `Digest: ${error.digest}\n` : "") +
      `\nWhat I was trying to do:\n\n<your note here>`,
  )}`;

  return (
    <html lang="bn">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>সমস্যা · PromisePD</title>
        <style
          dangerouslySetInnerHTML={{
            __html: `
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,"Segoe UI","Noto Sans Bengali",sans-serif;background:#f7f9ff;color:#0b1220;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:1.5rem;line-height:1.6}
.card{max-width:32rem;width:100%;background:#fff;border-radius:1.5rem;padding:2.5rem 2rem;box-shadow:0 14px 36px -10px rgba(24,71,161,.2);text-align:center}
.icon{display:inline-flex;width:64px;height:64px;align-items:center;justify-content:center;border-radius:1rem;background:#ffe4e7;color:#e11924;font-size:32px;font-weight:800}
h1{margin:1.25rem 0 .5rem;font-size:1.5rem;line-height:1.2;font-weight:800}
p{color:#5a6478;font-size:.9375rem;margin:.5rem 0 1.25rem}
.row{display:flex;gap:.5rem;flex-wrap:wrap;justify-content:center;margin-top:1.5rem}
button,a{appearance:none;border:0;cursor:pointer;border-radius:.875rem;padding:.75rem 1.25rem;font-size:.875rem;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:.5rem}
.btn-primary{background:#1847a1;color:#fff;box-shadow:0 14px 36px -10px rgba(24,71,161,.45)}
.btn-primary:hover{background:#133680}
.btn-ghost{background:#fff;color:#0b1220;border:1px solid #e6e9f2}
.btn-ghost:hover{border-color:#1847a1}
.dev{margin-top:1.75rem;padding-top:1.25rem;border-top:1px solid #e6e9f2;font-size:.8125rem;color:#5a6478}
.dev strong{color:#0b1220;font-weight:700}
small{display:block;margin-top:1rem;color:#8a93a6;font-size:.75rem;font-family:ui-monospace,monospace}
`,
          }}
        />
      </head>
      <body>
        <div className="card">
          <div className="icon">!</div>
          <h1>একটি গুরুতর সমস্যা হয়েছে</h1>
          <p>
            সাইটে অপ্রত্যাশিত ত্রুটি হয়েছে। নিচের বাটনে ক্লিক করে আবার
            চেষ্টা করুন, অথবা ডেভেলপারকে রিপোর্ট করুন।
          </p>
          <div className="row">
            <button className="btn-primary" onClick={() => reset()}>
              আবার চেষ্টা করুন
            </button>
            <a className="btn-ghost" href="/">
              হোমপেজ
            </a>
          </div>
          <div className="dev">
            <div>ডেভেলপারকে জানান —</div>
            <div style={{ marginTop: ".5rem" }}>
              <strong>{DEVELOPER.name}</strong> · {DEVELOPER.role}
            </div>
            <div className="row" style={{ marginTop: ".75rem" }}>
              <a className="btn-primary" href={`tel:${DEVELOPER.phone}`}>
                📞 {DEVELOPER.phone}
              </a>
              <a className="btn-ghost" href={mailto}>
                ✉️ ইমেইল
              </a>
            </div>
          </div>
          {error.digest && <small>ref · {error.digest}</small>}
        </div>
      </body>
    </html>
  );
}
