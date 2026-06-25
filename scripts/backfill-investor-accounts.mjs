/**
 * Backfill investor_accounts for orphan signups.
 *
 * Public signup creates auth.users + profiles(role=member) but historically
 * did NOT create an investor_accounts row — so those users never appeared in
 * the admin "App Users" list (which reads investor_accounts) and couldn't be
 * re-added manually ("phone already exists").  This gives every member
 * profile that lacks an investor account a fresh zero-balance one.
 *
 * Safe by default: prints what it WOULD do.  Pass --confirm to write.
 *
 *   node scripts/backfill-investor-accounts.mjs            # dry run
 *   node scripts/backfill-investor-accounts.mjs --confirm  # apply
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APPLY = process.argv.includes("--confirm");
const admin = createClient(URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });

/** Read every row of a table/column set, paging past the 1000-row cap. */
async function readAll(table, cols) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin.from(table).select(cols).range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...(data ?? []));
    if ((data ?? []).length < 1000) break;
  }
  return out;
}

const accounts = await readAll("investor_accounts", "uid, profile_id, phone_number");
const linked = new Set(accounts.map((a) => a.profile_id).filter(Boolean));
const phones = new Set(accounts.map((a) => a.phone_number).filter(Boolean));
let maxUid = 100000;
for (const a of accounts) {
  const n = parseInt(String(a.uid ?? "").replace(/\D/g, ""), 10);
  if (Number.isFinite(n) && n > maxUid) maxUid = n;
}

const members = await readAll("profiles", "id, name, mobile, email, role");
const orphans = members.filter(
  (p) => p.role === "member" && p.mobile && !linked.has(p.id),
);

console.log(`investor_accounts: ${accounts.length}`);
console.log(`member profiles:   ${members.filter((p) => p.role === "member").length}`);
console.log(`orphans (member, no investor account): ${orphans.length}`);
console.log("---");
for (const o of orphans) {
  console.log(`  ${o.name || "(no name)"}  ·  ${o.mobile}  ·  ${o.email || "no email"}`);
}
console.log("---");

if (!APPLY) {
  console.log(`DRY RUN — pass --confirm to create ${orphans.length} investor account(s).`);
  process.exit(0);
}

let created = 0;
let skipped = 0;
for (const o of orphans) {
  const phone = "+" + o.mobile;
  if (phones.has(phone)) {
    console.log(`SKIP (phone already in investor_accounts): ${o.mobile}`);
    skipped++;
    continue;
  }
  maxUid += 1;
  const uid = `U${maxUid}`;
  const { error } = await admin.from("investor_accounts").insert({
    uid,
    profile_id: o.id,
    full_name: o.name || "",
    phone_number: phone,
    email: o.email || null,
    language: "bn",
    is_verified: false,
    is_active: true,
    balance: { total_investment: 0, total_profit: 0, total_withdrawn: 0, total_balance: 0 },
  });
  if (error) {
    console.log(`ERROR ${o.mobile}: ${error.message}`);
    maxUid -= 1; // reuse the id for the next row
    skipped++;
  } else {
    phones.add(phone);
    created++;
    console.log(`OK  ${uid}  ${o.name || ""}  ${o.mobile}`);
  }
}
console.log("---");
console.log(`Created ${created}, skipped ${skipped}.`);
