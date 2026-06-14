"use server";

/** Server Actions for the Finance / Income / Expenses sections.
 *
 *  Roles:
 *   - addAccount / updateAccount → requireAdmin
 *   - addTransaction(income)     → requireAdmin
 *   - addTransaction(expense)    → requireManager
 *   - deleteTransaction          → requireManager
 *
 *  Every mutation goes through runAction (consistent ActionResult),
 *  writes via the service-role client, appends an audit-log entry and
 *  revalidates the affected admin routes. */

import { revalidatePath } from "next/cache";
import {
  getAdmin,
  logAudit,
  requireAdmin,
  requireManager,
  runAction,
  type ActionResult,
} from "@/lib/admin-guard";

const ACCOUNT_TYPES = ["bank", "cash", "mobile"] as const;
type AccountType = (typeof ACCOUNT_TYPES)[number];

const TXN_TYPES = ["income", "expense"] as const;
type TxnType = (typeof TXN_TYPES)[number];

function clean(s: string | null | undefined): string | null {
  const v = (s ?? "").trim();
  return v === "" ? null : v;
}

function money(detail: number): string {
  return `৳${Number(detail).toLocaleString("en-US")}`;
}

function revalidateFinance() {
  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard/finance/bank");
  revalidatePath("/dashboard/income");
  revalidatePath("/dashboard/expenses");
}

/* ----------------------------- Accounts ----------------------------- */

export type AccountInput = {
  name: string;
  type: string;
  account_number?: string | null;
  opening_balance: number | string;
  note?: string | null;
};

function parseAccount(input: AccountInput) {
  const name = (input.name ?? "").trim();
  if (!name) throw new Error("Account name is required.");

  const type = (input.type ?? "").trim() as AccountType;
  if (!ACCOUNT_TYPES.includes(type)) throw new Error("Invalid account type.");

  const opening = Number(input.opening_balance);
  if (!Number.isFinite(opening)) throw new Error("Opening balance must be a number.");

  return {
    name,
    type,
    account_number: clean(input.account_number),
    opening_balance: opening,
    note: clean(input.note),
  };
}

export async function addAccount(input: AccountInput): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    await requireAdmin();
    const admin = getAdmin();
    if (!admin) throw new Error("Database unavailable.");

    const row = parseAccount(input);
    const { data, error } = await admin
      .from("finance_accounts")
      .insert(row)
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Insert failed.");

    await logAudit({
      action: "create",
      entity: "finance_account",
      entityId: data.id,
      detail: `${row.name} (${row.type})`,
    });
    revalidateFinance();
    return { data: { id: data.id }, message: "Account added." };
  });
}

export async function updateAccount(
  id: string,
  input: AccountInput,
): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdmin();
    const admin = getAdmin();
    if (!admin) throw new Error("Database unavailable.");
    if (!id) throw new Error("Missing account id.");

    const row = parseAccount(input);
    const { error } = await admin.from("finance_accounts").update(row).eq("id", id);
    if (error) throw new Error(error.message);

    await logAudit({
      action: "update",
      entity: "finance_account",
      entityId: id,
      detail: `${row.name} (${row.type})`,
    });
    revalidateFinance();
    return { message: "Account updated." };
  });
}

/* --------------------------- Transactions --------------------------- */

export type TransactionInput = {
  amount: number | string;
  category: string;
  account_id?: string | null;
  txn_date: string;
  party?: string | null;
  project_slug?: string | null;
  method?: string | null;
  description?: string | null;
};

function parseTransaction(type: TxnType, input: TransactionInput) {
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount < 0)
    throw new Error("Amount must be a number of 0 or more.");

  const category = (input.category ?? "").trim();
  if (!category) throw new Error("Category is required.");

  const txn_date = (input.txn_date ?? "").trim();
  if (!txn_date) throw new Error("Date is required.");

  return {
    type,
    amount,
    category,
    account_id: clean(input.account_id),
    txn_date,
    party: clean(input.party),
    project_slug: clean(input.project_slug),
    method: clean(input.method),
    description: clean(input.description),
  };
}

export async function addTransaction(
  type: string,
  input: TransactionInput,
): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const t = (type ?? "").trim() as TxnType;
    if (!TXN_TYPES.includes(t)) throw new Error("Invalid transaction type.");

    // Income requires admin; expense requires (at least) manager.
    const me = t === "income" ? await requireAdmin() : await requireManager();

    const admin = getAdmin();
    if (!admin) throw new Error("Database unavailable.");

    const row = parseTransaction(t, input);
    const { data, error } = await admin
      .from("transactions")
      .insert({ ...row, created_by: me.id })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Insert failed.");

    await logAudit({
      action: "create",
      entity: "transaction",
      entityId: data.id,
      detail: `${t} ${money(row.amount)} · ${row.category}`,
      actor: me,
    });
    revalidateFinance();
    return {
      data: { id: data.id },
      message: t === "income" ? "Income recorded." : "Expense recorded.",
    };
  });
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  return runAction(async () => {
    const me = await requireManager();
    const admin = getAdmin();
    if (!admin) throw new Error("Database unavailable.");
    if (!id) throw new Error("Missing transaction id.");

    // Read first so the audit entry can describe what was removed.
    const { data: existing } = await admin
      .from("transactions")
      .select("type, amount, category")
      .eq("id", id)
      .maybeSingle();

    const { error } = await admin.from("transactions").delete().eq("id", id);
    if (error) throw new Error(error.message);

    await logAudit({
      action: "delete",
      entity: "transaction",
      entityId: id,
      detail: existing
        ? `${existing.type} ${money(Number(existing.amount))} · ${existing.category}`
        : null,
      actor: me,
    });
    revalidateFinance();
    return { message: "Transaction deleted." };
  });
}
