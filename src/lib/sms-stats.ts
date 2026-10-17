import "server-only";
import { getAdmin } from "@/lib/admin-guard";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type SmsLogRow = { recipient: string; kind: string; segments: number; created_at: string; status: "sent" | "failed"; error: string | null; message: string | null };

export type SmsStats = {
  balance: number;        // last checkpoint balance (BDT)
  balanceAt: string;      // when it was set
  rate: number;           // BDT per SMS unit
  costSince: number;      // cost of ACCEPTED sends since the checkpoint
  estBalance: number;     // balance − costSince (estimated live)
  remainingSms: number;   // floor(estBalance / rate)
  sentToday: number; sent7d: number; sent30d: number;
  /** sends the gateway refused or that never reached it (0035) */
  failedToday: number; failed7d: number; failed30d: number;
  lastFailure: { at: string; recipient: string; error: string } | null;
  segments30d: number; cost30d: number; cost7d: number;
  perDay: { date: string; count: number; failed: number }[];   // last 14 days
  byKind: { kind: string; count: number }[];    // last 30 days
  recent: SmsLogRow[];
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
  // "today" = the Bangladesh day, not the server's UTC day
  const bdNow = new Date(now + 6 * 3600 * 1000);
  const today = new Date(Date.UTC(bdNow.getUTCFullYear(), bdNow.getUTCMonth(), bdNow.getUTCDate()) - 6 * 3600 * 1000).toISOString();
  // Load rows far enough back to cover BOTH the 30-day window and the checkpoint.
  const since = new Date(Math.min(new Date(balanceAt).getTime(), now - 30 * DAY)).toISOString();

  const raw: any[] = [];
  for (let from = 0; ; from += 1000) {
    // select * — the 0035 columns may not exist yet; absent ones read as undefined
    const { data } = await (admin.from("sms_log") as any)
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .range(from, from + 999);
    const r = data ?? [];
    raw.push(...r);
    if (r.length < 1000) break;
  }
  const rows: SmsLogRow[] = raw.map((x) => ({
    recipient: String(x.recipient ?? ""), kind: String(x.kind || "other"), segments: Number(x.segments) || 1, created_at: String(x.created_at),
    status: x.status === "failed" ? "failed" : "sent", error: x.error ?? null, message: x.message ?? null,
  }));

  let costSince = 0, sentToday = 0, sent7d = 0, sent30d = 0, failedToday = 0, failed7d = 0, failed30d = 0, segments30d = 0, segments7d = 0;
  const byKind = new Map<string, number>();
  const perDay = new Map<string, { count: number; failed: number }>();
  for (let i = 13; i >= 0; i--) perDay.set(new Date(now - i * DAY + 6 * 3600 * 1000).toISOString().slice(0, 10), { count: 0, failed: 0 });
  let lastFailure: SmsStats["lastFailure"] = null;

  for (const x of rows) {
    const ts = x.created_at;
    const failed = x.status === "failed";
    if (failed) {
      if (!lastFailure) lastFailure = { at: ts, recipient: x.recipient, error: x.error || "unknown error" };
      if (ts >= today) failedToday++;
      if (ts >= d7) failed7d++;
      if (ts >= d30) failed30d++;
    } else {
      const seg = x.segments;
      if (ts >= balanceAt) costSince += seg * rate; // only accepted texts cost money
      if (ts >= today) sentToday++;
      if (ts >= d7) { sent7d++; segments7d += seg; }
      if (ts >= d30) { sent30d++; segments30d += seg; byKind.set(x.kind, (byKind.get(x.kind) || 0) + 1); }
    }
    const day = new Date(new Date(ts).getTime() + 6 * 3600 * 1000).toISOString().slice(0, 10);
    const e = perDay.get(day);
    if (e) { e.count++; if (failed) e.failed++; }
  }

  const estBalance = balance - costSince;
  return {
    balance, balanceAt, rate, costSince, estBalance,
    remainingSms: Math.max(0, Math.floor(estBalance / rate)),
    sentToday, sent7d, sent30d, failedToday, failed7d, failed30d, lastFailure,
    segments30d, cost30d: segments30d * rate, cost7d: segments7d * rate,
    perDay: [...perDay.entries()].map(([date, v]) => ({ date, ...v })),
    byKind: [...byKind.entries()].map(([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count),
    recent: rows.slice(0, 15),
  };
}
