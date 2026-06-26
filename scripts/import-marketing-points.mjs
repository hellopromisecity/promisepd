/**
 * One-off importer: marketing officers' historical point ledger.
 *
 * Source: the "Marketing Director & Officer Name list" workbook — one tab per
 * officer, each a dated sales/activity ledger (see column map below). This
 * reproduces, for every officer that has NO entries yet, exactly the
 * convention the first ~20 officers were entered with (one entry per sheet
 * row, real sale dates, catalogue rates). Idempotent: officers that already
 * have entries are skipped, so re-running never double-imports.
 *
 *   npm i xlsx --no-save        # one-off parse dependency (not a runtime dep)
 *   node scripts/import-marketing-points.mjs <path-to.xlsx>            # dry run
 *   node scripts/import-marketing-points.mjs <path-to.xlsx> --confirm  # write
 *
 * The xlsx is NOT committed (client names + mobile numbers = PII); pass it in.
 */
import { readFileSync } from "node:fs";
import xlsx from "xlsx";
import { createClient } from "@supabase/supabase-js";

const XLSX_PATH = process.argv[2];
const CONFIRM = process.argv.includes("--confirm");
if (!XLSX_PATH) { console.error("Usage: node scripts/import-marketing-points.mjs <xlsx> [--confirm]"); process.exit(1); }

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// Column indices in each officer sheet (row 2 = headers, data from row 3).
const C = { SL: 0, DATE: 1, FILE: 2, CLIENT: 3, DISTRICT: 4, MOBILE: 5, FB: 6, FC: 7, FT: 8, AP: 9, PC: 10, RECRUIT: 11, ATTEND: 12, DUES: 13, ROUGH: 14, TOTAL: 15 };

// Per-column → entry (label + rates), validated against already-done officers.
function buildEntry(key, value) {
  const v = r2(value); if (!(v > 0)) return null;
  switch (key) {
    case "FB":      return { label: "FB Activity", quantity: r2(v / 0.2), points: v, afr: 0, income: 0 };
    case "FC":      return { label: "ফুজালা কমপ্লেক্স শেয়ার (প্রতি শেয়ার)", quantity: v, points: v, afr: r2(v * 3000000), income: r2(v * 15000) };
    case "FT":      return { label: "ফুজালা টাওয়ার শেয়ার (প্রতি শেয়ার)", quantity: v, points: v, afr: r2(v * 1000000), income: r2(v * 20000) };
    case "AP":      return { label: "আহবাব রিয়েল এস্টেট ফ্ল্যাট 2 (প্রতি ফ্ল্যাট)", quantity: r2(v / 5), points: v, afr: r2((v / 5) * 4200000), income: r2((v / 5) * 50000) };
    case "PC":      return { label: "জমি (প্রতি শতাংশ)", quantity: v, points: v, afr: r2(v * 600000), income: r2(v * 10000) };
    case "RECRUIT": return { label: "অ্যাক্টিভ মার্কেটিং অফিসার নিয়োগ (প্রতি অফিসার)", quantity: r2(v / 2), points: v, afr: 0, income: r2((v / 2) * 20000) };
    case "ATTEND":  return { label: "Custom Activity", quantity: v, points: v, afr: 0, income: 0, fallbackClient: "Timely attendance" };
    case "DUES":    return { label: "Custom Activity", quantity: v, points: v, afr: 0, income: 0, fallbackClient: "Conditional (dues)" };
  }
}
const MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
function parseDate(v) {
  if (!v) return null;
  if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  const m = s.match(/^(\d{1,2})-([A-Za-z]{3,})-(\d{4})$/);
  if (m) { const mo = MON[m[2].slice(0, 3).toLowerCase()]; if (mo) return `${m[3]}-${String(mo).padStart(2, "0")}-${m[1].padStart(2, "0")}`; }
  const d = new Date(s); return isNaN(d) ? null : d.toISOString().slice(0, 10);
}
const clean = (x) => { const s = String(x ?? "").trim(); return s === "" ? null : s; };

async function main() {
  // DB officers by code + which already have entries
  const { data: offs } = await admin.from("marketing_officers").select("id, name, officer_code");
  const byCode = new Map(offs.filter((o) => o.officer_code).map((o) => [o.officer_code.trim().toUpperCase(), o]));
  const counts = {};
  for (let from = 0; ; from += 1000) {
    const { data } = await admin.from("marketing_point_entries").select("officer_id").range(from, from + 999);
    const rows = data ?? []; for (const r of rows) counts[r.officer_id] = (counts[r.officer_id] || 0) + 1;
    if (rows.length < 1000) break;
  }

  const wb = xlsx.readFile(XLSX_PATH, { cellDates: true });
  const META = new Set(["Notes", "Rules", "Database", "Search Box", "Home Page"]);
  let totEntries = 0, willImport = 0, skipDone = 0, noMatch = [], mismatches = [];

  const plan = []; // { officer, code, entries[], computedPts, sheetTotal }
  for (const sheetName of wb.SheetNames) {
    if (META.has(sheetName)) continue;
    const ws = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
    if (!rows.length) continue;
    const title = String(rows[0]?.[0] ?? "");
    const codeM = title.match(/(D-\d{7}|OF-\d{7}|MI-\d{7})/i);
    if (!codeM) { continue; }
    const code = codeM[1].toUpperCase();
    const officer = byCode.get(code);
    if (!officer) { noMatch.push(`${sheetName} (${code})`); continue; }

    const entries = [];
    let sheetTotalSum = 0;
    for (let i = 3; i < rows.length; i++) {
      const row = rows[i]; if (!row) continue;
      const date = parseDate(row[C.DATE]);
      const client = clean(row[C.CLIENT]);
      const file = clean(row[C.FILE]);
      // Only real sale/activity rows count. The per-sheet column-TOTALS row
      // (and the blank pre-numbered rows) carry no date/client/file — skip
      // them so we don't double-count. The "Dues" column is intentionally
      // excluded: it's a marker re-stating a sale's pending-dues points, not
      // an extra point source (Total Points already counts them once).
      if (!date && !client && !file) continue;
      sheetTotalSum += Number(row[C.TOTAL]) || 0;
      for (const [key, col] of [["FB", C.FB], ["FC", C.FC], ["FT", C.FT], ["AP", C.AP], ["PC", C.PC], ["RECRUIT", C.RECRUIT], ["ATTEND", C.ATTEND]]) {
        const e = buildEntry(key, row[col]);
        if (!e) continue;
        entries.push({
          officer_id: officer.id, item_label: e.label, quantity: e.quantity,
          points: e.points, afr: e.afr, income: e.income,
          sale_date: date, client_name: client ?? e.fallbackClient ?? null, client_id: file,
        });
      }
    }
    const computedPts = r2(entries.reduce((s, e) => s + e.points, 0));
    const sheetTotal = r2(sheetTotalSum);
    if (counts[officer.id] > 0) { skipDone++; continue; }       // idempotent: already done
    if (entries.length === 0) continue;                          // nothing to import
    if (Math.abs(computedPts - sheetTotal) > 0.05) mismatches.push(`${code} ${officer.name}: computed ${computedPts} vs sheet ${sheetTotal}`);
    plan.push({ officer, code, entries, computedPts, sheetTotal });
    willImport++; totEntries += entries.length;
  }

  console.log(`\nPending to import: ${willImport} officers, ${totEntries} entries. (skipped ${skipDone} already-done)`);
  if (noMatch.length) console.log(`No DB match (skipped): ${noMatch.join(", ")}`);
  if (mismatches.length) { console.log(`\n⚠ TOTAL MISMATCHES (${mismatches.length}):`); mismatches.forEach((m) => console.log("  " + m)); }
  else console.log("✓ every officer's computed points == sheet Total Points");
  console.log("\nPer-officer (code | name | entries | points | income | afr):");
  for (const p of plan) {
    const inc = r2(p.entries.reduce((s, e) => s + e.income, 0)), afr = r2(p.entries.reduce((s, e) => s + e.afr, 0));
    console.log(`  ${p.code} | ${p.officer.name.slice(0, 24).padEnd(24)} | ${String(p.entries.length).padStart(2)} | ${String(p.computedPts).padStart(6)} | ${String(inc).padStart(8)} | ${afr}`);
  }

  if (!CONFIRM) { console.log("\nDRY RUN — pass --confirm to write."); return; }

  console.log("\nWriting…");
  for (const p of plan) {
    const { error } = await admin.from("marketing_point_entries").insert(p.entries.map((e) => ({ ...e, note: "imported" })));
    if (error) { console.error(`  ✗ ${p.code} ${p.officer.name}: ${error.message}`); continue; }
    const points = r2(p.entries.reduce((s, e) => s + e.points, 0));
    const afr_total = r2(p.entries.reduce((s, e) => s + e.afr, 0));
    const income_total = r2(p.entries.reduce((s, e) => s + e.income, 0));
    await admin.from("marketing_officers").update({ points, afr_total, income_total }).eq("id", p.officer.id);
    console.log(`  ✓ ${p.code} ${p.officer.name}: ${p.entries.length} entries, ${points} pts`);
  }
  console.log("Done.");
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
