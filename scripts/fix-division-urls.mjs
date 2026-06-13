// One-shot codemod: drop the `/divisions/` prefix from every URL ref.
// Run with: node scripts/fix-division-urls.mjs

import fs from "node:fs";

const files = [
  "src/app/[slug]/page.tsx",
  "src/components/Hero.tsx",
  "src/components/Divisions.tsx",
  "src/components/Navbar.tsx",
  "src/lib/site.ts",
  "src/lib/schema.ts",
  "src/app/sitemap.ts",
];

for (const f of files) {
  if (!fs.existsSync(f)) {
    console.log("skip", f);
    continue;
  }
  let t = fs.readFileSync(f, "utf-8");
  const before = t;

  // /divisions/<slug-segment> → /<slug-segment>
  // Matches any path segment of [a-z0-9-]+ after /divisions/.
  // This catches both literal slugs and `${slug}` interpolation because the
  // template-literal `${...}` body contains those chars and the regex stops
  // at the first non-matching character.
  t = t.replace(/\/divisions\/([a-zA-Z0-9_${}.-]+)/g, "/$1");

  if (t !== before) {
    fs.writeFileSync(f, t);
    console.log("updated", f);
  } else {
    console.log("no-change", f);
  }
}
console.log("done");
