import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  BarChart3, Users, UserPlus, Activity, Eye, Clock, CalendarDays,
  Globe, FileText, Search, CheckCircle2, XCircle, KeyRound,
} from "lucide-react";
import { getCurrentUser, isManager } from "@/lib/auth";
import { PageHeader, Card, StatCard, EmptyState } from "@/components/admin/ui";
import { analyticsConfigured, getAnalytics, RANGE_LABELS, type DateRange } from "@/lib/analytics";
import RangeSelect from "./RangeSelect";

export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const fmt = (n: number) => n.toLocaleString("en-US");

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) redirect("/account");

  const sp = await searchParams;
  const range = (Object.keys(RANGE_LABELS).includes(sp.range ?? "") ? sp.range : "30d") as DateRange;

  // Not configured → show the connect / setup card.
  if (!analyticsConfigured()) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" subtitle="Google Analytics 4 & Search Console." />
        <Card>
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-blue-tint text-brand-blue"><KeyRound className="h-5 w-5" /></span>
            <div>
              <h2 className="text-base font-bold text-fg">Connect Google Analytics</h2>
              <p className="mt-1 text-sm text-fg-muted">Tracking is already live on the site. To show live numbers here, add a Google service account (read-only):</p>
              <ol className="mt-3 space-y-1.5 text-sm text-fg-muted">
                <li>1. Google Cloud → create a service account; enable <b>Analytics Data API</b> + <b>Search Console API</b>.</li>
                <li>2. GA4 → Admin → Property access → add the service-account email as <b>Viewer</b>. Note the numeric <b>Property ID</b>.</li>
                <li>3. Search Console → Settings → Users → add the same email.</li>
                <li>4. Add these env vars on Vercel, then redeploy:</li>
              </ol>
              <pre className="mt-3 overflow-x-auto rounded-xl bg-bg-soft p-3 text-xs text-fg">{`GA4_PROPERTY_ID=123456789
GOOGLE_CLIENT_EMAIL=...@...iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
SEARCH_CONSOLE_SITE_URL=https://promisecity.vercel.app/`}</pre>
              <p className="mt-3 text-xs text-fg-faint">Once these are set, this page automatically shows Users, Sessions, Top pages, Countries and Search Console data.</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const data = await getAnalytics(range);
  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" subtitle="Google Analytics 4 & Search Console." action={<RangeSelect value={range} />} />
        <EmptyState icon={XCircle} title="Couldn't load analytics" message="The service account is set but the API call failed — check the credentials, Property ID and that the account has access." />
      </div>
    );
  }

  const maxDaily = Math.max(1, ...data.daily.map((d) => d.users));
  const W = 760, H = 150, pad = 6;
  const bw = data.daily.length ? (W - pad * 2) / data.daily.length : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Live data from Google Analytics & Search Console."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> GA4</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${data.searchConsole ? "bg-emerald-50 text-emerald-700" : "bg-bg-soft text-fg-muted"}`}>
              {data.searchConsole ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />} Search Console
            </span>
            <RangeSelect value={range} />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Users" value={fmt(data.totals.users)} sub={RANGE_LABELS[range]} icon={Users} />
        <StatCard label="New users" value={fmt(data.totals.newUsers)} sub={RANGE_LABELS[range]} icon={UserPlus} tone="success" />
        <StatCard label="Sessions" value={fmt(data.totals.sessions)} sub={RANGE_LABELS[range]} icon={Activity} tone="info" />
        <StatCard label="Page views" value={fmt(data.totals.pageViews)} sub={RANGE_LABELS[range]} icon={Eye} tone="neutral" />
        <StatCard label="Today" value={fmt(data.today)} sub="active users" icon={Clock} tone="warning" />
        <StatCard label="Last 7 days" value={fmt(data.last7)} sub="active users" icon={CalendarDays} />
      </div>

      {/* Daily active users chart */}
      <Card>
        <div className="mb-3 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-brand-blue" /><h2 className="text-sm font-bold text-fg">Daily active users — {RANGE_LABELS[range]}</h2></div>
        {data.daily.length === 0 ? (
          <p className="py-8 text-center text-sm text-fg-muted">No data for this range yet.</p>
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} className="h-[150px] w-full" preserveAspectRatio="none" role="img" aria-label="Daily active users">
            {data.daily.map((d, i) => {
              const h = (d.users / maxDaily) * (H - pad * 2);
              return <rect key={i} x={pad + i * bw + bw * 0.12} y={H - pad - h} width={bw * 0.76} height={Math.max(1, h)} rx="2" fill="#1847A1" opacity={0.85} />;
            })}
          </svg>
        )}
      </Card>

      {/* Top pages + countries */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RankList title="Top 25 Pages" sub="by pageviews" icon={FileText} rows={data.topPages.map((p) => ({ key: p.path, label: p.title || p.path, hint: p.path, value: p.views }))} />
        <RankList title="Top 25 Countries" sub="by active users" icon={Globe} rows={data.topCountries.map((c) => ({ key: c.country, label: c.country || "(not set)", value: c.users }))} />
      </div>

      {/* Search Console */}
      {data.searchConsole && (
        <div className="grid gap-4 lg:grid-cols-2">
          <RankList title="Top 25 Search Keywords" sub="Google Search Console" icon={Search} rows={data.topQueries.map((q) => ({ key: q.query, label: q.query, value: q.clicks, extra: `${q.impressions} imp · ${(q.ctr * 100).toFixed(1)}% · #${q.position.toFixed(1)}` }))} />
          <RankList title="Top 25 Search Pages" sub="by clicks" icon={FileText} rows={data.topSearchPages.map((p) => ({ key: p.page, label: p.page.replace(/^https?:\/\/[^/]+/, "") || "/", value: p.clicks, extra: `${p.impressions} imp · #${p.position.toFixed(1)}` }))} />
        </div>
      )}
    </div>
  );
}

function RankList({
  title, sub, icon: Icon, rows,
}: {
  title: string; sub: string; icon: typeof Globe;
  rows: { key: string; label: string; hint?: string; value: number; extra?: string }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <Card pad={false}>
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-brand-blue" /><h2 className="text-sm font-bold text-fg">{title}</h2></div>
        <span className="text-xs text-fg-faint">{sub}</span>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 pb-6 text-center text-sm text-fg-muted">No data yet.</p>
      ) : (
        <ul className="divide-y divide-border/60 border-t border-border">
          {rows.map((r, i) => (
            <li key={r.key + i} className="px-5 py-2.5">
              <div className="flex items-center gap-3">
                <span className="w-6 shrink-0 text-xs font-bold text-fg-faint">#{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-fg">{r.label}</div>
                  {(r.hint || r.extra) && <div className="truncate text-xs text-fg-faint">{r.hint ?? r.extra}</div>}
                  <div className="mt-1 h-1 rounded-full bg-bg-soft"><div className="h-1 rounded-full bg-brand-blue" style={{ width: `${(r.value / max) * 100}%` }} /></div>
                </div>
                <span className="shrink-0 text-sm font-bold text-fg">{r.value.toLocaleString("en-US")}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
