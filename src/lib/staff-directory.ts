/** Shared staff directory: merges the code-defined company roster
 *  (STAFF_ROSTER) with the login accounts (profiles) into one list,
 *  matched by canonical mobile, and computes each person's stable
 *  attendance key (`ref`).  Used by both the Staff page and the
 *  Attendance roster so they agree on who exists and how each person is
 *  keyed for hajira.
 *
 *  Pure (no server imports) so it can run in either place. */

import { STAFF_ROSTER, canonicalMobile } from "@/lib/staff-roster";

/** The minimal account shape the directory merge needs (matched by
 *  mobile).  Callers may pass richer profile rows — only these fields
 *  are read. */
export type StaffAccount = {
  id: string;
  name: string;
  mobile: string;
  employee_code: string | null;
  role?: string;
};

export type StaffDirEntry = {
  /** Stable attendance key: roster employee code, else "uid:<account id>". */
  ref: string;
  name: string;
  designation: string | null;
  district: string | null;
  /** Display code (account's employee_code wins, else the roster ID). */
  code: string;
  /** Display mobile (local 01… form preferred). */
  mobile: string;
  account: StaffAccount | null;
};

/** The stable attendance ref for a person — the roster employee code if
 *  their mobile is on the roster, otherwise a per-account fallback.  Only
 *  needs id + mobile, so it works for both profiles and the session user. */
export function refForMember(m: { id: string; mobile: string }): string {
  const canon = canonicalMobile(m.mobile);
  // An empty/unparseable mobile must NOT match a roster row with a blank
  // mobile — fall through to the per-account ref instead.
  const hit = canon ? STAFF_ROSTER.find((e) => canonicalMobile(e.mobile) === canon) : undefined;
  return hit ? hit.idNo : `uid:${m.id}`;
}

/** Build the unified, de-duplicated directory.  Roster first (in sheet
 *  order), then any accounts that aren't on the roster. */
export function buildStaffDirectory(accounts: StaffAccount[]): StaffDirEntry[] {
  const byMobile = new Map<string, StaffAccount>();
  for (const a of accounts) {
    const c = canonicalMobile(a.mobile);
    if (c) byMobile.set(c, a); // skip blank mobiles so they can't collide on ""
  }

  const seen = new Set<string>();
  const out: StaffDirEntry[] = [];

  // De-dupe the hand-maintained roster by canonical mobile (no DB-style
  // uniqueness guard on the code list), keeping the first occurrence.
  const matchedAccounts = new Set<string>();
  for (const e of STAFF_ROSTER) {
    const canon = canonicalMobile(e.mobile) || e.idNo;
    if (seen.has(canon)) continue;
    seen.add(canon);
    const account = byMobile.get(canonicalMobile(e.mobile)) ?? null;
    if (account) matchedAccounts.add(account.id);
    out.push({
      ref: e.idNo,
      name: account?.name || e.name,
      designation: e.title,
      district: e.district,
      code: account?.employee_code || e.idNo,
      mobile: e.mobile || account?.mobile || "",
      account,
    });
  }

  for (const a of accounts) {
    if (matchedAccounts.has(a.id)) continue;
    out.push({
      ref: refForMember(a),
      name: a.name,
      designation: null,
      district: null,
      code: a.employee_code || "",
      mobile: a.mobile,
      account: a,
    });
  }

  return out;
}
