/** Shared, server-only helpers for the Finance section pages.
 *  Lives inside the finance folder (leading underscore → not a route). */

import { getAdmin } from "@/lib/admin-guard";

export type AccountRow = {
  id: string;
  name: string;
  type: string;
  account_number: string | null;
  opening_balance: number;
  note: string | null;
};

export type TxnRow = {
  id: string;
  type: string;
  amount: number;
  category: string;
  account_id: string | null;
  project_slug: string | null;
  txn_date: string;
  description: string | null;
  party: string | null;
  method: string | null;
};

/** ৳ + grouped, rounded integer. */
export function taka(amount: number): string {
  return `৳${Math.round(Number(amount) || 0).toLocaleString("en-US")}`;
}

/** dd Mon yyyy. */
export function fmtDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Per-account computed balance:
 *  opening_balance + Σ(income to account) − Σ(expense from account). */
export function accountBalances(
  accounts: AccountRow[],
  txns: Pick<TxnRow, "type" | "amount" | "account_id">[],
): Map<string, number> {
  const bal = new Map<string, number>();
  for (const a of accounts) bal.set(a.id, Number(a.opening_balance) || 0);
  for (const t of txns) {
    if (!t.account_id || !bal.has(t.account_id)) continue;
    const delta = (Number(t.amount) || 0) * (t.type === "income" ? 1 : -1);
    bal.set(t.account_id, (bal.get(t.account_id) ?? 0) + delta);
  }
  return bal;
}

/** Fetch all accounts (name-sorted). Returns null when DB is unavailable. */
export async function fetchAccounts(): Promise<AccountRow[] | null> {
  const admin = getAdmin();
  if (!admin) return null;
  const { data } = await admin
    .from("finance_accounts")
    .select("id, name, type, account_number, opening_balance, note")
    .order("name", { ascending: true });
  return (data ?? []) as AccountRow[];
}
