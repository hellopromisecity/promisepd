"use client";

/** Wide "featured" card shown ONLY at the top of page 1.  Two-column
 *  layout on desktop (big visual left, copy + CTA right); stacks on
 *  mobile.  The post is also kept out of the grid below so it never
 *  appears twice. */

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, Eye, Clock, ArrowRight, Sparkles } from "lucide-react";
import {
  BLOG_AUTHOR,
  BLOG_COVER,
  CATEGORY_META,
  bnNumber,
  type BlogPost,
} from "@/lib/blog";
import { BLOG_EN, CATEGORY_EN, formatDateEn } from "@/lib/blog.en";
import { DICT, localizedPath } from "@/lib/i18n";
import { useLocale } from "./LocaleProvider";

const ACCENT_TAG: Record<string, string> = {
  red: "bg-brand-red text-white",
  blue: "bg-brand-blue text-white",
  ash: "bg-brand-ash text-fg",
};

export default function BlogFeatured({ post }: { post: BlogPost }) {
  const locale = useLocale();
  const isEn = locale === "en";
  const t = DICT[locale].blog;
  const cat = CATEGORY_META[post.category];
  const en = isEn ? BLOG_EN[post.slug] : null;
  const title = en?.title ?? post.title;
  const excerpt = en?.excerpt ?? post.excerpt;
  const catLabel = isEn ? CATEGORY_EN[post.category] ?? cat.bn : cat.bn;
  const authorName = isEn ? BLOG_AUTHOR.nameEn : BLOG_AUTHOR.name;
  const authorRole = isEn ? "MD & CEO, Promise Group" : BLOG_AUTHOR.role;
  const num = (n: number) => (isEn ? String(n) : bnNumber(n));
  const dateText = isEn ? formatDateEn(post.iso) : post.date;
  const cover = BLOG_COVER[post.slug];

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.55 }}
      className="card overflow-hidden group"
    >
      <Link
        href={localizedPath(`/blog/${post.slug}`, locale)}
        className="grid lg:grid-cols-5 h-full"
      >
        {/* Visual — left 2/5 on desktop, real cover photo */}
        <div className="relative lg:col-span-2 min-h-[280px] lg:min-h-[360px] overflow-hidden bg-bg-soft">
          {cover && (
            <Image
              src={cover}
              alt={title}
              fill
              sizes="(min-width:1024px) 40vw, 100vw"
              priority
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-fg/35 via-transparent to-fg/20" />

          {/* Featured ribbon */}
          <div className="absolute top-4 left-4 z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-red shadow-md">
              <Sparkles className="h-3.5 w-3.5" />
              {isEn ? "Featured post" : "ফিচার্ড পোস্ট"}
            </span>
          </div>

          <div className="absolute top-4 right-4 z-10">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${
                ACCENT_TAG[cat.accent]
              } shadow-md border border-white/30`}
            >
              {catLabel}
            </span>
          </div>
        </div>

        {/* Copy — right 3/5 */}
        <div className="lg:col-span-3 p-6 sm:p-8 flex flex-col">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-fg-muted">
            <span className="inline-flex items-center gap-1 rounded-full bg-bg-soft px-2.5 py-1 font-semibold">
              <Clock className="h-3 w-3" />
              {num(post.readingMinutes)} {t.readMinsLong}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-bg-soft px-2.5 py-1 font-semibold">
              <Eye className="h-3 w-3" />
              {num(post.views)} {t.views}
            </span>
            <time
              dateTime={post.iso}
              className="inline-flex items-center gap-1 rounded-full bg-bg-soft px-2.5 py-1 font-semibold"
            >
              <Calendar className="h-3 w-3" />
              {dateText}
            </time>
          </div>

          <h2 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold text-fg leading-tight group-hover:text-brand-red transition-colors">
            {title}
          </h2>

          <p className="mt-3 text-base text-fg-muted leading-relaxed line-clamp-3 sm:line-clamp-4">
            {excerpt}
          </p>

          <div className="mt-auto pt-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Image
                src={BLOG_AUTHOR.avatarUrl}
                alt={authorName}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full shrink-0 object-cover"
              />
              <div className="min-w-0">
                <div className="text-sm font-bold text-fg truncate">
                  {authorName}
                </div>
                <div className="text-[11px] text-fg-faint truncate">
                  {authorRole}
                </div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-grad-rb group-hover:gap-3 transition-all whitespace-nowrap">
              {isEn ? "Read" : "পড়ুন"}
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
