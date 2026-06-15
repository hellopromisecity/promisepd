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
  listInvestors,
  listProjects,
  nameMaps,
  taka,
  fmtDate,
  type InvestorTransaction,
} from "@/lib/investments";
import TxnForm from "./TxnForm";
import TxnDelete from "./TxnDelete";

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

  const [all, types, maps, investors, projects] = await Promise.all([
    listTransactions(admin),
    listTypes(admin),
    nameMaps(admin),
    listInvestors(admin),
    listProjects(admin),
  ]);
  const op = new Map(types.map((t) => [t.name, t.operator]));

  // Options for the add/edit form.
  const localPhone = (p: string) => {
    const d = (p || "").replace(/\D/g, "");
    return d.startsWith("880") && d.length === 13 ? "0" + d.slice(3) : p;
  };
  const investorOptions = investors.map((i) => ({
    uid: i.uid,
    label: `${i.full_name || "Unnamed"} — ${localPhone(i.phone_number)}`,
  }));
  const typeOptions = types.map((t) => ({ name: t.name, operator: t.operator }));
  const projectOptions = projects.map((p) => ({ project_id: p.project_id, project_name: p.project_name }));
  const formProps = { investors: investorOptions, types: typeOptions, projects: projectOptions };

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
      <PageHeader
        title="All Transactions"
        subtitle={`${all.length} investor transactions ported from the app.`}
        action={<TxnForm {...formProps} />}
      />

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
                <th className={`${thCls} text-right`}>Actions</th>
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
                    <td className={tdCls}>
                      <div className="flex items-center justify-end gap-1">
                        <TxnForm
                          {...formProps}
                          txn={{
                            transaction_id: t.transaction_id,
                            uid: t.uid,
                            type: t.type,
                            amount: Number(t.amount) || 0,
                            date: (t.date || "").slice(0, 10),
                            project_id: t.project_id,
                            rashid_number: t.rashid_number,
                            description: t.description,
                          }}
                        />
                        <TxnDelete id={t.transaction_id} label={t.transaction_id} />
                      </div>
                    </td>
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
