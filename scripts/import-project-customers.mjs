/**
 * Import the master per-project customer books (Drive "Allprojects" .xlsx set)
 * into hub_customers + hub_customer_payments. Authoritative "who paid how much
 * per project" ledger — SEPARATE from the ported investor platform (untouched).
 *
 *   npm i xlsx pg --no-save
 *   node scripts/import-project-customers.mjs <folder>            # dry run (report)
 *   node scripts/import-project-customers.mjs <folder> --confirm  # write (replace-per-project)
 *
 * Idempotent: each project's rows are deleted + re-inserted, so re-running is safe.
 * The .xlsx books are NOT committed (customer PII); pass the folder path.
 */
import { readFileSync } from "node:fs";
import xlsx from "xlsx";
import { createClient } from "@supabase/supabase-js";

const DIR = process.argv[2];
const CONFIRM = process.argv.includes("--confirm");
if (!DIR) { console.error("Usage: node scripts/import-project-customers.mjs <folder> [--confirm]"); process.exit(1); }
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ""); }
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// file → { key, name, type, sort }
const PROJECTS = [
  { file: "(F.T) ফুযালা টাওয়ারের গ্রাহক হিসাব.xlsx", key: "fuzala-tower", name: "Fuzala Tower", type: "realestate", sort: 1 },
  { file: "(F.C) List of customer accounts in Fuzala Complex.xlsx", key: "fuzala-complex", name: "Fuzala Complex", type: "realestate", sort: 2 },
  { file: "(P.C) List of customer accounts in Promise City.xlsx", key: "promise-city", name: "Promise City", type: "realestate", sort: 3 },
  { file: "(A.P-01) List of customer accounts in Ahbab Palace-01.xlsx", key: "ahbab-palace-01", name: "Ahbab Palace-01", type: "realestate", sort: 4 },
  { file: "(A.P-02) List of customer accounts in Ahbab Palace-02.xlsx", key: "ahbab-palace-02", name: "Ahbab Palace-02", type: "realestate", sort: 5 },
  { file: "(S.D.) List of customer accounts in Special Deposit.xlsx", key: "special-deposit", name: "Special Deposit", type: "deposit", sort: 6 },
  { file: "(G.D. A) List of customer accounts in General Deposit Group-A.xlsx", key: "general-deposit-a", name: "General Deposit A", type: "deposit", sort: 7 },
  { file: "(G.D. B) List of customer accounts in General Deposit Group-B.xlsx", key: "general-deposit-b", name: "General Deposit B", type: "deposit", sort: 8 },
  { file: "(M.D.) List of customer accounts in Monthly Deposit.xlsx", key: "monthly-deposit", name: "Monthly Deposit", type: "deposit", sort: 9 },
];
const META = new Set(["Database","Name Search","Name search","Summary Of Every Month","Circling Summary","Summary","Total Summary","File No. Search","Search Box","Home Page","Summary of the discussion"]);

const num = (v) => { const n = Number(String(v ?? "").replace(/[^\d.-]/g, "")); return Number.isFinite(n) ? n : 0; };
const clean = (v) => { const s = String(v ?? "").replace(/\s+/g, " ").trim(); return s === "" ? null : s; };
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const hidx = (hdr, ...names) => { for (const nm of names) { const i = hdr.findIndex((h) => String(h).trim().toLowerCase() === nm.toLowerCase()); if (i >= 0) return i; } return -1; };
const MON = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };
function toDate(v) {
  if (!v) return null;
  if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  const m = s.match(/^(\d{1,2})-([A-Za-z]{3,})-(\d{4})$/);
  if (m) { const mo = MON[m[2].slice(0,3).toLowerCase()]; if (mo) return `${m[3]}-${String(mo).padStart(2,"0")}-${m[1].padStart(2,"0")}`; }
  const d = new Date(s); return isNaN(d) ? null : d.toISOString().slice(0, 10);
}

/** Database sheet → bio by file# and by lowercased name. */
function parseBio(wb) {
  const ws = wb.Sheets["Database"] || wb.Sheets[wb.SheetNames.find((n) => /database/i.test(n))];
  const byFile = new Map(), byName = new Map();
  if (!ws) return { byFile, byName };
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
  let h = rows.findIndex((r) => /member name/i.test(String(r[0])) || /^name$/i.test(String(r[0])));
  if (h < 0) h = 0;
  for (let i = h + 1; i < rows.length; i++) {
    const r = rows[i];
    const name = clean(r[0]), file = clean(r[1]);
    if (!name && !file) continue;
    const bio = {
      father_husband: clean(r[2]), mother: clean(r[3]), blood: clean(r[4]),
      village: clean(r[5]), post_office: clean(r[6]), police_station: clean(r[7]), district: clean(r[8]),
      nid: clean(r[9]), mobile: clean(r[10]),
      nominee_name: clean(r[11]), nominee_relationship: clean(r[12]),
      nominee_address: [clean(r[13]), clean(r[14]), clean(r[15]), clean(r[16])].filter(Boolean).join(", ") || null,
      nominee_nid: clean(r[17]), nominee_mobile: clean(r[18]), reference: clean(r[19]),
    };
    if (file) byFile.set(file, bio);
    if (name) byName.set(name.toLowerCase(), bio);
  }
  return { byFile, byName };
}

/** One customer tab → full record + payments[]. */
function parseTab(rows, type) {
  let h = -1;
  for (let i = 0; i < Math.min(4, rows.length); i++) if (/^file (number|no)/i.test(String(rows[i][0] ?? ""))) { h = i; break; }
  if (h < 0) return null;
  const hdr = rows[h].map((c) => String(c).trim());
  const d0 = rows[h + 1] || [];
  const file = clean(d0[0]), name = clean(d0[1]);
  if (!file && !name) return null;

  const c = {
    money: hidx(hdr, "Money"), savings: hidx(hdr, "Savings"), dividend: hidx(hdr, "Dividend"),
    withdrawal: hidx(hdr, "Withdrawal"), remaining: hidx(hdr, "Remaining"),
    date: hidx(hdr, "Submission date", "Date"), about: hidx(hdr, "About"), receipt: hidx(hdr, "Receipt No", "Receipt"),
    price: hidx(hdr, "Total price", "Total (potential) value", "About land shares"),
    join: hidx(hdr, "Joining date"), expiry: hidx(hdr, "Expiration date"),
    block: hidx(hdr, "Block No."), road: hidx(hdr, "Road No."), plot: hidx(hdr, "Plot No."),
    flat: hidx(hdr, "Flat No."), flatSize: hidx(hdr, "Flat size", "Plot size"), shares: hidx(hdr, "Number of shares"),
    land: hidx(hdr, "Land share + parking"), constr: hidx(hdr, "Construction cost (potential)", "Construction cost"),
    district: hidx(hdr, "District"),
  };
  const isDeposit = c.savings >= 0;
  const isTotal = (r) => String(r[c.date] ?? "").trim().toLowerCase().startsWith("total");

  const payments = [];
  let total_paid = 0, dividend = 0, withdrawn = 0, remaining = 0, balance = 0;
  for (let i = h + 1; i < rows.length; i++) {
    const r = rows[i];
    const label = String(r[c.date] ?? "").trim().toLowerCase();
    const aboutLbl = String(r[c.about] ?? "").trim().toLowerCase();
    if (isTotal(r)) { // totals row
      if (isDeposit) { total_paid = r2(num(r[c.savings])); dividend = r2(num(r[c.dividend])); withdrawn = r2(Math.abs(num(r[c.withdrawal]))); remaining = r2(num(r[c.remaining])); }
      else { total_paid = r2(num(r[c.money])); }
      continue;
    }
    if (/remaining amount/.test(label)) { remaining = r2(num(r[c.money] ?? r[c.remaining])); continue; }
    if (/withdrawal/.test(aboutLbl) || /withdrawal/.test(label)) { withdrawn = r2(Math.abs(num(r[c.money]))); continue; }
    if (/current bala/.test(aboutLbl) || /current bala/.test(label)) { balance = r2(num(r[c.money])); continue; }
    if (/service charge/.test(aboutLbl)) continue;
    // a real payment row
    if (isDeposit) {
      const sav = num(r[c.savings]), div = num(r[c.dividend]), wd = num(r[c.withdrawal]);
      const dt = toDate(r[c.date]), desc = clean(r[c.about]), rcpt = clean(r[c.receipt]);
      if (sav > 0) payments.push({ date: dt, description: desc, amount: r2(sav), receipt_no: rcpt, kind: "deposit" });
      if (div > 0) payments.push({ date: dt, description: desc || "Dividend", amount: r2(div), receipt_no: rcpt, kind: "dividend" });
      if (wd > 0) payments.push({ date: dt, description: desc || "Withdrawal", amount: r2(wd), receipt_no: rcpt, kind: "withdrawal" });
    } else {
      const amt = num(r[c.money]);
      if (amt > 0) payments.push({ date: toDate(r[c.date]), description: clean(r[c.about]), amount: r2(amt), receipt_no: clean(r[c.receipt]), kind: "deposit" });
    }
  }
  if (!total_paid && payments.length) total_paid = r2(payments.filter((p) => p.kind === "deposit").reduce((s, p) => s + p.amount, 0));

  return {
    file_no: file, name: name || "", district: isDeposit ? clean(d0[c.district >= 0 ? c.district : 2]) : clean(d0[2]),
    joining_date: toDate(d0[c.join]), expiry_date: toDate(d0[c.expiry]),
    total_price: c.price >= 0 ? r2(num(d0[c.price])) : 0, total_paid, total_remaining: remaining, dividend, withdrawn, balance,
    payments_count: payments.length,
    unit: {
      block: clean(d0[c.block]), road: clean(d0[c.road]), plot: clean(d0[c.plot]), flat: clean(d0[c.flat]),
      flat_size: clean(d0[c.flatSize]), shares: clean(d0[c.shares]),
      land_share: c.land >= 0 ? r2(num(d0[c.land])) : null, construction: c.constr >= 0 ? r2(num(d0[c.constr])) : null,
    },
    payments,
  };
}

function parseProject(proj) {
  const wb = xlsx.readFile(DIR + "/" + proj.file, { cellDates: true });
  const { byFile, byName } = parseBio(wb);
  const custTabs = wb.SheetNames.filter((n) => !META.has(n));
  const customers = [];
  for (const tab of custTabs) {
    const rows = xlsx.utils.sheet_to_json(wb.Sheets[tab], { header: 1, raw: false, defval: "" });
    const rec = parseTab(rows, proj.type);
    if (!rec) continue;
    const bio = (rec.file_no && byFile.get(rec.file_no)) || byName.get((rec.name || "").toLowerCase()) || {};
    customers.push({ source_tab: tab, ...rec, bio: { ...bio, ...rec.unit }, mobile: bio.mobile || null, district: rec.district || bio.district || null, nid: bio.nid || null, reference: bio.reference || null });
  }
  return customers;
}

async function main() {
  let gc = 0, gp = 0, gpaid = 0;
  for (const proj of PROJECTS) {
    const customers = parseProject(proj);
    const paid = customers.reduce((s, c) => s + c.total_paid, 0);
    const pays = customers.reduce((s, c) => s + c.payments.length, 0);
    gc += customers.length; gp += pays; gpaid += paid;
    console.log(`${proj.key.padEnd(18)} ${String(customers.length).padStart(4)} customers  ${String(pays).padStart(5)} payments  ৳${Math.round(paid).toLocaleString("en-IN")}`);

    if (!CONFIRM) continue;
    // replace-per-project
    await admin.from("hub_customers").delete().eq("project_key", proj.key);
    for (let i = 0; i < customers.length; i += 200) {
      const batch = customers.slice(i, i + 200).map((c) => ({
        project_key: proj.key, project_name: proj.name, project_type: proj.type, sort_order: proj.sort,
        source_tab: c.source_tab, file_no: c.file_no, name: c.name, mobile: c.mobile,
        mobile2: (c.bio.mobile && c.bio.nominee_mobile && c.bio.mobile !== c.bio.nominee_mobile) ? null : null,
        district: c.district, nid: c.nid, reference: c.reference,
        joining_date: c.joining_date, expiry_date: c.expiry_date,
        total_price: c.total_price, total_paid: c.total_paid, total_remaining: c.total_remaining,
        dividend: c.dividend, withdrawn: c.withdrawn, balance: c.balance, payments_count: c.payments_count,
        bio: c.bio,
      }));
      const { data, error } = await admin.from("hub_customers").insert(batch).select("id, source_tab");
      if (error) { console.error("  insert customers failed:", error.message); process.exit(1); }
      const idByTab = new Map(data.map((d) => [d.source_tab, d.id]));
      const payRows = [];
      for (const c of customers.slice(i, i + 200)) {
        const cid = idByTab.get(c.source_tab); if (!cid) continue;
        c.payments.forEach((p, seq) => payRows.push({ customer_id: cid, seq, date: p.date, description: p.description, amount: p.amount, receipt_no: p.receipt_no, kind: p.kind }));
      }
      for (let j = 0; j < payRows.length; j += 500) {
        const { error: pe } = await admin.from("hub_customer_payments").insert(payRows.slice(j, j + 500));
        if (pe) { console.error("  insert payments failed:", pe.message); process.exit(1); }
      }
    }
    console.log(`   ✓ written`);
  }
  console.log(`\nTOTAL: ${gc} customers, ${gp} payments, ৳${Math.round(gpaid).toLocaleString("en-IN")}`);
  console.log(CONFIRM ? "Imported." : "DRY RUN — pass --confirm to write.");
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
