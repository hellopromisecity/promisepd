/**
 * Atmospheric red toning — the radial blobs + wave dividers were
 * tuned with red and blue at roughly equal opacity, which makes
 * page sections wash pink.  The logo's red is a single accent
 * letter (~20 % visual weight), not 50 %.
 *
 * This codemod halves the alpha on every `rgba(225,25,36, …)`
 * fill across src/ so the red still warms a corner but never
 * dominates the blue.  Blue alphas are left alone.
 *
 * Conservative: anything ≤ 0.05 is treated as already-subtle and
 * left as-is.  Everything 0.06–0.30 is dropped to roughly half.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "src");

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(tsx?|jsx?|css)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const RED_RE = /rgba\(225,\s*25,\s*36,\s*0\.(\d+)\)/g;

let touched = 0;
let total = 0;

for (const file of walk(SRC)) {
  const before = fs.readFileSync(file, "utf-8");
  let n = 0;

  const after = before.replace(RED_RE, (full, digits) => {
    const alpha = parseFloat(`0.${digits}`);
    // Skip anything already very subtle.
    if (alpha <= 0.05) return full;
    // Halve and round to 2 dp.
    const next = Math.max(0.04, Math.round(alpha * 0.5 * 100) / 100);
    n += 1;
    return `rgba(225, 25, 36, ${next})`;
  });

  if (after !== before) {
    fs.writeFileSync(file, after);
    touched += 1;
    total += n;
    console.log(`✓ ${path.relative(ROOT, file)} — ${n}`);
  }
}

console.log(`\n${total} red-alpha values halved across ${touched} files.`);
