import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Activity, LogIn, ScrollText } from "lucide-react";
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
  type Tone,
} from "@/components/admin/ui";
import AuditFilter from "../AuditFilter";

export const metadata: Metadata = {
  title: "Audit log",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type LogRow = {
  id: string;
  actor_name: string | null;
  action: string;
  entity: string;
  detail: string | null;
  created_at: string;
};

/** Distinct values we offer in the filter selects.  Kept stable so the
 *  dropdowns don't shift around as data changes. */
const ACTIONS = ["create", "update", "delete", "login", "logout", "export"];
const ENTITIES = [
  "daily_report",
  "transaction",
  "finance_account",
  "client_followup",
  "attendance",
  "blog_post",
  "project",
  "profile",
  "org_setting",
  "auth",
];

function actionTone(action: string): Tone {
  const a = action.toLowerCase();
  if (a.includes("delete")) return "danger";
  if (a.includes("create") || a.includes("login")) return "success";
  if (a.includes("update") || a.includes("export")) return "info";
  if (a.includes("logout")) return "warning";
  return "neutral";
}

const fmtTime = (d: string) =>
  new Date(d).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; entity?: string }>;
}) {
  const me = await getCurrentUser();
  if (!me || !isAdmin(me.role)) redirect("/account");

  const sp = await searchParams;
  const action = (sp.action ?? "").trim();
  const entity = (sp.entity ?? "").trim();

  const admin = getAdmin();
  if (!admin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Audit log" subtitle="Who did what, across the dashboard." />
        <EmptyState
          icon={ScrollText}
          title="Data unavailable"
          message="Supabase isn't configured, so the audit log can't be loaded."
        />
      </div>
    );
  }

  // Total events + today's logins (independent of the active filter).
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayIso = startOfToday.toISOString();

  const [{ count: totalEvents }, { count: loginsToday }] = await Promise.all([
    admin.from("audit_logs").select("*", { count: "exact", head: true }),
    admin
      .from("audit_logs")
      .select("*", { count: "exact", head: true })
      .eq("action", "login")
      .gte("created_at", todayIso),
  ]);

  // Filtered rows, newest first, capped at 100.
  let query = admin
    .from("audit_logs")
    .select("id, actor_name, action, entity, detail, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (action) query = query.eq("action", action);
  if (entity) query = query.eq("entity", entity);

  const { data } = await query;
  const rows = (data ?? []) as LogRow[];

  return (
    <div className="space-y-6">
      <PageHeader title="Audit log" subtitle="Who did what, across the dashboard." />

      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <StatCard
          label="Total events"
          value={(totalEvents ?? 0).toLocaleString("en-US")}
          sub="all time"
          icon={Activity}
          tone="info"
        />
        <StatCard
          label="Logins today"
          value={(loginsToday ?? 0).toLocaleString("en-US")}
          sub="since midnight"
          icon={LogIn}
          tone="success"
        />
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <AuditFilter actions={ACTIONS} entities={ENTITIES} action={action} entity={entity} />
        <span className="text-xs text-fg-faint">
          {rows.length === 100 ? "Showing latest 100" : `${rows.length} event${rows.length === 1 ? "" : "s"}`}
        </span>
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No events found"
          message={
            action || entity
              ? "No audit events match this filter. Try clearing it."
              : "Activity will appear here as the team uses the dashboard."
          }
        />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <th className={thCls}>Time</th>
              <th className={thCls}>Actor</th>
              <th className={thCls}>Action</th>
              <th className={thCls}>Entity</th>
              <th className={thCls}>Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className={`${tdCls} whitespace-nowrap text-fg-muted`}>{fmtTime(r.created_at)}</td>
                <td className={`${tdCls} font-semibold`}>{r.actor_name || "System"}</td>
                <td className={tdCls}>
                  <Badge tone={actionTone(r.action)}>{r.action}</Badge>
                </td>
                <td className={`${tdCls} capitalize text-fg-muted`}>{r.entity.replace(/_/g, " ")}</td>
                <td className={`${tdCls} text-fg-muted`}>{r.detail || "—"}</td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}
