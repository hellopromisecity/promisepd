import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { getCurrentUser, isManager, isSuperAdmin } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import { PageHeader, Card, EmptyState } from "@/components/admin/ui";
import ReportForm from "@/app/dashboard/insights/ReportForm";
import ReportView, { type Report, type Staff } from "./ReportView";
import ReportLeaderboard, { PersonalStats } from "./ReportLeaderboard";
import { todayBD, type TeamMember } from "./leaderboard";

export const metadata: Metadata = { title: "Report", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Prof = { id: string; name: string | null; role: string | null; avatar_url: string | null; email: string | null; mobile: string | null };
const PROF_COLS = "id, name, role, avatar_url, email, mobile";

export default async function ReportPage() {
  const me = await getCurrentUser();
  if (!me || !["staff", "manager", "admin"].includes(me.role)) redirect("/account");

  const canSeeAll = isManager(me.role);
  // The MD — the env-designated owner account — reads the reports, he doesn't
  // file them, so no submit box for him (the owner's ask, 2026-11-03). The
  // rule is "owner", not "admin": Tarek, Helal and Rashedul are admins too and
  // they do file.
  const canSubmit = !me.isOwner;
  const admin = getAdmin();

  let reports: Report[] = [];
  let staff: Staff[] = [];
  let team: TeamMember[] = [];

  if (admin) {
    let q = admin
      .from("daily_reports")
      .select("id, member_id, report_date, body, created_at")
      .order("report_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6000);
    if (!canSeeAll) q = q.eq("member_id", me.id);
    const { data } = await q;
    reports = (data ?? []) as Report[];

    if (canSeeAll) {
      // The people expected to report: every staff login (staff, manager,
      // admin) except the owner — plus anyone else who has filed, so no
      // author is ever lost from the tabs.
      const byId = new Map<string, TeamMember>();
      const put = (p: Prof) => {
        if (isSuperAdmin(p.email ?? null, p.mobile ?? "")) return; // the MD is the reader, not a reporter
        byId.set(p.id, { id: p.id, name: p.name || "Unknown", role: p.role || "staff", avatarUrl: p.avatar_url || null });
      };
      const { data: profs } = await admin.from("profiles").select(PROF_COLS).neq("role", "member");
      for (const p of (profs ?? []) as Prof[]) put(p);
      const missing = [...new Set(reports.map((r) => r.member_id))].filter((id) => !byId.has(id));
      if (missing.length) {
        const { data: extra } = await admin.from("profiles").select(PROF_COLS).in("id", missing);
        for (const p of (extra ?? []) as Prof[]) put(p);
      }
      team = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
      // One tab per person who has filed reports, ordered by most-recent report.
      const seen = new Set<string>();
      for (const r of reports) {
        if (seen.has(r.member_id)) continue;
        seen.add(r.member_id);
        const m = byId.get(r.member_id);
        staff.push({ id: r.member_id, name: m?.name || "Unknown", avatarUrl: m?.avatarUrl ?? null });
      }
    } else {
      staff = [{ id: me.id, name: me.name, avatarUrl: me.avatarUrl }];
      team = [{ id: me.id, name: me.name, role: me.role, avatarUrl: me.avatarUrl }];
    }
  }

  const today = todayBD();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Report"
        subtitle={canSeeAll ? "Daily reports from the whole team — who files, how promptly, and what they wrote." : "Submit your daily report and review what you've shared."}
      />

      {canSubmit && (
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-blue-tint text-brand-blue">
              <MessageSquare className="h-[18px] w-[18px]" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-fg">Submit today&apos;s report</h2>
              <p className="text-xs text-fg-muted">A quick note on what you got done.</p>
            </div>
          </div>
          <ReportForm />
        </Card>
      )}

      {!admin ? (
        <EmptyState icon={MessageSquare} title="Data unavailable" message="Supabase isn't configured, so reports can't be loaded." />
      ) : (
        <>
          {canSeeAll ? (
            <ReportLeaderboard team={team} reports={reports} today={today} />
          ) : (
            team[0] && <PersonalStats me={team[0]} reports={reports} today={today} />
          )}
          <ReportView reports={reports} staff={staff} canSeeAll={canSeeAll} meId={me.id} />
        </>
      )}
    </div>
  );
}
