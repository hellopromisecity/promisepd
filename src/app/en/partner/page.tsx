import type { Metadata } from "next";
import PartnerView from "@/components/PartnerView";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";
import { PARTNER_EN } from "@/lib/pages.en";

const SITE_URL = getSiteUrl();
const OG_IMAGE = absoluteUrl("/og-image.jpg");

const PAGE_TITLE = PARTNER_EN.metaTitle;
const PAGE_DESC = PARTNER_EN.metaDesc;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: {
    canonical: "/en/partner",
    languages: { "bn-BD": "/partner", en: "/en/partner" },
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/en/partner`,
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

export default function EnPartnerPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: `${SITE_URL}/en` },
    { name: "Become a Partner", url: `${SITE_URL}/en/partner` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <PartnerView />
    </>
  );
}
