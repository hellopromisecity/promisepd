import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import TeamView from "@/components/TeamView";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();
const OG_IMAGE = absoluteUrl("/og-image.jpg");

const PAGE_TITLE = "আমাদের টিম — PromisePD";
const PAGE_DESC =
  "প্রমিস গ্রুপের পেছনের মানুষ — যারা প্রতিদিন আপনার স্বপ্নের ঠিকানা গড়তে কাজ করছেন। নেতৃত্ব, ব্যবস্থাপনা এবং অপারেশন টিমের পরিচিতি।";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: "/team" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/team`,
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

export default function TeamPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "হোম", url: SITE_URL },
    { name: "টিম", url: `${SITE_URL}/team` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <TeamView />
    </>
  );
}
