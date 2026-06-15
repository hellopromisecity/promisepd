import { redirect } from "next/navigation";
import { ReceiptText, ArrowUpRight, ArrowDownRight, Scale } from "lucide-react";
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
import {
  listTransactions,
  listTypes,
  nameMaps,
  taka,
  fmtDate,
  type InvestorTransaction,
} from "@/lib/investments";

export const dynamic = "force-dynamic";

export const metadata = { title: "All Transactions", robots: { index: false } };

const MAX_ROWS = 400; // newest first; stats are still computed over all

export default async function InvestorTransactionsPage() {
  const me = await getCurrentUser();
  if (!me || !isAdmin(me.role)) redirect("/account");

  const admin = getAdmin();
  if (!admin) {
    return (
      <div className="space-y-6">
        <PageHeader title="All Transactions" subtitle="Every investor deposit, profit and withdrawal." />
        <EmptyState icon={ReceiptText} title="Data unavailable" message="Supabase isn’t configured." />
      </div>
    );
  }

  const [all, types, maps] = await Promise.all([
    listTransactions(admin),
    listTypes(admin),
    nameMaps(admin),
  ]);
  const op = new Map(types.map((t) => [t.name, t.operator]));

  let inflow = 0;
  let outflow = 0;
  for (const t of all) {
    const amt = Number(t.amount) || 0;
    if (op.get(t.type) === "-") outflow += amt;
    else inflow += amt;
  }

  const rows = all.slice(0, MAX_ROWS);

  return (
    <div className="space-y-6">
      <PageHeader title="All Transactions" subtitle={`${all.length} investor transactions ported from the app.`} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Transactions" value={all.length} sub="all time" icon={ReceiptText} tone="info" />
        <StatCard label="Inflow (+)" value={taka(inflow)} sub="deposits, profit…" icon={ArrowUpRight} tone="success" />
        <StatCard label="Outflow (−)" value={taka(outflow)} sub="withdrawals, fees…" icon={ArrowDownRight} tone="danger" />
        <StatCard label="Net" value={taka(inflow - outflow)} sub="inflow − outflow" icon={Scale} tone="warning" />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={ReceiptText} title="No transactions yet" message="Imported transactions will appear here." />
      ) : (
        <>
          {all.length > MAX_ROWS && (
            <p className="text-xs text-fg-muted">
              Showing the latest {MAX_ROWS.toLocaleString("en-US")} of {all.length.toLocaleString("en-US")}. Search &amp; filters next.
            </p>
          )}
          <TableShell>
            <thead>
              <tr>
                <th className={thCls}>Date</th>
                <th className={thCls}>Investor</th>
                <th className={thCls}>Type</th>
                <th className={`${thCls} text-right`}>Amount</th>
                <th className={thCls}>Project</th>
                <th className={thCls}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t: InvestorTransaction) => {
                const minus = op.get(t.type) === "-";
                return (
                  <tr key={t.transaction_id}>
                    <td className={`${tdCls} whitespace-nowrap text-fg-muted`}>{fmtDate(t.date)}</td>
                    <td className={tdCls}>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-fg">{maps.investorName.get(t.uid) || t.uid}</p>
                        {t.description && <p className="truncate text-[11px] text-fg-muted">{t.description}</p>}
                      </div>
                    </td>
                    <td className={tdCls}>
                      <Badge tone={minus ? "danger" : "success"}>{t.type}</Badge>
                    </td>
                    <td className={`${tdCls} whitespace-nowrap text-right font-bold ${minus ? "text-brand-red-dark" : "text-emerald-600"}`}>
                      {minus ? "−" : "+"}{taka(t.amount)}
                    </td>
                    <td className={`${tdCls} text-fg-muted`}>
                      {t.project_id ? maps.projectName.get(t.project_id) || t.project_id : "—"}
                    </td>
                    <td className={`${tdCls} whitespace-nowrap font-mono text-xs text-fg-faint`}>{t.rashid_number || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
        </>
      )}
    </div>
  );
}
