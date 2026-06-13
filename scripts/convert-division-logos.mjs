/**
 * One-shot: convert the five division brand logos in /public from PNG
 * to WebP for use as the division icons (Hero showcase card + Navbar
 * "আমাদের বিভাগ" dropdown).
 *
 * Unlike the upload pipeline (src/lib/image.ts), this does NOT flatten
 * the alpha channel — these are transparent-background logos that sit
 * inside light icon boxes, so transparency must be preserved. Logos
 * also don't need the 1920px hero cap; 512px is plenty for a ~48px box
 * on retina displays.
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const PUBLIC = path.join(ROOT, "public");

// source PNG  →  clean slug-named .webp output (matches DIVISION slug)
const MAP = [
  ["promisecitylgo.png", "div-promise-city.webp"],
  ["Ahbab-Real-Estate's-Logo.png", "div-ahbab-real-estate.webp"],
  ["PI.png", "div-promise-international.webp"],
  ["Ahbab-Travels-and-Tours-logo.png", "div-ahbab-travels-tours.webp"],
  // Ahbab Interior and Architects — the colour mark (the -white variant is
  // for dark backgrounds and would be invisible in the light icon boxes).
  ["AIA-LOGO.png", "div-ahbab-interior.webp"],
];

for (const [srcName, outName] of MAP) {
  const src = path.join(PUBLIC, srcName);
  if (!fs.existsSync(src)) {
    console.warn(`✗ missing: ${srcName}`);
    continue;
  }

  const out = path.join(PUBLIC, outName);
  const inputBytes = fs.statSync(src).size;

  await sharp(src, { failOn: "none" })
    .rotate()
    // Trim the transparent / solid border baked into each logo so the
    // mark fills its frame — otherwise object-contain shrinks it inside
    // the icon box and it looks tiny with a lot of empty space.
    .trim({ threshold: 12 })
    .resize({
      width: 512,
      height: 512,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82, effort: 6, alphaQuality: 100 }) // keep alpha crisp
    .toFile(out);

  const outputBytes = fs.statSync(out).size;
  const saved = (((inputBytes - outputBytes) / inputBytes) * 100).toFixed(1);

  console.log(
    `✓ ${srcName} → ${outName} · ${(inputBytes / 1024).toFixed(0)} KB → ${(
      outputBytes / 1024
    ).toFixed(0)} KB  (saved ${saved} %)`,
  );
}
