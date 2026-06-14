import { redirect } from "next/navigation";
import { TrendingDown, CalendarRange } from "lucide-react";
import { getCurrentUser, isManager } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import { PROJECTS } from "@/lib/site";
import { PageHeader, StatCard, EmptyState } from "@/components/admin/ui";
import TransactionForm, {
  type AccountOption,
  type ProjectOption,
} from "../income/TransactionForm";
import TxnTable, { type TxnListRow } from "../income/TxnTable";

export const dynamic = "force-dynamic";

function taka(amount: number): string {
  return `৳${Math.round(Number(amount) || 0).toLocaleString("en-US")}`;
}

const PROJECT_OPTIONS: ProjectOption[] = PROJECTS.map((p) => ({ slug: p.slug, name: p.name }));
const PROJECT_NAMES: Record<string, string> = Object.fromEntries(
  PROJECTS.map((p) => [p.slug, p.name]),
);

export default async function ExpensesPage() {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) redirect("/account");

  const admin = getAdmin();
  if (!admin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Expenses" subtitle="All recorded expenses." />
        <EmptyState icon={TrendingDown} title="Data unavailable" message="Supabase isn’t configured." />
      </div>
    );
  }

  // Accounts (form dropdown) + expense rows are independent — fetch both
  // in parallel instead of one after the other.
  const [accRes, txnRes] = await Promise.all([
    admin.from("finance_accounts").select("id, name, type").order("name", { ascending: true }),
    admin
      .from("transactions")
      .select("id, type, amount, category, txn_date, party, project_slug, method, description")
      .eq("type", "expense")
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
        title="Expenses"
        subtitle="Record and review every outgoing payment."
        action={<TransactionForm type="expense" accounts={accounts} projects={PROJECT_OPTIONS} />}
      />

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total expense" value={taka(total)} sub={`${rows.length} entries`} icon={TrendingDown} tone="danger" />
        <StatCard label="This month" value={taka(monthTotal)} sub={monthLabel} icon={CalendarRange} tone="warning" />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={TrendingDown}
          title="No expenses recorded yet"
          message="Record your first outgoing payment to start tracking spend."
          action={<TransactionForm type="expense" accounts={accounts} projects={PROJECT_OPTIONS} />}
        />
      ) : (
        <TxnTable rows={rows} type="expense" projectNames={PROJECT_NAMES} />
      )}
    </div>
  );
}
