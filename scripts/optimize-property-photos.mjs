/**
 * Convert every property-photo source in /public/{ftpics,fcpics,ahbab1pics}
 * to brand-friendly WebP (1920 px max edge, q72, EXIF auto-rotate,
 * metadata stripped) and remove the originals.
 *
 * These photos are used as soft hero backdrops (PropertyBackdrop
 * component) — at the opacity we render them, q72 is visually
 * indistinguishable from q90 and saves ~40 %.
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const FOLDERS = ["public/ftpics", "public/fcpics", "public/ahbab1pics"];

let okCount = 0;
let savedKb = 0;

for (const folder of FOLDERS) {
  const dir = path.join(ROOT, folder);
  if (!fs.existsSync(dir)) {
    console.warn(`✗ missing: ${folder}`);
    continue;
  }

  for (const file of fs.readdirSync(dir)) {
    if (!/\.(jpe?g|png)$/i.test(file)) continue;
    const inPath = path.join(dir, file);

    // Stem normalised: lowercase, no spaces, no dots in middle.
    const stem = file
      .replace(/\.(jpe?g|png)$/i, "")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const outPath = path.join(dir, `${stem}.webp`);

    const inSize = fs.statSync(inPath).size;

    await sharp(inPath, { failOn: "none" })
      .rotate()
      .resize({
        width: 1920,
        height: 1920,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 72, effort: 5, smartSubsample: true })
      .toFile(outPath);

    const outSize = fs.statSync(outPath).size;
    fs.unlinkSync(inPath);

    okCount += 1;
    savedKb += (inSize - outSize) / 1024;
    console.log(
      `✓ ${folder}/${file} → ${stem}.webp  ·  ${(inSize / 1024).toFixed(
        0,
      )} KB → ${(outSize / 1024).toFixed(0)} KB`,
    );
  }
}

console.log(
  `\n${okCount} photo${
    okCount > 1 ? "s" : ""
  } optimised  ·  ${savedKb.toFixed(0)} KB saved overall.`,
);
