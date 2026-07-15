/**
 * Move every project-book (hub) customer onto the app — one investor account
 * per unique person, so the whole company runs on one user system.
 *
 * Per unique book person (grouped by mobile; no-mobile rows fold into their
 * name's single mobile-group, else stand alone):
 *
 *   • Already has an app account (explicit hub link or mobile match):
 *       – link their hub rows (hub_customers.investor_uid)
 *       – account has ZERO transactions → also mirror their book payments +
 *         project memberships + balance (a non-paying app signup finally sees
 *         their real money; nothing can double-count against an empty account)
 *       – account HAS transactions → link only (their app history is the
 *         original record; bulk-mirroring could double-count). Also ensure a
 *         membership for any project their txns already touch (PWA card gap).
 *       – NEVER touches their password / verified / active flags.
 *
 *   • No app account:
 *       – usable mobile → auth login (synthetic email, password
 *         DEFAULT_PASSWORD below, pre-confirmed) + member profile
 *       – always → investor account (verified + active), hub rows linked,
 *         memberships for their book projects, every book payment mirrored
 *         into investor_transactions, balance computed
 *       – no usable mobile → account WITHOUT a login (they appear everywhere
 *         and are manageable; login once a mobile is added)
 *
 * Existing app users keep logging in exactly as before. NO SMS is sent.
 * Idempotent: a re-run matches everyone by link/mobile and only fills gaps.
 *
 *   node scripts/migrate-book-users.mjs            # dry run (default)
 *   node scripts/migrate-book-users.mjs --confirm  # apply
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

const DEFAULT_PASSWORD = "258025"; // ≥6 chars (login form + Supabase minimum)
const AUTH_EMAIL_DOMAIN = "users.promisepd.app";
const INVESTMENT_TYPES = ["investment", "deposit", "booking_money", "installment"];

// punctuation-insensitive ("Md. Ahadul Gazi" ≡ "Md Ahadul Gazi"), unicode-safe
const normName = (s) => (s || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
const normProj = (s) => (s || "").toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9]/g, "");
const last10 = (m) => { const d = (m || "").replace(/\D/g, ""); return d.length >= 10 ? d.slice(-10) : ""; };
/** Canonical login mobile from a book mobile field — which may hold SEVERAL
 *  numbers ("01704522268 01628064623"): take the FIRST BD-shaped token, else
 *  fall back to the digits as an intl number. "" when nothing usable. */
function firstMobile(raw) {
  for (const tok of String(raw || "").split(/[^\d+]+/).filter(Boolean)) {
    const d = tok.replace(/\D/g, "");
    if (d.length === 11 && d.startsWith("01")) return "880" + d.slice(1);
    if (d.length === 13 && d.startsWith("8801")) return d;
    if (d.length === 10 && d.startsWith("1")) return "880" + d;
  }
  const all = String(raw || "").replace(/\D/g, "");
  return all.length >= 8 && all.length <= 15 ? all : "";
}
function appToHubName(appName) {
  const g = appName.match(/investment\s*\(([^)]*)\)\s*group[\s-]*([ab])/i);
  if (g) return `${g[1].trim()} ${g[2].toUpperCase()}`;
  const i = appName.match(/investment\s*\(([^)]*)\)/i);
  if (i) return i[1].trim();
  return appName;
}

/** Read every row of a table, paging past the 1000-row cap. */
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

console.log(APPLY ? "APPLY MODE — writing changes." : "DRY RUN — nothing will be written. Pass --confirm to apply.");
console.log("Loading data …");
const [hubs, pays, accounts, profiles, projects, memberships, txns, types] = await Promise.all([
  readAll("hub_customers", "id, name, mobile, file_no, project_key, project_name, investor_uid"),
  readAll("hub_customer_payments", "customer_id, date, amount, kind, description"),
  readAll("investor_accounts", "uid, profile_id, phone_number, full_name, fid"),
  readAll("profiles", "id, mobile, role"),
  readAll("investment_projects", "project_id, project_name"),
  readAll("investments", "uid, project_id"),
  readAll("investor_transactions", "uid, project_id, amount, date, type"),
  readAll("investment_types", "name, operator"),
]);
console.log(`hub customers ${hubs.length} · payments ${pays.length} · app accounts ${accounts.length} · memberships ${memberships.length} · txns ${txns.length}`);

// ── lookups ────────────────────────────────────────────────────────
const paysByCustomer = new Map();
for (const p of pays) { const l = paysByCustomer.get(p.customer_id) ?? []; l.push(p); paysByCustomer.set(p.customer_id, l); }

const accountByMobile = new Map(); // last10 → account
const accountByUid = new Map();
const accountsByName = new Map(); // normName → account[] (name-fallback matching)
const usedFids = new Set();
let maxUid = 100000;
for (const a of accounts) {
  accountByUid.set(a.uid, a);
  const mk = last10(a.phone_number);
  if (mk && !accountByMobile.has(mk)) accountByMobile.set(mk, a);
  const nm = normName(a.full_name);
  if (nm) { const l = accountsByName.get(nm) ?? []; l.push(a); accountsByName.set(nm, l); }
  if (a.fid) usedFids.add(String(a.fid));
  const n = parseInt(String(a.uid ?? "").replace(/\D/g, ""), 10);
  if (Number.isFinite(n) && n > maxUid) maxUid = n;
}
const profileByMobile = new Map(profiles.filter((p) => p.mobile).map((p) => [p.mobile, p]));

// book project name → app project_id (with the app→hub name fold)
const projectIdByHubName = new Map();
for (const hubName of new Set(hubs.map((h) => h.project_name))) {
  const want = normProj(hubName);
  const hit = projects.find((p) => normProj(appToHubName(p.project_name)) === want || normProj(p.project_name) === want);
  projectIdByHubName.set(hubName, hit?.project_id ?? null);
  if (!hit) console.log(`  ⚠ no app project matches book project "${hubName}" — its payments mirror without a project card`);
}

const memberSet = new Set(memberships.map((m) => `${m.uid}|${m.project_id}`));
const txnsByUid = new Map();
let maxTx = 100000;
for (const t of txns) {
  const l = txnsByUid.get(t.uid) ?? []; l.push(t); txnsByUid.set(t.uid, l);
  const n = parseInt(String(t.transaction_id ?? "").replace(/\D/g, ""), 10); // (col not selected → NaN, fine)
}
{ // TX max needs the id column — light second pass, id only
  const ids = await readAll("investor_transactions", "transaction_id");
  for (const t of ids) { const n = parseInt(String(t.transaction_id ?? "").replace(/\D/g, ""), 10); if (Number.isFinite(n) && n > maxTx) maxTx = n; }
}
const op = new Map(types.map((t) => [t.name, t.operator]));
const typeNames = new Set(types.map((t) => t.name.toLowerCase()));
function typeFor(kind, preferred) {
  if (preferred && typeNames.has(preferred.toLowerCase())) return preferred;
  if (kind === "withdrawal") return types.find((t) => t.operator === "-")?.name ?? "withdrawal";
  if (kind === "dividend") return types.find((t) => /dividend|লভ্যাংশ|profit/i.test(t.name))?.name ?? "dividend";
  return types.find((t) => t.operator === "+" && INVESTMENT_TYPES.includes(t.name))?.name ?? "deposit";
}

// ── group book rows into unique persons ────────────────────────────
// mobile-keyed groups first; no-mobile rows fold into their name's single
// mobile-group, else become their own (loginless) person.
const byMobileKey = new Map(); // last10(first mobile) → { name, mobile, rows[] }
const noMobile = [];
for (const h of hubs) {
  const mk = last10(firstMobile(h.mobile));
  if (mk) {
    let g = byMobileKey.get(mk);
    if (!g) { g = { name: h.name, mobile: h.mobile, rows: [] }; byMobileKey.set(mk, g); }
    g.rows.push(h);
  } else noMobile.push(h);
}
const mobileGroupsByName = new Map(); // normName → [groups]
for (const g of byMobileKey.values()) for (const nm of new Set(g.rows.map((r) => normName(r.name)))) {
  const l = mobileGroupsByName.get(nm) ?? []; if (!l.includes(g)) l.push(g); mobileGroupsByName.set(nm, l);
}
const namePersons = new Map(); // normName → { name, mobile:null, rows[] }
let foldedNoMobile = 0;
for (const h of noMobile) {
  const nm = normName(h.name);
  const cands = mobileGroupsByName.get(nm) ?? [];
  if (cands.length === 1) { cands[0].rows.push(h); foldedNoMobile++; continue; }
  let g = namePersons.get(nm);
  if (!g) { g = { name: h.name, mobile: null, rows: [] }; namePersons.set(nm, g); }
  g.rows.push(h);
}
const persons = [...byMobileKey.values(), ...namePersons.values()];

// shared-mobile anomaly: one number, several distinct names → ONE shared account
const shared = persons.filter((p) => new Set(p.rows.map((r) => normName(r.name))).size > 1);

// ── classify ───────────────────────────────────────────────────────
// account match order: explicit hub link → mobile → UNIQUE exact name (catches
// people whose book number differs from their app number, and no-mobile book
// rows of an existing app user — linking is safe, creating would duplicate).
const plan = { linkOnly: [], fillEmpty: [], create: [], createNoLogin: [], ambiguous: [] };
const nameLinked = [];
for (const p of persons) {
  const linkedUid = p.rows.map((r) => r.investor_uid).find(Boolean) ?? null;
  let acct = (linkedUid && accountByUid.get(linkedUid)) || accountByMobile.get(last10(firstMobile(p.mobile))) || null;
  let viaName = false;
  if (!acct) {
    const names = [...new Set(p.rows.map((r) => normName(r.name)).filter(Boolean))];
    const hits = [...new Set(names.flatMap((nm) => accountsByName.get(nm) ?? []))];
    if (hits.length === 1) { acct = hits[0]; viaName = true; }
    else if (hits.length > 1) { plan.ambiguous.push({ ...p, hits: hits.map((h) => h.uid) }); continue; }
  }
  if (acct) {
    const has = (txnsByUid.get(acct.uid) ?? []).length > 0;
    (has ? plan.linkOnly : plan.fillEmpty).push({ ...p, uid: acct.uid });
    if (viaName) nameLinked.push({ name: p.name, mobile: p.mobile, uid: acct.uid, app: acct.full_name });
  } else if (firstMobile(p.mobile).length >= 8) plan.create.push(p);
  else plan.createNoLogin.push(p);
}

console.log("—".repeat(60));
console.log(`unique book persons:            ${persons.length}  (${foldedNoMobile} no-mobile rows folded by name)`);
console.log(`already app users (link only):  ${plan.linkOnly.length}`);
console.log(`app account empty → backfill:   ${plan.fillEmpty.length}`);
console.log(`create account + login (${DEFAULT_PASSWORD}): ${plan.create.length}`);
console.log(`create account, NO login (no usable mobile): ${plan.createNoLogin.length}`);
console.log(`skipped — SAME name matches several app accounts (link manually): ${plan.ambiguous.length}`);
for (const a of plan.ambiguous) console.log(`   ? ${a.name} (${a.mobile || "no mobile"}) ↔ ${a.hits.join(", ")}`);
if (nameLinked.length) {
  console.log(`linked by exact name (different/missing mobile) — verify: ${nameLinked.length}`);
  for (const n of nameLinked.slice(0, 30)) console.log(`   ≈ ${n.name} (${n.mobile || "no mobile"}) → ${n.uid} "${n.app}"`);
  if (nameLinked.length > 30) console.log(`   … and ${nameLinked.length - 30} more`);
}
if (shared.length) {
  console.log(`⚠ ${shared.length} mobile(s) shared by multiple names (they merge into ONE account):`);
  for (const s of shared.slice(0, 25)) console.log(`   ${s.mobile} → ${[...new Set(s.rows.map((r) => r.name))].join(" | ")}`);
  if (shared.length > 25) console.log(`   … and ${shared.length - 25} more`);
}
for (const [label, list] of [["CREATE+LOGIN", plan.create], ["CREATE no-login", plan.createNoLogin]]) {
  console.log(`— ${label} sample —`);
  for (const p of list.slice(0, 12)) console.log(`   ${p.name}  ·  ${p.mobile || "no mobile"}  ·  ${p.rows.length} project row(s)`);
  if (list.length > 12) console.log(`   … and ${list.length - 12} more`);
}
if (!APPLY) { console.log("DRY RUN done — nothing written."); process.exit(0); }

// ── helpers (apply mode) ───────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function linkRows(rows, uid) {
  const ids = rows.filter((r) => r.investor_uid !== uid).map((r) => r.id);
  for (let i = 0; i < ids.length; i += 100) {
    const { error } = await admin.from("hub_customers").update({ investor_uid: uid }).in("id", ids.slice(i, i + 100));
    if (error) throw new Error(`link: ${error.message}`);
  }
}
async function ensureMemberships(uid, projectIds) {
  const rows = projectIds.filter((pid) => pid && !memberSet.has(`${uid}|${pid}`)).map((pid) => ({ uid, project_id: pid, total_paid: 0, discount: 0 }));
  if (!rows.length) return 0;
  const { error } = await admin.from("investments").insert(rows);
  if (error) throw new Error(`membership: ${error.message}`);
  rows.forEach((r) => memberSet.add(`${r.uid}|${r.project_id}`));
  return rows.length;
}
/** Mirror every book payment of `rows` into `uid`. Returns inserted rows. */
async function backfill(uid, rows) {
  const existing = new Set((txnsByUid.get(uid) ?? []).map((t) => `${t.project_id}|${Math.round(Number(t.amount) || 0)}|${String(t.date).slice(0, 10)}`));
  const inserts = [];
  for (const r of rows) {
    const pid = projectIdByHubName.get(r.project_name) ?? null;
    for (const p of paysByCustomer.get(r.id) ?? []) {
      const amount = Math.round((Number(p.amount) || 0) * 100) / 100;
      if (!(amount > 0)) continue;
      const day = String(p.date ?? "").slice(0, 10);
      const key = `${pid}|${Math.round(amount)}|${day}`;
      if (existing.has(key)) continue;
      existing.add(key);
      const sep = String(p.description ?? "").indexOf(" — ");
      const preferred = sep >= 0 ? String(p.description).slice(0, sep).trim() : "";
      inserts.push({
        transaction_id: `TX${++maxTx}`,
        uid,
        type: typeFor(p.kind, preferred),
        amount,
        date: /^\d{4}-\d{2}-\d{2}/.test(day) ? `${day}T00:00:00+06:00` : new Date().toISOString(),
        project_id: pid,
        description: p.description ?? null,
      });
    }
  }
  for (let i = 0; i < inserts.length; i += 400) {
    const { error } = await admin.from("investor_transactions").insert(inserts.slice(i, i + 400));
    if (error) throw new Error(`txns: ${error.message}`);
  }
  const l = txnsByUid.get(uid) ?? []; l.push(...inserts); txnsByUid.set(uid, l);
  return inserts;
}
async function writeBalance(uid) {
  let invested = 0, profit = 0, withdrawn = 0;
  for (const t of txnsByUid.get(uid) ?? []) {
    const amt = Number(t.amount) || 0;
    if (op.get(t.type) === "-") withdrawn += amt;
    else if (INVESTMENT_TYPES.includes(t.type)) invested += amt;
    else profit += amt;
  }
  const r2 = (n) => Math.round(n * 100) / 100;
  const { error } = await admin.from("investor_accounts").update({
    balance: { total_investment: r2(invested), total_profit: r2(profit), total_withdrawn: r2(withdrawn), total_balance: r2(invested + profit - withdrawn) },
  }).eq("uid", uid);
  if (error) throw new Error(`balance: ${error.message}`);
}

// ── apply ──────────────────────────────────────────────────────────
const stats = { linked: 0, filled: 0, created: 0, createdNoLogin: 0, reusedLogin: 0, txns: 0, memberships: 0, errors: 0 };
let done = 0;
const total = plan.linkOnly.length + plan.fillEmpty.length + plan.create.length + plan.createNoLogin.length;
const tick = () => { if (++done % 25 === 0) console.log(`  … ${done}/${total}`); };

// 1) existing app users with history — link + card-gap memberships only
for (const p of plan.linkOnly) {
  try {
    await linkRows(p.rows, p.uid);
    const touched = new Set((txnsByUid.get(p.uid) ?? []).map((t) => t.project_id).filter(Boolean));
    stats.memberships += await ensureMemberships(p.uid, [...touched]);
    stats.linked++;
  } catch (e) { stats.errors++; console.log(`ERR link ${p.name}: ${e.message}`); }
  tick();
}
// 2) existing but EMPTY accounts — safe to give them their book money
for (const p of plan.fillEmpty) {
  try {
    await linkRows(p.rows, p.uid);
    const ins = await backfill(p.uid, p.rows);
    stats.txns += ins.length;
    stats.memberships += await ensureMemberships(p.uid, [...new Set(p.rows.map((r) => projectIdByHubName.get(r.project_name)).filter(Boolean))]);
    if (ins.length) await writeBalance(p.uid);
    stats.filled++;
  } catch (e) { stats.errors++; console.log(`ERR fill ${p.name}: ${e.message}`); }
  tick();
}
// 3) brand-new accounts (with / without login)
for (const p of [...plan.create, ...plan.createNoLogin]) {
  try {
    const mobile = firstMobile(p.mobile);
    const withLogin = mobile.length >= 8;
    let profileId = null;
    if (withLogin) {
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email: `${mobile}@${AUTH_EMAIL_DOMAIN}`,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { name: p.name, mobile },
      });
      if (cErr) {
        if (!/already|registered|exists/i.test(cErr.message)) throw new Error(`auth: ${cErr.message}`);
        profileId = profileByMobile.get(mobile)?.id ?? null; // orphan login exists — keep ITS password
        stats.reusedLogin++;
      } else {
        profileId = created.user.id;
        const { error: pErr } = await admin.from("profiles").upsert({ id: profileId, name: p.name, mobile, role: "member" }, { onConflict: "id" });
        if (pErr) throw new Error(`profile: ${pErr.message}`);
      }
    }
    const uid = `U${++maxUid}`;
    const fid = p.rows.map((r) => (r.file_no ? String(r.file_no) : null)).find((f) => f && !usedFids.has(f)) ?? null;
    const { error: iErr } = await admin.from("investor_accounts").insert({
      uid,
      profile_id: profileId,
      fid,
      full_name: p.name,
      // phone_number is NOT NULL + unique — loginless accounts get a clearly
      // marked per-uid placeholder the admin replaces with a real number later
      phone_number: withLogin ? "+" + mobile : `book:${uid}`,
      language: "bn",
      is_verified: true,
      is_active: true,
      balance: { total_investment: 0, total_profit: 0, total_withdrawn: 0, total_balance: 0 },
    });
    if (iErr) throw new Error(`account: ${iErr.message}`);
    if (fid) usedFids.add(fid);
    await linkRows(p.rows, uid);
    const ins = await backfill(uid, p.rows);
    stats.txns += ins.length;
    stats.memberships += await ensureMemberships(uid, [...new Set(p.rows.map((r) => projectIdByHubName.get(r.project_name)).filter(Boolean))]);
    if (ins.length) await writeBalance(uid);
    if (withLogin) { stats.created++; console.log(`OK ${uid}  ${p.name}  ${p.mobile}`); await sleep(60); }
    else { stats.createdNoLogin++; console.log(`OK ${uid}  ${p.name}  (no login)`); }
  } catch (e) { stats.errors++; console.log(`ERR create ${p.name} (${p.mobile || "no mobile"}): ${e.message}`); }
  tick();
}

console.log("—".repeat(60));
console.log(`linked existing:        ${stats.linked}`);
console.log(`filled empty accounts:  ${stats.filled}`);
console.log(`created with login:     ${stats.created}  (password ${DEFAULT_PASSWORD})`);
console.log(`created without login:  ${stats.createdNoLogin}`);
console.log(`reused existing logins: ${stats.reusedLogin}  (their password unchanged)`);
console.log(`transactions mirrored:  ${stats.txns}`);
console.log(`memberships added:      ${stats.memberships}`);
console.log(`errors:                 ${stats.errors}`);
