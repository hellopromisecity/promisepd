/**
 * One-shot: convert the team headshots in /public from JPEG to WebP
 * using the same sharp settings the upload pipeline uses
 * (src/lib/image.ts: 1920px max edge, quality 78, EXIF auto-rotate,
 * metadata stripped).
 *
 * After this runs, the originals can be removed from git and team.ts
 * can reference the .webp versions instead.
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const PUBLIC = path.join(ROOT, "public");

const FILES = ["ceo.jpeg", "manager.jpeg", "developer.jpg"];

for (const filename of FILES) {
  const src = path.join(PUBLIC, filename);
  if (!fs.existsSync(src)) {
    console.warn(`✗ missing: ${filename}`);
    continue;
  }

  const stem = filename.replace(/\.(jpg|jpeg|png)$/i, "");
  const out = path.join(PUBLIC, `${stem}.webp`);
  const inputBytes = fs.statSync(src).size;

  await sharp(src, { failOn: "none" })
    .rotate()
    .resize({
      width: 1920,
      height: 1920,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 78, effort: 5, smartSubsample: true })
    .toFile(out);

  const outputBytes = fs.statSync(out).size;
  const saved = (((inputBytes - outputBytes) / inputBytes) * 100).toFixed(1);

  console.log(
    `✓ ${filename} → ${stem}.webp · ${(inputBytes / 1024).toFixed(0)} KB → ${(
      outputBytes / 1024
    ).toFixed(0)} KB  (saved ${saved} %)`,
  );
}
