/** Server-only bridge between the admin CMS (DB `blog_posts`) and the
 *  public blog.  Published DB posts are mapped into the same `BlogPost`
 *  shape the code-defined articles use, so the existing list / card /
 *  article components render them with zero special-casing — they just
 *  carry a few extra optional fields (cover, bodyHtml, EN overlays).
 *
 *  Import ONLY from server components / route handlers — it pulls in the
 *  service-role Supabase client.  Never import from a "use client" file. */

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { embedVideoLinks } from "@/lib/embed";
import {
  BLOG_POSTS,
  BLOG_PROJECTS,
  CATEGORY_META,
  CATEGORY_ORDER,
  bnDate,
  getPostBySlug as getCodePostBySlug,
  type BlogPost,
  type BlogCategoryKey,
  type BlogProjectKey,
} from "@/lib/blog";

// Name → key maps so a DB post's free-text category / project (stored as
// the Bangla display name) resolves back to the typed keys the filters use.
const CAT_BY_NAME: Record<string, BlogCategoryKey> = {
  // Legacy English seed names (pre-0013) → closest current bucket, so
  // posts tagged before the reseed still land somewhere sensible.
  "buying guide": "resources",
  investment: "resources",
  lifestyle: "resources",
  "market news": "notice",
  "project updates": "projects",
  "legal & documents": "rules",
};
for (const key of CATEGORY_ORDER) {
  CAT_BY_NAME[CATEGORY_META[key].bn.toLowerCase()] = key;
  CAT_BY_NAME[CATEGORY_META[key].en.toLowerCase()] = key;
  CAT_BY_NAME[key] = key;
}

const PROJ_BY_NAME: Record<string, BlogProjectKey> = {};
for (const p of BLOG_PROJECTS) {
  PROJ_BY_NAME[p.bn.toLowerCase()] = p.key;
  PROJ_BY_NAME[p.key] = p.key;
}

function resolveCategory(name: string | null): BlogCategoryKey {
  if (!name) return "notice";
  return CAT_BY_NAME[name.trim().toLowerCase()] ?? "notice";
}

function resolveProject(name: string | null): BlogProjectKey | undefined {
  if (!name) return undefined;
  return PROJ_BY_NAME[name.trim().toLowerCase()];
}

/** Strip tags + collapse whitespace — for excerpts + reading-time. */
function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function readingMinutes(html: string): number {
  const words = plainText(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Shape of the columns we read for the public surface. */
type DbRow = {
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover_url: string | null;
  category: string | null;
  project: string | null;
  views: number | null;
  published_at: string | null;
  created_at: string;
  author_name: string | null;
  title_en: string | null;
  excerpt_en: string | null;
  body_en: string | null;
};

const SELECT =
  "slug, title, excerpt, body, cover_url, category, project, views, published_at, created_at, author_name, title_en, excerpt_en, body_en";

function mapRow(row: DbRow): BlogPost {
  const category = resolveCategory(row.category);
  const accent = CATEGORY_META[category].accent;
  const iso = (row.published_at ?? row.created_at ?? "").slice(0, 10);
  const excerpt =
    (row.excerpt ?? "").trim() || plainText(row.body).slice(0, 160);

  return {
    slug: row.slug,
    title: row.title,
    excerpt,
    category,
    project: resolveProject(row.project),
    date: bnDate(iso),
    iso,
    views: Number(row.views) || 0,
    readingMinutes: readingMinutes(row.body),
    icon: "FileText",
    accent,
    featured: false,
    // Structured fields stay empty — DB posts render from bodyHtml.
    intro: "",
    sections: [],
    // DB-only extras the components pick up:
    cover: row.cover_url ?? undefined,
    bodyHtml: row.body ? embedVideoLinks(row.body) : undefined,
    bodyHtmlEn: row.body_en ? embedVideoLinks(row.body_en) : undefined,
    titleEn: row.title_en ?? undefined,
    excerptEn: row.excerpt_en ?? undefined,
    source: "db",
  };
}

/** Published DB posts mapped to the public BlogPost shape, newest-first.
 *  Returns [] when Supabase isn't configured or on any read error so the
 *  public blog always renders (just the code-defined posts). */
export async function getPublishedDbPosts(): Promise<BlogPost[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  // `cols` is a runtime string (we may drop `project` for pre-0013 DBs),
  // so the typed client can't infer the row — cast the result below.
  const list = (cols: string) =>
    admin
      .from("blog_posts")
      .select(cols)
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false });

  let res = await list(SELECT);
  if (res.error?.code === "42703") res = await list(SELECT.replace(", project", ""));
  if (res.error || !res.data) return [];

  // A post whose slug collides with a code-defined article is skipped —
  // the hand-authored version wins.
  const codeSlugs = new Set(BLOG_POSTS.map((p) => p.slug));
  return (res.data as unknown as DbRow[])
    .filter((r) => !codeSlugs.has(r.slug))
    .map(mapRow);
}

/** Merged pool (code + DB) sorted newest-first — for related / prev / next. */
export async function getAllPublicPosts(): Promise<BlogPost[]> {
  const db = await getPublishedDbPosts();
  return [...BLOG_POSTS, ...db].sort((a, b) => (a.iso < b.iso ? 1 : -1));
}

/** Resolve a slug to a post: hand-authored articles win, then DB posts. */
export async function getPublicPostBySlug(rawSlug: string): Promise<BlogPost | null> {
  // Next 16 hands the page component the *percent-encoded* slug while
  // generateMetadata gets the decoded one — decode so Unicode (Bangla)
  // slugs match the stored value in both contexts.
  let slug = rawSlug;
  if (slug.includes("%")) {
    try {
      slug = decodeURIComponent(slug);
    } catch {
      /* malformed escape — keep the raw value */
    }
  }

  const code = getCodePostBySlug(slug);
  if (code) return { ...code, source: "code" };

  const admin = createAdminClient();
  if (!admin) return null;

  const one = (cols: string) =>
    admin.from("blog_posts").select(cols).eq("slug", slug).eq("status", "published").maybeSingle();

  let res = await one(SELECT);
  if (res.error?.code === "42703") res = await one(SELECT.replace(", project", ""));
  if (res.error || !res.data) return null;
  return mapRow(res.data as unknown as DbRow);
}

/** slug → tracked extra views (post_views).  {} when unavailable. */
export async function getViewCounts(): Promise<Record<string, number>> {
  const admin = createAdminClient();
  if (!admin) return {};
  const { data, error } = await admin.from("post_views").select("slug, views");
  if (error || !data) return {};
  const map: Record<string, number> = {};
  for (const r of data as { slug: string; views: number }[]) {
    map[r.slug] = Number(r.views) || 0;
  }
  return map;
}

/** Add the tracked view delta onto each post's base view count. */
export function withViewCounts(posts: BlogPost[], counts: Record<string, number>): BlogPost[] {
  return posts.map((p) => ({ ...p, views: p.views + (counts[p.slug] ?? 0) }));
}

/** Related posts (same category first) drawn from the merged pool. */
export function relatedFrom(all: BlogPost[], slug: string, n = 3): BlogPost[] {
  const cur = all.find((p) => p.slug === slug);
  if (!cur) return all.filter((p) => p.slug !== slug).slice(0, n);
  const sameCat = all.filter((p) => p.slug !== slug && p.category === cur.category);
  const others = all.filter((p) => p.slug !== slug && p.category !== cur.category);
  return [...sameCat, ...others].slice(0, n);
}
