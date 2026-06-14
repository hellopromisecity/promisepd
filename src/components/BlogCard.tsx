"use client";

/** Compact blog card used in the 3×3 grid — real cover photo header
 *  with the category + reading-time chips floating on top. */

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Eye, Clock } from "lucide-react";
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

export default function BlogCard({
  post,
  index = 0,
}: {
  post: BlogPost;
  index?: number;
}) {
  const locale = useLocale();
  const isEn = locale === "en";
  const t = DICT[locale].blog;
  const cat = CATEGORY_META[post.category];
  const en = isEn ? BLOG_EN[post.slug] : null;
  const title = en?.title ?? (isEn ? post.titleEn : undefined) ?? post.title;
  const excerpt = en?.excerpt ?? (isEn ? post.excerptEn : undefined) ?? post.excerpt;
  const catLabel = isEn ? CATEGORY_EN[post.category] ?? cat.bn : cat.bn;
  const authorName = isEn ? BLOG_AUTHOR.nameEn : BLOG_AUTHOR.name;
  const num = (n: number) => (isEn ? String(n) : bnNumber(n));
  const dateText = isEn ? formatDateEn(post.iso) : post.date;
  const cover = post.cover ?? BLOG_COVER[post.slug];

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.45, delay: (index % 3) * 0.07 }}
      whileHover={{ y: -6 }}
      className="card group overflow-hidden flex flex-col"
    >
      <Link href={localizedPath(`/blog/${post.slug}`, locale)} className="flex flex-col h-full">
        {/* Real cover photo */}
        <div className="relative h-44 overflow-hidden bg-bg-soft">
          {cover && (
            <Image
              src={cover}
              alt={title}
              fill
              sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          )}
          {/* Soft scrim so the floating chips stay readable on any photo */}
          <div className="absolute inset-0 bg-gradient-to-b from-fg/30 via-transparent to-fg/15" />

          {/* Category chip — top-left */}
          <div className="absolute top-3 left-3 z-10">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                ACCENT_TAG[cat.accent]
              } shadow-md`}
            >
              {catLabel}
            </span>
          </div>

          {/* Reading time — top-right */}
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-fg shadow-md">
              <Clock className="h-3 w-3" />
              {num(post.readingMinutes)} {t.readMins}
            </span>
          </div>
        </div>

        {/* Card body */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-lg font-bold text-fg leading-tight line-clamp-2 group-hover:text-brand-red transition-colors">
            {title}
          </h3>
          <p className="mt-2 text-sm text-fg-muted leading-relaxed line-clamp-3 flex-1">
            {excerpt}
          </p>

          {/* Footer — author + meta */}
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Image
                src={BLOG_AUTHOR.avatarUrl}
                alt={authorName}
                width={28}
                height={28}
                className="h-7 w-7 rounded-full shrink-0 object-cover"
              />
              <span className="text-xs font-semibold text-fg truncate">
                {authorName}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-fg-muted shrink-0">
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {num(post.views)}
              </span>
              <time dateTime={post.iso}>{dateText}</time>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
