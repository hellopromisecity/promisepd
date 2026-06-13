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
  props: PageProps<"/blog/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "পোস্ট পাওয়া যায়নি" };

  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.excerpt,
      siteName: "PromisePD",
      locale: "bn_BD",
      publishedTime: post.iso,
      authors: [BLOG_AUTHOR.name],
      images: [
        {
          url: OG_IMAGE,
          secureUrl: OG_IMAGE,
          type: "image/jpeg",
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [{ url: OG_IMAGE, alt: post.title }],
    },
  };
}

export default async function BlogPostPage(
  props: PageProps<"/blog/[slug]">,
) {
  const { slug } = await props.params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const cat = CATEGORY_META[post.category];
  const related = getRelatedPosts(post.slug, 3);

  // Prev/next within the full chronological list (newest-first).
  const sorted = [...BLOG_POSTS].sort((a, b) => (a.iso < b.iso ? 1 : -1));
  const idx = sorted.findIndex((p) => p.slug === post.slug);
  const prev = sorted[(idx - 1 + sorted.length) % sorted.length];
  const next = sorted[(idx + 1) % sorted.length];

  const breadcrumb = breadcrumbSchema([
    { name: "হোম", url: SITE_URL },
    { name: "ব্লগ", url: `${SITE_URL}/blog` },
    { name: post.title, url: `${SITE_URL}/blog/${post.slug}` },
  ]);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${SITE_URL}/blog/${post.slug}#article`,
    headline: post.title,
    description: post.excerpt,
    image: OG_IMAGE,
    url: `${SITE_URL}/blog/${post.slug}`,
    datePublished: post.iso,
    dateModified: post.iso,
    inLanguage: "bn-BD",
    wordCount: post.sections.reduce(
      (n, s) => n + s.body.join(" ").split(/\s+/).length,
      post.intro.split(/\s+/).length,
    ),
    author: {
      "@type": "Person",
      name: BLOG_AUTHOR.name,
      alternateName: BLOG_AUTHOR.nameEn,
    },
    publisher: { "@id": `${SITE_URL}#organization` },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${post.slug}` },
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
        locale="bn"
      />
    </>
  );
}
