import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, isManager } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import BlogForm, { type CategoryOption, type ProjectOption } from "../BlogForm";

export const metadata: Metadata = {
  title: "New article",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function NewBlogPostPage() {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) redirect("/account");

  const admin = getAdmin();
  const [cats, projs] = admin
    ? await Promise.all([
        admin.from("blog_categories").select("id, name").order("name"),
        admin.from("blog_projects").select("id, name").order("sort"),
      ])
    : [{ data: null }, { data: null }];

  return (
    <BlogForm
      categories={(cats.data ?? []) as CategoryOption[]}
      projects={(projs.data ?? []) as ProjectOption[]}
    />
  );
}
