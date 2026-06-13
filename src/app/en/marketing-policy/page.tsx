import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import MarketingPolicyView from "@/components/MarketingPolicyView";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";
import { POLICY_EN } from "@/lib/pages.en";

const SITE_URL = getSiteUrl();
const OG_IMAGE = absoluteUrl("/og-image.jpg");

const PAGE_TITLE = POLICY_EN.metaTitle;
const PAGE_DESC = POLICY_EN.metaDesc;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: {
    canonical: "/en/marketing-policy",
    languages: { "bn-BD": "/marketing-policy", en: "/en/marketing-policy" },
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/en/marketing-policy`,
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

export default function EnMarketingPolicyPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: `${SITE_URL}/en` },
    { name: "Marketing Policy", url: `${SITE_URL}/en/marketing-policy` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <MarketingPolicyView />
    </>
  );
}
