"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, isManager } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import { sendTransactionSms } from "@/lib/sms";
import { hubCustomer, type HubCustomer, type HubPayment } from "@/lib/hub";

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
    const kind = operator === "-" ? "withdrawal" : /profit/i.test(type) ? "dividend" : "deposit";
    const { data: cd } = await HC(admin).select("mobile").eq("id", customerId).maybeSingle();
    const mobile = rec(cd)?.mobile as string | null;
    const desc = input.description ? `${type} — ${input.description}` : type;
    const { data: mx } = await HP(admin).select("seq").eq("customer_id", customerId).order("seq", { ascending: false }).limit(1).maybeSingle();
    const seq = Number(rec(mx)?.seq ?? -1) + 1;
    const { data: ins, error } = await HP(admin).insert({ customer_id: customerId, seq, date: input.date || null, amount: r2(input.amount), kind, description: desc, receipt_no: input.receipt_no || null }).select("id").single();
    if (error) return { ok: false, error: error.message };
    await recomputeCustomer(admin, customerId);
    // Text the customer (BD numbers only; never throws) — same gateway as App Users.
    await sendTransactionSms({ phone: mobile, operator, amount: Number(input.amount), txId: input.receipt_no || (rec(ins)?.id as string)?.slice(0, 8) || "TXN" });
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
