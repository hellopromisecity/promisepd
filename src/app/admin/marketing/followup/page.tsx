import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, ArrowLeft, Megaphone, Inbox, ListChecks } from "lucide-react";
import { getCurrentUser, isManager, isStaff, STAFF_ROLES } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import { PROJECTS } from "@/lib/site";
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
import AddFollowupForm, {
  type StaffOption,
  type ProjectOption,
} from "../AddFollowupForm";
import FollowupTable, { type FollowupItem } from "../FollowupTable";
import { STATUS_META, FOLLOWUP_STATUSES, type FollowupStatus } from "../status";
import ConvertLeadButton from "../ConvertLeadButton";

export const metadata: Metadata = {
  title: "Client follow-up",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

type FollowupRecord = FollowupItem;
type RecentSubmission = { id: string; name: string; interest: string | null; created_at: string };
type Submission = { id: string; name: string; phone: string | null; interest: string | null; created_at: string };

/** Dedup key — same person if name + digits-only mobile match. */
const leadKey = (name: string | null, mobile: string | null) =>
  `${(name || "").trim().toLowerCase()}|${(mobile || "").replace(/\D/g, "")}`;

export default async function FollowupPage() {
  const me = await getCurrentUser();
  if (!me || !isStaff(me.role)) redirect("/account");

  const admin = getAdmin();
  if (!admin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Client follow-up" subtitle="Track every lead to close." />
        <EmptyState icon={Users} title="Data unavailable" message="Supabase isn't configured." />
      </div>
    );
  }

  const canSeeAll = isManager(me.role);

  let query = admin
    .from("client_followups")
    .select("id, client_name, mobile, interest, status, next_followup, assigned_to, created_by, created_at")
    .order("next_followup", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (!canSeeAll) {
    query = query.or(`created_by.eq.${me.id},assigned_to.eq.${me.id}`);
  }

  const [followupsRes, staffRes, subsRes] = await Promise.all([
    query,
    admin.from("profiles").select("id, name").in("role", STAFF_ROLES).order("name", { ascending: true }),
    admin.from("contact_submissions").select("id, name, phone, interest, created_at").order("created_at", { ascending: false }),
  ]);

  const followups = (followupsRes.data ?? []) as FollowupRecord[];
  const staff: StaffOption[] = (staffRes.data ?? []).map((p) => ({ id: p.id, name: p.name || "Unnamed" }));
  const projects: ProjectOption[] = PROJECTS.map((p) => ({ slug: p.slug, name: p.name }));
  const subs = (subsRes.data ?? []) as Submission[];
  const recent: RecentSubmission[] = subs.slice(0, 8).map((s) => ({ id: s.id, name: s.name, interest: s.interest, created_at: s.created_at }));

  // Pipeline counts from the (role-scoped) follow-ups (per record).
  const counts: Record<FollowupStatus, number> = {
    new: 0, contacted: 0, interested: 0, negotiation: 0, closed_won: 0, closed_lost: 0,
  };
  for (const f of followups) {
    const s = f.status as FollowupStatus;
    if (s in counts) counts[s] += 1;
  }
  const maxCount = Math.max(1, ...Object.values(counts));

  // Unique-people counts (dedupe by name + mobile across enquiries + follow-ups).
  const inboundUnique = new Set(subs.map((s) => leadKey(s.name, s.phone))).size;
  const trackedUnique = new Set(followups.map((f) => leadKey(f.client_name, f.mobile))).size;
  const totalLeads = new Set([
    ...subs.map((s) => leadKey(s.name, s.phone)),
    ...followups.map((f) => leadKey(f.client_name, f.mobile)),
  ]).size;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client follow-up"
        subtitle={
          canSeeAll
            ? "Every lead in the pipeline — assign, update, and close."
            : "Your assigned and created leads."
        }
        action={<AddFollowupForm staff={staff} projects={projects} />}
      />

      <Link
        href="/admin/marketing"
        className="inline-flex items-center gap-1 text-sm font-semibold text-fg-muted transition-colors hover:text-brand-blue"
      >
        <ArrowLeft className="h-4 w-4" /> Marketing overview
      </Link>

      {/* Lead KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total leads" value={totalLeads.toLocaleString("en-US")} sub="unique people" icon={Megaphone} />
        <StatCard label="Inbound enquiries" value={inboundUnique.toLocaleString("en-US")} sub="unique, from the form" icon={Inbox} tone="neutral" />
        <StatCard label="Tracked follow-ups" value={trackedUnique.toLocaleString("en-US")} sub="unique in pipeline" icon={Users} tone="info" />
        <StatCard label="Closed won" value={counts.closed_won.toLocaleString("en-US")} sub="deals secured" icon={ListChecks} tone="success" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Pipeline by status */}
        <Card>
          <h2 className="mb-4 text-sm font-bold text-fg">Pipeline by status</h2>
          {followups.length === 0 ? (
            <p className="py-6 text-center text-sm text-fg-muted">No follow-ups yet — convert an enquiry to get started.</p>
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
                      <div className="h-2 rounded-full bg-brand-blue" style={{ width: `${pct}%` }} />
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
                  <th className={thCls}><span className="sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id}>
                    <td className={tdCls}><span className="font-semibold text-fg">{r.name || "Unknown"}</span></td>
                    <td className={tdCls}>{r.interest || <span className="text-fg-faint">General enquiry</span>}</td>
                    <td className={tdCls}>{fmtDate(r.created_at)}</td>
                    <td className={`${tdCls} text-right`}><ConvertLeadButton submissionId={r.id} /></td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          )}
        </Card>
      </div>

      {/* Follow-up pipeline — searchable / sortable / paginated grid + delete */}
      {followups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No follow-ups yet"
          message={
            canSeeAll
              ? "Add a follow-up, or convert an inbound enquiry above."
              : "Nothing assigned to you yet. Add a follow-up to get started."
          }
        />
      ) : (
        <FollowupTable items={followups} staff={staff} canSeeAll={canSeeAll} meId={me.id} />
      )}
    </div>
  );
}
