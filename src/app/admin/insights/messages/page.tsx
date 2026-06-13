import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MessageSquare, Inbox, User } from "lucide-react";
import { getCurrentUser, isManager } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import { PageHeader, Card, EmptyState } from "@/components/admin/ui";
import ReportForm from "../ReportForm";

export const metadata: Metadata = {
  title: "Message box",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type ReportRow = {
  id: string;
  member_id: string;
  report_date: string;
  body: string;
  created_at: string;
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default async function MessageBoxPage() {
  const me = await getCurrentUser();
  if (!me || !["staff", "manager", "admin"].includes(me.role)) redirect("/account");

  const canSeeAll = isManager(me.role);
  const admin = getAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Message box"
        subtitle={
          canSeeAll
            ? "Daily reports from the whole team — submit yours and read everyone's."
            : "Submit your daily report and review what you've shared."
        }
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
        <EmptyState
          icon={Inbox}
          title="Data unavailable"
          message="Supabase isn't configured, so reports can't be loaded."
        />
      ) : (
        <Feed admin={admin} memberId={me.id} canSeeAll={canSeeAll} />
      )}
    </div>
  );
}

async function Feed({
  admin,
  memberId,
  canSeeAll,
}: {
  admin: NonNullable<ReturnType<typeof getAdmin>>;
  memberId: string;
  canSeeAll: boolean;
}) {
  let query = admin
    .from("daily_reports")
    .select("id, member_id, report_date, body, created_at")
    .order("report_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (!canSeeAll) query = query.eq("member_id", memberId);

  const { data, error } = await query;
  const reports = (data ?? []) as ReportRow[];

  if (error || reports.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No reports yet"
        message={
          canSeeAll
            ? "When the team submits daily reports, they'll appear here newest first."
            : "Submit your first daily report above and it'll show up here."
        }
      />
    );
  }

  // For managers/admins, resolve author names with one extra query.
  const names = new Map<string, string>();
  if (canSeeAll) {
    const ids = Array.from(new Set(reports.map((r) => r.member_id)));
    if (ids.length) {
      const { data: profs } = await admin
        .from("profiles")
        .select("id, name")
        .in("id", ids);
      for (const p of profs ?? []) names.set(p.id, p.name);
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold text-fg">
        {canSeeAll ? "Team feed" : "Your reports"}
      </h2>
      {reports.map((r) => {
        const author = canSeeAll ? names.get(r.member_id) || "Unknown member" : null;
        return (
          <Card key={r.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                {canSeeAll && (
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-blue-tint text-xs font-bold text-brand-blue">
                    {(author?.[0] ?? "?").toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  {canSeeAll && (
                    <p className="flex items-center gap-1 text-sm font-semibold text-fg">
                      <User className="h-3.5 w-3.5 text-fg-faint" />
                      {author}
                    </p>
                  )}
                  <p className="text-xs text-fg-muted">{fmtDate(r.report_date)}</p>
                </div>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-fg">{r.body}</p>
          </Card>
        );
      })}
    </div>
  );
}
