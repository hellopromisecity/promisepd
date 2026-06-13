/**
 * One-shot: trim the transparent padding around the circular Promise
 * City badge in /public/logo.png and re-export as a tight WebP.
 *
 * The source PNG is a square canvas with a lot of empty space around
 * the badge, so at any given box height the visible logo looks small.
 * Trimming the border lets the badge fill its container — bigger and
 * clearer at the same height.  Used in the navbar / footer / about
 * (NOT the PWA manifest icons, which intentionally keep their square
 * safe-zone padding).
 */

import sharp from "sharp";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "public", "logo.png");
const OUT = path.join(ROOT, "public", "logo-tight.webp");

const trimmed = sharp(SRC).trim({ threshold: 12 });
const meta = await trimmed.metadata();

await trimmed
  .resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true })
  .webp({ quality: 92, alphaQuality: 100, effort: 6 })
  .toFile(OUT);

const out = await sharp(OUT).metadata();
console.log(
  `✓ logo.png trimmed → logo-tight.webp · ${meta.width}×${meta.height} (after trim) → ${out.width}×${out.height} output`,
);
