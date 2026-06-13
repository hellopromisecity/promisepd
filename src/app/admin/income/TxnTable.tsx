"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Badge, TableShell, thCls, tdCls } from "@/components/admin/ui";
import { deleteTransaction } from "@/app/actions/admin-finance";
import { confirmDialog } from "@/components/ui/Dialog";
import { toast } from "@/components/ui/Toast";

export type TxnListRow = {
  id: string;
  type: string;
  amount: number;
  category: string;
  txn_date: string;
  party: string | null;
  project_slug: string | null;
  method: string | null;
  description: string | null;
};

const labelCls = "mb-1 block text-xs font-semibold text-fg-muted";
const inputCls =
  "rounded-xl border border-border bg-bg-soft px-3 py-2 text-sm outline-none focus:border-brand-blue/50";

function taka(amount: number): string {
  return `৳${Math.round(Number(amount) || 0).toLocaleString("en-US")}`;
}
function fmtDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Transactions table with a month filter (bonus) and per-row delete.
 *  `projectNames` maps slug → display name. */
export default function TxnTable({
  rows,
  type,
  projectNames,
}: {
  rows: TxnListRow[];
  type: "income" | "expense";
  projectNames: Record<string, string>;
}) {
  const router = useRouter();
  const [month, setMonth] = useState<string>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, start] = useTransition();

  // Distinct YYYY-MM present in the data, newest first.
  const months = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) if (r.txn_date) set.add(r.txn_date.slice(0, 7));
    return Array.from(set).sort().reverse();
  }, [rows]);

  const filtered = useMemo(
    () => (month === "all" ? rows : rows.filter((r) => r.txn_date?.startsWith(month))),
    [rows, month],
  );

  const total = filtered.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  function monthLabel(ym: string): string {
    const [y, m] = ym.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });
  }

  async function remove(id: string) {
    const ok = await confirmDialog({ title: "Delete transaction", message: "Delete this transaction? This can’t be undone.", confirmText: "Delete", danger: true });
    if (!ok) return;
    setPendingId(id);
    start(async () => {
      const res = await deleteTransaction(id);
      setPendingId(null);
      if (res.ok) router.refresh();
      else toast(res.error, "error");
    });
  }

  const amountTone = type === "income" ? "text-emerald-700" : "text-brand-red-dark";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <label className={labelCls} htmlFor="month-filter">
            Filter by month
          </label>
          <select
            id="month-filter"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className={inputCls}
          >
            <option value="all">All months</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-fg-muted">
          {filtered.length} {filtered.length === 1 ? "entry" : "entries"} ·{" "}
          <span className={`font-bold ${amountTone}`}>{taka(total)}</span>
        </p>
      </div>

      <TableShell>
        <thead>
          <tr>
            <th className={`${thCls} text-right`}>Amount</th>
            <th className={thCls}>Category</th>
            <th className={thCls}>Account / project</th>
            <th className={thCls}>Party</th>
            <th className={thCls}>Method</th>
            <th className={thCls}>Date</th>
            <th className={`${thCls} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td className={`${tdCls} text-center text-fg-muted`} colSpan={7}>
                No {type} entries for this period.
              </td>
            </tr>
          ) : (
            filtered.map((r) => (
              <tr key={r.id}>
                <td className={`${tdCls} text-right font-bold ${amountTone}`}>{taka(r.amount)}</td>
                <td className={tdCls}>{r.category}</td>
                <td className={tdCls}>
                  {r.project_slug ? (
                    <Badge tone="info">{projectNames[r.project_slug] ?? r.project_slug}</Badge>
                  ) : (
                    <span className="text-fg-faint">—</span>
                  )}
                </td>
                <td className={`${tdCls} text-fg-muted`}>{r.party || "—"}</td>
                <td className={`${tdCls} text-fg-muted`}>{r.method || "—"}</td>
                <td className={`${tdCls} text-fg-muted`}>{fmtDate(r.txn_date)}</td>
                <td className={`${tdCls} text-right`}>
                  <button
                    type="button"
                    onClick={() => remove(r.id)}
                    disabled={pendingId === r.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-bg px-2.5 py-1.5 text-xs font-semibold text-fg transition-colors hover:border-brand-red/40 hover:text-brand-red-dark disabled:opacity-50"
                    aria-label="Delete transaction"
                  >
                    {pendingId === r.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableShell>
    </div>
  );
}
