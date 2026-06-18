/**
 * Regenerate the full PWA icon + splash set from the brand app-icon.
 *
 * Source: public/final.webp  (512×512 rounded-square PPD / Promise City app
 * icon — the single brand icon Kamrul maintains; converted from final.png).
 * Used as the icon EVERYWHERE: PWA install icon, Android splash, iOS home
 * icon + launch screens, and the browser / Google favicon.
 *
 * Why maskable is full-bleed: maskable icons are masked to the launcher's
 * shape and MUST fill the square — any transparent padding renders as a dark
 * frame. "any" icons keep the clean rounded-square (transparent corners).
 *
 * Outputs (all overwrite in place):
 *   public/icon-any-192.png, icon-any-512.png   — purpose "any" (transparent)
 *   public/icon-any.webp                          — webp "any"
 *   public/icon-maskable-192.png, -512.png        — purpose "maskable" (blue)
 *   src/app/icon.png                              — favicon / Next icon (256)
 *   src/app/apple-icon.png                        — iOS home icon (180, blue)
 *   public/splash/apple-splash-*.png              — iOS launch screens
 *
 * favicon.ico is generated separately (needs png-to-ico) — see the one-off
 * command in the commit / README; this script is sharp-only.
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
const SRC = join(PUBLIC, "final.webp");

const WHITE = { r: 0xff, g: 0xff, b: 0xff, alpha: 1 };
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };

/** Resize the icon to `px` square, contained on a transparent canvas. */
const logoBuf = (px) =>
  sharp(SRC).resize(px, px, { fit: "contain", background: CLEAR }).png().toBuffer();

/** Composite a contained icon (fraction of the side) onto a solid canvas. */
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

  // Sample the icon's own blue so the maskable / iOS backgrounds blend
  // seamlessly with final.webp instead of showing a seam.
  const d = (await sharp(SRC).stats()).dominant;
  const BLUE = { r: d.r, g: d.g, b: d.b, alpha: 1 };

  // ── "any" icons — the clean rounded-square, transparent corners ──
  await sharp(SRC).resize(192, 192, { fit: "contain", background: CLEAR }).png()
    .toFile(join(PUBLIC, "icon-any-192.png"));
  await sharp(SRC).resize(512, 512, { fit: "contain", background: CLEAR }).png()
    .toFile(join(PUBLIC, "icon-any-512.png"));
  await sharp(SRC).resize(512, 512, { fit: "contain", background: CLEAR }).webp({ quality: 92 })
    .toFile(join(PUBLIC, "icon-any.webp"));

  // ── maskable icons — full-bleed brand blue, icon in the safe zone ──
  await plate(192, 192, BLUE, 0.82, join(PUBLIC, "icon-maskable-192.png"));
  await plate(512, 512, BLUE, 0.82, join(PUBLIC, "icon-maskable-512.png"));

  // ── favicon / Next icon (256, transparent rounded-square) ──
  await sharp(SRC).resize(256, 256, { fit: "contain", background: CLEAR }).png()
    .toFile(join(APP, "icon.png"));

  // ── iOS home-screen icon (180): flatten onto blue so the rounded corners
  //    read as a solid blue tile (iOS adds its own corner radius). ──
  await sharp(SRC).resize(180, 180, { fit: "contain", background: BLUE })
    .flatten({ background: BLUE }).png()
    .toFile(join(APP, "apple-icon.png"));

  // ── iOS launch screens (white bg, centered icon ~42% of width) ──
  const SPLASH = [
    [640, 1136], [750, 1334], [828, 1792], [1125, 2436], [1170, 2532],
    [1179, 2556], [1242, 2688], [1284, 2778], [1290, 2796],
  ];
  for (const [w, h] of SPLASH) {
    const logo = await logoBuf(Math.round(w * 0.42));
    await sharp({ create: { width: w, height: h, channels: 4, background: WHITE } })
      .composite([{ input: logo, gravity: "center" }])
      .png()
      .toFile(join(PUBLIC, "splash", `apple-splash-${w}x${h}.png`));
  }

  console.log("PWA icon + splash set regenerated from final.webp (blue #" +
    [d.r, d.g, d.b].map((x) => x.toString(16).padStart(2, "0")).join("") + ").");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
