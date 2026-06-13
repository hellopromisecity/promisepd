/** Client-safe analytics constants — no Node/Google deps, so client
 *  components (the range selector) can import these without dragging the
 *  server-only GA4 SDK into the browser bundle. */

export type DateRange = "7d" | "30d" | "thismonth" | "lastmonth" | "365d" | "lifetime";

export const RANGE_LABELS: Record<DateRange, string> = {
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  thismonth: "This Month",
  lastmonth: "Last Month",
  "365d": "Last 365 Days",
  lifetime: "Lifetime",
};
