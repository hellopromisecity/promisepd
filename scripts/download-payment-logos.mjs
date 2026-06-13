/**
 * Download official payment-method + payment-gateway logos, run them
 * through the same sharp pipeline the upload route uses (resize +
 * WebP), and drop them into /public/payments/.
 *
 * Solid colour chips don't earn trust — Bangladeshi visitors expect
 * to see the actual bKash, Nagad, Visa marks at checkout.
 *
 * Why curl and not Node fetch: Wikimedia + a couple of the brand
 * CDNs block non-browser User-Agents from Node fetch but happily
 * serve curl, so we shell out for the network call and keep sharp
 * for the encoding step.
 *
 * URLs verified working at commit time; if any of them rot in
 * future, the script will report the failures so a maintainer can
 * swap in fresh paths without touching the rest of the pipeline.
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "public", "payments");
fs.mkdirSync(OUT, { recursive: true });

// Each logo is shipped at ~96 px tall WebP (renders crisply at the
// ~32 px footer size, even at 3x DPR).  Aspect ratio is preserved.
const TARGET_HEIGHT = 96;

const LOGOS = [
  {
    name: "bkash",
    url: "https://upload.wikimedia.org/wikipedia/en/thumb/6/68/BKash_logo.svg/330px-BKash_logo.svg.png",
  },
  {
    name: "nagad",
    // The official Nagad wordmark (the orange "Nagad" lockup).  An
    // earlier attempt grabbed `logo-02` which is just the circular
    // emblem — fine as a favicon, useless as a trust signal in the
    // footer because nobody recognises the bare icon.
    url: "https://nagad.com.bd/_nuxt/img/new-logo.14fe8a5.png",
  },
  {
    name: "upay",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Upay_logo.svg/330px-Upay_logo.svg.png",
  },
  {
    name: "rocket",
    url: "https://www.dutchbanglabank.com/img/logo.png",
  },
  {
    name: "sslcommerz",
    // The full SSLCommerz wordmark — earlier `z.svg` was just the
    // stylised letter glyph from their header, again no use as a
    // standalone trust badge.
    url: "https://sslcommerz.com/wp-content/uploads/2021/11/logo.png",
  },
  {
    name: "visa",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Visa_Inc._logo_%282021%E2%80%93present%29.svg/500px-Visa_Inc._logo_%282021%E2%80%93present%29.svg.png",
  },
  {
    name: "mastercard",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/330px-Mastercard-logo.svg.png",
  },
];

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

let ok = 0;
let fail = 0;

for (const { name, url } of LOGOS) {
  try {
    // Pull the bytes via curl (Wikimedia / nagad CDN are friendly to
    // it).  --fail makes curl exit non-zero on a 4xx/5xx so we don't
    // try to encode an HTML error page as an image.
    const bytes = execSync(
      `curl -sL --fail -A "${UA}" "${url}"`,
      { maxBuffer: 16 * 1024 * 1024 },
    );

    if (!bytes || bytes.length < 200) {
      throw new Error(`response too small (${bytes?.length ?? 0} bytes)`);
    }

    const out = await sharp(bytes)
      .resize({ height: TARGET_HEIGHT, withoutEnlargement: false })
      .webp({ quality: 90, effort: 5 })
      .toBuffer();

    fs.writeFileSync(path.join(OUT, `${name}.webp`), out);
    ok += 1;
    console.log(
      `✓ ${name}.webp  ·  ${(bytes.length / 1024).toFixed(0)} KB → ${(
        out.length / 1024
      ).toFixed(0)} KB`,
    );
  } catch (err) {
    fail += 1;
    console.error(`✗ ${name}: ${err.message?.split("\n")[0] ?? err}`);
  }
}

console.log(
  `\n${ok}/${LOGOS.length} saved to /public/payments/${
    fail ? `  (${fail} failed)` : ""
  }`,
);
