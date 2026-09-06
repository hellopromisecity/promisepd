"use server";

/** Finance module Server Actions — heads (খাত), ledger entries (income /
 *  expense) and bank & cash accounts. Replaces the July admin-finance.ts.
 *
 *  Roles:
 *   • entries (add / edit / delete)  → manager+
 *   • heads (add / hide)             → admin
 *   • accounts (add / edit)          → admin
 *
 *  Every write goes through runAction (uniform ActionResult), the service
 *  role client, an audit-log line, and revalidates the four Finance routes. */

import { revalidatePath } from "next/cache";
import { getAdmin, logAudit, requireAdmin, requireManager, runAction, type ActionResult } from "@/lib/admin-guard";

const KINDS = ["income", "expense"] as const;
type Kind = (typeof KINDS)[number];
const ACCOUNT_TYPES = ["bank", "cash", "mobile"] as const;

const clean = (s: string | null | undefined): string | null => { const v = (s ?? "").trim(); return v === "" ? null : v; };
const money = (v: number) => `৳${Math.round(v).toLocaleString("en-IN")}`;
const kindOf = (k: string): Kind => { const v = (k ?? "").trim() as Kind; if (!KINDS.includes(v)) throw new Error("Invalid entry type."); return v; };

function revalidateFinance() {
  for (const p of ["/dashboard/finance", "/dashboard/finance/bank", "/dashboard/finance/income", "/dashboard/finance/expense", "/dashboard"]) revalidatePath(p);
}

/* ───────────────────────── heads (খাত) ───────────────────────── */

export async function addHead(kind: string, name: string, nameBn?: string | null): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    await requireAdmin();
    const admin = getAdmin();
    if (!admin) throw new Error("Database unavailable.");
    const k = kindOf(kind);
    const nm = (name ?? "").trim();
    if (!nm) throw new Error("Head name is required.");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const heads = (admin.from as any)("finance_heads");
    // same name again (even a hidden one) → just reactivate it
    const { data: dup } = await heads.select("id, is_active").eq("kind", k).ilike("name", nm).maybeSingle();
    if (dup) {
      if (!dup.is_active) await heads.update({ is_active: true }).eq("id", dup.id);
      return { data: { id: dup.id as string }, message: dup.is_active ? "That head already exists — selected." : "Head restored." };
    }
    const { data: mx } = await heads.select("sort").eq("kind", k).lt("sort", 99).order("sort", { ascending: false }).limit(1).maybeSingle();
    const sort = Number(mx?.sort ?? 0) + 1;
    const { data, error } = await heads.insert({ kind: k, name: nm, name_bn: clean(nameBn), sort, is_default: false, is_active: true }).select("id").single();
    if (error || !data) throw new Error(/relation|does not exist/i.test(String(error?.message)) ? "Finance heads need migration 0033 — run the SQL first." : error?.message ?? "Insert failed.");
    await logAudit({ action: "create", entity: "finance_head", entityId: data.id, detail: `${k} head “${nm}”` });
    revalidateFinance();
    return { data: { id: data.id as string }, message: `Head “${nm}” added.` };
  });
}

/** Hide a custom head from the pickers (existing entries keep it). */
export async function setHeadActive(id: string, active: boolean): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdmin();
    const admin = getAdmin();
    if (!admin) throw new Error("Database unavailable.");
    if (!id) throw new Error("Missing head.");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: h, error } = await (admin.from as any)("finance_heads").update({ is_active: !!active }).eq("id", id).select("name, is_default").maybeSingle();
    if (error) throw new Error(error.message);
    await logAudit({ action: "update", entity: "finance_head", entityId: id, detail: `${active ? "Shown" : "Hidden"} head “${h?.name ?? id}”` });
    revalidateFinance();
    return { message: active ? "Head shown again." : "Head hidden from the picker." };
  });
}

/* ───────────────────────── ledger entries ───────────────────────── */

export type EntryInput = {
  amount: number | string;
  /** finance_heads.id — or null with `newHead` to create one on the fly */
  head_id?: string | null;
  /** create-and-use a custom head (admin only) */
  newHead?: { name: string; name_bn?: string | null } | null;
  /** what exactly — required when the head is "Others" */
  head_detail?: string | null;
  txn_date: string;
  account_id?: string | null;
  party?: string | null;
  method?: string | null;
  reference?: string | null;
  description?: string | null;
  project_slug?: string | null;
};

async function resolveHead(admin: NonNullable<ReturnType<typeof getAdmin>>, kind: Kind, input: EntryInput): Promise<{ id: string; name: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heads = (admin.from as any)("finance_heads");
  if (input.newHead?.name?.trim()) {
    await requireAdmin(); // only an admin may grow the head list
    const r = await addHead(kind, input.newHead.name, input.newHead.name_bn ?? null);
    if (!r.ok) throw new Error(r.error);
    const { data } = await heads.select("id, name").eq("id", r.data!.id).maybeSingle();
    return { id: String(data.id), name: String(data.name) };
  }
  const id = clean(input.head_id);
  if (!id) throw new Error("Pick a head (খাত).");
  const { data, error } = await heads.select("id, name, kind").eq("id", id).maybeSingle();
  if (error) throw new Error(/relation|does not exist/i.test(String(error.message)) ? "Finance heads need migration 0033 — run the SQL first." : error.message);
  if (!data) throw new Error("That head no longer exists.");
  if (data.kind !== kind) throw new Error("That head belongs to the other ledger.");
  return { id: String(data.id), name: String(data.name) };
}

async function parseEntry(admin: NonNullable<ReturnType<typeof getAdmin>>, kind: Kind, input: EntryInput) {
  const amount = Math.round((Number(input.amount) || 0) * 100) / 100;
  if (!(amount > 0)) throw new Error("Amount must be greater than 0.");
  const txn_date = (input.txn_date ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(txn_date)) throw new Error("Pick a date.");
  const head = await resolveHead(admin, kind, input);
  const head_detail = clean(input.head_detail);
  if (/^others?$/i.test(head.name) && !head_detail) throw new Error("“Others” needs a short note of what it was.");
  const account_id = clean(input.account_id);
  if (account_id) {
    const { data: acc } = await admin.from("finance_accounts").select("id").eq("id", account_id).maybeSingle();
    if (!acc) throw new Error("That account no longer exists.");
  }
  return {
    type: kind, amount, category: head.name, head_id: head.id, head_detail,
    txn_date, account_id, party: clean(input.party), method: clean(input.method),
    reference: clean(input.reference), description: clean(input.description), project_slug: clean(input.project_slug),
  };
}

export async function addEntry(kind: string, input: EntryInput): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const me = await requireManager();
    const admin = getAdmin();
    if (!admin) throw new Error("Database unavailable.");
    const k = kindOf(kind);
    const row = await parseEntry(admin, k, input);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin.from as any)("transactions").insert({ ...row, created_by: me.id }).select("id").single();
    if (error || !data) throw new Error(/head_id|head_detail|reference/i.test(String(error?.message)) ? "The ledger needs migration 0033 — run the SQL first." : error?.message ?? "Insert failed.");
    await logAudit({ action: "create", entity: "finance_entry", entityId: data.id, detail: `${k} ${money(row.amount)} · ${row.category}${row.head_detail ? ` (${row.head_detail})` : ""}${row.party ? ` · ${row.party}` : ""}`, actor: me });
    revalidateFinance();
    return { data: { id: data.id as string }, message: k === "income" ? "Income recorded." : "Expense recorded." };
  });
}

export async function updateEntry(id: string, input: EntryInput): Promise<ActionResult> {
  return runAction(async () => {
    const me = await requireManager();
    const admin = getAdmin();
    if (!admin) throw new Error("Database unavailable.");
    if (!id) throw new Error("Missing entry.");
    const { data: cur } = await admin.from("transactions").select("type, amount, category").eq("id", id).maybeSingle();
    if (!cur) throw new Error("Entry not found.");
    const k = kindOf(String(cur.type));
    const row = await parseEntry(admin, k, input);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin.from as any)("transactions").update(row).eq("id", id);
    if (error) throw new Error(error.message);
    await logAudit({ action: "update", entity: "finance_entry", entityId: id, detail: `${k} ${money(Number(cur.amount))} · ${cur.category} → ${money(row.amount)} · ${row.category}`, actor: me });
    revalidateFinance();
    return { message: "Entry updated." };
  });
}

export async function deleteEntry(id: string): Promise<ActionResult> {
  return runAction(async () => {
    const me = await requireManager();
    const admin = getAdmin();
    if (!admin) throw new Error("Database unavailable.");
    if (!id) throw new Error("Missing entry.");
    const { data: cur } = await admin.from("transactions").select("type, amount, category, txn_date").eq("id", id).maybeSingle();
    if (!cur) throw new Error("Entry not found.");
    const { error } = await admin.from("transactions").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await logAudit({ action: "delete", entity: "finance_entry", entityId: id, detail: `${cur.type} ${money(Number(cur.amount))} · ${cur.category} · ${cur.txn_date}`, actor: me });
    revalidateFinance();
    return { message: "Entry deleted." };
  });
}

/* ───────────────────────── bank & cash accounts ───────────────────────── */

export type AccountInput = { name: string; type: string; account_number?: string | null; opening_balance: number | string; note?: string | null };

function parseAccount(input: AccountInput) {
  const name = (input.name ?? "").trim();
  if (!name) throw new Error("Account name is required.");
  const type = (input.type ?? "").trim();
  if (!(ACCOUNT_TYPES as readonly string[]).includes(type)) throw new Error("Pick an account type.");
  const opening = Math.round((Number(input.opening_balance) || 0) * 100) / 100;
  if (!Number.isFinite(opening)) throw new Error("Opening balance must be a number.");
  return { name, type, account_number: clean(input.account_number), opening_balance: opening, note: clean(input.note) };
}

export async function addFinanceAccount(input: AccountInput): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    await requireAdmin();
    const admin = getAdmin();
    if (!admin) throw new Error("Database unavailable.");
    const row = parseAccount(input);
    const { data, error } = await admin.from("finance_accounts").insert(row).select("id").single();
    if (error || !data) throw new Error(error?.message ?? "Insert failed.");
    await logAudit({ action: "create", entity: "finance_account", entityId: data.id, detail: `${row.name} (${row.type}) · opening ${money(row.opening_balance)}` });
    revalidateFinance();
    return { data: { id: data.id }, message: "Account added." };
  });
}

export async function updateFinanceAccount(id: string, input: AccountInput): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdmin();
    const admin = getAdmin();
    if (!admin) throw new Error("Database unavailable.");
    if (!id) throw new Error("Missing account.");
    const row = parseAccount(input);
    const { error } = await admin.from("finance_accounts").update(row).eq("id", id);
    if (error) throw new Error(error.message);
    await logAudit({ action: "update", entity: "finance_account", entityId: id, detail: `${row.name} (${row.type}) · opening ${money(row.opening_balance)}` });
    revalidateFinance();
    return { message: "Account updated." };
  });
}

/** Remove an account that has NO entries (entries would lose their home). */
export async function deleteFinanceAccount(id: string): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdmin();
    const admin = getAdmin();
    if (!admin) throw new Error("Database unavailable.");
    if (!id) throw new Error("Missing account.");
    const { count } = await admin.from("transactions").select("id", { count: "exact", head: true }).eq("account_id", id);
    if ((count ?? 0) > 0) throw new Error(`This account has ${count} entr${count === 1 ? "y" : "ies"} — move or delete them first.`);
    const { data: acc } = await admin.from("finance_accounts").select("name").eq("id", id).maybeSingle();
    const { error } = await admin.from("finance_accounts").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await logAudit({ action: "delete", entity: "finance_account", entityId: id, detail: `Removed account ${acc?.name ?? id}` });
    revalidateFinance();
    return { message: "Account removed." };
  });
}
