import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Newspaper } from "lucide-react";
import { getCurrentUser, isManager } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import { EmptyState, PageHeader } from "@/components/admin/ui";
import BlogForm, { type BlogFormPost, type CategoryOption } from "../BlogForm";

export const metadata: Metadata = {
  title: "Edit post",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) redirect("/account");

  const { id } = await params;

  const admin = getAdmin();
  if (!admin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit post" subtitle="Update this article." />
        <EmptyState
          icon={Newspaper}
          title="Data unavailable"
          message="Supabase isn’t configured, so this post can’t be loaded right now."
        />
      </div>
    );
  }

  const [{ data, error }, cats] = await Promise.all([
    admin
      .from("blog_posts")
      .select(
        "id, slug, title, excerpt, body, cover_url, tags, author_name, author_role, status, scheduled_at, meta_title, meta_description, layout, category, access_type, region, custom_css, custom_schema, title_en, excerpt_en, body_en",
      )
      .eq("id", id)
      .maybeSingle(),
    admin.from("blog_categories").select("id, name").order("name"),
  ]);

  if (error || !data) notFound();

  return <BlogForm post={data as BlogFormPost} categories={(cats.data ?? []) as CategoryOption[]} />;
}
