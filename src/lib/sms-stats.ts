import "server-only";
import { getAdmin } from "@/lib/admin-guard";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type SmsStats = {
  balance: number;        // last checkpoint balance (BDT)
  balanceAt: string;      // when it was set
  rate: number;           // BDT per SMS unit
  costSince: number;      // cost of sends since the checkpoint
  estBalance: number;     // balance − costSince (estimated live)
  remainingSms: number;   // floor(estBalance / rate)
  sentToday: number; sent7d: number; sent30d: number;
  segments30d: number; cost30d: number; cost7d: number;
  perDay: { date: string; count: number }[];   // last 14 days
  byKind: { kind: string; count: number }[];    // last 30 days
  recent: { recipient: string; kind: string; segments: number; created_at: string }[];
};

const DAY = 86_400_000;

export async function smsStats(): Promise<SmsStats | null> {
  const admin = getAdmin();
  if (!admin) return null;

  const { data: cfg } = await (admin.from("sms_config") as any).select("balance, balance_at, rate").eq("id", 1).maybeSingle();
  const balance = Number(cfg?.balance) || 0;
  const balanceAt = cfg?.balance_at || new Date(0).toISOString();
  const rate = Number(cfg?.rate) > 0 ? Number(cfg.rate) : 0.35;

  const now = Date.now();
  const d30 = new Date(now - 30 * DAY).toISOString();
  const d7 = new Date(now - 7 * DAY).toISOString();
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const today = t0.toISOString();
  // Load rows far enough back to cover BOTH the 30-day window and the checkpoint.
  const since = new Date(Math.min(new Date(balanceAt).getTime(), now - 30 * DAY)).toISOString();

  const rows: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await (admin.from("sms_log") as any)
      .select("recipient, kind, segments, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .range(from, from + 999);
    const r = data ?? [];
    rows.push(...r);
    if (r.length < 1000) break;
  }

  let costSince = 0, sentToday = 0, sent7d = 0, sent30d = 0, segments30d = 0, segments7d = 0;
  const byKind = new Map<string, number>();
  const perDay = new Map<string, number>();
  for (let i = 13; i >= 0; i--) perDay.set(new Date(now - i * DAY).toISOString().slice(0, 10), 0);

  for (const x of rows) {
    const seg = Number(x.segments) || 1;
    const ts = String(x.created_at);
    if (ts >= balanceAt) costSince += seg * rate;
    if (ts >= today) sentToday++;
    if (ts >= d7) { sent7d++; segments7d += seg; }
    if (ts >= d30) { sent30d++; segments30d += seg; byKind.set(x.kind || "other", (byKind.get(x.kind || "other") || 0) + 1); }
    const day = ts.slice(0, 10);
    if (perDay.has(day)) perDay.set(day, (perDay.get(day) || 0) + 1);
  }

  const estBalance = balance - costSince;
  return {
    balance, balanceAt, rate, costSince, estBalance,
    remainingSms: Math.max(0, Math.floor(estBalance / rate)),
    sentToday, sent7d, sent30d,
    segments30d, cost30d: segments30d * rate, cost7d: segments7d * rate,
    perDay: [...perDay.entries()].map(([date, count]) => ({ date, count })),
    byKind: [...byKind.entries()].map(([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count),
    recent: rows.slice(0, 12).map((x) => ({ recipient: x.recipient, kind: x.kind, segments: Number(x.segments) || 1, created_at: x.created_at })),
  };
}
