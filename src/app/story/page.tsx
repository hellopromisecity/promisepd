import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import StoryView from "@/components/StoryView";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();
const OG_IMAGE = absoluteUrl("/og-image.jpg");

const PAGE_TITLE = "পেছনের গল্প — PromisePD";
const PAGE_DESC =
  "যাঁর স্বপ্নে আজ হাজারো পরিবারের ঠিকানা — হাফেজ মাওলানা মুফতি কামরুল হাসানের জীবনযাত্রা। গ্রামের সাধারণ ছেলে থেকে প্রমিস গ্রুপের কর্ণধার, মাইলফলকে গাঁথা এক স্বপ্নযাত্রা।";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: "/story" },
  openGraph: {
    type: "profile",
    url: `${SITE_URL}/story`,
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

export default function StoryPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "হোম", url: SITE_URL },
    { name: "পেছনের গল্প", url: `${SITE_URL}/story` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <StoryView />
    </>
  );
}
