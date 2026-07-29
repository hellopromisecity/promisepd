"use server";

/** Topbar bell: the latest five transactions that have actually happened
 *  (future-dated scheduled entries are skipped). Kept tiny — one indexed
 *  query plus two lookups — so opening the bell feels instant. */

import { requireManager, getAdmin } from "@/lib/admin-guard";

export type BellTxn = {
  id: string;
  name: string;
  type: string;
  operator: string; // + | -
  amount: number;
  date: string; // ISO
};

export async function latestTransactionsForBell(): Promise<BellTxn[]> {
  try {
    await requireManager();
    const admin = getAdmin();
    if (!admin) return [];

    const { data } = await admin
      .from("investor_transactions")
      .select("transaction_id, uid, type, amount, date")
      .lte("date", new Date().toISOString())
      .order("date", { ascending: false })
      .limit(5);
    const txns = (data ?? []) as { transaction_id: string; uid: string; type: string; amount: number; date: string }[];
    if (!txns.length) return [];

    const uids = [...new Set(txns.map((t) => t.uid))];
    const [{ data: accs }, { data: types }] = await Promise.all([
      admin.from("investor_accounts").select("uid, full_name").in("uid", uids),
      admin.from("investment_types").select("name, operator"),
    ]);
    const nameOf = new Map((accs ?? []).map((a: { uid: string; full_name: string }) => [a.uid, a.full_name]));
    const opOf = new Map((types ?? []).map((t: { name: string; operator: string }) => [t.name, t.operator]));

    return txns.map((t) => ({
      id: t.transaction_id,
      name: nameOf.get(t.uid) || t.uid,
      type: t.type,
      operator: opOf.get(t.type) ?? "+",
      amount: Number(t.amount) || 0,
      date: t.date,
    }));
  } catch {
    return [];
  }
}
