import type { Metadata } from "next";
import BlogList from "@/components/BlogList";
import BlogHeader from "@/components/BlogHeader";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";
import { BLOG_AUTHOR, BLOG_POSTS } from "@/lib/blog";

const SITE_URL = getSiteUrl();
const OG_IMAGE = absoluteUrl("/og-image.jpg");

const PAGE_TITLE = "প্রমিস জার্নাল — রিয়েল এস্টেট গাইড, নোটিশ ও রিসোর্স";
const PAGE_DESC =
  "প্রমিস গ্রুপের অফিসিয়াল ব্লগ — প্রকল্প পরিচিতি, মার্কেটিং নোটিশ, বুকিং নিয়মাবলী এবং ফ্ল্যাট/জমি কেনার সম্পূর্ণ রিসোর্স গাইড। সব Bangla-তে, কামরুল হাসান-এর কলম থেকে।";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/blog`,
    title: PAGE_TITLE,
    description: PAGE_DESC,
    siteName: "PromisePD",
    locale: "bn_BD",
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

export default function BlogPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "হোম", url: SITE_URL },
    { name: "ব্লগ", url: `${SITE_URL}/blog` },
  ]);

  // Schema.org Blog with each post listed — boosts SEO + lets search
  // engines understand the index page as a content hub.
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${SITE_URL}/blog#blog`,
    name: PAGE_TITLE,
    description: PAGE_DESC,
    url: `${SITE_URL}/blog`,
    inLanguage: "bn-BD",
    publisher: { "@id": `${SITE_URL}#organization` },
    author: {
      "@type": "Person",
      name: BLOG_AUTHOR.name,
      alternateName: BLOG_AUTHOR.nameEn,
    },
    blogPost: BLOG_POSTS.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${SITE_URL}/blog/${p.slug}`,
      datePublished: p.iso,
      dateModified: p.iso,
      author: { "@type": "Person", name: BLOG_AUTHOR.name },
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
