/** Single source of truth for the site's public base URL.
 *
 *  Resolution order (first match wins):
 *  1. `NEXT_PUBLIC_SITE_URL` env override — set this on Vercel when the
 *     custom domain (promisepd.com) is live and verified.
 *  2. `VERCEL_PROJECT_PRODUCTION_URL` — auto-injected on Vercel, points
 *     at whichever URL is configured as the project's production
 *     domain (e.g. `promisepd.vercel.app` today, `promisepd.com` later).
 *  3. `VERCEL_URL` — auto-injected on every Vercel deployment
 *     (preview / branch deploys).
 *  4. Hardcoded fallback for local dev.
 *
 *  Why this matters: Open Graph / Twitter scrapers (Facebook, WhatsApp,
 *  LinkedIn, etc.) must be able to fetch the og:image at the URL we
 *  emit. If we hard-code `https://promisepd.com/og-image.jpg` while the
 *  site is actually live at `promisepd.vercel.app`, the image fails to
 *  load and link previews show as bare text. Driving everything from
 *  the live deployment URL avoids that. */

const FALLBACK_URL = "https://promisepd.com";

function stripTrailingSlash(u: string): string {
  return u.replace(/\/+$/, "");
}

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return stripTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL);
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return FALLBACK_URL;
}

/** Convenience: absolute URL for an in-repo asset path. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = getSiteUrl();
  const rel = path.startsWith("/") ? path : `/${path}`;
  return `${base}${rel}`;
}
