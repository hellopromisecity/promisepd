/** Company employee roster — the people on the team, imported from the
 *  office spreadsheet.  This is a DIRECTORY (name, designation, district,
 *  ID, mobile); it is NOT a login.  The Staff dashboard merges this list
 *  with the real accounts in `profiles` (matched by mobile): anyone who
 *  also has an account gets full management; anyone who doesn't shows as
 *  a roster entry an admin can turn into a login in one click.
 *
 *  Keep ID numbers + mobiles exactly as the office records them. */

export type StaffRosterEntry = {
  name: string;
  /** Job designation (Engineer, Driver, …) — distinct from the access role. */
  title: string;
  district: string;
  /** Office employee code / ID number. */
  idNo: string;
  /** As recorded (local 01… form); matched to accounts by canonical digits. */
  mobile: string;
};

export const STAFF_ROSTER: StaffRosterEntry[] = [
  { name: "Kamrul Hasan", title: "Founder & CEO", district: "Faridpur", idNo: "MC-2025001", mobile: "01910065136" },
  { name: "Rashedul Islam", title: "Manager", district: "Faridpur", idNo: "M-2025001", mobile: "01910065137" },
  { name: "Rafi Sarkar", title: "Engineer", district: "Munshiganj", idNo: "E-2025001", mobile: "01676737322" },
  { name: "Tarek Ahmed", title: "Senior Officer", district: "Sylhet", idNo: "SO-2026001", mobile: "01908324298" },
  { name: "Hanif Hawlader", title: "Driver", district: "Barisal", idNo: "DR-2025001", mobile: "01718403704" },
  { name: "Abu Bakr", title: "Office Assistant", district: "Na:ganj", idNo: "OA-2025001", mobile: "01934748994" },
];

/** Canonical BD mobile (digits only, 8801XXXXXXXXX) for matching against
 *  the accounts table, which stores the canonical form.  Returns the raw
 *  digits if it isn't a recognisable BD number. */
export function canonicalMobile(raw: string): string {
  let d = (raw || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 13 && d.startsWith("8801")) return d;
  if (d.length === 11 && d.startsWith("01")) return `880${d.slice(1)}`;
  if (d.length === 10 && d.startsWith("1")) return `8801${d.slice(1)}`;
  return d;
}

/** Best-guess access role to pre-select when creating a login for a
 *  roster entry, from their job title. */
export function roleFromTitle(title: string): "member" | "staff" | "manager" | "admin" {
  const t = title.toLowerCase();
  if (t.includes("ceo") || t.includes("founder") || t.includes("director")) return "admin";
  if (t.includes("manager")) return "manager";
  return "staff";
}
