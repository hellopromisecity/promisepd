/**
 * Supabase connection + schema verifier.
 *
 *   node scripts/verify-supabase.mjs
 *
 * Reads .env.local, connects with the service-role key, and reports:
 *   - whether the project URL + key authenticate
 *   - whether the contact_submissions / newsletter_subscriptions
 *     tables exist
 *   - whether the public "uploads" storage bucket exists
 *
 * Use it before AND after applying the migrations to confirm each
 * step landed.  Read-only — it never writes anything.
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// Tiny .env.local parser (no dotenv dependency needed).
const envPath = path.resolve(import.meta.dirname, "..", ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("✗ .env.local not found — create it with your Supabase keys.");
  process.exit(1);
}
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

console.log(`→ Connecting to ${url}\n`);

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let allGood = true;

async function checkTable(name) {
  const { error } = await supabase.from(name).select("*", {
    count: "exact",
    head: true,
  });
  if (error) {
    if (error.code === "42P01" || /does not exist/i.test(error.message)) {
      console.log(`✗ table "${name}" — NOT created yet`);
    } else {
      console.log(`✗ table "${name}" — error: ${error.message}`);
    }
    allGood = false;
  } else {
    console.log(`✓ table "${name}" — exists`);
  }
}

async function checkBucket(id) {
  const { data, error } = await supabase.storage.getBucket(id);
  if (error || !data) {
    console.log(`✗ storage bucket "${id}" — NOT created yet`);
    allGood = false;
  } else {
    console.log(`✓ storage bucket "${id}" — exists (public: ${data.public})`);
  }
}

await checkTable("contact_submissions");
await checkTable("newsletter_subscriptions");
await checkBucket("uploads");

console.log(
  allGood
    ? "\n🎉 Everything is set up — contact form, newsletter, and uploads are live."
    : "\n⚠️  Some pieces are missing — run the migration SQL in the Supabase SQL Editor (see chat), then re-run this script.",
);
process.exit(allGood ? 0 : 2);
