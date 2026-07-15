import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Building, ArrowDownLeft, ArrowUpRight, Wallet, TrendingUp, Layers } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getInvestorRef, investorPortalForRef } from "@/lib/investments";
import { PageHeader, Card, EmptyState } from "@/components/admin/ui";

export const metadata: Metadata = { title: "My Projects", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const tk = (n: number) => "৳" + Math.round(Number(n) || 0).toLocaleString("en-IN");
const dOnly = (iso: string) => {
  if (!iso) return "—";
  try { return new Date(iso.includes("T") ? iso : iso + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return iso; }
};

export default async function MyProjectsPage() {
  const me = await getCurrentUser();
  if (!me || !["staff", "manager", "admin"].includes(me.role)) redirect("/account");

  const ref = await getInvestorRef(me.id);
  const portal = await investorPortalForRef(ref, me.mobile);

  if (!portal) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Projects" subtitle="Your own investment in Promise projects." />
        <EmptyState
          icon={Building}
          title="No linked investment yet"
          message="We couldn't find an investor account linked to you. Ask an admin to add your Investor ID (or matching mobile) on the Staff page."
        />
      </div>
    );
  }

  const totalInvested = portal.myProjects.reduce((s, p) => s + p.invested, 0);
  const totalProfit = portal.myProjects.reduce((s, p) => s + p.profit, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="My Projects" subtitle={`${portal.full_name || me.name} — your own investment & transactions`} />

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={Wallet} label="Total invested" value={tk(totalInvested)} tone="blue" />
        <Stat icon={TrendingUp} label="Profit / dividend" value={tk(totalProfit)} tone="green" />
        <Stat icon={Layers} label="Projects" value={String(portal.myProjects.length)} />
      </div>

      {/* Per-project cards */}
      {portal.myProjects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {portal.myProjects.map((p) => (
            <Card key={p.project_id}>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-fg">{p.project_name}</div>
                  <div className="text-[11px] uppercase tracking-wide text-fg-faint">{p.status}</div>
                </div>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-blue-tint text-brand-blue"><Building className="h-4.5 w-4.5" /></span>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-fg-faint">Invested</div>
                  <div className="text-lg font-extrabold tabular-nums text-brand-blue">{tk(p.invested)}</div>
                </div>
                {p.profit > 0 && (
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wide text-fg-faint">Profit</div>
                    <div className="text-sm font-bold tabular-nums text-emerald-600">{tk(p.profit)}</div>
                  </div>
                )}
              </div>
              {p.goal > 0 && (
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-fg-muted">
                    <span>Progress</span><span className="font-semibold text-fg">{p.progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-bg-soft">
                    <div className="h-full rounded-full bg-brand-blue" style={{ width: `${Math.min(100, p.progress)}%` }} />
                  </div>
                  <div className="mt-1 text-[11px] text-fg-faint">Target {tk(p.goal)}</div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Transactions ledger */}
      <Card pad={false}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-bold text-fg">Transactions</h2>
          <span className="text-xs text-fg-muted">{portal.transactions.length} total</span>
        </div>
        {portal.transactions.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-fg-muted">No transactions yet.</p>
        ) : (
          <div className="max-h-[58vh] overflow-y-auto [scrollbar-gutter:stable]">
            {portal.transactions.map((t) => {
              const minus = t.operator === "-";
              return (
                <div key={t.transaction_id} className="flex items-center gap-3 border-b border-border/60 px-5 py-3 last:border-0">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${minus ? "bg-brand-red-tint text-brand-red-dark" : "bg-emerald-50 text-emerald-600"}`}>
                    {minus ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold capitalize text-fg">{t.type.replace(/_/g, " ")}</div>
                    <div className="truncate text-[11px] text-fg-muted">
                      {t.project_name ? `${t.project_name} · ` : ""}{dOnly(t.date)}{t.rashid_number ? ` · #${t.rashid_number}` : ""}
                    </div>
                  </div>
                  <span className={`shrink-0 text-sm font-bold tabular-nums ${minus ? "text-brand-red-dark" : "text-emerald-600"}`}>
                    {minus ? "−" : "+"}{tk(t.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Wallet; label: string; value: string; tone?: "blue" | "green" }) {
  const box = tone === "blue" ? "bg-brand-blue-tint text-brand-blue" : tone === "green" ? "bg-emerald-50 text-emerald-600" : "bg-bg-soft text-fg-muted";
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-bg p-4">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${box}`}><Icon className="h-5 w-5" /></span>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-fg-faint">{label}</div>
        <div className="text-lg font-extrabold tabular-nums text-fg">{value}</div>
      </div>
    </div>
  );
}
