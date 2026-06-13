/**
 * One-shot codemod: "প্রমিজ" → "প্রমিস" everywhere in src/.
 *
 * The brand "Promise" should be transliterated with দন্ত্য স (প্রমিস),
 * not the consonant জ (প্রমিজ).  Earlier copy used the wrong form.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const TARGET_DIRS = ["src", "supabase"];
const WRONG = "প্রমিজ";
const RIGHT = "প্রমিস";

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      out.push(...walk(full));
    } else if (/\.(tsx?|jsx?|md|mdx|json|sql|css)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

let touched = 0;
let totalReplacements = 0;

for (const dir of TARGET_DIRS) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const file of walk(abs)) {
    const before = fs.readFileSync(file, "utf-8");
    if (!before.includes(WRONG)) continue;
    const matches = before.split(WRONG).length - 1;
    const after = before.replaceAll(WRONG, RIGHT);
    fs.writeFileSync(file, after);
    touched += 1;
    totalReplacements += matches;
    console.log(
      `✓ ${path.relative(ROOT, file)} — ${matches} replacement${
        matches > 1 ? "s" : ""
      }`,
    );
  }
}

console.log(
  `\n${totalReplacements} replacements across ${touched} file${
    touched > 1 ? "s" : ""
  }.`,
);
