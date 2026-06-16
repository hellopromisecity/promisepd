/**
 * PromiseCity — restore data from a backup snapshot made by backup-supabase.mjs.
 *
 * SAFETY: dry-run by DEFAULT. It only writes when you pass --confirm, and it
 * refuses to write to the live project unless you ALSO pass --allow-prod.
 * Normal recovery target is a FRESH Supabase project (or local Postgres) whose
 * schema you've already created by running supabase/migrations/.
 *
 * Usage:
 *   node scripts/restore-supabase.mjs                          # dry-run, latest snapshot
 *   node scripts/restore-supabase.mjs --file <path.json.gz>    # dry-run a specific file
 *   node scripts/restore-supabase.mjs --only investor_accounts,investments   # subset
 *   node scripts/restore-supabase.mjs --target-url <url> --target-key <service_key> --confirm
 *       ^ actually writes into the TARGET project (the recovery DB)
 *
 * Restore = create schema from supabase/migrations/ first, THEN run this.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoDir = join(__dirname, "..");
const envFile = join(repoDir, ".env.local");
const home = process.env.USERPROFILE || process.env.HOME || ".";
const BackupRoot = join(home, "Downloads", "backup", "promisecity-supabase");
const BatchSize = 500;

// Parents first so foreign keys resolve; unknown tables go last.
const ORDER = [
  "org_settings", "investment_types", "investment_projects", "blog_categories",
  "blog_projects", "marketing_point_items", "marketing_officers", "finance_accounts",
  "profiles", "investor_accounts",
  "investments", "investor_transactions", "investor_unsubscribe_requests", "project_overrides",
  "blog_posts", "post_views", "marketing_point_entries", "client_followups",
  "daily_reports", "attendance", "contact_submissions", "newsletter_subscriptions",
  "vault_credentials", "transactions", "audit_logs",
];

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const next = process.argv[i + 1];
  return next && !next.startsWith("--") ? next : true;
}
function parseEnv(p) {
  const out = {};
  for (const l of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}
function latestSnapshot() {
  const last = join(BackupRoot, "last", "promisecity-latest.json.gz");
  if (existsSync(last)) return last;
  const daily = join(BackupRoot, "daily");
  if (!existsSync(daily)) return null;
  const files = readdirSync(daily).filter((f) => f.endsWith(".json.gz"))
    .map((f) => ({ p: join(daily, f), t: statSync(join(daily, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  return files[0]?.p ?? null;
}

async function main() {
  const confirm = !!arg("confirm", false);
  const allowProd = !!arg("allow-prod", false);
  const only = arg("only") ? String(arg("only")).split(",").map((s) => s.trim()) : null;
  const file = arg("file") || latestSnapshot();
  if (!file || !existsSync(file)) { console.error("No snapshot found. Pass --file <path.json.gz>."); process.exit(1); }

  const snap = JSON.parse(gunzipSync(readFileSync(file)).toString("utf8"));
  const tables = Object.keys(snap.tables || {})
    .filter((t) => !only || only.includes(t))
    .sort((a, b) => (ORDER.indexOf(a) + 1 || 999) - (ORDER.indexOf(b) + 1 || 999));

  console.log(`snapshot : ${file}`);
  console.log(`created  : ${snap._meta?.created ?? "?"}`);
  console.log(`tables   : ${tables.length}${only ? " (filtered)" : ""}\n`);

  const env = existsSync(envFile) ? parseEnv(envFile) : {};
  const targetUrl = arg("target-url") || env.NEXT_PUBLIC_SUPABASE_URL;
  const targetKey = arg("target-key") || env.SUPABASE_SERVICE_ROLE_KEY;
  const isProd = targetUrl === env.NEXT_PUBLIC_SUPABASE_URL;

  if (!confirm) {
    console.log("DRY RUN — nothing will be written. Plan:");
    let total = 0;
    for (const t of tables) { const n = (snap.tables[t] || []).length; total += n; console.log(`  ${t.padEnd(32)} ${n} rows`); }
    console.log(`\nWould restore ${total} rows into ${tables.length} tables.`);
    console.log(`Target would be: ${targetUrl}${isProd ? "  (THIS IS THE LIVE PROJECT)" : ""}`);
    console.log("\nTo actually write: add --confirm (and --allow-prod only if the target really is live).");
    return;
  }

  if (isProd && !allowProd) {
    console.error("Refusing to write to the LIVE project. Point --target-url/--target-key at a recovery DB, or pass --allow-prod if you truly mean the live one.");
    process.exit(1);
  }
  if (!targetUrl || !targetKey) { console.error("Need --target-url and --target-key (service role) for the recovery DB."); process.exit(1); }

  const supa = createClient(targetUrl, targetKey, { auth: { persistSession: false, autoRefreshToken: false } });
  let ok = 0, failed = 0;
  for (const t of tables) {
    const rows = snap.tables[t] || [];
    if (!rows.length) { console.log(`  ${t}: 0 rows, skip`); continue; }
    let done = 0; const errs = [];
    for (let i = 0; i < rows.length; i += BatchSize) {
      const batch = rows.slice(i, i + BatchSize);
      const { error } = await supa.from(t).upsert(batch);
      if (error) errs.push(error.message); else done += batch.length;
    }
    if (errs.length) { failed++; console.log(`  ${t}: restored ${done}/${rows.length} — ERROR ${errs[0]}`); }
    else { ok++; console.log(`  ${t}: restored ${done}/${rows.length}`); }
  }
  console.log(`\nDone. ${ok} tables OK, ${failed} with errors.`);
  if (failed) process.exit(2);
}

main().catch((e) => { console.error("FATAL:", (e && e.stack) || e); process.exit(1); });
