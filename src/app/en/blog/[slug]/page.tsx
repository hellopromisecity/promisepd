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
import { BLOG_EN } from "@/lib/blog.en";
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

/** Best social-share image for a post — DB cover → code cover → default. */
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

/** Code slugs prerender; admin-published DB posts render on demand. */
export const dynamicParams = true;
export const revalidate = 60;

export async function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  props: PageProps<"/en/blog/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPublicPostBySlug(slug);
  if (!post) return { title: "Post not found" };

  const en = BLOG_EN[slug];
  const title = en?.title ?? post.titleEn ?? post.title;
  const description = en?.excerpt ?? post.excerptEn ?? post.excerpt;
  const url = `${SITE_URL}/en/blog/${post.slug}`;
  const ogImg = ogImageFor(post);
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
        { url: ogImg, secureUrl: ogImg, type: ogImageType(ogImg), alt: title },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: ogImg, alt: title }],
    },
  };
}

export default async function EnBlogPostPage(
  props: PageProps<"/en/blog/[slug]">,
) {
  const { slug } = await props.params;
  const found = await getPublicPostBySlug(slug);
  if (!found) notFound();

  const en = BLOG_EN[found.slug];
  const cat = CATEGORY_META[found.category];

  // Prev/next + related + sidebar within the merged pool, newest-first,
  // with dynamic view counts folded in.
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
    .slice(0, 10);
  const recent = sorted.filter((p) => p.slug !== post.slug).slice(0, 10);

  const title = en?.title ?? post.titleEn ?? post.title;
  const description = en?.excerpt ?? post.excerptEn ?? post.excerpt;

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
    image: ogImageFor(post),
    url: `${SITE_URL}/en/blog/${post.slug}`,
    datePublished: post.iso,
    dateModified: post.iso,
    inLanguage: "en",
    wordCount: sections.length
      ? sections.reduce(
          (n, s) => n + s.body.join(" ").split(/\s+/).length,
          intro.split(/\s+/).length,
        )
      : post.readingMinutes * 200,
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
      <ViewCounter slug={post.slug} />

      <BlogArticle
        post={post}
        related={related}
        prev={prev}
        next={next}
        locale="en"
        popular={popular}
        recent={recent}
      />
    </>
  );
}
