import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { getCurrentUser, isManager } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import { PageHeader, Card, EmptyState } from "@/components/admin/ui";
import ReportForm from "@/app/dashboard/insights/ReportForm";
import ReportView, { type Report } from "./ReportView";

export const metadata: Metadata = { title: "Report", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ReportPage() {
  const me = await getCurrentUser();
  if (!me || !["staff", "manager", "admin"].includes(me.role)) redirect("/account");

  const canSeeAll = isManager(me.role);
  const admin = getAdmin();

  let reports: Report[] = [];
  let staff: { id: string; name: string }[] = [];

  if (admin) {
    let q = admin
      .from("daily_reports")
      .select("id, member_id, report_date, body, created_at")
      .order("report_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(3000);
    if (!canSeeAll) q = q.eq("member_id", me.id);
    const { data } = await q;
    reports = (data ?? []) as Report[];

    if (canSeeAll) {
      const ids = [...new Set(reports.map((r) => r.member_id))];
      const nameById = new Map<string, string>();
      if (ids.length) {
        const { data: profs } = await admin.from("profiles").select("id, name").in("id", ids);
        for (const p of profs ?? []) nameById.set(p.id as string, (p.name as string) ?? "Unknown");
      }
      // One tab per person who has filed reports, ordered by most-recent report.
      const seen = new Set<string>();
      for (const r of reports) {
        if (seen.has(r.member_id)) continue;
        seen.add(r.member_id);
        staff.push({ id: r.member_id, name: nameById.get(r.member_id) || "Unknown" });
      }
    } else {
      staff = [{ id: me.id, name: me.name }];
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Report"
        subtitle={canSeeAll ? "Daily reports from the whole team — one tab per person." : "Submit your daily report and review what you've shared."}
      />

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

      {!admin ? (
        <EmptyState icon={MessageSquare} title="Data unavailable" message="Supabase isn't configured, so reports can't be loaded." />
      ) : (
        <ReportView reports={reports} staff={staff} canSeeAll={canSeeAll} meId={me.id} />
      )}
    </div>
  );
}
