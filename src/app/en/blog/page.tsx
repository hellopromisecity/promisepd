import type { Metadata } from "next";
import BlogList from "@/components/BlogList";
import BlogHeader from "@/components/BlogHeader";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";
import { BLOG_AUTHOR, BLOG_POSTS } from "@/lib/blog";
import { BLOG_EN } from "@/lib/blog.en";

const SITE_URL = getSiteUrl();
const OG_IMAGE = absoluteUrl("/og-image.jpg");

const PAGE_TITLE = "Promise Journal — real-estate guides, notices & resources";
const PAGE_DESC =
  "Promise Group's official blog — project guides, marketing notices, booking rules and complete flat & land buying resources, from the pen of Kamrul Hasan.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: {
    canonical: "/en/blog",
    languages: { "bn-BD": "/blog", en: "/en/blog" },
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/en/blog`,
    title: PAGE_TITLE,
    description: PAGE_DESC,
    siteName: "PromisePD",
    locale: "en",
    images: [
      {
        url: OG_IMAGE,
        secureUrl: OG_IMAGE,
        type: "image/jpeg",
        width: 1200,
        height: 630,
        alt: PAGE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESC,
    images: [{ url: OG_IMAGE, alt: PAGE_TITLE }],
  },
};

export default function EnBlogPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: `${SITE_URL}/en` },
    { name: "Blog", url: `${SITE_URL}/en/blog` },
  ]);

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${SITE_URL}/en/blog#blog`,
    name: PAGE_TITLE,
    description: PAGE_DESC,
    url: `${SITE_URL}/en/blog`,
    inLanguage: "en",
    publisher: { "@id": `${SITE_URL}#organization` },
    author: {
      "@type": "Person",
      name: BLOG_AUTHOR.nameEn,
      alternateName: BLOG_AUTHOR.name,
    },
    blogPost: BLOG_POSTS.map((p) => ({
      "@type": "BlogPosting",
      headline: BLOG_EN[p.slug]?.title ?? p.title,
      url: `${SITE_URL}/en/blog/${p.slug}`,
      datePublished: p.iso,
      dateModified: p.iso,
      author: { "@type": "Person", name: BLOG_AUTHOR.nameEn },
    })),
  };

  return (
    <>
      <JsonLd data={breadcrumb} />
      <JsonLd data={blogSchema} />

      <BlogHeader />
      <BlogList />
    </>
  );
}
