/**
 * Regenerate the full PWA icon + splash set from the brand logo.
 *
 * Source: public/pwa.png  (512×512 circular PPD/Promise City mark on a
 * transparent square — the logo Kamrul maintains as the single brand source).
 *
 * Why this exists — the "black rounded frame on the splash" bug:
 *   The old manifest used the *transparent* circle (logo.png) as the
 *   `maskable` icon.  Maskable icons are masked to the launcher's shape
 *   (circle / squircle) and MUST be full-bleed — any transparent padding
 *   gets composited over the system surface and renders as a dark frame.
 *   Fix: maskable icons here are full-bleed brand blue with the logo inside
 *   the 80% safe zone.  "any" icons stay the clean transparent circle.
 *
 * Outputs (all overwrite in place):
 *   public/icon-any-192.png, icon-any-512.png   — purpose "any" (transparent)
 *   public/icon-any.webp                          — webp "any" (Kamrul asked)
 *   public/icon-maskable-192.png, -512.png        — purpose "maskable" (blue)
 *   src/app/icon.png                              — favicon / Next icon (256)
 *   src/app/apple-icon.png                        — iOS home icon (180, white)
 *   public/splash/apple-splash-*.png              — iOS launch screens
 *   public/developer-v2.webp                      — new team headshot (webp)
 *
 * Run:  node scripts/gen-pwa-assets.mjs
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");
const APP = join(ROOT, "src", "app");
const SRC = join(PUBLIC, "pwa.png");

// Brand blue (matches manifest theme_color) — maskable fill + splash accent.
const BLUE = { r: 0x18, g: 0x47, b: 0xa1, alpha: 1 };
const WHITE = { r: 0xff, g: 0xff, b: 0xff, alpha: 1 };
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };

/** Resize the logo to `px` square, contained on a transparent canvas. */
const logoBuf = (px) =>
  sharp(SRC).resize(px, px, { fit: "contain", background: CLEAR }).png().toBuffer();

/** Composite a contained logo (fraction of the shorter side) onto a solid canvas. */
async function plate(W, H, bg, frac, out) {
  const side = Math.round(Math.min(W, H) * frac);
  const logo = await logoBuf(side);
  await sharp({ create: { width: W, height: H, channels: 4, background: bg } })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(out);
}

async function main() {
  await mkdir(join(PUBLIC, "splash"), { recursive: true });

  // ── "any" icons — clean transparent circle, straight resize ──
  await sharp(SRC).resize(192, 192, { fit: "contain", background: CLEAR }).png()
    .toFile(join(PUBLIC, "icon-any-192.png"));
  await sharp(SRC).resize(512, 512, { fit: "contain", background: CLEAR }).png()
    .toFile(join(PUBLIC, "icon-any-512.png"));
  await sharp(SRC).resize(512, 512, { fit: "contain", background: CLEAR }).webp({ quality: 92 })
    .toFile(join(PUBLIC, "icon-any.webp"));

  // ── maskable icons — full-bleed brand blue, logo in the 80% safe zone ──
  await plate(192, 192, BLUE, 0.8, join(PUBLIC, "icon-maskable-192.png"));
  await plate(512, 512, BLUE, 0.8, join(PUBLIC, "icon-maskable-512.png"));

  // ── favicon / Next icon (256, transparent circle) ──
  await sharp(SRC).resize(256, 256, { fit: "contain", background: CLEAR }).png()
    .toFile(join(APP, "icon.png"));

  // ── iOS home-screen icon (180, logo on white so iOS shows no black) ──
  await plate(180, 180, WHITE, 0.92, join(APP, "apple-icon.png"));

  // ── iOS launch screens (white bg, centered logo ~38% of width) ──
  const SPLASH = [
    [640, 1136], [750, 1334], [828, 1792], [1125, 2436], [1170, 2532],
    [1179, 2556], [1242, 2688], [1284, 2778], [1290, 2796],
  ];
  for (const [w, h] of SPLASH) {
    const side = Math.round(w * 0.42);
    const logo = await logoBuf(side);
    await sharp({ create: { width: w, height: h, channels: 4, background: WHITE } })
      .composite([{ input: logo, gravity: "center" }])
      .png()
      .toFile(join(PUBLIC, "splash", `apple-splash-${w}x${h}.png`));
  }

  // ── New team headshot: developer.png → developer-v2.webp (cache-busting
  //    versioned name, per the convention in src/lib/team.ts) ──
  await sharp(join(PUBLIC, "developer.png"))
    .rotate() // honour EXIF orientation, then strip it (no withMetadata)
    .resize(1280, 1280, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(join(PUBLIC, "developer-v2.webp"));

  console.log("PWA assets + developer-v2.webp generated.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
