import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Megaphone,
  Users,
  Inbox,
  ListChecks,
  ArrowRight,
} from "lucide-react";
import { getCurrentUser, isManager } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import {
  PageHeader,
  StatCard,
  Card,
  Badge,
  EmptyState,
  TableShell,
  thCls,
  tdCls,
} from "@/components/admin/ui";
import { STATUS_META, FOLLOWUP_STATUSES, type FollowupStatus } from "./status";
import ConvertLeadButton from "./ConvertLeadButton";

export const metadata: Metadata = {
  title: "Marketing",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

type RecentSubmission = {
  id: string;
  name: string;
  interest: string | null;
  created_at: string;
};

export default async function MarketingOverviewPage() {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) redirect("/account");

  const admin = getAdmin();
  if (!admin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Marketing" subtitle="Leads and client follow-ups." />
        <EmptyState
          icon={Megaphone}
          title="Data unavailable"
          message="Supabase isn't configured."
        />
      </div>
    );
  }

  // Count inbound submissions + tracked follow-ups, the status breakdown, and
  // the most recent contact submissions — all in parallel.
  const [submissionsCountRes, followupsCountRes, statusRowsRes, recentRes] =
    await Promise.all([
      admin.from("contact_submissions").select("*", { count: "exact", head: true }),
      admin.from("client_followups").select("*", { count: "exact", head: true }),
      admin.from("client_followups").select("status"),
      admin
        .from("contact_submissions")
        .select("id, name, interest, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  const submissionsCount = submissionsCountRes.count ?? 0;
  const followupsCount = followupsCountRes.count ?? 0;
  const totalLeads = submissionsCount + followupsCount;

  // Tally follow-ups by status.
  const counts: Record<FollowupStatus, number> = {
    new: 0,
    contacted: 0,
    interested: 0,
    negotiation: 0,
    closed_won: 0,
    closed_lost: 0,
  };
  for (const r of statusRowsRes.data ?? []) {
    const s = r.status as FollowupStatus;
    if (s in counts) counts[s] += 1;
  }
  const maxCount = Math.max(1, ...Object.values(counts));

  const recent = (recentRes.data ?? []) as RecentSubmission[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing"
        subtitle="Leads and client follow-ups across every channel."
        action={
          <Link
            href="/admin/marketing/followup"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-brand-blue/40"
          >
            <ListChecks className="h-4 w-4" /> Manage follow-ups
          </Link>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total leads"
          value={totalLeads.toLocaleString("en-US")}
          sub="enquiries + follow-ups"
          icon={Megaphone}
        />
        <StatCard
          label="Inbound enquiries"
          value={submissionsCount.toLocaleString("en-US")}
          sub="from the contact form"
          icon={Inbox}
          tone="neutral"
        />
        <StatCard
          label="Tracked follow-ups"
          value={followupsCount.toLocaleString("en-US")}
          sub="in the pipeline"
          icon={Users}
          tone="info"
        />
        <StatCard
          label="Closed won"
          value={counts.closed_won.toLocaleString("en-US")}
          sub="deals secured"
          icon={ListChecks}
          tone="success"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Pipeline by status */}
        <Card>
          <h2 className="mb-4 text-sm font-bold text-fg">Pipeline by status</h2>
          {followupsCount === 0 ? (
            <p className="py-6 text-center text-sm text-fg-muted">
              No follow-ups yet — convert an enquiry below to get started.
            </p>
          ) : (
            <div className="space-y-3.5">
              {FOLLOWUP_STATUSES.map((s) => {
                const meta = STATUS_META[s];
                const n = counts[s];
                const pct = Math.round((n / maxCount) * 100);
                return (
                  <div key={s}>
                    <div className="mb-1 flex items-center justify-between text-[13px]">
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                      <span className="shrink-0 font-semibold text-fg-muted">{n}</span>
                    </div>
                    <div className="h-2 rounded-full bg-bg-soft">
                      <div
                        className="h-2 rounded-full bg-brand-blue"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Recent inbound enquiries */}
        <Card pad={false}>
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="text-sm font-bold text-fg">Recent enquiries</h2>
            <Link
              href="/admin/marketing/followup"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline"
            >
              Follow-ups <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="px-5 pb-6 text-center text-sm text-fg-muted">
              No enquiries yet — they&apos;ll appear here from the contact form.
            </p>
          ) : (
            <TableShell>
              <thead>
                <tr>
                  <th className={thCls}>Name</th>
                  <th className={thCls}>Interest</th>
                  <th className={thCls}>Date</th>
                  <th className={thCls}>
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id}>
                    <td className={tdCls}>
                      <span className="font-semibold text-fg">{r.name || "Unknown"}</span>
                    </td>
                    <td className={tdCls}>
                      {r.interest || <span className="text-fg-faint">General enquiry</span>}
                    </td>
                    <td className={tdCls}>{fmtDate(r.created_at)}</td>
                    <td className={`${tdCls} text-right`}>
                      <ConvertLeadButton submissionId={r.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          )}
        </Card>
      </div>
    </div>
  );
}
