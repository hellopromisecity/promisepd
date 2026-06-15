import { redirect } from "next/navigation";
import { UsersRound, UserCheck, Wallet, TrendingUp } from "lucide-react";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import {
  PageHeader,
  StatCard,
  Badge,
  EmptyState,
  TableShell,
  thCls,
  tdCls,
} from "@/components/admin/ui";
import { listInvestors, bal, taka, type InvestorAccount } from "@/lib/investments";
import InvestorEdit from "./InvestorEdit";

export const dynamic = "force-dynamic";

export const metadata = { title: "App Users", robots: { index: false } };

/** Prefer the local 01… form for a +880 number; otherwise show as-is. */
function localPhone(p: string): string {
  const d = (p || "").replace(/\D/g, "");
  if (d.startsWith("880") && d.length === 13) return "0" + d.slice(3);
  return p || "—";
}

export default async function InvestorUsersPage() {
  const me = await getCurrentUser();
  if (!me || !isAdmin(me.role)) redirect("/account");

  const admin = getAdmin();
  if (!admin) {
    return (
      <div className="space-y-6">
        <PageHeader title="App Users" subtitle="Investor accounts." />
        <EmptyState icon={UsersRound} title="Data unavailable" message="Supabase isn’t configured." />
      </div>
    );
  }

  const investors: InvestorAccount[] = await listInvestors(admin);
  const active = investors.filter((i) => i.is_active).length;
  const totalBalance = investors.reduce((s, i) => s + bal(i.balance).total_balance, 0);
  const totalInvested = investors.reduce((s, i) => s + bal(i.balance).total_investment, 0);

  // Highest balance first — the accounts that matter most on top.
  const rows = [...investors].sort((a, b) => bal(b.balance).total_balance - bal(a.balance).total_balance);

  return (
    <div className="space-y-6">
      <PageHeader title="App Users" subtitle={`${investors.length} investor accounts ported from the app.`} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Investors" value={investors.length} sub="total accounts" icon={UsersRound} tone="info" />
        <StatCard label="Active" value={active} sub="is_active = true" icon={UserCheck} tone="success" />
        <StatCard label="Total invested" value={taka(totalInvested)} sub="across all" icon={TrendingUp} tone="warning" />
        <StatCard label="Total balance" value={taka(totalBalance)} sub="current holdings" icon={Wallet} tone="info" />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={UsersRound} title="No investors yet" message="Imported investor accounts will appear here." />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <th className={thCls}>Investor</th>
              <th className={`${thCls} text-right`}>Invested</th>
              <th className={`${thCls} text-right`}>Profit</th>
              <th className={`${thCls} text-right`}>Withdrawn</th>
              <th className={`${thCls} text-right`}>Balance</th>
              <th className={thCls}>Status</th>
              <th className={`${thCls} text-right`}>Edit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => {
              const b = bal(i.balance);
              return (
                <tr key={i.uid}>
                  <td className={tdCls}>
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-blue-tint text-xs font-bold text-brand-blue">
                        {(i.full_name?.[0] ?? "?").toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-fg">
                          {i.full_name || "Unnamed"}
                          {i.is_verified && <span className="ml-1.5 text-[10px] font-semibold text-emerald-600">✓ verified</span>}
                        </p>
                        <p className="truncate text-xs text-fg-muted">
                          {localPhone(i.phone_number)}
                          <span className="ml-1.5 font-mono text-fg-faint">{i.uid}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className={`${tdCls} text-right text-fg-muted`}>{taka(b.total_investment)}</td>
                  <td className={`${tdCls} text-right text-emerald-600`}>{taka(b.total_profit)}</td>
                  <td className={`${tdCls} text-right text-fg-muted`}>{taka(b.total_withdrawn)}</td>
                  <td className={`${tdCls} text-right font-bold ${b.total_balance < 0 ? "text-brand-red-dark" : "text-fg"}`}>
                    {taka(b.total_balance)}
                  </td>
                  <td className={tdCls}>
                    <Badge tone={i.is_active ? "success" : "neutral"}>{i.is_active ? "active" : "inactive"}</Badge>
                  </td>
                  <td className={tdCls}>
                    <div className="flex justify-end">
                      <InvestorEdit
                        investor={{
                          uid: i.uid,
                          full_name: i.full_name,
                          email: i.email,
                          is_active: i.is_active,
                          is_verified: i.is_verified,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}
