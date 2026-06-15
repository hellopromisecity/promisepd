"use server";

/** Server Actions for the Investments admin sections.
 *
 *  Same pattern as the rest of the dashboard: runAction wraps each
 *  mutation, requireAdmin asserts the role, writes go through the
 *  service-role client, then revalidatePath refreshes the page.
 *
 *  Balance rule (faithfully ported from the old FastAPI service):
 *    +  & type ∈ {investment, deposit, booking_money, installment} → invested
 *    +  & any other type                                           → profit
 *    -  (any type)                                                 → withdrawn
 *    balance = (invested + profit) − withdrawn
 *  Recomputed from ALL of an investor's transactions on every change, so it
 *  can never drift. */

import { revalidatePath } from "next/cache";
import {
  requireAdmin,
  getAdmin,
  logAudit,
  runAction,
  ValidationError,
  type ActionResult,
} from "@/lib/admin-guard";

type Admin = NonNullable<ReturnType<typeof getAdmin>>;

/** Type names that count toward total_investment (vs total_profit). */
const INVESTMENT_TYPES = ["investment", "deposit", "booking_money", "installment"];

const money = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
};
const isoDate = (s: string) => /^\d{4}-\d{2}-\d{2}/.test(s);

/** Recompute + persist one investor's balance from all their transactions. */
async function recomputeBalance(admin: Admin, uid: string) {
  const [{ data: txs }, { data: types }] = await Promise.all([
    admin.from("investor_transactions").select("amount, type").eq("uid", uid),
    admin.from("investment_types").select("name, operator"),
  ]);
  const op = new Map((types ?? []).map((t: { name: string; operator: string }) => [t.name, t.operator]));
  let invested = 0;
  let profit = 0;
  let withdrawn = 0;
  for (const t of (txs ?? []) as { amount: number; type: string }[]) {
    const amt = Number(t.amount) || 0;
    if (op.get(t.type) === "-") withdrawn += amt;
    else if (INVESTMENT_TYPES.includes(t.type)) invested += amt;
    else profit += amt;
  }
  const balance = {
    total_investment: Math.round(invested * 100) / 100,
    total_profit: Math.round(profit * 100) / 100,
    total_withdrawn: Math.round(withdrawn * 100) / 100,
    total_balance: Math.round((invested + profit - withdrawn) * 100) / 100,
  };
  await admin.from("investor_accounts").update({ balance }).eq("uid", uid);
  return balance;
}

/** Next sequential id with a prefix, continuing the legacy numbering. */
async function nextId(admin: Admin, table: string, col: string, prefix: string, start: number): Promise<string> {
  const { data } = await admin.from(table).select(col);
  let max = start - 1;
  for (const r of (data ?? []) as Record<string, unknown>[]) {
    const n = parseInt(String(r[col] ?? "").replace(/\D/g, ""), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${prefix}${max + 1}`;
}

// ── Transactions ──────────────────────────────────────────────────
export type TxnInput = {
  transaction_id?: string | null; // present = edit
  uid: string;
  type: string;
  amount: number | string;
  date: string;
  project_id?: string | null;
  rashid_number?: string | null;
  description?: string | null;
};

export async function saveInvestorTransaction(input: TxnInput): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    await requireAdmin();
    const admin = getAdmin();
    if (!admin) throw new Error("Data unavailable");

    const uid = input.uid?.trim();
    if (!uid) throw new ValidationError("Pick an investor.");
    const type = input.type?.trim();
    if (!type) throw new ValidationError("Pick a transaction type.");
    const amount = money(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new ValidationError("Enter a valid amount.");
    if (!isoDate(input.date)) throw new ValidationError("Pick a date.");

    // Validate FKs exist (friendlier than a raw FK error).
    const [{ data: inv }, { data: ty }] = await Promise.all([
      admin.from("investor_accounts").select("uid").eq("uid", uid).maybeSingle(),
      admin.from("investment_types").select("name").eq("name", type).maybeSingle(),
    ]);
    if (!inv) throw new ValidationError("That investor no longer exists.");
    if (!ty) throw new ValidationError("That transaction type doesn’t exist.");

    const project_id = input.project_id?.trim() || null;
    const row = {
      uid,
      type,
      amount,
      date: `${input.date}T00:00:00+06:00`,
      project_id,
      rashid_number: input.rashid_number?.trim() || null,
      description: input.description?.trim() || null,
    };

    let id = input.transaction_id?.trim() || null;
    let prevUid: string | null = null;
    if (id) {
      const { data: existing } = await admin
        .from("investor_transactions")
        .select("uid")
        .eq("transaction_id", id)
        .maybeSingle();
      if (!existing) throw new ValidationError("That transaction no longer exists.");
      prevUid = (existing as { uid: string }).uid;
      const { error } = await admin.from("investor_transactions").update(row).eq("transaction_id", id);
      if (error) throw new Error(error.message);
    } else {
      id = await nextId(admin, "investor_transactions", "transaction_id", "TX", 100001);
      const { error } = await admin.from("investor_transactions").insert({ transaction_id: id, ...row });
      if (error) throw new Error(error.message);
    }

    // Recompute the affected investor(s) — and the previous owner if a
    // transaction was moved to a different investor.
    await recomputeBalance(admin, uid);
    if (prevUid && prevUid !== uid) await recomputeBalance(admin, prevUid);

    await logAudit({
      action: input.transaction_id ? "update" : "create",
      entity: "investor_transaction",
      entityId: id,
      detail: `${input.transaction_id ? "Edited" : "Added"} ${type} ৳${amount} for ${uid}`,
    });
    revalidatePath("/dashboard/investments/transactions");
    revalidatePath("/dashboard/investments/users");
    return { data: { id: id! }, message: "Transaction saved." };
  });
}

export async function deleteInvestorTransaction(transactionId: string): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdmin();
    const admin = getAdmin();
    if (!admin) throw new Error("Data unavailable");
    if (!transactionId) throw new ValidationError("Missing transaction.");

    const { data: existing } = await admin
      .from("investor_transactions")
      .select("uid")
      .eq("transaction_id", transactionId)
      .maybeSingle();
    if (!existing) throw new ValidationError("That transaction no longer exists.");

    const { error } = await admin.from("investor_transactions").delete().eq("transaction_id", transactionId);
    if (error) throw new Error(error.message);
    await recomputeBalance(admin, (existing as { uid: string }).uid);

    await logAudit({ action: "delete", entity: "investor_transaction", entityId: transactionId, detail: `Deleted transaction ${transactionId}` });
    revalidatePath("/dashboard/investments/transactions");
    revalidatePath("/dashboard/investments/users");
    return { message: "Transaction deleted." };
  });
}

// ── Investors (app users) ─────────────────────────────────────────
export type InvestorInput = {
  full_name: string;
  email?: string | null;
  is_active: boolean;
  is_verified: boolean;
};

export async function updateInvestor(uid: string, input: InvestorInput): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdmin();
    const admin = getAdmin();
    if (!admin) throw new Error("Data unavailable");
    if (!uid) throw new ValidationError("Missing investor.");
    const name = input.full_name?.trim();
    if (!name || name.length < 2) throw new ValidationError("Name is required.");

    const { error } = await admin
      .from("investor_accounts")
      .update({
        full_name: name,
        email: input.email?.trim() || null,
        is_active: !!input.is_active,
        is_verified: !!input.is_verified,
      })
      .eq("uid", uid);
    if (error) throw new Error(error.message);

    await logAudit({ action: "update", entity: "investor", entityId: uid, detail: `Updated investor ${name}` });
    revalidatePath("/dashboard/investments/users");
    return { message: "Investor saved." };
  });
}

// ── Projects ──────────────────────────────────────────────────────
export type ProjectInput = {
  project_id?: string | null;
  project_name: string;
  status: string;
  project_address?: string | null;
  total_amount_required?: number | string | null;
  per_user_share_amount?: number | string | null;
  project_progress?: number | string | null;
  start_date?: string | null;
  end_date?: string | null;
};

export async function saveInvestmentProject(input: ProjectInput): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    await requireAdmin();
    const admin = getAdmin();
    if (!admin) throw new Error("Data unavailable");
    const name = input.project_name?.trim();
    if (!name) throw new ValidationError("Project name is required.");
    const status = input.status?.trim() || "Ongoing";

    const row = {
      project_name: name,
      status,
      project_address: input.project_address?.trim() || null,
      total_amount_required: input.total_amount_required != null && input.total_amount_required !== "" ? money(input.total_amount_required) : null,
      per_user_share_amount: input.per_user_share_amount != null && input.per_user_share_amount !== "" ? money(input.per_user_share_amount) : null,
      project_progress: input.project_progress != null && input.project_progress !== "" ? money(input.project_progress) : 0,
      start_date: input.start_date && isoDate(input.start_date) ? input.start_date : null,
      end_date: input.end_date && isoDate(input.end_date) ? input.end_date : null,
    };

    let id = input.project_id?.trim() || null;
    if (id) {
      const { error } = await admin.from("investment_projects").update(row).eq("project_id", id);
      if (error) throw new Error(error.message);
    } else {
      id = await nextId(admin, "investment_projects", "project_id", "PJ-", 1001);
      const { error } = await admin.from("investment_projects").insert({ project_id: id, ...row });
      if (error) throw new Error(error.message);
    }

    await logAudit({ action: input.project_id ? "update" : "create", entity: "investment_project", entityId: id, detail: `${input.project_id ? "Edited" : "Added"} project ${name}` });
    revalidatePath("/dashboard/investments/projects");
    return { data: { id: id! }, message: "Project saved." };
  });
}

// ── Transaction types ─────────────────────────────────────────────
export type TypeInput = {
  original_name?: string | null; // present = edit
  name: string;
  operator: "+" | "-";
  classification: string;
  is_active: boolean;
};

export async function saveInvestmentType(input: TypeInput): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdmin();
    const admin = getAdmin();
    if (!admin) throw new Error("Data unavailable");
    const name = input.name?.trim();
    if (!name) throw new ValidationError("Type name is required.");
    if (input.operator !== "+" && input.operator !== "-") throw new ValidationError("Pick + or −.");
    const classification = input.classification?.trim() || "other";

    if (input.original_name) {
      const { error } = await admin
        .from("investment_types")
        .update({ name, operator: input.operator, classification, is_active: !!input.is_active })
        .eq("name", input.original_name);
      if (error) throw new Error(/duplicate|unique/i.test(error.message) ? "A type with that name already exists." : error.message);
    } else {
      const next = await nextId(admin, "investment_types", "sort_order", "", 1).catch(() => "1");
      const { error } = await admin
        .from("investment_types")
        .insert({ name, operator: input.operator, classification, is_active: !!input.is_active, sort_order: parseInt(next) || 99 });
      if (error) throw new Error(/duplicate|unique/i.test(error.message) ? "A type with that name already exists." : error.message);
    }

    await logAudit({ action: input.original_name ? "update" : "create", entity: "investment_type", entityId: name, detail: `${input.original_name ? "Edited" : "Added"} type ${name}` });
    revalidatePath("/dashboard/investments/types");
    return { message: "Type saved." };
  });
}

// ── Unsubscribe requests ──────────────────────────────────────────
export async function reviewUnsubscribe(id: string, status: "approved" | "rejected", notes?: string): Promise<ActionResult> {
  return runAction(async () => {
    const me = await requireAdmin();
    const admin = getAdmin();
    if (!admin) throw new Error("Data unavailable");
    if (!id) throw new ValidationError("Missing request.");
    if (status !== "approved" && status !== "rejected") throw new ValidationError("Invalid decision.");

    const { error } = await admin
      .from("investor_unsubscribe_requests")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: me.name || "admin",
        admin_notes: notes?.trim() || null,
      })
      .eq("id", id);
    if (error) throw new Error(error.message);

    await logAudit({ action: "update", entity: "unsubscribe_request", entityId: id, detail: `Unsubscribe ${status}` });
    revalidatePath("/dashboard/investments/unsubscribe");
    return { message: `Request ${status}.` };
  });
}
