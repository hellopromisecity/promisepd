import type { MetadataRoute } from "next";
import { DIVISIONS, PROJECTS } from "@/lib/site";
import { BLOG_POSTS } from "@/lib/blog";
import { FORMS } from "@/lib/forms";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();

/** Build a sitemap entry for a path that exists in BOTH locales (Bengali
 *  at the root, English under /en). The bn URL is canonical; both are
 *  declared as hreflang alternates so search engines pair them. `path`
 *  is "" for the homepage, otherwise a leading-slash path like "/blog". */
function bilingual(
  path: string,
  opts: {
    lastModified: Date;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  },
): MetadataRoute.Sitemap[number] {
  const bn = `${SITE_URL}${path}`;
  const en = `${SITE_URL}/en${path}`;
  return {
    url: bn,
    lastModified: opts.lastModified,
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates: { languages: { "bn-BD": bn, en } },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    bilingual("", { lastModified: now, changeFrequency: "weekly", priority: 1.0 }),
    bilingual("/partner", { lastModified: now, changeFrequency: "monthly", priority: 0.9 }),
    bilingual("/contact", { lastModified: now, changeFrequency: "monthly", priority: 0.9 }),
    bilingual("/team", { lastModified: now, changeFrequency: "monthly", priority: 0.7 }),
    bilingual("/story", { lastModified: now, changeFrequency: "monthly", priority: 0.8 }),
    bilingual("/leaderboard", { lastModified: now, changeFrequency: "weekly", priority: 0.7 }),
    bilingual("/gallery", { lastModified: now, changeFrequency: "weekly", priority: 0.75 }),
    bilingual("/marketing-policy", { lastModified: now, changeFrequency: "monthly", priority: 0.6 }),
    bilingual("/forms", { lastModified: now, changeFrequency: "monthly", priority: 0.6 }),
    // Division pages.
    ...DIVISIONS.map((d) =>
      bilingual(`/${d.slug}`, { lastModified: now, changeFrequency: "monthly", priority: 0.8 }),
    ),
    // Project detail pages (English mirror lives under /en/projects/…).
    ...PROJECTS.map((p) =>
      bilingual(`/projects/${p.slug}`, { lastModified: now, changeFrequency: "monthly", priority: 0.75 }),
    ),
    // Blog index + posts.
    bilingual("/blog", { lastModified: now, changeFrequency: "weekly", priority: 0.85 }),
    ...BLOG_POSTS.map((p) =>
      bilingual(`/blog/${p.slug}`, { lastModified: new Date(p.iso), changeFrequency: "monthly", priority: 0.7 }),
    ),
    // Official forms (the form documents stay Bengali, but the pages exist
    // in both locales for navigation).
    ...FORMS.map((f) =>
      bilingual(`/forms/${f.slug}`, { lastModified: now, changeFrequency: "monthly", priority: 0.55 }),
    ),
  ];
}
