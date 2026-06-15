/** Shared types + helpers for the Projects explorer and project detail. */
export { taka, compact, fmtDate, fmtDateTime, localPhone, initial, avatarTint, dateInput } from "../users/shared";

export type ProjectCardData = {
  project_id: string;
  project_name: string;
  status: string;
  address: string | null;
  details: string | null;
  goal: number | null;
  share: number | null;
  progress: number; // stored 0–100
  raised: number; // computed from transactions
  investors: number; // membership count
  hide_total: boolean;
  hide_share: boolean;
  start_date: string | null;
  end_date: string | null;
};

export type ProjectMemberRow = {
  uid: string;
  name: string;
  phone: string;
  share: number | null;
  discount: number;
  start_date: string | null;
  end_date: string | null;
  paid: number;
};

export type InvestorOpt = { uid: string; name: string; phone: string };

/** Status → soft badge palette. */
export function statusTone(s: string): { bg: string; fg: string; dot: string } {
  const v = (s || "").toLowerCase();
  if (v.includes("complete") || v.includes("done")) return { bg: "bg-emerald-500/15", fg: "text-emerald-600", dot: "bg-emerald-500" };
  if (v.includes("hold") || v.includes("pause")) return { bg: "bg-amber-500/15", fg: "text-amber-600", dot: "bg-amber-500" };
  if (v.includes("cancel") || v.includes("close")) return { bg: "bg-brand-red-tint", fg: "text-brand-red-dark", dot: "bg-brand-red" };
  if (v.includes("upcoming") || v.includes("plan")) return { bg: "bg-violet-500/15", fg: "text-violet-600", dot: "bg-violet-500" };
  return { bg: "bg-brand-blue-tint", fg: "text-brand-blue", dot: "bg-brand-blue" }; // ongoing / active / default
}
