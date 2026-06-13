/** Shared marketing config — officer types and per-project point values.
 *  Pure data (no server/client deps), so both the admin forms and the
 *  Server Actions import the same source of truth. */

export type OfficerType = "MO" | "AMO" | "MD" | "HM";

export const OFFICER_TYPES: { code: OfficerType; label: string }[] = [
  { code: "MO", label: "Marketing Officer" },
  { code: "AMO", label: "Active Marketing Officer" },
  { code: "MD", label: "Marketing Director" },
  { code: "HM", label: "Head of Marketing" },
];

export const officerTypeLabel = (code: string): string =>
  OFFICER_TYPES.find((t) => t.code === code)?.label ?? code;

/** Points awarded per unit promoted/sold, by project slug.  Selecting a
 *  project in the "award points" form auto-fills its value; points added
 *  = value × quantity.  Unknown slugs fall back to DEFAULT_POINTS. */
export const PROJECT_POINTS: Record<string, number> = {
  "promise-city": 100,
  "fuzala-tower": 80,
  "fuzala-complex": 80,
  "ahbab-palace-01": 60,
  "ahbab-palace-02": 60,
};

export const DEFAULT_POINTS = 50;

export const pointsForProject = (slug: string): number =>
  PROJECT_POINTS[slug] ?? DEFAULT_POINTS;
