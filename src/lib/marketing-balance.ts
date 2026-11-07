/* eslint-disable @typescript-eslint/no-explicit-any */
/** Referral points vs. the customer's CURRENT balance (the owner's rule,
 *  2026-11-07): a marketing officer / director earns nothing for a referred
 *  customer whose balance in that project is 0 — a zero balance means the
 *  customer withdrew, otherwise the money would still be in the project.
 *
 *  Every Projectify referral stores its commission entry on the book row
 *  (hub_customers.commission_entry_id), so the book's own figures decide:
 *  net = total_paid − withdrawn, and an archived file counts as withdrawn.
 *  Nothing is rewritten in the database — the stored points stay as awarded
 *  and the pages subtract the zero-balance ones when they show totals, so
 *  the moment the customer pays in again the points come back by themselves.
 *  Manual awards with no linked book row (FB activity, attendance…) are
 *  untouched. Server-only. */

import type { getAdmin } from "@/lib/admin-guard";

type Admin = NonNullable<ReturnType<typeof getAdmin>>;

export type ReferralBalance = {
  entryId: string;
  hubId: string;
  projectKey: string;
  fileNo: string | null;
  name: string | null;
  /** paid − withdrawn, the book figure (৳). */
  net: number;
  deleted: boolean;
  /** No points for this referral right now. */
  zero: boolean;
};

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Every commission entry's linked book customer, keyed by entry id. */
export async function referralBalances(admin: Admin): Promise<Map<string, ReferralBalance>> {
  const out = new Map<string, ReferralBalance>();
  for (let f = 0; ; f += 1000) {
    const { data, error } = await (admin.from as any)("hub_customers")
      .select("id, commission_entry_id, project_key, file_no, name, total_paid, withdrawn, deleted_at")
      .not("commission_entry_id", "is", null)
      .range(f, f + 999);
    if (error) break; // pre-commission schema — nothing to exclude
    const rows = (data ?? []) as Record<string, unknown>[];
    for (const r of rows) {
      const entryId = String(r.commission_entry_id ?? "");
      if (!entryId) continue;
      const net = r2((Number(r.total_paid) || 0) - (Number(r.withdrawn) || 0));
      const deleted = !!r.deleted_at;
      out.set(entryId, {
        entryId,
        hubId: String(r.id),
        projectKey: String(r.project_key ?? ""),
        fileNo: (r.file_no as string | null) ?? null,
        name: (r.name as string | null) ?? null,
        net,
        deleted,
        zero: deleted || net <= 0,
      });
    }
    if (rows.length < 1000) break;
  }
  return out;
}

/** The zero-balance referral entries and the positive points they hold per
 *  officer — subtract those from an officer's stored total. A manual negative
 *  entry (a −1 "took it back") is left alone, so it isn't counted twice. */
export async function zeroReferralPoints(admin: Admin): Promise<{ zeroIds: Set<string>; byOfficer: Map<string, number> }> {
  const bal = await referralBalances(admin);
  const zeroIds = new Set<string>();
  for (const b of bal.values()) if (b.zero) zeroIds.add(b.entryId);
  const byOfficer = new Map<string, number>();
  const ids = [...zeroIds];
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await admin.from("marketing_point_entries").select("id, officer_id, points").in("id", ids.slice(i, i + 200));
    for (const e of (data ?? []) as { id: string; officer_id: string; points: unknown }[]) {
      const p = Number(e.points) || 0;
      if (p > 0) byOfficer.set(e.officer_id, r2((byOfficer.get(e.officer_id) ?? 0) + p));
    }
  }
  return { zeroIds, byOfficer };
}

/** Points to show for one entry: zero while its customer's balance is 0. */
export const effectivePoints = (points: number, zero: boolean) => (zero && points > 0 ? 0 : points);
