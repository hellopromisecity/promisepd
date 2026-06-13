"use client";

/** Full blog article editor — title, permalink, featured image, rich
 *  content, and a sidebar of SEO / author / category / access / layout /
 *  custom CSS + JSON-LD controls.  Save as draft, publish now, or
 *  schedule.  Categories are managed inline (add / delete). */

import { useMemo, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Save, Send, CalendarClock, Upload, Loader2, Plus, Trash2,
  Link2, AlertCircle, Globe, Lock, ChevronDown,
} from "lucide-react";
import RichEditor from "@/components/admin/RichEditor";
import { uploadImage } from "@/app/actions/upload-image";
import {
  createPost, updatePost, createCategory, deleteCategory,
  type BlogPostInput, type BlogStatus,
} from "@/app/actions/admin-blog";
import { slugify } from "./slug";

export type CategoryOption = { id: string; name: string };

export type BlogFormPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover_url: string | null;
  tags: string[] | null;
  author_name: string | null;
  author_role: string | null;
  status: string | null;
  scheduled_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  layout: string | null;
  category: string | null;
  access_type: string | null;
  region: string | null;
  custom_css: string | null;
  custom_schema: string | null;
  title_en: string | null;
  excerpt_en: string | null;
  body_en: string | null;
};

const REGIONS = ["Worldwide", "Bangladesh", "Dhaka", "Chattogram", "Sylhet", "Khulna", "Rajshahi"];
const PERMALINK_PREFIX = "promisepd.com/blog/";

export default function BlogForm({
  post,
  categories: initialCategories,
}: {
  post?: BlogFormPost;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const editing = !!post;

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(editing);
  const [cover, setCover] = useState(post?.cover_url ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [layout, setLayout] = useState<"full" | "sidebar">(post?.layout === "full" ? "full" : "sidebar");
  const [metaTitle, setMetaTitle] = useState(post?.meta_title ?? "");
  const [metaDesc, setMetaDesc] = useState(post?.meta_description ?? "");
  const [authorName, setAuthorName] = useState(post?.author_name ?? "Promise City");
  const [authorRole, setAuthorRole] = useState(post?.author_role ?? "Real Estate Advisor");
  const [category, setCategory] = useState(post?.category ?? (initialCategories[0]?.name ?? ""));
  const [access, setAccess] = useState<"free" | "premium">(post?.access_type === "premium" ? "premium" : "free");
  const [region, setRegion] = useState(post?.region ?? "Worldwide");
  const [tags, setTags] = useState((post?.tags ?? []).join(", "));
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [customCss, setCustomCss] = useState(post?.custom_css ?? "");
  const [customSchema, setCustomSchema] = useState(post?.custom_schema ?? "");
  const [scheduledAt, setScheduledAt] = useState(
    post?.scheduled_at ? toLocalInput(post.scheduled_at) : "",
  );

  const [categories, setCategories] = useState(initialCategories);
  const [manageCats, setManageCats] = useState(false);
  const [newCat, setNewCat] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [catPending, startCatTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const effSlug = slug || slugify(title);

  // Internal links found in the content (for the interlink panel).
  const internalLinks = useMemo(() => {
    const out: string[] = [];
    const re = /href=["'](\/[^"'#][^"']*|https?:\/\/(?:www\.)?promisepd\.com\/[^"']*)["']/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(body))) out.push(m[1]);
    return out;
  }, [body]);

  function onTitle(v: string) {
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  function payload(status: BlogStatus): BlogPostInput {
    return {
      title, slug: effSlug, excerpt, body, cover_url: cover, tags,
      author_name: authorName, author_role: authorRole, status,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      meta_title: metaTitle, meta_description: metaDesc, layout, category,
      access_type: access, region, custom_css: customCss, custom_schema: customSchema,
    };
  }

  function submit(status: BlogStatus) {
    setError(null);
    startTransition(async () => {
      const res = editing
        ? await updatePost(post!.id, payload(status))
        : await createPost(payload(status));
      if (res.ok) {
        router.push("/admin/blog");
        router.refresh();
      } else {
        setError(res.error);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  async function onUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("folder", "blog");
      const res = await uploadImage(fd);
      if (res.ok) setCover(res.url);
      else setError(res.error);
    } finally {
      setUploading(false);
    }
  }

  function addCategory() {
    const name = newCat.trim();
    if (!name) return;
    startCatTransition(async () => {
      const res = await createCategory(name);
      if (res.ok) {
        setCategories((c) => [...c, { id: res.data!.id, name }].sort((a, b) => a.name.localeCompare(b.name)));
        setCategory(name);
        setNewCat("");
      } else {
        setError(res.error);
      }
    });
  }

  function removeCategory(id: string, name: string) {
    startCatTransition(async () => {
      const res = await deleteCategory(id);
      if (res.ok) {
        setCategories((c) => c.filter((x) => x.id !== id));
        if (category === name) setCategory("");
      } else {
        setError(res.error);
      }
    });
  }

  const scheduling = !!scheduledAt && new Date(scheduledAt).getTime() > Date.now();

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => router.push("/admin/blog")} className="grid h-9 w-9 place-items-center rounded-xl border border-border text-fg-muted hover:text-fg" aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="mr-auto">
          <h1 className="text-xl font-bold text-fg sm:text-2xl">{editing ? "Edit article" : "New article"}</h1>
          <p className="text-sm text-fg-muted">{editing ? "Update this article." : "Create a new article."}</p>
        </div>
        <button onClick={() => submit("draft")} disabled={pending} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold text-fg hover:border-brand-blue/40 disabled:opacity-60">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save draft
        </button>
        <button onClick={() => submit(scheduling ? "scheduled" : "published")} disabled={pending} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark disabled:opacity-60">
          {scheduling ? <CalendarClock className="h-4 w-4" /> : <Send className="h-4 w-4" />} {scheduling ? "Schedule" : "Publish"}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-brand-red/30 bg-brand-red-tint px-4 py-3 text-sm text-brand-red-dark">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* Main column */}
        <div className="space-y-5">
          <Card>
            <Label>Title</Label>
            <input value={title} onChange={(e) => onTitle(e.target.value)} placeholder="Enter article title…" className="w-full rounded-xl border border-border bg-bg-soft px-3.5 py-3 text-lg font-semibold text-fg outline-none focus:border-brand-blue/50" />
          </Card>

          <Card>
            <Label>Permalink</Label>
            <div className="flex items-center overflow-hidden rounded-xl border border-border bg-bg-soft">
              <span className="whitespace-nowrap px-3 py-2.5 text-sm text-fg-faint">{PERMALINK_PREFIX}</span>
              <input
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
                onBlur={() => setSlug((s) => slugify(s))}
                placeholder={slugify(title) || "article-slug"}
                className="w-full bg-transparent py-2.5 pr-3 text-sm text-fg outline-none"
              />
            </div>
          </Card>

          <Card>
            <Label>Featured image</Label>
            <p className="mb-2 text-xs text-fg-faint">Recommended 1200×630px (1.91:1) · JPG / PNG / WEBP</p>
            <div className="flex items-center gap-2">
              <input value={cover} onChange={(e) => setCover(e.target.value)} placeholder="/image.webp or https://…" className="w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm text-fg outline-none focus:border-brand-blue/50" />
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-sm font-semibold text-brand-blue hover:bg-brand-blue-tint disabled:opacity-60">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
            </div>
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className="mt-3 max-h-44 rounded-xl border border-border object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            )}
          </Card>

          <div>
            <Label>Content</Label>
            <RichEditor value={body} onChange={setBody} />
          </div>

          <Card>
            <Label>Excerpt</Label>
            <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} placeholder="Short summary shown on the blog list…" className="w-full resize-y rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm text-fg outline-none focus:border-brand-blue/50" />
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-bold text-fg">Status</h3>
            <p className="mt-1 text-xs text-fg-muted">Use <b>Save draft</b> to save without publishing, or <b>Publish</b> to make it live.</p>
            <Label className="mt-3">Schedule for later (optional)</Label>
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm text-fg outline-none focus:border-brand-blue/50" />
            {scheduling && <p className="mt-1 text-xs text-brand-blue">Will publish automatically at the chosen time.</p>}
          </Card>

          <Card>
            <h3 className="mb-2 text-sm font-bold text-fg">Sitewide</h3>
            <Toggle2 a="Full page" b="With sidebar" value={layout === "full" ? "a" : "b"} onChange={(v) => setLayout(v === "a" ? "full" : "sidebar")} />
          </Card>

          <Card>
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-fg"><Link2 className="h-4 w-4 text-brand-blue" /> Interlink checker</h3>
            {internalLinks.length === 0 ? (
              <p className="mt-1 text-xs text-fg-muted">Add internal links in the content to see them here.</p>
            ) : (
              <>
                <p className="mt-1 text-xs text-fg-muted">{internalLinks.length} internal link{internalLinks.length > 1 ? "s" : ""} found.</p>
                <ul className="mt-2 space-y-1">
                  {internalLinks.slice(0, 8).map((l, i) => (
                    <li key={i} className="truncate rounded-md bg-bg-soft px-2 py-1 text-[11px] text-fg-muted">{l}</li>
                  ))}
                </ul>
              </>
            )}
          </Card>

          <Card>
            <h3 className="text-sm font-bold text-fg">SEO settings</h3>
            <Label className="mt-3">Meta title</Label>
            <input value={metaTitle} maxLength={70} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Custom title for search engines…" className="w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm text-fg outline-none focus:border-brand-blue/50" />
            <Counter n={metaTitle.length} max={60} />
            <Label className="mt-3">Meta description</Label>
            <textarea value={metaDesc} maxLength={170} rows={3} onChange={(e) => setMetaDesc(e.target.value)} placeholder="Brief description for Google search results (max 155 chars)…" className="w-full resize-y rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm text-fg outline-none focus:border-brand-blue/50" />
            <Counter n={metaDesc.length} max={155} />
          </Card>

          <Card>
            <h3 className="text-sm font-bold text-fg">Author</h3>
            <Label className="mt-3">Name</Label>
            <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm text-fg outline-none focus:border-brand-blue/50" />
            <Label className="mt-3">Role</Label>
            <input value={authorRole} onChange={(e) => setAuthorRole(e.target.value)} className="w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm text-fg outline-none focus:border-brand-blue/50" />
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-fg">Category</h3>
              <button onClick={() => setManageCats((v) => !v)} className="text-xs font-semibold text-brand-blue hover:underline">{manageCats ? "Done" : "Manage"}</button>
            </div>
            <div className="relative mt-2">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full appearance-none rounded-xl border border-border bg-bg-soft px-3 py-2.5 pr-9 text-sm text-fg outline-none focus:border-brand-blue/50">
                <option value="">Uncategorised</option>
                {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" />
            </div>
            {manageCats && (
              <div className="mt-3 space-y-2 border-t border-border pt-3">
                <div className="flex gap-2">
                  <input value={newCat} onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCategory(); } }} placeholder="New category name" className="w-full rounded-lg border border-border bg-bg-soft px-2.5 py-2 text-sm text-fg outline-none focus:border-brand-blue/50" />
                  <button onClick={addCategory} disabled={catPending} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-blue text-white disabled:opacity-60" aria-label="Add category">
                    {catPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </button>
                </div>
                <ul className="space-y-1">
                  {categories.map((c) => (
                    <li key={c.id} className="flex items-center justify-between rounded-lg bg-bg-soft px-2.5 py-1.5 text-sm text-fg">
                      {c.name}
                      <button onClick={() => removeCategory(c.id, c.name)} disabled={catPending} className="text-fg-faint hover:text-brand-red" aria-label={`Delete ${c.name}`}><Trash2 className="h-3.5 w-3.5" /></button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="mb-2 text-sm font-bold text-fg">Access type</h3>
            <div className="grid grid-cols-2 gap-2">
              <AccessBtn active={access === "free"} onClick={() => setAccess("free")} icon={Globe} label="Free" />
              <AccessBtn active={access === "premium"} onClick={() => setAccess("premium")} icon={Lock} label="Premium" />
            </div>
          </Card>

          <Card>
            <h3 className="mb-2 text-sm font-bold text-fg">Region</h3>
            <div className="relative">
              <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full appearance-none rounded-xl border border-border bg-bg-soft px-3 py-2.5 pr-9 text-sm text-fg outline-none focus:border-brand-blue/50">
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" />
            </div>
          </Card>

          <Card>
            <Label>Tags</Label>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="comma, separated, tags" className="w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm text-fg outline-none focus:border-brand-blue/50" />
          </Card>

          <Card>
            <h3 className="text-sm font-bold text-fg">Custom CSS</h3>
            <p className="mt-1 text-xs text-fg-muted">Loads only on this article.</p>
            <textarea value={customCss} onChange={(e) => setCustomCss(e.target.value)} rows={4} spellCheck={false} placeholder={"/* Example */\n.rich-content h2 { color: #1847A1; }"} className="mt-2 w-full resize-y rounded-xl border border-border bg-bg-soft px-3 py-2.5 font-mono text-xs text-fg outline-none focus:border-brand-blue/50" />
          </Card>

          <Card>
            <h3 className="text-sm font-bold text-fg">Custom schema (JSON-LD)</h3>
            <p className="mt-1 text-xs text-fg-muted">If set, replaces the default Article schema (FAQPage, HowTo, etc.).</p>
            <textarea value={customSchema} onChange={(e) => setCustomSchema(e.target.value)} rows={5} spellCheck={false} placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "FAQPage"\n}'} className="mt-2 w-full resize-y rounded-xl border border-border bg-bg-soft px-3 py-2.5 font-mono text-xs text-fg outline-none focus:border-brand-blue/50" />
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── small presentational helpers ──────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-bg p-4">{children}</div>;
}
function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <label className={`mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-fg-muted ${className}`}>{children}</label>;
}
function Counter({ n, max }: { n: number; max: number }) {
  return <p className={`mt-1 text-[11px] ${n > max ? "text-brand-red" : "text-fg-faint"}`}>{n}/{max} characters</p>;
}
function Toggle2({ a, b, value, onChange }: { a: string; b: string; value: "a" | "b"; onChange: (v: "a" | "b") => void }) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-bg-soft p-1">
      {(["a", "b"] as const).map((k) => (
        <button key={k} onClick={() => onChange(k)} className={`rounded-lg py-2 text-sm font-semibold transition-colors ${value === k ? "bg-brand-blue text-white shadow-[var(--shadow-brand)]" : "text-fg-muted hover:text-fg"}`}>
          {k === "a" ? a : b}
        </button>
      ))}
    </div>
  );
}
function AccessBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Globe; label: string }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-colors ${active ? "bg-brand-blue text-white shadow-[var(--shadow-brand)]" : "bg-bg-soft text-fg-muted hover:text-fg"}`}>
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

/** ISO → value for <input type="datetime-local"> (local, no seconds). */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
