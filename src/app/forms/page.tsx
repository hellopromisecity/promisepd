import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import FormsView from "@/components/FormsView";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();
const OG_IMAGE = absoluteUrl("/og-image.jpg");

const PAGE_TITLE = "ফর্ম — PromisePD";
const PAGE_DESC =
  "প্রমিস গ্রুপের সকল অফিসিয়াল ফরম অনলাইনেই পূরণ করুন — ফ্ল্যাট বরাদ্দ, বিনিয়োগ, প্রমিস সিটি, ফুজালা টাওয়ার ও কমপ্লেক্স, মার্কেটিং ডিরেক্টর। পূরণ করলেই সরাসরি অফিসে পৌঁছে যায়।";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: "/forms" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/forms`,
    title: PAGE_TITLE,
    description: PAGE_DESC,
    siteName: "PromisePD",
    locale: "bn_BD",
    images: [
      { url: OG_IMAGE, secureUrl: OG_IMAGE, type: "image/jpeg", width: 1200, height: 630, alt: PAGE_TITLE },
    ],
  },
  twitter: { card: "summary_large_image", title: PAGE_TITLE, description: PAGE_DESC, images: [{ url: OG_IMAGE, alt: PAGE_TITLE }] },
};

export default function FormsPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "হোম", url: SITE_URL },
    { name: "ফর্ম", url: `${SITE_URL}/forms` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <FormsView />
    </>
  );
}
