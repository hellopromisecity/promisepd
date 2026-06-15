import { redirect } from "next/navigation";
import { Tags, Plus, Minus } from "lucide-react";
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
import { listTypes, type InvestmentType } from "@/lib/investments";

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
  for (const r of (usageRes.data ?? []) as { type: string }[]) {
    usage.set(r.type, (usage.get(r.type) ?? 0) + 1);
  }

  const inflow = types.filter((t) => t.operator === "+").length;
  const outflow = types.filter((t) => t.operator === "-").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Transaction Types" subtitle={`${types.length} types ported from the app.`} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Types" value={types.length} sub="total" icon={Tags} tone="info" />
        <StatCard label="Inflow (+)" value={inflow} sub="add to balance" icon={Plus} tone="success" />
        <StatCard label="Outflow (−)" value={outflow} sub="reduce balance" icon={Minus} tone="danger" />
      </div>

      {types.length === 0 ? (
        <EmptyState icon={Tags} title="No types yet" message="Imported transaction types will appear here." />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <th className={thCls}>Name</th>
              <th className={thCls}>Effect</th>
              <th className={thCls}>Classification</th>
              <th className={`${thCls} text-right`}>Used</th>
              <th className={thCls}>Editable</th>
              <th className={thCls}>Status</th>
            </tr>
          </thead>
          <tbody>
            {types.map((t: InvestmentType) => (
              <tr key={t.name}>
                <td className={`${tdCls} font-semibold text-fg`}>{t.name}</td>
                <td className={tdCls}>
                  <Badge tone={t.operator === "-" ? "danger" : "success"}>
                    {t.operator === "-" ? "− subtract" : "+ add"}
                  </Badge>
                </td>
                <td className={`${tdCls} capitalize text-fg-muted`}>{t.classification}</td>
                <td className={`${tdCls} text-right tabular-nums text-fg-muted`}>{(usage.get(t.name) ?? 0).toLocaleString("en-US")}</td>
                <td className={tdCls}>
                  <Badge tone={t.is_editable ? "neutral" : "info"}>{t.is_editable ? "editable" : "system"}</Badge>
                </td>
                <td className={tdCls}>
                  <Badge tone={t.is_active ? "success" : "neutral"}>{t.is_active ? "active" : "inactive"}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}
