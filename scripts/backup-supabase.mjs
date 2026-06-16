/**
 * PromiseCity — Supabase data backup (no Docker / pg_dump needed).
 *
 * Exports EVERY row of EVERY public table to one gzipped JSON snapshot and
 * rotates copies into daily / weekly / monthly folders — the same scheme the
 * old admin.promisepd.com server used.
 *
 * It uses the service-role key (already in .env.local) over PostgREST, which
 * bypasses RLS and so reads every row. Tables are discovered dynamically from
 * the PostgREST OpenAPI spec, and each is paged past Supabase's 1000-row cap.
 *
 * The table SCHEMA (DDL, RLS, functions) lives in supabase/migrations/ in git,
 * so this data snapshot + the repo = a complete, restorable backup.
 *
 * Run:        node scripts/backup-supabase.mjs
 * Schedule:   scripts/register-backup-task.ps1  (runs the .ps1 wrapper daily)
 * Docs:       scripts/BACKUP.md
 */

import {
  readFileSync, writeFileSync, mkdirSync, existsSync,
  readdirSync, statSync, unlinkSync, copyFileSync, appendFileSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoDir = join(__dirname, "..");
const envFile = join(repoDir, ".env.local");

// ---- settings (safe to edit) ------------------------------------------------
const home = process.env.USERPROFILE || process.env.HOME || ".";
const BackupRoot = join(home, "Downloads", "backup", "promisecity-supabase");
const KeepDaily = 14, KeepWeekly = 8, KeepMonthly = 12;
const PageSize = 1000;
// -----------------------------------------------------------------------------

function parseEnv(path) {
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

const pad = (n) => String(n).padStart(2, "0");
const now = new Date();
const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

const dirs = {
  daily: join(BackupRoot, "daily"), weekly: join(BackupRoot, "weekly"),
  monthly: join(BackupRoot, "monthly"), last: join(BackupRoot, "last"), logs: join(BackupRoot, "logs"),
};
for (const d of [BackupRoot, ...Object.values(dirs)]) mkdirSync(d, { recursive: true });

const logFile = join(dirs.logs, `backup-${now.getFullYear()}${pad(now.getMonth() + 1)}.log`);
function log(m) {
  const line = `${new Date().toISOString().slice(0, 19)}  ${m}`;
  console.log(line);
  try { appendFileSync(logFile, line + "\n"); } catch { /* ignore */ }
}

function isoWeekTag(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (t.getUTCDay() + 6) % 7;          // Mon=0 … Sun=6
  t.setUTCDate(t.getUTCDate() - day + 3);        // nearest Thursday
  const week1 = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((t - week1) / 86400000 - 3 + ((week1.getUTCDay() + 6) % 7)) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function prune(dir, keep) {
  const files = readdirSync(dir).filter((f) => f.endsWith(".json.gz"))
    .map((f) => ({ f, t: statSync(join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  for (const { f } of files.slice(keep)) { unlinkSync(join(dir, f)); log(`pruned ${f}`); }
}

async function main() {
  if (!existsSync(envFile)) { log(`ERROR: .env.local not found at ${envFile}`); process.exit(1); }
  const env = parseEnv(envFile);
  const URL = env.NEXT_PUBLIC_SUPABASE_URL;
  const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL || !KEY) { log("ERROR: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env.local"); process.exit(1); }

  log(`=== backup start (${stamp}) ===`);

  // discover tables/views from the PostgREST OpenAPI spec
  const specRes = await fetch(`${URL}/rest/v1/`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  if (!specRes.ok) { log(`ERROR: could not read API spec (HTTP ${specRes.status})`); process.exit(1); }
  const spec = await specRes.json();
  const defs = spec.definitions || (spec.components && spec.components.schemas) || {};
  const tables = Object.keys(defs);
  if (!tables.length) { log("ERROR: no tables discovered"); process.exit(1); }
  log(`discovered ${tables.length} tables/views`);

  const supa = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const out = {
    _meta: { created: new Date().toISOString(), project: URL, generator: "backup-supabase.mjs", tables: 0, total_rows: 0, errors: [] },
    tables: {},
  };

  for (const t of tables) {
    try {
      const orderCol = Object.keys((defs[t] && defs[t].properties) || {})[0] || null;
      const { count, error: cErr } = await supa.from(t).select("*", { count: "exact", head: true });
      if (cErr) throw new Error(cErr.message);
      const rows = [];
      const total = count ?? 0;
      for (let from = 0; from < total || (total === 0 && from === 0); from += PageSize) {
        let q = supa.from(t).select("*").range(from, from + PageSize - 1);
        if (orderCol) q = q.order(orderCol, { ascending: true });
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        rows.push(...(data ?? []));
        if (!data || data.length < PageSize) break;
      }
      out.tables[t] = rows;
      out._meta.total_rows += rows.length;
      out._meta.tables++;
      log(`  ${t}: ${rows.length} rows`);
    } catch (e) {
      out._meta.errors.push({ table: t, error: String((e && e.message) || e) });
      log(`  ${t}: ERROR ${(e && e.message) || e}`);
    }
  }

  const json = JSON.stringify(out);
  const gz = gzipSync(Buffer.from(json, "utf8"), { level: 9 });
  if (gz.length < 200) { log("ERROR: snapshot suspiciously small — aborting, not overwriting good backups"); process.exit(1); }

  const outName = `promisecity-${stamp}.json.gz`;
  const outPath = join(dirs.daily, outName);
  writeFileSync(outPath, gz);
  copyFileSync(outPath, join(dirs.last, "promisecity-latest.json.gz"));
  log(`wrote daily/${outName} (${(gz.length / 1024).toFixed(1)} KB gz, ${(json.length / 1024).toFixed(1)} KB raw, ${out._meta.total_rows} rows / ${out._meta.tables} tables)`);

  const weekTag = isoWeekTag(now);
  const wPath = join(dirs.weekly, `promisecity-${weekTag}.json.gz`);
  if (!existsSync(wPath)) { copyFileSync(outPath, wPath); log(`weekly snapshot ${weekTag}`); }
  const mTag = `${now.getFullYear()}${pad(now.getMonth() + 1)}`;
  const mPath = join(dirs.monthly, `promisecity-${mTag}.json.gz`);
  if (!existsSync(mPath)) { copyFileSync(outPath, mPath); log(`monthly snapshot ${mTag}`); }

  prune(dirs.daily, KeepDaily);
  prune(dirs.weekly, KeepWeekly);
  prune(dirs.monthly, KeepMonthly);

  if (out._meta.errors.length) { log(`=== done WITH ${out._meta.errors.length} table error(s) — check the log ===`); process.exit(2); }
  log("=== backup OK ===");
}

main().catch((e) => { log(`FATAL: ${(e && e.stack) || e}`); process.exit(1); });
