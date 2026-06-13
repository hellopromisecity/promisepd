import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import GalleryHeader from "@/components/GalleryHeader";
import GalleryView from "@/components/GalleryView";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();
const OG_IMAGE = absoluteUrl("/og-image.jpg");

const PAGE_TITLE = "গ্যালারি — PromisePD";
const PAGE_DESC =
  "আমাদের প্রকল্পের সর্বশেষ ছবি ও ভিডিও — ফুজালা টাওয়ার, ফুজালা কমপ্লেক্স, আহবাব প্যালেসসহ সকল কাজের একটি ঝলক।";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: "/gallery" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/gallery`,
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

export default function GalleryPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "হোম", url: SITE_URL },
    { name: "গ্যালারি", url: `${SITE_URL}/gallery` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />

      <GalleryHeader />
      <GalleryView />
    </>
  );
}
