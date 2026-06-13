// Rebuilds public/screenshot-mobile-v2.png as a SQUARE install-dialog
// screenshot.  Chrome's Android "richer install UI" scales each screenshot
// into a roughly-square cell and left-aligns it; a tall 720x1280 portrait
// therefore fills only ~56% of the width and leaves a dark gap on the right.
//
// We composite the EXISTING (already-approved) portrait card, unchanged,
// centered on a branded navy panel with rounded corners + a soft drop
// shadow.  A square output fills the square cell, so the card sits dead
// centre with no gap — and the framing reads as deliberate, premium design.
//
// Static, repo-committed brand asset (manifest screenshot) -> exempt from the
// WebP upload pipeline; kept as PNG to match the sibling screenshot + for
// maximum install-dialog compatibility.

import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUB = path.join(__dirname, "..", "public");
const SRC = path.join(PUB, "screenshot-mobile-v2.png");
const OUT = SRC; // overwrite in place (original preserved in git history)

const SIDE = 1280; // square canvas
const RADIUS = 44; // card corner radius
const CARD_H = 1172; // leaves ~54px top/bottom margin
const PAD = 80; // shadow spread padding

const cardW = Math.round(720 * (CARD_H / 1280)); // keep card aspect
const cardX = Math.round((SIDE - cardW) / 2);
const cardY = Math.round((SIDE - CARD_H) / 2);

// 1. Resize the existing card (content untouched, just scaled to fit height).
const cardResized = await sharp(SRC).resize(cardW, CARD_H).png().toBuffer();

// 2. Round its corners via a dest-in mask.
const maskSvg = Buffer.from(
  `<svg width="${cardW}" height="${CARD_H}" xmlns="http://www.w3.org/2000/svg"><rect width="${cardW}" height="${CARD_H}" rx="${RADIUS}" ry="${RADIUS}" fill="#fff"/></svg>`,
);
const cardRounded = await sharp(cardResized)
  .composite([{ input: maskSvg, blend: "dest-in" }])
  .png()
  .toBuffer();

// 3. Soft drop shadow — drawn on a full canvas-sized layer (offset down a
//    touch) so the blur can spread without overflowing the composite.
const shadowSvg = Buffer.from(
  `<svg width="${SIDE}" height="${SIDE}" xmlns="http://www.w3.org/2000/svg"><rect x="${cardX}" y="${cardY + 22}" width="${cardW}" height="${CARD_H}" rx="${RADIUS}" ry="${RADIUS}" fill="#000" fill-opacity="0.55"/></svg>`,
);
const shadow = await sharp(shadowSvg).blur(34).png().toBuffer();

// 4. Branded navy panel (diagonal gradient + soft top glow).
const bgSvg = Buffer.from(
  `<svg width="${SIDE}" height="${SIDE}" xmlns="http://www.w3.org/2000/svg">
     <defs>
       <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
         <stop offset="0" stop-color="#0a1f4d"/>
         <stop offset="1" stop-color="#16356f"/>
       </linearGradient>
       <radialGradient id="glow" cx="50%" cy="38%" r="62%">
         <stop offset="0" stop-color="#2f63c8" stop-opacity="0.50"/>
         <stop offset="1" stop-color="#2f63c8" stop-opacity="0"/>
       </radialGradient>
     </defs>
     <rect width="${SIDE}" height="${SIDE}" fill="url(#g)"/>
     <rect width="${SIDE}" height="${SIDE}" fill="url(#glow)"/>
   </svg>`,
);
const bg = await sharp(bgSvg).png().toBuffer();

// 5. Composite: panel -> shadow (offset down) -> card.
const out = await sharp(bg)
  .composite([
    { input: shadow, left: cardX - PAD, top: cardY - PAD + 20 },
    { input: cardRounded, left: cardX, top: cardY },
  ])
  .png()
  .toBuffer();

await sharp(out).toFile(OUT);

const meta = await sharp(OUT).metadata();
console.log(`✓ ${path.basename(OUT)} -> ${meta.width}x${meta.height} (card ${cardW}x${CARD_H} centred)`);
