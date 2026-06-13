/**
 * Flips the primary-CTA colour from red → blue across all components.
 *
 * The logo has blue as the dominant brand colour and red as the
 * accent.  My earlier implementation had it the other way round, so
 * every "primary button" pattern needs to switch.
 *
 * Targeted patterns (all within a single className string —
 * `[^"`]*?` stays inside one quoted attribute):
 *
 *   1. `bg-brand-red … hover:bg-brand-red-dark`
 *      → `bg-brand-blue … hover:bg-brand-blue-dark`
 *      (the universal "filled primary button" combo)
 *
 *   2. `hover:border-brand-red/{40,50}`
 *      → `hover:border-brand-blue/{40,50}`
 *      (the "ghost button" border-hover that pairs with the primary)
 *
 * Standalone `bg-brand-red` (no hover) is intentionally NOT touched —
 * those are accent chips, alert dots, ribbons, etc. where red is the
 * correct choice.  A second pass with manual review handles those.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "src");

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const PRIMARY_BTN = /bg-brand-red([^"`]*?)hover:bg-brand-red-dark/g;
const BORDER_HOVER = /hover:border-brand-red\/(40|50)/g;

let touched = 0;
let totalReplacements = 0;

for (const file of walk(SRC)) {
  const before = fs.readFileSync(file, "utf-8");
  let after = before;

  let n1 = 0;
  after = after.replace(PRIMARY_BTN, (_, mid) => {
    n1 += 1;
    return `bg-brand-blue${mid}hover:bg-brand-blue-dark`;
  });

  let n2 = 0;
  after = after.replace(BORDER_HOVER, (_, slash) => {
    n2 += 1;
    return `hover:border-brand-blue/${slash}`;
  });

  if (after !== before) {
    fs.writeFileSync(file, after);
    const total = n1 + n2;
    totalReplacements += total;
    touched += 1;
    console.log(
      `✓ ${path.relative(ROOT, file)} — ${n1} btn, ${n2} border (${total} total)`,
    );
  }
}

console.log(
  `\n${totalReplacements} replacements across ${touched} file${
    touched > 1 ? "s" : ""
  }.`,
);
