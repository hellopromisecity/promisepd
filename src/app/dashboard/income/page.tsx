import { redirect } from "next/navigation";
import { TrendingUp, CalendarRange } from "lucide-react";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import { PROJECTS } from "@/lib/site";
import { PageHeader, StatCard, EmptyState } from "@/components/admin/ui";
import TransactionForm, { type AccountOption, type ProjectOption } from "./TransactionForm";
import TxnTable, { type TxnListRow } from "./TxnTable";

export const dynamic = "force-dynamic";

function taka(amount: number): string {
  return `৳${Math.round(Number(amount) || 0).toLocaleString("en-US")}`;
}

const PROJECT_OPTIONS: ProjectOption[] = PROJECTS.map((p) => ({ slug: p.slug, name: p.name }));
const PROJECT_NAMES: Record<string, string> = Object.fromEntries(
  PROJECTS.map((p) => [p.slug, p.name]),
);

export default async function IncomePage() {
  const me = await getCurrentUser();
  if (!me || !isAdmin(me.role)) redirect("/account");

  const admin = getAdmin();
  if (!admin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Income" subtitle="All recorded income." />
        <EmptyState icon={TrendingUp} title="Data unavailable" message="Supabase isn’t configured." />
      </div>
    );
  }

  // Accounts (form dropdown) + income rows are independent — fetch both
  // in parallel instead of one after the other.
  const [accRes, txnRes] = await Promise.all([
    admin.from("finance_accounts").select("id, name, type").order("name", { ascending: true }),
    admin
      .from("transactions")
      .select("id, type, amount, category, txn_date, party, project_slug, method, description")
      .eq("type", "income")
      .order("txn_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);
  const accounts = (accRes.data ?? []) as AccountOption[];
  const rows = (txnRes.data ?? []) as TxnListRow[];

  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthTotal = rows
    .filter((r) => r.txn_date?.startsWith(ym))
    .reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const monthLabel = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Income"
        subtitle="Record and review every incoming payment."
        action={<TransactionForm type="income" accounts={accounts} projects={PROJECT_OPTIONS} />}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        <StatCard label="Total income" value={taka(total)} sub={`${rows.length} entries`} icon={TrendingUp} tone="success" />
        <StatCard label="This month" value={taka(monthTotal)} sub={monthLabel} icon={CalendarRange} tone="info" />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No income recorded yet"
          message="Record your first incoming payment to start tracking revenue."
          action={<TransactionForm type="income" accounts={accounts} projects={PROJECT_OPTIONS} />}
        />
      ) : (
        <TxnTable rows={rows} type="income" projectNames={PROJECT_NAMES} />
      )}
    </div>
  );
}
