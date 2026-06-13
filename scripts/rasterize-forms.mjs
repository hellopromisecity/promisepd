/**
 * One-time: render each official blank form PDF → high-res WebP page
 * images under /public/forms/<slug>-p<n>.webp. These become the EXACT
 * background of the on-site form; the user's typed data is overlaid on
 * top (browser-shaped Bengali) and captured to a faithful PDF.
 *
 * Zero system deps — pdf-to-img bundles pdf.js + @napi-rs/canvas.
 */
import { pdf } from "pdf-to-img";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SRC = "C:/Users/User/Downloads";
const OUT = path.resolve("public/forms");
fs.mkdirSync(OUT, { recursive: true });

const FORMS = [
  { slug: "flat-allocation", file: "ফ্ল্যাট বরাদ্দের আবেদন ফরম.pdf" },
  { slug: "marketing-director", file: "Marketing director Form.pdf" },
  { slug: "promise-city", file: "P.C Form.pdf" },
  { slug: "fuzala-complex", file: "ফুযালা কমপ্লেক্স-এর ফরম.pdf" },
  { slug: "fuzala-tower", file: "ফুযালা টাওয়ার-এর ফরম.pdf" },
  { slug: "investment", file: "বিনিয়োগ ফরমবিনিয়োগ ফরম.pdf" },
];

const dirEntries = fs.readdirSync(SRC);
const findFile = (target) => {
  const t = target.normalize("NFC");
  const exact = dirEntries.find((n) => n.normalize("NFC") === t);
  if (exact) return exact;
  // looser: match on the leading keyword before any space/extension
  const key = t.replace(/\.pdf$/i, "").slice(0, 6);
  return dirEntries.find(
    (n) => n.normalize("NFC").includes(key) && /\.pdf$/i.test(n),
  );
};

for (const f of FORMS) {
  const found = findFile(f.file);
  if (!found) {
    console.warn(`! missing: ${f.file}`);
    continue;
  }
  const src = path.join(SRC, found);
  const doc = await pdf(src, { scale: 3 });
  let i = 1;
  for await (const pageBuf of doc) {
    const out = path.join(OUT, `${f.slug}-p${i}.webp`);
    const meta = await sharp(pageBuf).webp({ quality: 90 }).toFile(out);
    console.log(
      `✓ ${f.slug}-p${i}.webp · ${meta.width}×${meta.height} · ${Math.round(
        fs.statSync(out).size / 1024,
      )}KB`,
    );
    i++;
  }
}
console.log("done.");
