import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, ArrowLeft } from "lucide-react";
import { getCurrentUser, isManager, isStaff, STAFF_ROLES } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import { PROJECTS } from "@/lib/site";
import {
  PageHeader,
  EmptyState,
  TableShell,
  thCls,
} from "@/components/admin/ui";
import AddFollowupForm, {
  type StaffOption,
  type ProjectOption,
} from "../AddFollowupForm";
import FollowupRow, { type FollowupRowData } from "../FollowupRow";

export const metadata: Metadata = {
  title: "Client follow-up",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type FollowupRecord = FollowupRowData & {
  created_by: string | null;
};

export default async function FollowupPage() {
  const me = await getCurrentUser();
  if (!me || !isStaff(me.role)) redirect("/account");

  const admin = getAdmin();
  if (!admin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Client follow-up" subtitle="Track every lead to close." />
        <EmptyState
          icon={Users}
          title="Data unavailable"
          message="Supabase isn't configured."
        />
      </div>
    );
  }

  const canSeeAll = isManager(me.role);

  // Build the follow-ups query.  Managers/admins see every row; plain staff
  // see only rows they created or are assigned to.
  let query = admin
    .from("client_followups")
    .select(
      "id, client_name, mobile, interest, status, next_followup, assigned_to, created_by",
    )
    .order("next_followup", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (!canSeeAll) {
    query = query.or(`created_by.eq.${me.id},assigned_to.eq.${me.id}`);
  }

  const [followupsRes, staffRes] = await Promise.all([
    query,
    admin
      .from("profiles")
      .select("id, name")
      .in("role", STAFF_ROLES)
      .order("name", { ascending: true }),
  ]);

  const followups = (followupsRes.data ?? []) as FollowupRecord[];
  const staff: StaffOption[] = (staffRes.data ?? []).map((p) => ({
    id: p.id,
    name: p.name || "Unnamed",
  }));
  const projects: ProjectOption[] = PROJECTS.map((p) => ({
    slug: p.slug,
    name: p.name,
  }));

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

      {followups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No follow-ups yet"
          message={
            canSeeAll
              ? "Add a follow-up, or convert an inbound enquiry from the overview."
              : "Nothing assigned to you yet. Add a follow-up to get started."
          }
        />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <th className={thCls}>Client</th>
              <th className={thCls}>Mobile</th>
              <th className={thCls}>Interest</th>
              <th className={thCls}>Status</th>
              <th className={thCls}>Next follow-up</th>
              <th className={thCls}>Assigned to</th>
            </tr>
          </thead>
          <tbody>
            {followups.map((row) => {
              const owns = row.created_by === me.id || row.assigned_to === me.id;
              const editable = canSeeAll || owns;
              return (
                <FollowupRow
                  key={row.id}
                  row={{
                    id: row.id,
                    client_name: row.client_name,
                    mobile: row.mobile,
                    interest: row.interest,
                    status: row.status,
                    next_followup: row.next_followup,
                    assigned_to: row.assigned_to,
                  }}
                  staff={staff}
                  editable={editable}
                />
              );
            })}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}
