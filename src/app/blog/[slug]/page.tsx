import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import BlogArticle from "@/components/BlogArticle";
import {
  BLOG_AUTHOR,
  BLOG_COVER,
  BLOG_POSTS,
  CATEGORY_META,
  type BlogPost,
} from "@/lib/blog";
import {
  getAllPublicPosts,
  getPublicPostBySlug,
  getViewCounts,
  relatedFrom,
  withViewCounts,
} from "@/lib/blog-db";
import ViewCounter from "@/components/ViewCounter";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();
const OG_IMAGE = absoluteUrl("/og-image.jpg");

/** Best social-share image for a post: DB cover (already absolute) →
 *  code cover (local path, made absolute) → the site default.  Used so
 *  WhatsApp / Facebook show the post's own banner instead of a generic. */
function ogImageFor(post: BlogPost): string {
  if (post.cover) return post.cover;
  const local = BLOG_COVER[post.slug];
  return local ? absoluteUrl(local) : OG_IMAGE;
}
function ogImageType(url: string): string {
  if (url.endsWith(".png")) return "image/png";
  if (url.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

/** The code-defined slugs prerender; admin-published DB posts render on
 *  demand (then ISR-cache) instead of 404ing. */
export const dynamicParams = true;
export const revalidate = 60;

export async function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  props: PageProps<"/blog/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPublicPostBySlug(slug);
  if (!post) return { title: "পোস্ট পাওয়া যায়নি" };

  const url = `${SITE_URL}/blog/${post.slug}`;
  const ogImg = ogImageFor(post);
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
        { url: ogImg, secureUrl: ogImg, type: ogImageType(ogImg), alt: post.title },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [{ url: ogImg, alt: post.title }],
    },
  };
}

export default async function BlogPostPage(
  props: PageProps<"/blog/[slug]">,
) {
  const { slug } = await props.params;
  const found = await getPublicPostBySlug(slug);
  if (!found) notFound();

  const cat = CATEGORY_META[found.category];

  // Prev/next + related + sidebar within the merged pool (code + DB),
  // newest-first, with dynamic view counts folded in.
  const counts = await getViewCounts();
  const sorted = withViewCounts(await getAllPublicPosts(), counts);
  const post = { ...found, views: found.views + (counts[found.slug] ?? 0) };
  const related = relatedFrom(sorted, post.slug, 3);
  const idx = sorted.findIndex((p) => p.slug === post.slug);
  const prev = sorted[(idx - 1 + sorted.length) % sorted.length];
  const next = sorted[(idx + 1) % sorted.length];

  const popular = [...sorted]
    .filter((p) => p.slug !== post.slug)
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);
  const recent = sorted.filter((p) => p.slug !== post.slug).slice(0, 5);

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
    image: ogImageFor(post),
    url: `${SITE_URL}/blog/${post.slug}`,
    datePublished: post.iso,
    dateModified: post.iso,
    inLanguage: "bn-BD",
    wordCount: post.sections.length
      ? post.sections.reduce(
          (n, s) => n + s.body.join(" ").split(/\s+/).length,
          post.intro.split(/\s+/).length,
        )
      : post.readingMinutes * 200,
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
      <ViewCounter slug={post.slug} />

      <BlogArticle
        post={post}
        related={related}
        prev={prev}
        next={next}
        locale="bn"
        popular={popular}
        recent={recent}
      />
    </>
  );
}
