import type { Metadata } from "next";
import Link from "next/link";
import {
  Building,
  Users,
  MessageSquare,
  Newspaper,
  ArrowUpRight,
  ArrowRight,
  Plus,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { PROJECTS, type Project } from "@/lib/site";
import { BLOG_POSTS } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const SAMPLE_REVENUE = [22, 26, 24, 31, 29, 38, 35, 41, 46, 44, 52, 58];
const MONTHS = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];

/** Real sell-through % per project from whatever availability data it carries. */
function sellThrough(p: Project): { sold: number; total: number; pct: number } | null {
  if (p.shareMap?.total) {
    const { sold, total } = p.shareMap;
    return { sold, total, pct: Math.round((sold / total) * 100) };
  }
  if (p.unitMap?.floors?.length) {
    let total = 0;
    let sold = 0;
    for (const f of p.unitMap.floors)
      for (const u of f.units) {
        total++;
        if (u.status === "sold" || u.status === "rented") sold++;
      }
    if (total) return { sold, total, pct: Math.round((sold / total) * 100) };
  }
  if (p.buildings?.total) {
    const { soldOut, total } = p.buildings;
    return { sold: soldOut, total, pct: Math.round((soldOut / total) * 100) };
  }
  return null;
}

async function tableCount(table: "profiles" | "contact_submissions"): Promise<number | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const { count, error } = await admin.from(table).select("*", { count: "exact", head: true });
  return error ? null : count;
}

/** Total published articles = code-defined posts + admin-published DB
 *  posts (excluding any DB post that shadows a code slug). */
async function publishedBlogCount(): Promise<number> {
  const admin = createAdminClient();
  if (!admin) return BLOG_POSTS.length;
  const { data, error } = await admin.from("blog_posts").select("slug").eq("status", "published");
  if (error || !data) return BLOG_POSTS.length;
  const codeSlugs = new Set(BLOG_POSTS.map((p) => p.slug));
  const extra = (data as { slug: string }[]).filter((r) => !codeSlugs.has(r.slug)).length;
  return BLOG_POSTS.length + extra;
}

async function recentLeads() {
  const admin = createAdminClient();
  if (!admin) return [] as { name: string; interest: string | null; created_at: string }[];
  const { data } = await admin
    .from("contact_submissions")
    .select("name, interest, created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  return data ?? [];
}

export default async function AdminDashboard() {
  const [members, leads, recent, blogCount] = await Promise.all([
    tableCount("profiles"),
    tableCount("contact_submissions"),
    recentLeads(),
    publishedBlogCount(),
  ]);

  const sell = PROJECTS.map((p) => ({ name: p.name, st: sellThrough(p) })).filter(
    (x): x is { name: string; st: { sold: number; total: number; pct: number } } => !!x.st,
  );

  const kpis = [
    { label: "Projects", value: PROJECTS.length, sub: "live on the site", icon: Building, href: "/dashboard/projects" },
    { label: "Members", value: members, sub: "registered accounts", icon: Users, href: "/dashboard/staff" },
    { label: "Leads", value: leads, sub: "contact enquiries", icon: MessageSquare, href: "/dashboard/marketing/followup" },
    { label: "Blog posts", value: blogCount, sub: "published articles", icon: Newspaper, href: "/dashboard/blog" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-fg sm:text-2xl">Dashboard</h1>
          <p className="mt-0.5 text-sm text-fg-muted">Everything at a glance.</p>
        </div>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-blue-dark"
        >
          <Plus className="h-4 w-4" /> New project
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link
            key={k.label}
            href={k.href}
            className="group rounded-2xl border border-border bg-bg p-4 transition-all hover:border-brand-blue/40 hover:shadow-[var(--shadow-brand)]"
          >
            <div className="flex items-center justify-between">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-blue-tint text-brand-blue">
                <k.icon className="h-[18px] w-[18px]" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-fg-faint transition-colors group-hover:text-brand-blue" />
            </div>
            <p className="mt-3 text-2xl font-extrabold text-fg">{k.value ?? "—"}</p>
            <p className="text-[13px] font-semibold text-fg">{k.label}</p>
            <p className="text-xs text-fg-muted">{k.sub}</p>
          </Link>
        ))}
      </div>

      {/* Revenue chart (sample until Finance module) */}
      <div className="rounded-2xl border border-border bg-bg p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-fg">Revenue &amp; bookings</h2>
            <p className="text-xs text-fg-muted">last 12 months</p>
          </div>
          <span className="rounded-full bg-bg-soft px-2.5 py-1 text-[11px] font-semibold text-fg-muted">
            Sample · connect Finance
          </span>
        </div>
        <RevenueChart data={SAMPLE_REVENUE} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Sell-through */}
        <div className="rounded-2xl border border-border bg-bg p-5">
          <h2 className="mb-4 text-sm font-bold text-fg">Project sell-through</h2>
          <div className="space-y-3.5">
            {sell.map((s) => (
              <div key={s.name}>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <span className="truncate pr-2 text-fg">{s.name}</span>
                  <span className="shrink-0 text-fg-muted">
                    {s.st.sold}/{s.st.total} · {s.st.pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-bg-soft">
                  <div
                    className="h-2 rounded-full bg-brand-blue"
                    style={{ width: `${s.st.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent enquiries */}
        <div className="rounded-2xl border border-border bg-bg p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-fg">Recent enquiries</h2>
            <Link
              href="/dashboard/marketing/followup"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline"
            >
              All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-fg-muted">
              No enquiries yet — they’ll appear here from the contact form.
            </p>
          ) : (
            <ul className="space-y-3">
              {recent.map((r, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-blue-tint text-xs font-bold text-brand-blue">
                    {(r.name?.[0] ?? "?").toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-fg">{r.name || "Unknown"}</p>
                    <p className="truncate text-xs text-fg-muted">
                      {r.interest || "General enquiry"} ·{" "}
                      {new Date(r.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/** Dependency-free SVG area chart (server-rendered → zero client JS). */
function RevenueChart({ data }: { data: number[] }) {
  const W = 720;
  const H = 170;
  const pad = 8;
  const max = Math.max(...data) * 1.1;
  const min = 0;
  const stepX = (W - pad * 2) / (data.length - 1);
  const x = (i: number) => pad + i * stepX;
  const y = (v: number) => H - pad - ((v - min) / (max - min)) * (H - pad * 2);

  const line = data.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L ${x(data.length - 1).toFixed(1)} ${H - pad} L ${x(0).toFixed(1)} ${H - pad} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[170px] w-full" preserveAspectRatio="none" role="img" aria-label="Sample monthly revenue trend, rising over the last 12 months">
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1847A1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#1847A1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#rev)" />
        <path d={line} fill="none" stroke="#1847A1" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="mt-1 flex justify-between px-1 text-[10px] text-fg-faint">
        {MONTHS.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
    </div>
  );
}
