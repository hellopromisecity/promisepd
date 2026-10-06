/** How money moved for a transaction — the office's five channels. Shared by
 *  the forms (picker options) and the server actions (validation), so a typo
 *  can never land in the ledger. Stored as the canonical label. */
export const PAYMENT_METHODS = ["Cash", "Bank", "Bkash", "Nagad", "Rocket"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Canonical label for a typed / stored value ("bkash" → "Bkash"); null when
 *  empty or not one of the five. */
export function normalizePaymentMethod(v: string | null | undefined): PaymentMethod | null {
  const s = (v ?? "").trim().toLowerCase();
  if (!s) return null;
  return PAYMENT_METHODS.find((m) => m.toLowerCase() === s) ?? null;
}

/** PostgREST's "unknown column" error (before migration 0034 is run) — the
 *  callers retry the write without the new columns so nothing is blocked. */
export const isMissingColumn = (msg: string | null | undefined) => /column|schema cache/i.test(String(msg ?? ""));
