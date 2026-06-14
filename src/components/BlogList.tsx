"use client";

/** Search + category filter + paginated grid for the blog index.
 *
 *  Page-1 layout: 1 featured (taken from `featured: true` in data)
 *  + a 3×3 grid of 9 regular cards.  Page-2 and beyond: just 9
 *  regular cards per page.  Filter/search filter the regular pool;
 *  the featured slot only renders on page 1 when "All categories"
 *  is selected and no search query is active (so it never feels
 *  out of place with filtered results).
 *
 *  All state is local — no URL params yet to keep this drop-in
 *  simple.  Easy to upgrade later with useSearchParams. */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  Filter,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Building2,
} from "lucide-react";
import BlogCard from "./BlogCard";
import BlogFeatured from "./BlogFeatured";
import {
  BLOG_POSTS,
  BLOG_PROJECTS,
  CATEGORY_META,
  CATEGORY_ORDER,
  bnNumber,
  type BlogPost,
  type BlogCategoryKey,
  type BlogProjectKey,
} from "@/lib/blog";
import { BLOG_EN, CATEGORY_EN, BLOG_PROJECT_EN } from "@/lib/blog.en";
import { DICT } from "@/lib/i18n";
import { useLocale } from "./LocaleProvider";

const PAGE_SIZE = 9;
const PAGINATION_WINDOW = 5;

type CategoryFilter = "all" | BlogCategoryKey;
type ProjectFilter = "all" | BlogProjectKey;

export default function BlogList({
  extraPosts = [],
  viewCounts = {},
}: {
  extraPosts?: BlogPost[];
  viewCounts?: Record<string, number>;
}) {
  const locale = useLocale();
  const isEn = locale === "en";
  const t = DICT[locale].blog;
  const num = (n: number) => (isEn ? String(n) : bnNumber(n));
  const catName = (key: BlogCategoryKey) =>
    isEn ? CATEGORY_EN[key] ?? CATEGORY_META[key].bn : CATEGORY_META[key].bn;
  const projName = (key: BlogProjectKey, bn: string) =>
    isEn ? BLOG_PROJECT_EN[key] ?? bn : bn;

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [project, setProject] = useState<ProjectFilter>("all");
  const [page, setPage] = useState(1);
  const [catOpen, setCatOpen] = useState(false);
  const [projOpen, setProjOpen] = useState(false);

  // Code-defined articles + admin-published DB posts, newest-first, with
  // the dynamic view delta folded onto each post's base count.
  const allPosts = useMemo(
    () =>
      [...BLOG_POSTS, ...extraPosts].map((p) => ({
        ...p,
        views: p.views + (viewCounts[p.slug] ?? 0),
      })),
    [extraPosts, viewCounts],
  );
  const allSorted = useMemo(
    () => [...allPosts].sort((a, b) => (a.iso < b.iso ? 1 : -1)),
    [allPosts],
  );

  const featuredPost = useMemo(
    () => allSorted.find((p) => p.featured),
    [allSorted],
  );

  // Filter set = everything except the featured post (which is shown
  // separately at top of page 1).  This way the featured post never
  // appears twice in the grid.
  //
  // Filter semantics:
  //  - category and project are independent ANDs.
  //  - project only meaningfully narrows the "projects" category, but
  //    we still apply it independently so picking "ফুজালা টাওয়ার"
  //    works even if category is "All categories".
  const filtered = useMemo(() => {
    const pool = allSorted.filter((p) => p.slug !== featuredPost?.slug);
    const q = query.trim().toLowerCase();
    return pool.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (project !== "all" && p.project !== project) return false;
      if (!q) return true;
      const en = isEn ? BLOG_EN[p.slug] : null;
      const title = (en?.title ?? p.title).toLowerCase();
      const excerpt = (en?.excerpt ?? p.excerpt).toLowerCase();
      const catLabel = (
        isEn ? CATEGORY_EN[p.category] ?? "" : CATEGORY_META[p.category].bn
      ).toLowerCase();
      return (
        title.includes(q) ||
        excerpt.includes(q) ||
        catLabel.includes(q)
      );
    });
  }, [allSorted, featuredPost, category, project, query, isEn]);

  // The featured slot only appears when:
  //  - we're on page 1
  //  - no search is active
  //  - both filters are "all"
  // Otherwise the featured post (if matched by filter) joins the regular grid.
  const showFeaturedSlot =
    page === 1 &&
    !query.trim() &&
    category === "all" &&
    project === "all" &&
    !!featuredPost;

  const totalCount =
    filtered.length + (showFeaturedSlot ? 1 : 0);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Clamp page if filters shrank the pool below it.
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const onCategoryChange = (next: CategoryFilter) => {
    setCategory(next);
    setPage(1);
    setCatOpen(false);
  };

  const onProjectChange = (next: ProjectFilter) => {
    setProject(next);
    setPage(1);
    setProjOpen(false);
  };

  const onSearchChange = (next: string) => {
    setQuery(next);
    setPage(1);
  };

  const reset = () => {
    setQuery("");
    setCategory("all");
    setProject("all");
    setPage(1);
  };

  const currentProjectLabel = useMemo(() => {
    if (project === "all") return t.allProjects;
    const found = BLOG_PROJECTS.find((p) => p.key === project);
    if (!found) return t.allProjects;
    return projName(found.key, found.bn);
  }, [project, t, isEn]);

  const projectPostCount = useMemo(
    () => allPosts.filter((p) => p.category === "projects").length,
    [allPosts],
  );

  return (
    <section className="relative pb-20 sm:pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Search + filter bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card p-3 sm:p-4 flex flex-col sm:flex-row gap-3"
        >
          {/* Search input */}
          <div className="flex-1 flex items-center gap-2 rounded-xl bg-bg-soft px-4">
            <Search className="h-4 w-4 text-fg-muted shrink-0" />
            <input
              type="search"
              value={query}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.searchPh}
              className="w-full bg-transparent py-3 text-sm text-fg placeholder:text-fg-faint outline-none"
              aria-label={t.searchAria}
            />
            {query && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="text-[11px] font-bold uppercase tracking-wider text-fg-muted hover:text-brand-red transition-colors"
              >
                {t.clear}
              </button>
            )}
          </div>

          {/* Project dropdown — sits to the LEFT of category so visitors
              can drill into a specific Fuzala / Ahbab unit before (or
              instead of) filtering by content type. */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setProjOpen((v) => !v);
                setCatOpen(false);
              }}
              className="w-full sm:w-auto flex items-center justify-between gap-2 rounded-xl bg-bg-soft px-4 py-3 text-sm font-semibold text-fg hover:bg-bg-soft-2 transition-colors"
              aria-haspopup="listbox"
              aria-expanded={projOpen}
            >
              <span className="inline-flex items-center gap-2">
                <Building2 className="h-4 w-4 text-fg-muted" />
                {currentProjectLabel}
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  projOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <AnimatePresence>
              {projOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setProjOpen(false)}
                    aria-hidden
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-full sm:w-72 z-30 glass-strong rounded-2xl p-2 shadow-2xl"
                    role="listbox"
                  >
                    <FilterOption
                      label={t.allProjects}
                      count={projectPostCount}
                      isEn={isEn}
                      active={project === "all"}
                      onClick={() => onProjectChange("all")}
                    />
                    {BLOG_PROJECTS.map((p) => {
                      const count = allPosts.filter(
                        (post) => post.project === p.key,
                      ).length;
                      return (
                        <FilterOption
                          key={p.key}
                          label={projName(p.key, p.bn)}
                          count={count}
                          isEn={isEn}
                          active={project === p.key}
                          onClick={() => onProjectChange(p.key)}
                          accent="blue"
                        />
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Category dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setCatOpen((v) => !v);
                setProjOpen(false);
              }}
              className="w-full sm:w-auto flex items-center justify-between gap-2 rounded-xl bg-bg-soft px-4 py-3 text-sm font-semibold text-fg hover:bg-bg-soft-2 transition-colors"
              aria-haspopup="listbox"
              aria-expanded={catOpen}
            >
              <span className="inline-flex items-center gap-2">
                <Filter className="h-4 w-4 text-fg-muted" />
                {category === "all" ? t.allCategories : catName(category)}
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  catOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <AnimatePresence>
              {catOpen && (
                <>
                  {/* Click-outside backdrop */}
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setCatOpen(false)}
                    aria-hidden
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{
                      duration: 0.2,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="absolute right-0 top-full mt-2 w-full sm:w-64 z-30 glass-strong rounded-2xl p-2 shadow-2xl"
                    role="listbox"
                  >
                    <FilterOption
                      label={t.allCategories}
                      count={allPosts.length}
                      isEn={isEn}
                      active={category === "all"}
                      onClick={() => onCategoryChange("all")}
                    />
                    {CATEGORY_ORDER.map((key) => {
                      const meta = CATEGORY_META[key];
                      const count = allPosts.filter(
                        (p) => p.category === key,
                      ).length;
                      return (
                        <FilterOption
                          key={key}
                          label={catName(key)}
                          count={count}
                          isEn={isEn}
                          active={category === key}
                          onClick={() => onCategoryChange(key)}
                          accent={meta.accent}
                        />
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Result count + active filters */}
        <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-fg-muted">
            <span className="font-bold text-fg">
              {num(totalCount)}
            </span>{" "}
            {t.posts}
            {project !== "all" && (
              <>
                {" "}
                · {t.projectLabel}{" "}
                <span className="font-bold text-fg">
                  {currentProjectLabel}
                </span>
              </>
            )}
            {category !== "all" && (
              <>
                {" "}
                · {t.categoryLabel}{" "}
                <span className="font-bold text-fg">
                  {catName(category)}
                </span>
              </>
            )}
            {query.trim() && (
              <>
                {" "}
                · &ldquo;
                <span className="font-bold text-fg">{query.trim()}</span>
                &rdquo; {t.forQuery}
              </>
            )}
          </p>
          {(query.trim() || category !== "all" || project !== "all") && (
            <button
              type="button"
              onClick={reset}
              className="text-xs font-bold uppercase tracking-wider text-brand-red hover:underline"
            >
              {t.reset}
            </button>
          )}
        </div>

        {/* Featured slot (page 1, no filters) */}
        {showFeaturedSlot && featuredPost && (
          <div className="mt-6">
            <BlogFeatured post={featuredPost} />
          </div>
        )}

        {/* Regular grid */}
        {pageItems.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((post, i) => (
              <BlogCard key={post.slug} post={post} index={i} />
            ))}
          </div>
        ) : (
          <EmptyState
            onReset={reset}
            title={t.emptyTitle}
            sub={t.emptySub}
            cta={t.emptyReset}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            page={safePage}
            totalPages={totalPages}
            isEn={isEn}
            prevLabel={t.prev}
            nextLabel={t.next}
            onPage={(p) => {
              setPage(p);
              // Smooth-scroll back up so user sees the new page
              if (typeof window !== "undefined") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          />
        )}
      </div>
    </section>
  );
}

function FilterOption({
  label,
  count,
  isEn,
  active,
  onClick,
  accent,
}: {
  label: string;
  count: number;
  isEn: boolean;
  active: boolean;
  onClick: () => void;
  accent?: "red" | "blue" | "ash";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="option"
      aria-selected={active}
      className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors ${
        active
          ? "bg-bg-soft font-bold text-fg"
          : "text-fg-soft hover:bg-bg-soft"
      }`}
    >
      <span className="inline-flex items-center gap-2">
        {accent ? (
          <span
            className={`h-2 w-2 rounded-full ${
              accent === "red"
                ? "bg-brand-red"
                : accent === "blue"
                  ? "bg-brand-blue"
                  : "bg-brand-ash"
            }`}
          />
        ) : (
          <span className="h-2 w-2 rounded-full bg-fg-faint" />
        )}
        {label}
      </span>
      <span className="text-[11px] font-bold text-fg-faint">
        {isEn ? String(count) : bnNumber(count)}
      </span>
    </button>
  );
}

function Pagination({
  page,
  totalPages,
  isEn,
  prevLabel,
  nextLabel,
  onPage,
}: {
  page: number;
  totalPages: number;
  isEn: boolean;
  prevLabel: string;
  nextLabel: string;
  onPage: (p: number) => void;
}) {
  // Sliding window of up to PAGINATION_WINDOW page numbers around current.
  const windowSize = Math.min(PAGINATION_WINDOW, totalPages);
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <nav
      className="mt-12 flex items-center justify-center gap-2 flex-wrap"
      aria-label={isEn ? "Page navigation" : "পৃষ্ঠা নেভিগেশন"}
    >
      <button
        type="button"
        onClick={() => page > 1 && onPage(page - 1)}
        disabled={page === 1}
        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-fg hover:border-brand-blue/40 disabled:opacity-40 disabled:hover:border-border transition-colors"
        aria-label={isEn ? "Previous page" : "পূর্ববর্তী পৃষ্ঠা"}
      >
        <ChevronLeft className="h-4 w-4" />
        {prevLabel}
      </button>

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPage(p)}
          aria-current={p === page ? "page" : undefined}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-all ${
            p === page
              ? "bg-brand-blue text-white shadow-md scale-105"
              : "border border-border bg-white text-fg hover:border-brand-blue/40"
          }`}
        >
          {isEn ? String(p) : bnNumber(p)}
        </button>
      ))}

      <button
        type="button"
        onClick={() => page < totalPages && onPage(page + 1)}
        disabled={page === totalPages}
        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-fg hover:border-brand-blue/40 disabled:opacity-40 disabled:hover:border-border transition-colors"
        aria-label={isEn ? "Next page" : "পরবর্তী পৃষ্ঠা"}
      >
        {nextLabel}
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

function EmptyState({
  onReset,
  title,
  sub,
  cta,
}: {
  onReset: () => void;
  title: string;
  sub: string;
  cta: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-10 card p-10 text-center"
    >
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-ash-tint text-fg-muted">
        <Inbox className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-xl font-bold text-fg">{title}</h3>
      <p className="mt-2 text-sm text-fg-muted max-w-md mx-auto">{sub}</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-brand-blue-dark transition-colors"
      >
        {cta}
      </button>
    </motion.div>
  );
}
