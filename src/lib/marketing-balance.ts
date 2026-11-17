/* eslint-disable @typescript-eslint/no-explicit-any */
/** What a marketing officer's point entries are really worth today. Three
 *  rules, all applied when the pages READ the ledger — nothing is rewritten or
 *  deleted in the database, so each rule undoes itself when the facts change.
 *
 *  1. Zero balance (the owner's rule, 2026-11-07): a referral whose customer
 *     now has a zero balance in that project — withdrawn, or the file archived
 *     — earns no POINTS. A zero balance means the customer took the money out.
 *
 *  2. Duplicate (found 2026-11-17): the old office ledger was entered twice
 *     over — once by hand / by scripts/import-marketing-points.mjs (June 2026,
 *     notes "imported" or none), and again when the same customer was linked
 *     to their officer in Projectify (note "projectify", tied to the book row
 *     through hub_customers.commission_entry_id). 109 referrals across 42
 *     officers were counted twice. The book-linked entry is the real one; an
 *     UNLINKED entry of the same officer for the same file number is its
 *     duplicate and counts for nothing — points, fund and income. The same
 *     goes when the BOOK holds one file twice in a project (an archived copy
 *     beside the live row, or a customer entered twice): one entry counts —
 *     the live row's, else the older — and the other is a duplicate.
 *
 *  3. Stale: an entry Projectify made (note "projectify") that no book row
 *     points at any more — its customer was re-filed — also counts for nothing.
 *
 *  Manual awards with no book row and no twin (FB activity, attendance,
 *  recruitment, sales not yet in Projectify) are untouched. Server-only. */

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

export type Minus = { points: number; afr: number; income: number };

export type EntryAudit = {
  /** Book-linked entries → their customer's current standing. */
  balances: Map<string, ReferralBalance>;
  /** Book-linked entries whose customer has a zero balance (rule 1). */
  zeroIds: Set<string>;
  /** Unlinked entry → the book-linked entry it repeats (rule 2). */
  dupOf: Map<string, string>;
  /** Unlinked "projectify" entries (rule 3). */
  staleIds: Set<string>;
  /** dupOf ∪ staleIds — not referrals of their own; hidden and worth nothing. */
  hiddenIds: Set<string>;
  /** Per officer: what to take off the stored totals. */
  minus: Map<string, Minus>;
};

const r2 = (n: number) => Math.round(n * 100) / 100;
/** A file number as digits only — "53018221", " 5301-8221 " and "53018221 " are one file. */
const fileKey = (s: unknown) => String(s ?? "").replace(/\D/g, "");

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

type EntryRow = { id: string; officer_id: string; client_id: string | null; note: string | null; points: unknown; afr: unknown; income: unknown; created_at: string };

/** Read the whole ledger once and work out which entries count. */
export async function auditEntries(admin: Admin): Promise<EntryAudit> {
  const balances = await referralBalances(admin);
  const entries: EntryRow[] = [];
  for (let f = 0; ; f += 1000) {
    const { data, error } = await admin.from("marketing_point_entries").select("id, officer_id, client_id, note, points, afr, income, created_at").order("created_at", { ascending: true }).order("id", { ascending: true }).range(f, f + 999);
    if (error) break;
    const rows = (data ?? []) as EntryRow[];
    entries.push(...rows);
    if (rows.length < 1000) break;
  }

  // The real entry for a file: the book row's own file number decides (the
  // entry's client_id is only a copy of it). A live book row beats an archived
  // one; otherwise the older entry stands (entries arrive oldest first).
  const linkedFile = (e: EntryRow) => fileKey(balances.get(e.id)?.fileNo) || fileKey(e.client_id);
  const better = (cur: string | undefined, id: string) => !cur || (balances.get(cur)!.deleted && !balances.get(id)!.deleted);
  const realByProjectFile = new Map<string, string>(); // officer|file|project → entry (the book holding a file twice)
  const linkedByOfficerFile = new Map<string, string>(); // officer|file → entry (the old ledger's twin)
  for (const e of entries) {
    const bal = balances.get(e.id);
    if (!bal) continue;
    const f = linkedFile(e);
    if (!f) continue;
    const k = `${e.officer_id}|${f}|${bal.projectKey}`;
    if (better(realByProjectFile.get(k), e.id)) realByProjectFile.set(k, e.id);
    const k2 = `${e.officer_id}|${f}`;
    if (better(linkedByOfficerFile.get(k2), e.id)) linkedByOfficerFile.set(k2, e.id);
  }

  const zeroIds = new Set<string>();
  const dupOf = new Map<string, string>();
  const staleIds = new Set<string>();
  const hiddenIds = new Set<string>();
  const minus = new Map<string, Minus>();
  const take = (officer: string, m: Minus) => {
    const cur = minus.get(officer) ?? { points: 0, afr: 0, income: 0 };
    minus.set(officer, { points: r2(cur.points + m.points), afr: r2(cur.afr + m.afr), income: r2(cur.income + m.income) });
  };

  for (const e of entries) {
    const pts = Number(e.points) || 0;
    const bal = balances.get(e.id);
    if (bal) {
      // rule 2, book side — this file sits in the project twice and another row's entry is the real one
      const f = linkedFile(e);
      const real = f ? realByProjectFile.get(`${e.officer_id}|${f}|${bal.projectKey}`) : undefined;
      if (real && real !== e.id) {
        dupOf.set(e.id, real);
        hiddenIds.add(e.id);
        take(e.officer_id, { points: pts, afr: Number(e.afr) || 0, income: Number(e.income) || 0 });
        continue;
      }
      // rule 1 — a manual negative ("took it back") is left alone, not counted twice
      if (bal.zero) { zeroIds.add(e.id); if (pts > 0) take(e.officer_id, { points: pts, afr: 0, income: 0 }); }
      continue;
    }
    const f = fileKey(e.client_id);
    const twin = f.length >= 4 ? linkedByOfficerFile.get(`${e.officer_id}|${f}`) : undefined;
    if (twin) dupOf.set(e.id, twin);                     // rule 2
    else if (e.note === "projectify") staleIds.add(e.id); // rule 3
    else continue;
    hiddenIds.add(e.id);
    take(e.officer_id, { points: pts, afr: Number(e.afr) || 0, income: Number(e.income) || 0 });
  }

  return { balances, zeroIds, dupOf, staleIds, hiddenIds, minus };
}

/** An officer's stored totals with the audit applied. */
export function adjustTotals(audit: EntryAudit, officerId: string, stored: Minus): Minus {
  const m = audit.minus.get(officerId);
  return m ? { points: r2(stored.points - m.points), afr: r2(stored.afr - m.afr), income: r2(stored.income - m.income) } : stored;
}

/** One entry's figures with the audit applied (for the period filters). */
export function adjustEntry(audit: EntryAudit, id: string, e: Minus): Minus {
  if (audit.hiddenIds.has(id)) return { points: 0, afr: 0, income: 0 };
  if (audit.zeroIds.has(id) && e.points > 0) return { ...e, points: 0 };
  return e;
}

/** Points to show for one entry: zero while its customer's balance is 0. */
export const effectivePoints = (points: number, zero: boolean) => (zero && points > 0 ? 0 : points);
