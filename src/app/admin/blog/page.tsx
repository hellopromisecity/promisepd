import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Newspaper } from "lucide-react";
import { getCurrentUser, isManager } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import { EmptyState, PageHeader } from "@/components/admin/ui";
import BlogList, { type BlogRow } from "./BlogList";

export const metadata: Metadata = {
  title: "Blog",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/** Count internal links in an article body (for the list "Links" badge). */
function countLinks(body: string): number {
  const re = /href=["'](\/[^"'#]|https?:\/\/(?:www\.)?promisepd\.com\/)/gi;
  return (body.match(re) ?? []).length;
}

export default async function BlogAdminPage() {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) redirect("/account");

  const admin = getAdmin();
  const newBtn = (
    <Link
      href="/admin/blog/new"
      className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark"
    >
      + New article
    </Link>
  );

  if (!admin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Blog" subtitle="Manage your articles." action={newBtn} />
        <EmptyState icon={Newspaper} title="Data unavailable" message="Supabase isn’t configured yet." />
      </div>
    );
  }

  const { data } = await admin
    .from("blog_posts")
    .select("id, slug, title, body, category, access_type, status, published, published_at, scheduled_at, created_at, views")
    .order("created_at", { ascending: false });

  const rows: BlogRow[] = (data ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    category: p.category,
    accessType: p.access_type,
    status: p.status || (p.published ? "published" : "draft"),
    date: p.published_at ?? p.scheduled_at ?? p.created_at,
    views: p.views ?? 0,
    links: countLinks(p.body ?? ""),
  }));

  return <BlogList rows={rows} newButton={newBtn} />;
}
