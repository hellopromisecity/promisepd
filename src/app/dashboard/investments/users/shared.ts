/** Shared types + formatters for the App Users explorer and its modals. */

export type UserTxn = {
  transaction_id: string;
  date: string;
  type: string;
  operator: string; // "+" | "-"
  amount: number;
  project_id: string | null;
  project_name: string | null;
  rashid_number: string | null;
  description: string | null;
};

export type AppUser = {
  uid: string;
  fid: string | null;
  full_name: string;
  phone_number: string;
  email: string | null;
  language: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  invested: number;
  profit: number;
  withdrawn: number;
  balance: number;
  txns: UserTxn[];
};

export type TypeOpt = { name: string; operator: string };
export type ProjectOpt = { project_id: string; project_name: string };

/** ৳ with full thousands grouping. */
export function taka(n: number | null | undefined): string {
  return `৳${Math.round(Number(n) || 0).toLocaleString("en-US")}`;
}

/** Compact market form: ৳2.20 Cr, ৳1.10 L, else grouped. */
export function compact(n: number | null | undefined): string {
  const v = Number(n) || 0;
  const a = Math.abs(v);
  if (a >= 1e7) return `৳${(v / 1e7).toFixed(2)} Cr`;
  if (a >= 1e5) return `৳${(v / 1e5).toFixed(2)} L`;
  return `৳${Math.round(v).toLocaleString("en-US")}`;
}

/** 10 Sep 2025 */
export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const t = new Date(d.includes("T") ? d : `${d}T00:00:00`);
  return Number.isNaN(t.getTime()) ? "—" : t.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** 10 Sep 2025, 4:12 PM */
export function fmtDateTime(d: string | null | undefined): string {
  if (!d) return "—";
  const t = new Date(d);
  return Number.isNaN(t.getTime())
    ? "—"
    : t.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

/** Prefer the local 01… form for a +880 number; otherwise show as-is. */
export function localPhone(p: string | null | undefined): string {
  const d = (p || "").replace(/\D/g, "");
  if (d.startsWith("880") && d.length === 13) return "0" + d.slice(3);
  return p || "—";
}

/** YYYY-MM-DD from an ISO/date string, for <input type=date>. */
export function dateInput(d: string | null | undefined): string {
  if (!d) return "";
  const s = d.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "";
}

export function initial(name: string | null | undefined): string {
  return (name?.trim()?.[0] ?? "?").toUpperCase();
}

/** Deterministic soft avatar tint from a string (uid) — adds life to the list. */
export function avatarTint(seed: string): { bg: string; fg: string } {
  const palette = [
    { bg: "bg-brand-blue-tint", fg: "text-brand-blue" },
    { bg: "bg-emerald-500/15", fg: "text-emerald-600" },
    { bg: "bg-amber-500/15", fg: "text-amber-600" },
    { bg: "bg-violet-500/15", fg: "text-violet-600" },
    { bg: "bg-rose-500/15", fg: "text-rose-600" },
    { bg: "bg-cyan-500/15", fg: "text-cyan-600" },
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}
