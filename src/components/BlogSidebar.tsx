"use client";

/** Sticky article sidebar: a premium author card (links to the story
 *  page), the most-viewed posts, and the newest posts.  Rendered beside
 *  the article body on /blog/[slug] and /en/blog/[slug]. */

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Eye, Clock, Flame, Sparkles, BadgeCheck } from "lucide-react";
import {
  BLOG_AUTHOR,
  BLOG_COVER,
  CATEGORY_META,
  bnNumber,
  type BlogPost,
} from "@/lib/blog";
import { BLOG_EN, CATEGORY_EN, formatDateEn } from "@/lib/blog.en";
import { localizedPath, type Locale } from "@/lib/i18n";

const COPY = {
  bn: {
    eyebrow: "লেখক",
    bio: "প্রমিস গ্রুপের প্রতিষ্ঠাতা ও প্রধান পরিচালক। ১৫+ বছরের অভিজ্ঞতায় ঢাকার রিয়েল এস্টেট ইন্ডাস্ট্রিতে স্বচ্ছতা ও বিশ্বাসের নতুন মান গড়ে তুলেছেন।",
    moreAbout: "পেছনের গল্প",
    years: "১৫+ বছরের অভিজ্ঞতা",
    verified: "ভেরিফায়েড",
    popular: "জনপ্রিয় পোস্ট",
    recent: "সাম্প্রতিক পোস্ট",
    views: "ভিউ",
    mins: "মিনিট",
  },
  en: {
    eyebrow: "Author",
    bio: "Founder & Managing Director of Promise Group. Over 15 years setting a new standard of transparency and trust in Dhaka's real-estate industry.",
    moreAbout: "Our story",
    years: "15+ years of experience",
    verified: "Verified",
    popular: "Popular posts",
    recent: "Recent posts",
    views: "views",
    mins: "min",
  },
};

export default function BlogSidebar({
  popular,
  recent,
  locale,
}: {
  popular: BlogPost[];
  recent: BlogPost[];
  locale: Locale;
}) {
  const isEn = locale === "en";
  const t = COPY[locale];
  const num = (n: number) => (isEn ? String(n) : bnNumber(n));
  const lp = (href: string) => localizedPath(href, locale);
  const authorName = isEn ? BLOG_AUTHOR.nameEn : BLOG_AUTHOR.name;
  const titleOf = (p: BlogPost) =>
    isEn ? BLOG_EN[p.slug]?.title ?? p.titleEn ?? p.title : p.title;
  const coverOf = (p: BlogPost) => p.cover ?? BLOG_COVER[p.slug];

  return (
    <aside className="mt-10 lg:mt-0 lg:sticky lg:top-24 self-start space-y-6">
      {/* ── Author card ───────────────────────────────────────── */}
      <div className="overflow-hidden rounded-3xl border border-border bg-bg shadow-[var(--shadow-brand)]">
        {/* Gradient banner */}
        <div className="relative h-20 bg-gradient-to-br from-brand-blue via-brand-blue-dark to-brand-red">
          <div className="absolute inset-0 opacity-30 mix-blend-overlay [background:radial-gradient(circle_at_20%_20%,#fff_0,transparent_45%)]" />
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-brand-blue-dark shadow-sm">
            <BadgeCheck className="h-3 w-3" /> {t.verified}
          </span>
        </div>

        <div className="px-5 pb-5 -mt-12 text-center">
          <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-brand-blue to-brand-red p-[3px] shadow-lg">
            <Image
              src={BLOG_AUTHOR.avatarUrl}
              alt={authorName}
              width={96}
              height={96}
              className="h-full w-full rounded-full object-cover ring-2 ring-white"
            />
          </div>
          <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-fg-faint">
            {t.eyebrow}
          </div>
          <div className="mt-0.5 text-lg font-bold text-fg">{authorName}</div>
          <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-brand-blue-tint px-3 py-1 text-[11px] font-semibold text-brand-blue-dark">
            <Sparkles className="h-3 w-3" />
            {isEn ? "MD & CEO, Promise Group" : "MD & CEO, Promise Group"}
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-fg-muted">{t.bio}</p>

          <div className="mt-3 rounded-xl bg-bg-soft px-3 py-2 text-[11px] font-semibold text-fg-muted">
            🏆 {t.years}
          </div>

          <Link
            href={lp("/story")}
            className="group mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-fg px-4 py-2.5 text-sm font-bold text-bg transition-all hover:gap-3 hover:bg-brand-blue"
          >
            {t.moreAbout}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* ── Popular posts ─────────────────────────────────────── */}
      {popular.length > 0 && (
        <SidebarList
          title={t.popular}
          icon={<Flame className="h-4 w-4 text-brand-red" />}
          posts={popular}
          ranked
          renderMeta={(p) => (
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3 w-3" /> {num(p.views)} {t.views}
            </span>
          )}
          lp={lp}
          titleOf={titleOf}
          coverOf={coverOf}
        />
      )}

      {/* ── Recent posts ──────────────────────────────────────── */}
      {recent.length > 0 && (
        <SidebarList
          title={t.recent}
          icon={<Clock className="h-4 w-4 text-brand-blue" />}
          posts={recent}
          renderMeta={(p) => (
            <span>{isEn ? formatDateEn(p.iso) : p.date}</span>
          )}
          lp={lp}
          titleOf={titleOf}
          coverOf={coverOf}
        />
      )}
    </aside>
  );
}

function SidebarList({
  title,
  icon,
  posts,
  ranked = false,
  renderMeta,
  lp,
  titleOf,
  coverOf,
}: {
  title: string;
  icon: React.ReactNode;
  posts: BlogPost[];
  ranked?: boolean;
  renderMeta: (p: BlogPost) => React.ReactNode;
  lp: (href: string) => string;
  titleOf: (p: BlogPost) => string;
  coverOf: (p: BlogPost) => string | undefined;
}) {
  return (
    <div className="rounded-3xl border border-border bg-bg p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold text-fg">
        {icon}
        {title}
      </h3>
      <ul className="mt-3 space-y-1">
        {posts.map((p, i) => {
          const cover = coverOf(p);
          const cat = CATEGORY_META[p.category];
          return (
            <li key={p.slug}>
              <Link
                href={lp(`/blog/${p.slug}`)}
                className="group flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-bg-soft"
              >
                {ranked ? (
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-bg-soft text-xs font-extrabold text-fg-faint group-hover:bg-brand-red group-hover:text-white">
                    {i + 1}
                  </span>
                ) : null}
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-bg-soft">
                  {cover && (
                    <Image
                      src={cover}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  )}
                  <span
                    className={`absolute inset-x-0 bottom-0 h-1 ${
                      cat.accent === "red"
                        ? "bg-brand-red"
                        : cat.accent === "blue"
                          ? "bg-brand-blue"
                          : "bg-brand-ash"
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-[13px] font-semibold leading-snug text-fg group-hover:text-brand-blue">
                    {titleOf(p)}
                  </div>
                  <div className="mt-0.5 text-[11px] text-fg-faint">{renderMeta(p)}</div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
