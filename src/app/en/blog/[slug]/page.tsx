import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import BlogArticle from "@/components/BlogArticle";
import {
  BLOG_AUTHOR,
  BLOG_POSTS,
  CATEGORY_META,
  getPostBySlug,
  getRelatedPosts,
} from "@/lib/blog";
import { BLOG_EN } from "@/lib/blog.en";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();
const OG_IMAGE = absoluteUrl("/og-image.jpg");

/** Only the 12 known slugs prerender — every other URL 404s. */
export const dynamicParams = false;

export async function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  props: PageProps<"/en/blog/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post not found" };

  const en = BLOG_EN[slug];
  const title = en?.title ?? post.title;
  const description = en?.excerpt ?? post.excerpt;
  const url = `${SITE_URL}/en/blog/${post.slug}`;
  return {
    title,
    description,
    alternates: {
      canonical: `/en/blog/${post.slug}`,
      languages: { "bn-BD": `/blog/${post.slug}`, en: `/en/blog/${post.slug}` },
    },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: "PromisePD",
      locale: "en",
      publishedTime: post.iso,
      authors: [BLOG_AUTHOR.nameEn],
      images: [
        {
          url: OG_IMAGE,
          secureUrl: OG_IMAGE,
          type: "image/jpeg",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: OG_IMAGE, alt: title }],
    },
  };
}

export default async function EnBlogPostPage(
  props: PageProps<"/en/blog/[slug]">,
) {
  const { slug } = await props.params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const en = BLOG_EN[post.slug];
  const cat = CATEGORY_META[post.category];
  const related = getRelatedPosts(post.slug, 3);

  // Prev/next within the full chronological list (newest-first).
  const sorted = [...BLOG_POSTS].sort((a, b) => (a.iso < b.iso ? 1 : -1));
  const idx = sorted.findIndex((p) => p.slug === post.slug);
  const prev = sorted[(idx - 1 + sorted.length) % sorted.length];
  const next = sorted[(idx + 1) % sorted.length];

  const title = en?.title ?? post.title;
  const description = en?.excerpt ?? post.excerpt;

  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: `${SITE_URL}/en` },
    { name: "Blog", url: `${SITE_URL}/en/blog` },
    { name: title, url: `${SITE_URL}/en/blog/${post.slug}` },
  ]);

  const sections = en?.sections ?? post.sections;
  const intro = en?.intro ?? post.intro;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${SITE_URL}/en/blog/${post.slug}#article`,
    headline: title,
    description,
    image: OG_IMAGE,
    url: `${SITE_URL}/en/blog/${post.slug}`,
    datePublished: post.iso,
    dateModified: post.iso,
    inLanguage: "en",
    wordCount: sections.reduce(
      (n, s) => n + s.body.join(" ").split(/\s+/).length,
      intro.split(/\s+/).length,
    ),
    author: {
      "@type": "Person",
      name: BLOG_AUTHOR.nameEn,
      alternateName: BLOG_AUTHOR.name,
    },
    publisher: { "@id": `${SITE_URL}#organization` },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/en/blog/${post.slug}`,
    },
    articleSection: cat.en,
  };

  return (
    <>
      <JsonLd data={breadcrumb} />
      <JsonLd data={articleSchema} />

      <BlogArticle
        post={post}
        related={related}
        prev={prev}
        next={next}
        locale="en"
      />
    </>
  );
}
