/** Roster employees an admin has removed from the Staff page (the owner's
 *  ask, 2026-11-03: a trash button next to "Create login"). The roster itself
 *  is code (STAFF_ROSTER), so removals are remembered in org_settings under
 *  one key — no migration — and every roster consumer (Staff, Attendance, the
 *  import page) filters through them. A removed person can be restored from
 *  the Staff page; someone who already has a login is deleted through their
 *  account instead. Server-only (service-role client). */

import type { getAdmin } from "@/lib/admin-guard";
import { STAFF_ROSTER, type StaffRosterEntry } from "@/lib/staff-roster";

type Admin = NonNullable<ReturnType<typeof getAdmin>>;

export const ROSTER_REMOVED_KEY = "staff_roster_removed";

export type RemovedRosterEntry = {
  idNo: string;
  name: string;
  mobile: string;
  removed_by: string;
  removed_at: string; // ISO
};

const normId = (id: string) => id.trim().toUpperCase();

/** The removed list as stored; empty when nothing was ever removed. */
export async function readRemovedRoster(admin: Admin): Promise<RemovedRosterEntry[]> {
  const { data } = await admin.from("org_settings").select("value").eq("key", ROSTER_REMOVED_KEY).maybeSingle();
  // stored as { list: [...] } — org_settings.value is a jsonb object
  const v = (data as { value?: { list?: unknown } } | null)?.value?.list;
  return Array.isArray(v) ? (v as RemovedRosterEntry[]).filter((e) => e && typeof e.idNo === "string") : [];
}

export async function writeRemovedRoster(admin: Admin, list: RemovedRosterEntry[]): Promise<void> {
  const { error } = await admin.from("org_settings").upsert([{ key: ROSTER_REMOVED_KEY, value: { list } }], { onConflict: "key" });
  if (error) throw new Error(error.message);
}

/** Upper-cased employee codes of the removed people, for quick filtering. */
export const removedIdSet = (list: RemovedRosterEntry[]) => new Set(list.map((e) => normId(e.idNo)));

/** The roster minus the removed people. */
export const activeRoster = (removed: Set<string>): StaffRosterEntry[] => STAFF_ROSTER.filter((e) => !removed.has(normId(e.idNo)));

export const isRemovedId = (removed: Set<string>, idNo: string) => removed.has(normId(idNo));
