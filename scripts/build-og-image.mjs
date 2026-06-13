/**
 * One-shot: build the premium, on-brand share/install imagery —
 *   - /public/og-image.jpg            (1200×630)  social link previews
 *   - /public/screenshot-wide-v2.png  (1280×720)  PWA install dialog (wide)
 *   - /public/screenshot-mobile-v2.png (720×1280) PWA install dialog (narrow)
 *
 * Screenshot filenames are versioned (-v2) so the browser/CDN can't serve
 * a stale install-dialog preview when the design changes.
 *
 * Design: a real Ahbab Palace project photo kept FAINT under a strong
 * brand-blue wash (blue #1847A1 leads, red #E11924 as a thin accent bar)
 * with the circular logo + wordmark + division line.  English text so it
 * renders reliably through sharp/librsvg.
 */

import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PUB = path.join(ROOT, "public");
const PHOTO = path.join(PUB, "ahbab1pics", "ahbab1pics.webp");
const LOGO_B64 = fs.readFileSync(path.join(PUB, "logo.png")).toString("base64");
const FONT = "Arial, Helvetica, sans-serif";

const defs = `
  <defs>
    <linearGradient id="blue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1847a1" stop-opacity="0.95"/>
      <stop offset="55%" stop-color="#1847a1" stop-opacity="0.84"/>
      <stop offset="100%" stop-color="#133680" stop-opacity="0.96"/>
    </linearGradient>
    <linearGradient id="ink" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0b1220" stop-opacity="0"/>
      <stop offset="100%" stop-color="#0b1220" stop-opacity="0.45"/>
    </linearGradient>
  </defs>`;

async function build(file, W, H, body) {
  const base = await sharp(PHOTO)
    .resize(W, H, { fit: "cover", position: "centre" })
    .modulate({ brightness: 0.8, saturation: 0.9 })
    .toBuffer();
  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    ${defs}
    <rect width="${W}" height="${H}" fill="url(#blue)"/>
    <rect width="${W}" height="${H}" fill="url(#ink)"/>
    <rect x="0" y="0" width="${W}" height="10" fill="#e11924"/>
    <rect x="0" y="${H - 10}" width="${W}" height="10" fill="#e11924"/>
    ${body}
  </svg>`;
  const out = path.join(PUB, file);
  const img = sharp(base).composite([
    { input: Buffer.from(svg), top: 0, left: 0 },
  ]);
  if (/\.jpe?g$/i.test(file)) {
    // JPEG for the social OG image — WhatsApp/Facebook/LinkedIn render
    // JPEG link-preview thumbnails far more reliably than (palette) PNG,
    // and mozjpeg keeps it tiny (well under the ~300 KB limit).
    await img.jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: "4:4:4" }).toFile(out);
  } else {
    // Palette PNG for the PWA install screenshots — crisp UI art, small.
    await img.png({ palette: true, colours: 256, compressionLevel: 9, effort: 10 }).toFile(out);
  }
  const m = await sharp(out).metadata();
  console.log(`✓ ${file} · ${m.width}×${m.height} · ${Math.round(fs.statSync(out).size / 1024)} KB`);
}

const DIV = "Real Estate &#183; Construction &#183; Savings &#183; Hajj &#183; 3D Design";

// ── Landscape (og + wide) ─────────────────────────────────────────────
const landscape = (W, H) => `
  <image href="data:image/png;base64,${LOGO_B64}" x="${W * 0.075}" y="${H * 0.19}" width="${H * 0.24}" height="${H * 0.24}"/>
  <text x="${W * 0.225}" y="${H * 0.29}" font-family="${FONT}" font-size="${H * 0.099}" font-weight="bold" fill="#ffffff">PromisePD</text>
  <text x="${W * 0.226}" y="${H * 0.365}" font-family="${FONT}" font-size="${H * 0.043}" fill="#dbe4f7">Promise Proper Development Ltd.</text>
  <text x="${W * 0.075}" y="${H * 0.635}" font-family="${FONT}" font-size="${H * 0.092}" font-weight="bold" fill="#ffffff">Dhaka's Trusted Real-Estate Partner</text>
  <text x="${W * 0.077}" y="${H * 0.73}" font-family="${FONT}" font-size="${H * 0.046}" fill="#cfe0f7">${DIV}</text>
  <text x="${W * 0.077}" y="${H * 0.89}" font-family="${FONT}" font-size="${H * 0.041}" font-weight="bold" fill="#ffffff" opacity="0.92">promisepd.com</text>`;

// ── Portrait (mobile) — centred stack ─────────────────────────────────
const portrait = (W, H) => `
  <image href="data:image/png;base64,${LOGO_B64}" x="${(W - 200) / 2}" y="${H * 0.14}" width="200" height="200"/>
  <text x="${W / 2}" y="${H * 0.36}" text-anchor="middle" font-family="${FONT}" font-size="78" font-weight="bold" fill="#ffffff">PromisePD</text>
  <text x="${W / 2}" y="${H * 0.40}" text-anchor="middle" font-family="${FONT}" font-size="30" fill="#dbe4f7">Promise Proper Development Ltd.</text>
  <text x="${W / 2}" y="${H * 0.55}" text-anchor="middle" font-family="${FONT}" font-size="62" font-weight="bold" fill="#ffffff">Dhaka's Trusted</text>
  <text x="${W / 2}" y="${H * 0.605}" text-anchor="middle" font-family="${FONT}" font-size="62" font-weight="bold" fill="#ffffff">Real-Estate Partner</text>
  <text x="${W / 2}" y="${H * 0.70}" text-anchor="middle" font-family="${FONT}" font-size="27" fill="#cfe0f7">Real Estate &#183; Construction &#183; Savings</text>
  <text x="${W / 2}" y="${H * 0.735}" text-anchor="middle" font-family="${FONT}" font-size="27" fill="#cfe0f7">Hajj &#183; 3D Design</text>
  <text x="${W / 2}" y="${H * 0.90}" text-anchor="middle" font-family="${FONT}" font-size="30" font-weight="bold" fill="#ffffff" opacity="0.92">promisepd.com</text>`;

await build("og-image.jpg", 1200, 630, landscape(1200, 630));
await build("screenshot-wide-v2.png", 1280, 720, landscape(1280, 720));
await build("screenshot-mobile-v2.png", 720, 1280, portrait(720, 1280));
