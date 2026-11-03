/** How money moved for a transaction. Two steps in every form (v2.6.9, the
 *  owner's ask): Cash or Bank first, then the channel under it —
 *    Cash → Cash / Bkash / Nagad / Rocket
 *    Bank → one of the office's six accounts
 *  The ledger stores only the channel name ("Nagad", "Kamrul DBBL"). Plain
 *  "Bank" is still accepted: rows recorded before the banks were listed carry
 *  it, and so does a row where Bank was picked without naming the bank.
 *  Shared by the picker (options) and the server actions (validation), so a
 *  typo can never land in the ledger. */
export const PAYMENT_GROUPS = [
  { key: "Cash", label: "Cash", channels: ["Cash", "Bkash", "Nagad", "Rocket"] },
  { key: "Bank", label: "Bank", channels: ["Kamrul DBBL", "PPD DBBL", "Sonali Bank", "Bank Asia", "Islami Bank", "Al Arafah Bank"] },
] as const;
export type PaymentGroup = (typeof PAYMENT_GROUPS)[number]["key"];

/** Every value the ledger may hold — the channels above plus plain "Bank". */
export const PAYMENT_METHODS: readonly string[] = [...PAYMENT_GROUPS.flatMap((g) => [...g.channels]), "Bank"];
export type PaymentMethod = string;

/** Canonical label for a typed / stored value ("bkash" → "Bkash",
 *  "sonali  bank" → "Sonali Bank"); null when empty or not a known channel. */
export function normalizePaymentMethod(v: string | null | undefined): PaymentMethod | null {
  const s = (v ?? "").trim().replace(/\s+/g, " ").toLowerCase();
  if (!s) return null;
  return PAYMENT_METHODS.find((m) => m.toLowerCase() === s) ?? null;
}

/** Cash or Bank for a stored value; null when empty or unknown. */
export function paymentGroupOf(v: string | null | undefined): PaymentGroup | null {
  const m = normalizePaymentMethod(v);
  if (!m) return null;
  if (m === "Bank") return "Bank";
  return PAYMENT_GROUPS.find((g) => (g.channels as readonly string[]).includes(m))?.key ?? null;
}

/** PostgREST's "unknown column" error (before migration 0034 is run) — the
 *  callers retry the write without the new columns so nothing is blocked. */
export const isMissingColumn = (msg: string | null | undefined) => /column|schema cache/i.test(String(msg ?? ""));
