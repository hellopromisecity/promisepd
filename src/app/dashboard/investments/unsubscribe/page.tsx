import { redirect } from "next/navigation";
import { UserMinus, Clock, CheckCheck } from "lucide-react";
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
  type Tone,
} from "@/components/admin/ui";
import { listUnsubscribe, nameMaps, fmtDate, type UnsubscribeRequest } from "@/lib/investments";

export const dynamic = "force-dynamic";

export const metadata = { title: "Unsubscribe Requests", robots: { index: false } };

function statusTone(s: string): Tone {
  const v = s.toLowerCase();
  if (v === "pending") return "warning";
  if (v.includes("approve") || v.includes("done") || v.includes("complete")) return "success";
  if (v.includes("reject") || v.includes("decline")) return "danger";
  return "neutral";
}

export default async function UnsubscribePage() {
  const me = await getCurrentUser();
  if (!me || !isAdmin(me.role)) redirect("/account");

  const admin = getAdmin();
  if (!admin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Unsubscribe Requests" subtitle="Investors asking to exit a project." />
        <EmptyState icon={UserMinus} title="Data unavailable" message="Supabase isn’t configured." />
      </div>
    );
  }

  const [reqs, maps] = await Promise.all([listUnsubscribe(admin), nameMaps(admin)]);
  const pending = reqs.filter((r) => r.status.toLowerCase() === "pending").length;
  const reviewed = reqs.length - pending;

  return (
    <div className="space-y-6">
      <PageHeader title="Unsubscribe Requests" subtitle={`${reqs.length} requests ported from the app.`} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Requests" value={reqs.length} sub="total" icon={UserMinus} tone="info" />
        <StatCard label="Pending" value={pending} sub="awaiting review" icon={Clock} tone="warning" />
        <StatCard label="Reviewed" value={reviewed} sub="actioned" icon={CheckCheck} tone="success" />
      </div>

      {reqs.length === 0 ? (
        <EmptyState icon={UserMinus} title="No requests" message="Unsubscribe requests will appear here." />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <th className={thCls}>Investor</th>
              <th className={thCls}>Project</th>
              <th className={thCls}>Status</th>
              <th className={thCls}>Requested</th>
              <th className={thCls}>Reviewed</th>
              <th className={thCls}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {reqs.map((r: UnsubscribeRequest) => (
              <tr key={r.id}>
                <td className={tdCls}>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-fg">{maps.investorName.get(r.uid) || r.uid}</p>
                    <p className="truncate text-[11px] text-fg-faint">{maps.investorPhone.get(r.uid) || ""}</p>
                  </div>
                </td>
                <td className={`${tdCls} text-fg-muted`}>{maps.projectName.get(r.project_id) || r.project_id}</td>
                <td className={tdCls}>
                  <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                </td>
                <td className={`${tdCls} whitespace-nowrap text-fg-muted`}>{fmtDate(r.requested_at)}</td>
                <td className={`${tdCls} whitespace-nowrap text-fg-muted`}>
                  {r.reviewed_at ? `${fmtDate(r.reviewed_at)}${r.reviewed_by ? ` · ${r.reviewed_by}` : ""}` : "—"}
                </td>
                <td className={`${tdCls} text-fg-muted`}>{r.admin_notes || "—"}</td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}
