"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, isManager } from "@/lib/auth";
import { getAdmin, logAudit } from "@/lib/admin-guard";
import { sendTransactionSms, sendBulkSms } from "@/lib/sms";
import { hubCustomer, hubProjectCustomers, type HubCustomer, type HubPayment } from "@/lib/hub";
import { getProfitConfig, accruedProfitByCustomer } from "@/lib/deposit-profit";
import { mirrorBookPayment, backfillHubToInvestor } from "@/lib/investor-write";

type Result = { ok: true; message?: string } | { ok: false; error: string };
type Admin = NonNullable<ReturnType<typeof getAdmin>>;
const r2 = (n: unknown) => Math.round((Number(n) || 0) * 100) / 100;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rec = (d: unknown) => (d ?? null) as any;
// hub_* tables aren't in the generated Supabase types → loosen the builder.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HC = (a: Admin) => (a.from as any)("hub_customers");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HP = (a: Admin) => (a.from as any)("hub_customer_payments");

async function guard(): Promise<Admin | null> {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) throw new Error("Not allowed.");
  return getAdmin();
}

/** Real-estate project → the marketing point-item that referral earns.
 *  Deposit schemes earn no commission (no entry). */
const PROJECT_ITEM: Record<string, string> = {
  "fuzala-tower": "ফুজালা টাওয়ার শেয়ার (প্রতি শেয়ার)",
  "fuzala-complex": "ফুজালা কমপ্লেক্স শেয়ার (প্রতি শেয়ার)",
  "promise-city": "জমি (প্রতি শতাংশ)",
  "ahbab-palace-01": "আহবাব রিয়েল এস্টেট ফ্ল্যাট 1 (প্রতি ফ্ল্যাট)",
  "ahbab-palace-02": "আহবাব রিয়েল এস্টেট ফ্ল্যাট 2 (প্রতি ফ্ল্যাট)",
};

// ── reads ────────────────────────────────────────────────────────
export async function getHubCustomerDetail(id: string): Promise<{ customer: HubCustomer; payments: HubPayment[] } | null> {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) return null;
  return hubCustomer(id);
}

export type RefOfficer = { id: string; name: string; code: string | null; mobile: string | null; position: string | null; district: string | null };
/** Marketing officers, for the Reference autocomplete. */
export async function listReferenceOfficers(): Promise<RefOfficer[]> {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) return [];
  const admin = getAdmin();
  if (!admin) return [];
  const out: RefOfficer[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await admin.from("marketing_officers").select("id, name, officer_code, mobile, position, district").order("name").range(f, f + 999);
    const r = (data ?? []) as Record<string, unknown>[];
    for (const o of r) out.push({ id: o.id as string, name: (o.name as string) ?? "", code: (o.officer_code as string) ?? null, mobile: (o.mobile as string) ?? null, position: (o.position as string) ?? null, district: (o.district as string) ?? null });
    if (r.length < 1000) break;
  }
  return out;
}

export type TxnType = { name: string; operator: string; classification: string };
/** Transaction types — the SAME list App Users uses, for a consistent dropdown. */
export async function listTxnTypes(): Promise<TxnType[]> {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) return [];
  const admin = getAdmin();
  if (!admin) return [];
  const { data } = await admin.from("investment_types").select("name, operator, classification").eq("is_active", true).order("sort_order");
  return ((data ?? []) as Record<string, unknown>[]).map((t) => ({ name: t.name as string, operator: t.operator as string, classification: (t.classification as string) ?? "" }));
}

// ── helpers ──────────────────────────────────────────────────────
async function recomputeOfficer(admin: Admin, officerId: string) {
  let points = 0, afr = 0, income = 0;
  for (let f = 0; ; f += 1000) {
    const { data } = await admin.from("marketing_point_entries").select("points, afr, income").eq("officer_id", officerId).range(f, f + 999);
    const r = (data ?? []) as Record<string, unknown>[];
    for (const x of r) { points += Number(x.points) || 0; afr += Number(x.afr) || 0; income += Number(x.income) || 0; }
    if (r.length < 1000) break;
  }
  await admin.from("marketing_officers").update({ points: r2(points), afr_total: r2(afr), income_total: r2(income) }).eq("id", officerId);
}

async function recomputeCustomer(admin: Admin, customerId: string) {
  const { data } = await HP(admin).select("amount, kind").eq("customer_id", customerId);
  const rows = (data ?? []) as Record<string, unknown>[];
  let paid = 0, dividend = 0, withdrawn = 0;
  for (const p of rows) { const a = Number(p.amount) || 0; const k = p.kind as string; if (k === "dividend") dividend += a; else if (k === "withdrawal") withdrawn += a; else paid += a; }
  await HC(admin).update({ total_paid: r2(paid), dividend: r2(dividend), withdrawn: r2(withdrawn), payments_count: rows.length }).eq("id", customerId);
}

/** Create / update / remove the referral commission entry so the marketing
 *  officer's points stay in sync with this customer. Returns the entry id. */
async function syncCommission(
  admin: Admin,
  cust: { project_key: string; name: string | null; file_no: string | null; joining_date: string | null; reference_officer_id: string | null; commission_entry_id: string | null; shares: string | null },
): Promise<string | null> {
  const removeOld = async () => {
    if (!cust.commission_entry_id) return;
    const { data } = await admin.from("marketing_point_entries").select("officer_id").eq("id", cust.commission_entry_id).maybeSingle();
    const e = rec(data);
    await admin.from("marketing_point_entries").delete().eq("id", cust.commission_entry_id);
    if (e?.officer_id) await recomputeOfficer(admin, e.officer_id as string);
  };
  const officerId = cust.reference_officer_id;
  const label = PROJECT_ITEM[cust.project_key];
  if (!officerId || !label) { await removeOld(); return null; }

  const { data: itemD } = await admin.from("marketing_point_items").select("points, afr, income").eq("label", label).maybeSingle();
  const item = rec(itemD);
  if (!item) { await removeOld(); return null; }
  const qty = Math.max(1, parseInt(String(cust.shares ?? "").replace(/\D/g, "")) || 1);
  const payload = {
    officer_id: officerId, item_label: label, quantity: qty,
    points: r2(Number(item.points) * qty), afr: r2(Number(item.afr) * qty), income: r2(Number(item.income) * qty),
    sale_date: cust.joining_date || null, client_name: cust.name || null, client_id: cust.file_no || null, note: "projectify",
  };

  let entryId = cust.commission_entry_id;
  if (entryId) {
    const { data } = await admin.from("marketing_point_entries").select("officer_id").eq("id", entryId).maybeSingle();
    const e = rec(data);
    if (!e || e.officer_id !== officerId) { await removeOld(); entryId = null; } // moved to a different officer → recreate
  }
  if (entryId) {
    await admin.from("marketing_point_entries").update(payload).eq("id", entryId);
  } else {
    const { data } = await admin.from("marketing_point_entries").insert(payload).select("id").single();
    entryId = (rec(data)?.id as string) ?? null;
  }
  await recomputeOfficer(admin, officerId);
  return entryId;
}

export type CustomerInput = {
  name: string; file_no?: string; mobile?: string; district?: string;
  reference?: string; reference_officer_id?: string | null; shares?: string;
  joining_date?: string; total_price?: number;
};

// ── customer CRUD ────────────────────────────────────────────────
export async function createHubCustomer(project: { key: string; name: string; type: string; sort: number }, input: CustomerInput): Promise<Result> {
  try {
    const admin = await guard();
    if (!admin) return { ok: false, error: "Database not configured." };
    if (!input.name?.trim()) return { ok: false, error: "Name is required." };
    const { data, error } = await HC(admin).insert({
      project_key: project.key, project_name: project.name, project_type: project.type, sort_order: project.sort,
      source_tab: `manual-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      file_no: input.file_no || null, name: input.name.trim(), mobile: input.mobile || null, district: input.district || null,
      reference: input.reference || null, reference_officer_id: input.reference_officer_id || null,
      joining_date: input.joining_date || null, total_price: r2(input.total_price), total_paid: 0, payments_count: 0,
      bio: { shares: input.shares || null },
    }).select("id").single();
    if (error) return { ok: false, error: error.message };
    const cid = rec(data)?.id as string;
    const entryId = await syncCommission(admin, { project_key: project.key, name: input.name, file_no: input.file_no || null, joining_date: input.joining_date || null, reference_officer_id: input.reference_officer_id || null, commission_entry_id: null, shares: input.shares || null });
    if (entryId) await HC(admin).update({ commission_entry_id: entryId }).eq("id", cid);
    revalidatePath(`/dashboard/projects/${project.key}`);
    return { ok: true, message: "Customer added." };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}

export async function updateHubCustomer(id: string, projectKey: string, input: CustomerInput): Promise<Result> {
  try {
    const admin = await guard();
    if (!admin) return { ok: false, error: "Database not configured." };
    const { data } = await HC(admin).select("bio, commission_entry_id").eq("id", id).maybeSingle();
    const cur = rec(data);
    if (!cur) return { ok: false, error: "Customer not found." };
    const bio = { ...(cur.bio as Record<string, unknown>), shares: input.shares || (cur.bio as Record<string, unknown>)?.shares || null };
    await HC(admin).update({
      name: input.name.trim(), file_no: input.file_no || null, mobile: input.mobile || null, district: input.district || null,
      reference: input.reference || null, reference_officer_id: input.reference_officer_id || null,
      joining_date: input.joining_date || null, total_price: r2(input.total_price), bio,
    }).eq("id", id);
    const entryId = await syncCommission(admin, { project_key: projectKey, name: input.name, file_no: input.file_no || null, joining_date: input.joining_date || null, reference_officer_id: input.reference_officer_id || null, commission_entry_id: (cur.commission_entry_id as string) ?? null, shares: input.shares || (bio.shares as string) || null });
    await HC(admin).update({ commission_entry_id: entryId }).eq("id", id);
    revalidatePath(`/dashboard/projects/${projectKey}`);
    return { ok: true, message: "Saved." };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}

export async function deleteHubCustomer(id: string, projectKey: string): Promise<Result> {
  try {
    const admin = await guard();
    if (!admin) return { ok: false, error: "Database not configured." };
    const { data } = await HC(admin).select("commission_entry_id").eq("id", id).maybeSingle();
    const cur = rec(data);
    if (cur?.commission_entry_id) {
      const { data: e } = await admin.from("marketing_point_entries").select("officer_id").eq("id", cur.commission_entry_id).maybeSingle();
      await admin.from("marketing_point_entries").delete().eq("id", cur.commission_entry_id);
      const eo = rec(e)?.officer_id as string | undefined;
      if (eo) await recomputeOfficer(admin, eo);
    }
    await HC(admin).delete().eq("id", id); // cascades payments
    revalidatePath(`/dashboard/projects/${projectKey}`);
    return { ok: true, message: "Customer deleted." };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}

// ── payments / transactions ──────────────────────────────────────
export async function addHubPayment(customerId: string, projectKey: string, input: { date?: string; amount: number; type: string; description?: string; receipt_no?: string }): Promise<Result> {
  try {
    const admin = await guard();
    if (!admin) return { ok: false, error: "Database not configured." };
    if (!(Number(input.amount) > 0)) return { ok: false, error: "Amount must be greater than 0." };
    const type = input.type || "deposit";
    // resolve the investment type → operator (+/-), then the hub kind for totals.
    const { data: td } = await admin.from("investment_types").select("operator").eq("name", type).maybeSingle();
    const operator = (rec(td)?.operator as string) ?? "+";
    const kind = operator === "-" ? "withdrawal" : /profit|dividend|লভ্যাংশ/i.test(type) ? "dividend" : "deposit";
    const { data: cd } = await HC(admin).select("name, mobile, investor_uid, project_name").eq("id", customerId).maybeSingle();
    const cust = rec(cd);
    const mobile = cust?.mobile as string | null;
    const desc = input.description ? `${type} — ${input.description}` : type;
    const { data: mx } = await HP(admin).select("seq").eq("customer_id", customerId).order("seq", { ascending: false }).limit(1).maybeSingle();
    const seq = Number(rec(mx)?.seq ?? -1) + 1;
    const { data: ins, error } = await HP(admin).insert({ customer_id: customerId, seq, date: input.date || null, amount: r2(input.amount), kind, description: desc, receipt_no: input.receipt_no || null }).select("id").single();
    if (error) return { ok: false, error: error.message };
    await recomputeCustomer(admin, customerId);
    // Text the customer (BD numbers only; never throws) — same gateway as App Users.
    await sendTransactionSms({ phone: mobile, operator, amount: Number(input.amount), txId: input.receipt_no || (rec(ins)?.id as string)?.slice(0, 8) || "TXN" });
    // Mirror into the buyer's app / investor account so their PWA updates too —
    // auto-creating the account (mobile + default password) if they have none,
    // plus the project membership for the PWA card. Never throws.
    await mirrorBookPayment(admin, { id: customerId, name: cust?.name as string | null, investor_uid: cust?.investor_uid as string | null, mobile, project_name: cust?.project_name as string }, { kind, type, amount: Number(input.amount), date: input.date, description: input.description });
    revalidatePath(`/dashboard/projects/${projectKey}`);
    return { ok: true, message: "Transaction added." };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}

export async function deleteHubPayment(paymentId: string, projectKey: string): Promise<Result> {
  try {
    const admin = await guard();
    if (!admin) return { ok: false, error: "Database not configured." };
    const { data } = await HP(admin).select("customer_id").eq("id", paymentId).maybeSingle();
    const p = rec(data);
    if (!p) return { ok: false, error: "Not found." };
    await HP(admin).delete().eq("id", paymentId);
    await recomputeCustomer(admin, p.customer_id as string);
    revalidatePath(`/dashboard/projects/${projectKey}`);
    return { ok: true, message: "Transaction removed." };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}

/** Edit an existing transaction in place (amount / date / type / receipt / note),
 *  then re-roll the customer totals. No SMS is sent on an edit. */
export async function updateHubPayment(paymentId: string, projectKey: string, input: { date?: string; amount: number; type: string; description?: string; receipt_no?: string }): Promise<Result> {
  try {
    const admin = await guard();
    if (!admin) return { ok: false, error: "Database not configured." };
    if (!(Number(input.amount) > 0)) return { ok: false, error: "Amount must be greater than 0." };
    const { data: pd } = await HP(admin).select("customer_id").eq("id", paymentId).maybeSingle();
    const p = rec(pd);
    if (!p) return { ok: false, error: "Transaction not found." };
    const type = input.type || "deposit";
    const { data: td } = await admin.from("investment_types").select("operator").eq("name", type).maybeSingle();
    const operator = (rec(td)?.operator as string) ?? "+";
    const kind = operator === "-" ? "withdrawal" : /profit|dividend|লভ্যাংশ/i.test(type) ? "dividend" : "deposit";
    const desc = input.description ? `${type} — ${input.description}` : type;
    const { error } = await HP(admin).update({ date: input.date || null, amount: r2(input.amount), kind, description: desc, receipt_no: input.receipt_no || null }).eq("id", paymentId);
    if (error) return { ok: false, error: error.message };
    await recomputeCustomer(admin, p.customer_id as string);
    revalidatePath(`/dashboard/projects/${projectKey}`);
    return { ok: true, message: "Transaction updated." };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}

// ── deposit profit push (bulk SMS to a scheme's members) ─────────
type PushResult = { ok: true; message?: string; sent?: number; skipped?: number } | { ok: false; error: string };

/** Fill a template with one member's figures. Placeholders (case-insensitive):
 *  {name} {profit} {paid} {remain}. Amounts are grouped (BD lakh) integers. */
function fillTemplate(tpl: string, c: HubCustomer, profit: number): string {
  const n = (v: number) => Math.round(Number(v) || 0).toLocaleString("en-IN");
  return tpl
    .replace(/\{name\}/gi, c.name || "")
    .replace(/\{profit\}/gi, n(profit))
    .replace(/\{paid\}/gi, n(c.total_paid))
    .replace(/\{remain\}/gi, n(c.total_paid + c.dividend - c.withdrawn + profit));
}

/** Text every member of a deposit scheme their profit message. Each member's
 *  {profit} is their live accrued dividend. Sends real SMS (costs balance). */
export async function pushDepositProfit(projectKey: string, template: string): Promise<PushResult> {
  try {
    const admin = await guard();
    if (!admin) return { ok: false, error: "Database not configured." };
    const tpl = (template || "").trim();
    if (!tpl) return { ok: false, error: "Write a message first." };

    const customers = await hubProjectCustomers(projectKey);
    if (!customers.length) return { ok: false, error: "No customers in this scheme." };
    const cfg = await getProfitConfig(projectKey);
    const profits = await accruedProfitByCustomer(customers.map((c) => c.id), cfg);

    let sent = 0, skipped = 0;
    const BATCH = 20; // send in parallel batches so a big scheme finishes in time
    for (let i = 0; i < customers.length; i += BATCH) {
      const slice = customers.slice(i, i + BATCH);
      const results = await Promise.all(slice.map((c) => sendBulkSms(c.mobile, fillTemplate(tpl, c, profits.get(c.id) || 0), "profit")));
      for (const r of results) { if (r) sent++; else skipped++; }
    }

    await logAudit({ action: "sms", entity: "deposit_profit_push", entityId: projectKey, detail: `Profit push to ${projectKey}: sent ${sent}, skipped ${skipped} (no mobile)` });
    return { ok: true, sent, skipped, message: `Sent to ${sent} customer${sent !== 1 ? "s" : ""}${skipped ? ` · ${skipped} skipped (no valid mobile)` : ""}.` };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}

// ── link a book customer to their app / investor account ─────────
export type InvestorHit = { uid: string; full_name: string; fid: string | null; mobile: string | null };

/** Search app / investor accounts for the "Link to app account" picker. */
export async function searchInvestors(query: string): Promise<InvestorHit[]> {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) return [];
  const admin = getAdmin();
  if (!admin) return [];
  const safe = (query || "").replace(/[^a-zA-Z0-9ঀ-৿ ]/g, "").trim();
  const base = admin.from("investor_accounts").select("uid, full_name, fid, phone_number").limit(20);
  const req = safe
    ? base.or(`full_name.ilike.%${safe}%,uid.ilike.%${safe}%,fid.ilike.%${safe}%,phone_number.ilike.%${safe}%`)
    : base.order("created_at", { ascending: false });
  const { data } = await req;
  return ((data ?? []) as Record<string, unknown>[]).map((a) => ({ uid: a.uid as string, full_name: (a.full_name as string) ?? "", fid: (a.fid as string) ?? null, mobile: (a.phone_number as string) ?? null }));
}

/** Link a book customer to an app account, then backfill their past book
 *  payments into it so their PWA shows everything immediately. */
export async function linkHubToInvestor(hubCustomerId: string, uid: string): Promise<Result> {
  try {
    const admin = await guard();
    if (!admin) return { ok: false, error: "Database not configured." };
    if (!hubCustomerId || !uid) return { ok: false, error: "Missing link." };
    const { data: c } = await HC(admin).select("project_key, project_name").eq("id", hubCustomerId).maybeSingle();
    const cust = rec(c);
    if (!cust) return { ok: false, error: "Customer not found." };
    const { data: inv } = await admin.from("investor_accounts").select("full_name").eq("uid", uid).maybeSingle();
    if (!inv) return { ok: false, error: "That app account no longer exists." };
    await HC(admin).update({ investor_uid: uid }).eq("id", hubCustomerId);
    const added = await backfillHubToInvestor(admin, hubCustomerId, uid, cust.project_name as string);
    await logAudit({ action: "link", entity: "hub_customer", entityId: hubCustomerId, detail: `Linked to app ${uid}; backfilled ${added} txn(s)` });
    revalidatePath(`/dashboard/projects/${cust.project_key}`);
    revalidatePath("/dashboard/projects/all");
    return { ok: true, message: `Linked to ${(rec(inv)?.full_name as string) || uid}${added ? ` · ${added} past transaction${added !== 1 ? "s" : ""} synced to their app` : ""}.` };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}
