import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MessageSquare, Wallet, Send, Smartphone, Coins, TrendingDown } from "lucide-react";
import { getCurrentUser, isManager } from "@/lib/auth";
import { PageHeader, StatCard, Card, EmptyState } from "@/components/admin/ui";
import { smsStats } from "@/lib/sms-stats";
import SmsConfigForm from "./SmsConfigForm";

export const metadata: Metadata = { title: "SMS", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const bdt = (n: number) => "৳" + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const fmtDay = (d: string) => { try { return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short" }); } catch { return d; } };
const fmtWhen = (iso: string) => { try { return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); } catch { return iso; } };
const local = (p: string | null) => { const d = (p || "").replace(/\D/g, ""); return d.startsWith("880") ? "0" + d.slice(3) : (p || "—"); };

export default async function SmsPage() {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) redirect("/account");

  const s = await smsStats();
  if (!s) {
    return (
      <div className="space-y-6">
        <PageHeader title="SMS" subtitle="Balance, usage and cost." />
        <EmptyState icon={MessageSquare} title="Not ready yet" message="Supabase isn't configured, or the sms_log / sms_config tables (migration 0027) haven't been created yet." />
      </div>
    );
  }

  const maxDay = Math.max(1, ...s.perDay.map((d) => d.count));
  const pctLeft = s.balance > 0 ? Math.max(0, Math.min(100, Math.round((s.estBalance / s.balance) * 100))) : 0;
  const needsSetup = s.balance === 0 && s.sent30d === 0;

  return (
    <div className="space-y-6">
      <PageHeader title="SMS" subtitle="Your KhudeBarta balance & usage — tracked here so you don't have to log in to check." />

      {needsSetup && (
        <div className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Set your current KhudeBarta balance and per-SMS rate below to start. Every SMS the app sends is then subtracted automatically.
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Balance (est.)" value={bdt(s.estBalance)} sub={`checkpoint ${bdt(s.balance)}`} icon={Wallet} tone="success" />
        <StatCard label="Remaining SMS" value={s.remainingSms.toLocaleString("en-IN")} sub={`at ${bdt(s.rate)} / SMS`} icon={Smartphone} tone="info" />
        <StatCard label="Sent · 30 days" value={s.sent30d.toLocaleString("en-IN")} sub={`${s.sentToday} today · ${s.sent7d} in 7d`} icon={Send} tone="warning" />
        <StatCard label="Cost · 30 days" value={bdt(s.cost30d)} sub={`7-day ${bdt(s.cost7d)}`} icon={TrendingDown} tone="neutral" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* balance remaining donut */}
        <Card>
          <h2 className="mb-3 text-sm font-bold text-fg">Balance remaining</h2>
          <div className="flex items-center gap-4">
            <Donut pct={pctLeft} />
            <div className="text-sm">
              <div className="text-2xl font-extrabold tabular-nums text-fg">{bdt(s.estBalance)}</div>
              <div className="text-fg-muted">of {bdt(s.balance)}</div>
              <div className="mt-1 text-[11px] text-fg-faint">spent {bdt(s.costSince)} since {new Date(s.balanceAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</div>
            </div>
          </div>
        </Card>

        {/* per-day bar chart */}
        <Card className="lg:col-span-2">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-fg"><Coins className="h-4 w-4 text-brand-blue" /> SMS sent · last 14 days</h2>
          <div className="flex h-36 items-end gap-1.5">
            {s.perDay.map((d) => (
              <div key={d.date} className="group relative flex h-full flex-1 flex-col items-center justify-end" title={`${fmtDay(d.date)}: ${d.count}`}>
                <span className="mb-1 text-[10px] font-semibold tabular-nums text-fg-muted opacity-0 transition-opacity group-hover:opacity-100">{d.count}</span>
                <div className="w-full rounded-t bg-gradient-to-t from-brand-blue to-brand-blue/55" style={{ height: `${Math.max(2, (d.count / maxDay) * 100)}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex gap-1.5">
            {s.perDay.map((d) => <span key={d.date} className="flex-1 truncate text-center text-[9px] text-fg-faint">{fmtDay(d.date).split(" ")[0]}</span>)}
          </div>
        </Card>
      </div>

      {/* settings + recent */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SmsConfigForm balance={s.balance} rate={s.rate} />

        <Card pad={false} className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h2 className="text-sm font-bold text-fg">Recent SMS</h2>
            <div className="flex gap-1.5">
              {s.byKind.map((k) => <span key={k.kind} className="rounded-full bg-bg-soft px-2 py-0.5 text-[10px] font-semibold text-fg-muted">{k.kind} {k.count}</span>)}
            </div>
          </div>
          {s.recent.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-fg-muted">No SMS sent yet — they'll appear here as the app texts customers.</p>
          ) : (
            <div className="max-h-[42vh] overflow-y-auto">
              {s.recent.map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-2.5 text-sm last:border-0">
                  <div className="min-w-0">
                    <span className="font-medium text-fg">{local(r.recipient)}</span>
                    <span className="ml-2 rounded-full bg-bg-soft px-1.5 py-0.5 text-[10px] font-semibold text-fg-muted">{r.kind}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-xs text-fg-muted">
                    <span>{r.segments} SMS</span>
                    <span className="tabular-nums">{fmtWhen(r.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Donut({ pct }: { pct: number }) {
  const r = 34, c = 2 * Math.PI * r;
  const off = c * (1 - pct / 100);
  const color = pct <= 15 ? "#e5484d" : pct <= 35 ? "#f5a524" : "#10b981";
  return (
    <div className="relative" style={{ width: 96, height: 96 }}>
      <svg viewBox="0 0 88 88" width={96} height={96} className="-rotate-90">
        <circle cx="44" cy="44" r={r} fill="none" stroke="var(--color-border)" strokeWidth="9" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div className="absolute inset-0 grid place-items-center"><span className="text-lg font-extrabold tabular-nums text-fg">{pct}%</span></div>
    </div>
  );
}
