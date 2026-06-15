import { redirect } from "next/navigation";
import { Tags, Plus, Minus, ToggleRight } from "lucide-react";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import { PageHeader, StatCard, EmptyState } from "@/components/admin/ui";
import { listTypes } from "@/lib/investments";
import TypeForm from "./TypeForm";
import TypesTable, { type TypeRow } from "./TypesTable";

export const dynamic = "force-dynamic";

export const metadata = { title: "Transaction Types", robots: { index: false } };

export default async function TransactionTypesPage() {
  const me = await getCurrentUser();
  if (!me || !isAdmin(me.role)) redirect("/account");

  const admin = getAdmin();
  if (!admin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Transaction Types" subtitle="The kinds of money movement (deposit, profit, withdrawal…)." />
        <EmptyState icon={Tags} title="Data unavailable" message="Supabase isn’t configured." />
      </div>
    );
  }

  const [types, usageRes] = await Promise.all([
    listTypes(admin),
    admin.from("investor_transactions").select("type"),
  ]);
  const usage = new Map<string, number>();
  for (const r of (usageRes.data ?? []) as { type: string }[]) usage.set(r.type, (usage.get(r.type) ?? 0) + 1);

  const rows: TypeRow[] = types.map((t) => ({
    name: t.name,
    operator: (t.operator === "-" ? "-" : "+") as "+" | "-",
    classification: t.classification,
    is_editable: t.is_editable,
    is_active: t.is_active,
    used: usage.get(t.name) ?? 0,
  }));

  const active = rows.filter((t) => t.is_active).length;
  const credit = rows.filter((t) => t.operator === "+").length;
  const debit = rows.filter((t) => t.operator === "-").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transaction Types"
        subtitle={`${rows.length} types — how each kind of money movement affects a balance.`}
        action={<TypeForm />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Types" value={rows.length} sub="total kinds" icon={Tags} tone="info" />
        <StatCard label="Active" value={active} sub="in use" icon={ToggleRight} tone="success" />
        <StatCard label="Credit (+)" value={credit} sub="add to balance" icon={Plus} tone="success" />
        <StatCard label="Debit (−)" value={debit} sub="reduce balance" icon={Minus} tone="danger" />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Tags} title="No types yet" message="Add your first transaction type." />
      ) : (
        <TypesTable types={rows} />
      )}
    </div>
  );
}
