import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, isManager } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import BlogForm, { type CategoryOption } from "../BlogForm";

export const metadata: Metadata = {
  title: "New article",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function NewBlogPostPage() {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) redirect("/account");

  const admin = getAdmin();
  const { data } = admin
    ? await admin.from("blog_categories").select("id, name").order("name")
    : { data: null };

  return <BlogForm categories={(data ?? []) as CategoryOption[]} />;
}
