import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Megaphone, ListChecks } from "lucide-react";
import { getCurrentUser, isManager } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import { PageHeader, EmptyState } from "@/components/admin/ui";
import MarketingOfficers, { type Officer, type PointItem, type Entry } from "./MarketingOfficers";

export const metadata: Metadata = {
  title: "Marketing",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function MarketingOverviewPage() {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) redirect("/account");

  const followupsLink = (
    <Link
      href="/admin/marketing/followup"
      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-brand-blue/40"
    >
      <ListChecks className="h-4 w-4" /> Client follow-up
    </Link>
  );

  const admin = getAdmin();
  if (!admin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Marketing" subtitle="Officer leaderboard." action={followupsLink} />
        <EmptyState icon={Megaphone} title="Data unavailable" message="Supabase isn't configured." />
      </div>
    );
  }

  // Point entries from the last ~2 years feed the date-range filter
  // (last 30 days / this year / last year); lifetime uses officer totals.
  const since = new Date();
  since.setFullYear(since.getFullYear() - 2);

  const [officersRes, itemsRes, entriesRes] = await Promise.all([
    admin
      .from("marketing_officers")
      .select("id, name, officer_type, position, district, officer_code, mobile, points, afr_total, income_total")
      .order("points", { ascending: false }),
    admin
      .from("marketing_point_items")
      .select("id, label, points, afr, income")
      .eq("active", true)
      .order("sort", { ascending: true })
      .order("created_at", { ascending: true }),
    admin
      .from("marketing_point_entries")
      .select("officer_id, points, afr, income, created_at")
      .gte("created_at", since.toISOString()),
  ]);

  // numeric columns arrive as strings from PostgREST — coerce to numbers.
  const officers: Officer[] = (officersRes.data ?? []).map((o) => ({
    id: o.id, name: o.name, officer_type: o.officer_type, position: o.position,
    district: o.district, officer_code: o.officer_code, mobile: o.mobile,
    points: Number(o.points) || 0, afr: Number(o.afr_total) || 0, income: Number(o.income_total) || 0,
  }));
  const items: PointItem[] = (itemsRes.data ?? []).map((i) => ({
    id: i.id, label: i.label, points: Number(i.points) || 0, afr: Number(i.afr) || 0, income: Number(i.income) || 0,
  }));
  const entries: Entry[] = (entriesRes.data ?? []).map((e) => ({
    officer_id: e.officer_id, points: Number(e.points) || 0, afr: Number(e.afr) || 0, income: Number(e.income) || 0, created_at: e.created_at,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing"
        subtitle="Officer leaderboard — ranked by points. Add officers and award points per sale."
        action={followupsLink}
      />
      <MarketingOfficers officers={officers} items={items} entries={entries} />
    </div>
  );
}
