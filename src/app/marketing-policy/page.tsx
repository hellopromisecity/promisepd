import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import MarketingPolicyView from "@/components/MarketingPolicyView";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();
const OG_IMAGE = absoluteUrl("/og-image.jpg");

const PAGE_TITLE = "মার্কেটিং পলিসি — PromisePD";
const PAGE_DESC =
  "প্রমিস সিটির মার্কেটার ও রিসেলারদের জন্য অফিসিয়াল মার্কেটিং নীতিমালা — কনটেন্ট ব্যবহার, মূল্য নির্ধারণ, রেফারেন্স, কমিশন ও ক্লায়েন্ট ভিজিটের নিয়মাবলী।";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: "/marketing-policy" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/marketing-policy`,
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

export default function MarketingPolicyPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "হোম", url: SITE_URL },
    { name: "মার্কেটিং পলিসি", url: `${SITE_URL}/marketing-policy` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <MarketingPolicyView />
    </>
  );
}
