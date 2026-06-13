"use client";

/** Shared, locale-aware article body for a single blog post. Rendered by
 *  both /blog/[slug] (Bengali, root) and /en/blog/[slug] (English). The
 *  Bengali BlogPost data is passed in unchanged; English text is overlaid
 *  from BLOG_EN when locale === "en", preserving cover, category, order
 *  and chronology. */

import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  Clock,
  Calendar,
  Phone,
  Mail,
} from "lucide-react";
import BlogCard from "./BlogCard";
import { SITE } from "@/lib/site";
import {
  BLOG_AUTHOR,
  BLOG_COVER,
  CATEGORY_META,
  bnNumber,
  type BlogPost,
} from "@/lib/blog";
import { BLOG_EN, CATEGORY_EN, formatDateEn } from "@/lib/blog.en";
import { DICT, localizedPath, type Locale } from "@/lib/i18n";

const ACCENT_TAG: Record<string, string> = {
  red: "bg-brand-red text-white",
  blue: "bg-brand-blue text-white",
  ash: "bg-brand-ash text-fg",
};

export default function BlogArticle({
  post,
  related,
  prev,
  next,
  locale,
}: {
  post: BlogPost;
  related: BlogPost[];
  prev: BlogPost;
  next: BlogPost;
  locale: Locale;
}) {
  const isEn = locale === "en";
  const t = DICT[locale].blog;
  const lp = (href: string) => localizedPath(href, locale);
  const num = (n: number) => (isEn ? String(n) : bnNumber(n));

  const cover = BLOG_COVER[post.slug];
  const cat = CATEGORY_META[post.category];
  const catLabel = isEn ? CATEGORY_EN[post.category] ?? cat.bn : cat.bn;

  const en = isEn ? BLOG_EN[post.slug] : null;
  const title = en?.title ?? post.title;
  const intro = en?.intro ?? post.intro;
  const sections = en?.sections ?? post.sections;
  const closing = en?.closing ?? post.closing;

  const authorName = isEn ? BLOG_AUTHOR.nameEn : BLOG_AUTHOR.name;
  const dateText = isEn ? formatDateEn(post.iso) : post.date;

  const prevTitle = isEn ? BLOG_EN[prev.slug]?.title ?? prev.title : prev.title;
  const nextTitle = isEn ? BLOG_EN[next.slug]?.title ?? next.title : next.title;

  return (
    <>
      {/* Article header / hero */}
      <section className="relative pt-28 pb-12 sm:pt-32 sm:pb-16">
        <div className="absolute inset-0 -z-10 mesh-bg-soft" />
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link
            href={lp("/blog")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted hover:text-brand-red transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t.backToList}
          </Link>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${
                ACCENT_TAG[cat.accent]
              } shadow-sm`}
            >
              {catLabel}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-bg-soft px-3 py-1.5 text-[11px] font-semibold text-fg-muted">
              <Clock className="h-3 w-3" />
              {num(post.readingMinutes)} {t.readMinsLong}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-bg-soft px-3 py-1.5 text-[11px] font-semibold text-fg-muted">
              <Eye className="h-3 w-3" />
              {num(post.views)} {t.views}
            </span>
            <time
              dateTime={post.iso}
              className="inline-flex items-center gap-1 rounded-full bg-bg-soft px-3 py-1.5 text-[11px] font-semibold text-fg-muted"
            >
              <Calendar className="h-3 w-3" />
              {dateText}
            </time>
          </div>

          <h1 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.12] text-fg">
            {title}
          </h1>

          <div className="mt-6 flex items-center gap-3">
            <Image
              src={BLOG_AUTHOR.avatarUrl}
              alt={authorName}
              width={44}
              height={44}
              className="h-11 w-11 rounded-full shrink-0 object-cover"
            />
            <div className="min-w-0">
              <div className="text-sm font-bold text-fg">{authorName}</div>
              <div className="text-[11px] text-fg-muted">{BLOG_AUTHOR.role}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Article visual — real cover photo */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden shadow-xl h-56 sm:h-72 lg:h-80 bg-bg-soft">
          {cover && (
            <Image
              src={cover}
              alt={title}
              fill
              priority
              sizes="(min-width:1024px) 896px, 100vw"
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-fg/25 to-transparent" />
        </div>
      </div>

      {/* Article body */}
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <p className="text-lg sm:text-xl text-fg-soft leading-relaxed font-medium first-letter:text-5xl first-letter:font-bold first-letter:text-brand-red first-letter:float-left first-letter:mr-2 first-letter:leading-none">
          {intro}
        </p>

        <div className="mt-10 space-y-10">
          {sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-2xl sm:text-3xl font-bold text-fg leading-tight">
                {section.heading}
              </h2>
              <div className="mt-4 space-y-4">
                {section.body.map((p, j) => (
                  <p
                    key={j}
                    className="text-base sm:text-lg text-fg-soft leading-relaxed"
                  >
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {closing && (
          <div className="mt-12 rounded-2xl border-l-4 border-brand-red bg-bg-soft px-6 py-5">
            <p className="text-base sm:text-lg text-fg-soft leading-relaxed italic">
              {closing}
            </p>
          </div>
        )}

        {/* Author card */}
        <div className="mt-12 card p-6 flex items-start gap-4">
          <Image
            src={BLOG_AUTHOR.avatarUrl}
            alt={authorName}
            width={64}
            height={64}
            className="h-16 w-16 rounded-2xl shrink-0 object-cover"
          />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.2em] text-fg-faint">
              {t.authorLabel}
            </div>
            <div className="mt-1 text-lg font-bold text-fg">{authorName}</div>
            <p className="mt-1 text-sm text-fg-muted leading-relaxed">
              {isEn
                ? `${BLOG_AUTHOR.role}. ${t.authorBio}`
                : `${BLOG_AUTHOR.role}। ${t.authorBio}`}
            </p>
          </div>
        </div>
      </article>

      {/* CTA */}
      <section className="relative pb-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grad-border p-7 sm:p-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
              {t.ctaHead}
            </h2>
            <p className="mt-3 text-base text-fg-muted max-w-2xl mx-auto">
              {t.ctaSub}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={`tel:${SITE.phone}`}
                className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark hover:scale-[1.02] transition-all"
              >
                <Phone className="h-4 w-4" />
                {isEn ? SITE.phoneDisplayEn : SITE.phoneDisplay}
              </a>
              <Link
                href={lp("/#contact")}
                className="inline-flex items-center gap-2 rounded-2xl bg-white border border-border px-6 py-3 text-sm font-semibold text-fg hover:border-brand-blue/40 hover:shadow-lg transition-all"
              >
                <Mail className="h-4 w-4 text-brand-red" />
                {t.sendMsg}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="relative pb-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-fg leading-tight">
              {t.relatedTitle}
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p, i) => (
                <BlogCard key={p.slug} post={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Prev / next */}
      <section className="relative pb-20 sm:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              href={lp(`/blog/${prev.slug}`)}
              className="card group p-5 flex items-center gap-4 hover:scale-[1.01] transition-transform"
            >
              <ArrowLeft className="h-5 w-5 text-fg-muted group-hover:text-brand-red transition-colors shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-[0.2em] text-fg-faint">
                  {t.prevPost}
                </div>
                <div className="text-sm font-bold text-fg truncate">
                  {prevTitle}
                </div>
              </div>
            </Link>
            <Link
              href={lp(`/blog/${next.slug}`)}
              className="card group p-5 flex items-center gap-4 sm:text-right hover:scale-[1.01] transition-transform"
            >
              <div className="min-w-0 flex-1 sm:order-1">
                <div className="text-[10px] uppercase tracking-[0.2em] text-fg-faint">
                  {t.nextPost}
                </div>
                <div className="text-sm font-bold text-fg truncate">
                  {nextTitle}
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-fg-muted group-hover:text-brand-red transition-colors sm:order-2 shrink-0" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
