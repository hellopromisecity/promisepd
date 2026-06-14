import { redirect } from "next/navigation";
import { Building2, Banknote, Smartphone, Wallet } from "lucide-react";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import {
  PageHeader,
  Badge,
  EmptyState,
  TableShell,
  thCls,
  tdCls,
} from "@/components/admin/ui";
import {
  accountBalances,
  fetchAccounts,
  taka,
  type AccountRow,
  type TxnRow,
} from "../_lib";
import AccountForm, { type EditableAccount } from "./AccountForm";

export const dynamic = "force-dynamic";

const TYPE_META: Record<
  string,
  { label: string; tone: "info" | "success" | "neutral" }
> = {
  bank: { label: "Bank", tone: "info" },
  cash: { label: "Cash", tone: "success" },
  mobile: { label: "Mobile", tone: "neutral" },
};

const TYPE_ICON: Record<string, typeof Building2> = {
  bank: Building2,
  cash: Banknote,
  mobile: Smartphone,
};

export default async function BankCashPage() {
  const me = await getCurrentUser();
  if (!me || !isAdmin(me.role)) redirect("/account");

  const admin = getAdmin();
  if (!admin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Bank & cash" subtitle="Manage your finance accounts." />
        <EmptyState icon={Wallet} title="Data unavailable" message="Supabase isn’t configured." />
      </div>
    );
  }

  // Accounts + transactions are independent — fetch in parallel.
  const [accountsRaw, txnRes] = await Promise.all([
    fetchAccounts(),
    admin.from("transactions").select("type, amount, account_id"),
  ]);
  const accounts = (accountsRaw ?? []) as AccountRow[];
  const txns = (txnRes.data ?? []) as Pick<TxnRow, "type" | "amount" | "account_id">[];
  const balances = accountBalances(accounts, txns);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bank & cash"
        subtitle="Bank, cash and mobile-banking accounts with live balances."
        action={<AccountForm />}
      />

      {accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No accounts yet"
          message="Add a bank, cash or mobile-banking account. Transactions you record then update these balances automatically."
          action={<AccountForm />}
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
              <th className={`${thCls} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => {
              const meta = TYPE_META[a.type] ?? { label: a.type, tone: "neutral" as const };
              const Icon = TYPE_ICON[a.type] ?? Wallet;
              const balance = balances.get(a.id) ?? (Number(a.opening_balance) || 0);
              const editable: EditableAccount = {
                id: a.id,
                name: a.name,
                type: a.type,
                account_number: a.account_number,
                opening_balance: Number(a.opening_balance) || 0,
                note: a.note,
              };
              return (
                <tr key={a.id}>
                  <td className={tdCls}>
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-blue-tint text-brand-blue">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-fg">{a.name}</p>
                        {a.note && <p className="truncate text-xs text-fg-muted">{a.note}</p>}
                      </div>
                    </div>
                  </td>
                  <td className={tdCls}>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
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
                  <td className={`${tdCls} text-right`}>
                    <AccountForm account={editable} />
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
