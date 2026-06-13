/* PromisePD — production service worker (v4).
 *
 * v4 bump: forces every browser to install a fresh worker, which on
 * activate nukes ALL caches and claims clients — clearing any stale
 * cached HTML/assets left from a flaky deploy.
 *
 * Why versioned (and why every previous install needs to be nuked):
 *   v1 cached HTML pages aggressively and never invalidated.  Next.js
 *   HTML embeds hashed chunk URLs (`/_next/static/chunks/<hash>.js`).
 *   Once we redeploy, those hashes change — but a PWA user's v1 cache
 *   still serves the OLD HTML, which now points at DELETED chunks.
 *   Result: blank screen / stuck on PWA splash forever.
 *
 * v3 design rules:
 *   1. Skip Next.js internals and API routes entirely.  These MUST
 *      hit the network — they encode build-time hashes and runtime
 *      data the SW has no business intercepting.
 *   2. NEVER cache navigation / HTML responses.  Always go to network
 *      with a hard 4-second timeout.  Stale HTML is the #1 cause of
 *      "PWA frozen on splash" — we'd rather show a clean offline
 *      fallback than ship broken chunk references.
 *   3. Stale-while-revalidate ONLY for safe, low-churn assets:
 *      logo, manifest, OG image, install screenshots.
 *   4. On activate, delete EVERY existing cache (not just non-current
 *      ones).  This is the kill switch for v1's bad cache.
 *   5. skipWaiting + clients.claim so the new SW takes over without
 *      requiring the user to close every tab.
 */

const CACHE_VERSION = "ppd-v6";

// Only these explicit paths get cached.  Anything else — and anything
// HTML — bypasses the cache entirely.
const SAFE_TO_CACHE = new Set([
  "/logo.png",
  "/icon.png",
  "/apple-icon.png",
  "/og-image.jpg",
  "/manifest.webmanifest",
  "/screenshot-mobile-v2.png",
  "/screenshot-wide-v2.png",
]);

self.addEventListener("install", (event) => {
  // Don't wait for old tabs to close — take over immediately.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Nuke EVERY cache from previous SW versions.  This is what
      // unsticks users who had v1 installed and were trapped on the
      // splash screen.
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

/** Allow the page to force-trigger update activation via postMessage. */
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // ── Hard skip: Next.js internals + API + sitemap/robots ───────────
  // These MUST be served by the network.  Caching them is what broke
  // v1 — HTML referenced chunks the cache no longer had.
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/api/") ||
    url.pathname === "/sitemap.xml" ||
    url.pathname === "/robots.txt"
  ) {
    return; // fall through to default browser fetch
  }

  // ── Navigation / HTML: network-first with a 4 s timeout ───────────
  // Never cache HTML.  If the network is too slow, show a clean
  // offline page instead of hanging on a blank screen.
  const accept = req.headers.get("accept") || "";
  if (req.mode === "navigate" || accept.includes("text/html")) {
    event.respondWith(
      Promise.race([
        fetch(req).catch(() => offlinePage()),
        new Promise((resolve) =>
          setTimeout(() => resolve(offlinePage()), 4000),
        ),
      ]),
    );
    return;
  }

  // ── Safe static assets: stale-while-revalidate ────────────────────
  if (SAFE_TO_CACHE.has(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_VERSION).then(async (cache) => {
        const cached = await cache.match(req);
        const fresh = fetch(req)
          .then((res) => {
            if (res.ok && res.type === "basic") cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || fresh;
      }),
    );
    return;
  }

  // Everything else: let the browser handle natively.
});

/** Minimal offline / timeout fallback.  Brand-coloured, single file,
 *  no external resources so it always renders.  Reload button forces
 *  a fresh network attempt. */
function offlinePage() {
  const html = `<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>সংযোগ নেই · PromisePD</title>
<style>
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#f7f9ff;color:#0b1220;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:1.5rem}
.card{max-width:28rem;width:100%;background:#fff;border-radius:1.5rem;padding:2.5rem 2rem;box-shadow:0 14px 36px -10px rgba(24,71,161,.18);text-align:center}
.dot{display:inline-block;width:8px;height:8px;border-radius:9999px;background:#e11924;margin-right:.5rem;vertical-align:middle;animation:pulse 1.6s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.tag{font-size:.75rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#5a6478}
h1{margin:1rem 0 .5rem;font-size:1.5rem;line-height:1.25;font-weight:800}
p{color:#5a6478;font-size:.9375rem;line-height:1.7;margin:0 0 1.5rem}
button{appearance:none;background:#1847a1;color:#fff;border:0;border-radius:.875rem;padding:.875rem 1.75rem;font-size:.9375rem;font-weight:700;cursor:pointer;box-shadow:0 14px 36px -10px rgba(24,71,161,.45)}
button:hover{background:#133680}
small{display:block;margin-top:1rem;color:#8a93a6;font-size:.75rem}
</style>
</head>
<body>
<div class="card">
<div class="tag"><span class="dot"></span>সংযোগ নেই</div>
<h1>ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না</h1>
<p>আপনার ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।</p>
<button onclick="location.reload()">আবার লোড করুন</button>
<small>Promise Proper Development Ltd.</small>
</div>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
