import { redirect } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Scale,
  CalendarRange,
  Building2,
  ArrowRight,
} from "lucide-react";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import {
  PageHeader,
  Card,
  StatCard,
  Badge,
  EmptyState,
  TableShell,
  thCls,
  tdCls,
} from "@/components/admin/ui";
import {
  accountBalances,
  fetchAccounts,
  fmtDate,
  taka,
  type AccountRow,
  type TxnRow,
} from "./_lib";

export const dynamic = "force-dynamic";

const ACCOUNT_TONE: Record<string, "info" | "neutral" | "success"> = {
  bank: "info",
  cash: "success",
  mobile: "neutral",
};

export default async function FinanceOverviewPage() {
  const me = await getCurrentUser();
  if (!me || !isAdmin(me.role)) redirect("/account");

  const admin = getAdmin();
  if (!admin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Finance" subtitle="Income, expenses and balances at a glance." />
        <EmptyState icon={Scale} title="Data unavailable" message="Supabase isn’t configured." />
      </div>
    );
  }

  const accounts = ((await fetchAccounts()) ?? []) as AccountRow[];

  // All transactions feed the totals + per-account balances; recent 10 for the list.
  const { data: allTxns } = await admin
    .from("transactions")
    .select("type, amount, account_id");
  const txns = (allTxns ?? []) as Pick<TxnRow, "type" | "amount" | "account_id">[];

  const { data: recentData } = await admin
    .from("transactions")
    .select("id, type, amount, category, txn_date, party, project_slug")
    .order("txn_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(10);
  const recent = (recentData ?? []) as Pick<
    TxnRow,
    "id" | "type" | "amount" | "category" | "txn_date" | "party" | "project_slug"
  >[];

  const totalIncome = txns
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalExpense = txns
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const net = totalIncome - totalExpense;

  // This-month net needs dated rows.
  const { data: monthData } = await admin
    .from("transactions")
    .select("type, amount, txn_date");
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  let monthNet = 0;
  for (const t of (monthData ?? []) as Pick<TxnRow, "type" | "amount" | "txn_date">[]) {
    if (!t.txn_date?.startsWith(ym)) continue;
    monthNet += (Number(t.amount) || 0) * (t.type === "income" ? 1 : -1);
  }

  const balances = accountBalances(accounts, txns);
  const monthLabel = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        subtitle="Income, expenses and account balances at a glance."
        action={
          <Link
            href="/dashboard/finance/bank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-brand-blue/40"
          >
            <Building2 className="h-4 w-4" /> Bank &amp; cash
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total income" value={taka(totalIncome)} icon={TrendingUp} tone="success" />
        <StatCard label="Total expense" value={taka(totalExpense)} icon={TrendingDown} tone="danger" />
        <StatCard
          label="Net balance"
          value={taka(net)}
          sub="income − expense"
          icon={Scale}
          tone={net >= 0 ? "info" : "warning"}
        />
        <StatCard
          label="This month"
          value={taka(monthNet)}
          sub={monthLabel}
          icon={CalendarRange}
          tone={monthNet >= 0 ? "info" : "warning"}
        />
      </div>

      {/* Per-account balances */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-fg">Account balances</h2>
        {accounts.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No accounts yet"
            message="Add a bank, cash or mobile account to start tracking balances."
            action={
              <Link
                href="/dashboard/finance/bank"
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-blue-dark"
              >
                Add account <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
        ) : (
          <TableShell>
            <thead>
              <tr>
                <th className={thCls}>Account</th>
                <th className={thCls}>Type</th>
                <th className={thCls}>Number</th>
                <th className={`${thCls} text-right`}>Opening</th>
                <th className={`${thCls} text-right`}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => {
                const balance = balances.get(a.id) ?? (Number(a.opening_balance) || 0);
                return (
                  <tr key={a.id}>
                    <td className={`${tdCls} font-semibold`}>{a.name}</td>
                    <td className={tdCls}>
                      <Badge tone={ACCOUNT_TONE[a.type] ?? "neutral"}>{a.type}</Badge>
                    </td>
                    <td className={`${tdCls} text-fg-muted`}>{a.account_number || "—"}</td>
                    <td className={`${tdCls} text-right text-fg-muted`}>{taka(a.opening_balance)}</td>
                    <td
                      className={`${tdCls} text-right font-bold ${
                        balance < 0 ? "text-brand-red-dark" : "text-fg"
                      }`}
                    >
                      {taka(balance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
        )}
      </div>

      {/* Recent transactions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-fg">Recent transactions</h2>
          <Link
            href="/dashboard/income"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline"
          >
            All income <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <Card>
            <p className="py-6 text-center text-sm text-fg-muted">
              No transactions yet — record income or expenses to see them here.
            </p>
          </Card>
        ) : (
          <TableShell>
            <thead>
              <tr>
                <th className={thCls}>Type</th>
                <th className={`${thCls} text-right`}>Amount</th>
                <th className={thCls}>Category</th>
                <th className={thCls}>Party</th>
                <th className={thCls}>Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((t) => (
                <tr key={t.id}>
                  <td className={tdCls}>
                    <Badge tone={t.type === "income" ? "success" : "danger"}>{t.type}</Badge>
                  </td>
                  <td
                    className={`${tdCls} text-right font-bold ${
                      t.type === "income" ? "text-emerald-700" : "text-brand-red-dark"
                    }`}
                  >
                    {t.type === "income" ? "+" : "−"}
                    {taka(t.amount)}
                  </td>
                  <td className={tdCls}>{t.category}</td>
                  <td className={`${tdCls} text-fg-muted`}>{t.party || "—"}</td>
                  <td className={`${tdCls} text-fg-muted`}>{fmtDate(t.txn_date)}</td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </div>
    </div>
  );
}
