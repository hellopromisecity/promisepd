"use server";

/** Blog Server Actions — full CRUD over public.blog_posts plus category
 *  management (public.blog_categories).
 *
 *  Every mutation: requireManager() → validate → write via getAdmin() →
 *  logAudit() → revalidate the admin list + the public /blog. Slug
 *  collisions surface as a friendly error.  `published_at` is stamped
 *  the first time a post goes live and never overwritten. */

import { revalidatePath } from "next/cache";
import {
  getAdmin,
  logAudit,
  requireManager,
  runAction,
  ValidationError,
  type ActionResult,
} from "@/lib/admin-guard";
import { slugify } from "@/app/admin/blog/slug";

export type BlogStatus = "draft" | "published" | "scheduled";

export type BlogPostInput = {
  title: string;
  slug: string;
  excerpt?: string;
  body: string;
  cover_url?: string;
  tags?: string;
  author_name?: string;
  author_role?: string;
  status?: BlogStatus;
  scheduled_at?: string;
  meta_title?: string;
  meta_description?: string;
  layout?: "full" | "sidebar";
  category?: string;
  project?: string;
  access_type?: "free" | "premium";
  region?: string;
  custom_css?: string;
  custom_schema?: string;
  title_en?: string;
  excerpt_en?: string;
  body_en?: string;
};

function parseTags(raw: string | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of raw.split(",")) {
    const v = t.trim();
    if (v && !seen.has(v.toLowerCase())) {
      seen.add(v.toLowerCase());
      out.push(v);
    }
  }
  return out;
}

const trimOrNull = (v: string | undefined): string | null => {
  const t = (v ?? "").trim();
  return t.length ? t : null;
};

function buildPayload(input: BlogPostInput) {
  const title = (input.title ?? "").trim();
  if (!title) throw new ValidationError("Title is required.");

  // Unicode-aware slug handles Bangla titles; fall back to a stable
  // timestamp slug only for the rare symbol/emoji-only title so a
  // publish never hard-fails on an empty slug.
  let slug = slugify(input.slug || title);
  if (!slug) slug = `post-${Date.now().toString(36)}`;

  const status: BlogStatus = input.status ?? "draft";
  const scheduled_at = status === "scheduled" ? trimOrNull(input.scheduled_at) : null;
  if (status === "scheduled" && !scheduled_at) {
    throw new ValidationError("Pick a date & time to schedule this article.");
  }

  // Validate optional JSON-LD so we never store broken schema.
  const custom_schema = trimOrNull(input.custom_schema);
  if (custom_schema) {
    try {
      JSON.parse(custom_schema);
    } catch {
      throw new ValidationError("Custom Schema must be valid JSON.");
    }
  }

  return {
    slug,
    title,
    excerpt: trimOrNull(input.excerpt),
    body: input.body ?? "",
    cover_url: trimOrNull(input.cover_url),
    tags: parseTags(input.tags),
    author_name: trimOrNull(input.author_name) ?? "Promise City",
    author_role: trimOrNull(input.author_role),
    status,
    published: status === "published",
    scheduled_at,
    meta_title: trimOrNull(input.meta_title),
    meta_description: trimOrNull(input.meta_description),
    layout: input.layout === "full" ? "full" : "sidebar",
    category: trimOrNull(input.category),
    project: trimOrNull(input.project),
    access_type: input.access_type === "premium" ? "premium" : "free",
    region: trimOrNull(input.region) ?? "Worldwide",
    custom_css: trimOrNull(input.custom_css),
    custom_schema,
    title_en: trimOrNull(input.title_en),
    excerpt_en: trimOrNull(input.excerpt_en),
    body_en: trimOrNull(input.body_en),
  };
}

function isSlugCollision(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  return err.code === "23505" || /duplicate key|unique/i.test(err.message ?? "");
}

/** Columns introduced by a later migration (0013).  If the migration
 *  hasn't been applied yet, Postgres errors with 42703 — we strip these
 *  and retry so a publish/save never hard-fails on a pending migration. */
const OPTIONAL_COLUMNS = ["project"] as const;

function isUndefinedColumn(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  return err.code === "42703" || /column .* does not exist/i.test(err.message ?? "");
}

function stripOptional<T extends Record<string, unknown>>(row: T): T {
  const copy = { ...row } as Record<string, unknown>;
  for (const key of OPTIONAL_COLUMNS) delete copy[key];
  return copy as T;
}

function revalidateBlog() {
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}

export async function createPost(input: BlogPostInput): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    await requireManager();
    const admin = getAdmin();
    if (!admin) throw new Error("Database is not configured.");

    const payload = buildPayload(input);
    const row = {
      ...payload,
      published_at: payload.published ? new Date().toISOString() : null,
    };

    let { data, error } = await admin.from("blog_posts").insert(row).select("id").single();
    if (error && isUndefinedColumn(error)) {
      ({ data, error } = await admin.from("blog_posts").insert(stripOptional(row)).select("id").single());
    }

    if (error || !data) {
      if (isSlugCollision(error)) throw new ValidationError(`The slug “${payload.slug}” is already in use — pick another.`);
      throw error ?? new Error("Insert returned no row.");
    }

    await logAudit({ action: "create", entity: "blog_post", entityId: data.id, detail: `Created “${payload.title}”` });
    revalidateBlog();
    return { data: { id: data.id }, message: "Article created." };
  });
}

export async function updatePost(id: string, input: BlogPostInput): Promise<ActionResult> {
  return runAction(async () => {
    await requireManager();
    if (!id) throw new Error("Missing article id.");
    const admin = getAdmin();
    if (!admin) throw new Error("Database is not configured.");

    const payload = buildPayload(input);

    const { data: existing, error: readErr } = await admin
      .from("blog_posts")
      .select("published_at")
      .eq("id", id)
      .maybeSingle();
    if (readErr) throw readErr;
    if (!existing) throw new ValidationError("That article no longer exists.");

    const published_at =
      payload.published && !existing.published_at ? new Date().toISOString() : existing.published_at;

    const row = { ...payload, published_at, updated_at: new Date().toISOString() };
    let { error } = await admin.from("blog_posts").update(row).eq("id", id);
    if (error && isUndefinedColumn(error)) {
      ({ error } = await admin.from("blog_posts").update(stripOptional(row)).eq("id", id));
    }

    if (error) {
      if (isSlugCollision(error)) throw new ValidationError(`The slug “${payload.slug}” is already in use — pick another.`);
      throw error;
    }

    await logAudit({ action: "update", entity: "blog_post", entityId: id, detail: `Updated “${payload.title}”` });
    revalidateBlog();
    return { message: "Article saved." };
  });
}

export async function setPublished(id: string, published: boolean): Promise<ActionResult> {
  return runAction(async () => {
    await requireManager();
    if (!id) throw new Error("Missing article id.");
    const admin = getAdmin();
    if (!admin) throw new Error("Database is not configured.");

    const { data: existing, error: readErr } = await admin
      .from("blog_posts")
      .select("title, slug, published_at")
      .eq("id", id)
      .maybeSingle();
    if (readErr) throw readErr;
    if (!existing) throw new Error("That article no longer exists.");

    const published_at =
      published && !existing.published_at ? new Date().toISOString() : existing.published_at;

    const { error } = await admin
      .from("blog_posts")
      .update({
        published,
        status: published ? "published" : "draft",
        published_at,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw error;

    await logAudit({
      action: published ? "publish" : "unpublish",
      entity: "blog_post",
      entityId: id,
      detail: `${published ? "Published" : "Unpublished"} “${existing.title}”`,
    });
    revalidateBlog();
    return { message: published ? "Article published." : "Moved to draft." };
  });
}

export async function deletePost(id: string): Promise<ActionResult> {
  return runAction(async () => {
    await requireManager();
    if (!id) throw new Error("Missing article id.");
    const admin = getAdmin();
    if (!admin) throw new Error("Database is not configured.");

    const { data: existing } = await admin.from("blog_posts").select("title, slug").eq("id", id).maybeSingle();

    const { error } = await admin.from("blog_posts").delete().eq("id", id);
    if (error) throw error;

    await logAudit({
      action: "delete",
      entity: "blog_post",
      entityId: id,
      detail: existing ? `Deleted “${existing.title}”` : `Deleted article ${id}`,
    });
    revalidateBlog();
    return { message: "Article deleted." };
  });
}

// ── Categories ────────────────────────────────────────────────────

export async function createCategory(name: string): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    await requireManager();
    const admin = getAdmin();
    if (!admin) throw new ValidationError("Database is not configured.");

    const clean = (name ?? "").trim();
    if (!clean) throw new ValidationError("Category name is required.");
    const slug = slugify(clean) || `category-${Date.now().toString(36)}`;

    const { data, error } = await admin
      .from("blog_categories")
      .insert({ name: clean, slug })
      .select("id")
      .single();
    if (error) {
      if (isSlugCollision(error)) throw new ValidationError(`“${clean}” already exists.`);
      throw error;
    }

    await logAudit({ action: "create", entity: "blog_category", entityId: data.id, detail: `Added category “${clean}”` });
    revalidatePath("/admin/blog");
    revalidatePath("/admin/blog/new");
    return { data: { id: data.id }, message: "Category added." };
  });
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  return runAction(async () => {
    await requireManager();
    if (!id) throw new ValidationError("Missing category id.");
    const admin = getAdmin();
    if (!admin) throw new ValidationError("Database is not configured.");

    const { data: existing } = await admin.from("blog_categories").select("name").eq("id", id).maybeSingle();
    const { error } = await admin.from("blog_categories").delete().eq("id", id);
    if (error) throw error;

    await logAudit({
      action: "delete",
      entity: "blog_category",
      entityId: id,
      detail: existing ? `Deleted category “${existing.name}”` : `Deleted category ${id}`,
    });
    revalidatePath("/admin/blog");
    revalidatePath("/admin/blog/new");
    return { message: "Category deleted." };
  });
}

// ── Projects (admin can create / delete) ──────────────────────────
// Mirrors the public-blog "প্রকল্প" filter so a post can be tagged to a
// specific Fuzala / Ahbab unit independently of its content category.

export async function createProject(name: string): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    await requireManager();
    const admin = getAdmin();
    if (!admin) throw new ValidationError("Database is not configured.");

    const clean = (name ?? "").trim();
    if (!clean) throw new ValidationError("Project name is required.");
    const slug = slugify(clean) || `project-${Date.now().toString(36)}`;

    const { data, error } = await admin
      .from("blog_projects")
      .insert({ name: clean, slug })
      .select("id")
      .single();
    if (error) {
      if (isSlugCollision(error)) throw new ValidationError(`“${clean}” already exists.`);
      throw error;
    }

    await logAudit({ action: "create", entity: "blog_project", entityId: data.id, detail: `Added project “${clean}”` });
    revalidatePath("/admin/blog");
    revalidatePath("/admin/blog/new");
    return { data: { id: data.id }, message: "Project added." };
  });
}

export async function deleteProject(id: string): Promise<ActionResult> {
  return runAction(async () => {
    await requireManager();
    if (!id) throw new ValidationError("Missing project id.");
    const admin = getAdmin();
    if (!admin) throw new ValidationError("Database is not configured.");

    const { data: existing } = await admin.from("blog_projects").select("name").eq("id", id).maybeSingle();
    const { error } = await admin.from("blog_projects").delete().eq("id", id);
    if (error) throw error;

    await logAudit({
      action: "delete",
      entity: "blog_project",
      entityId: id,
      detail: existing ? `Deleted project “${existing.name}”` : `Deleted project ${id}`,
    });
    revalidatePath("/admin/blog");
    revalidatePath("/admin/blog/new");
    return { message: "Project deleted." };
  });
}
