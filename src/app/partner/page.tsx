import type { Metadata } from "next";
import { PARTNER_HEADLINE } from "@/lib/partner";
import PartnerView from "@/components/PartnerView";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();
const OG_IMAGE = absoluteUrl("/og-image.jpg");

const PAGE_TITLE = "পার্টনার হোন — নিজের আয়ের লক্ষ্য নিজে ঠিক করুন";
const PAGE_DESC = `প্রমিস গ্রুপের পার্টনার প্রোগ্রাম। মাত্র ${PARTNER_HEADLINE.referralsTarget} জন রেফার করে ফ্রি উমরাহ + ৳ ${PARTNER_HEADLINE.totalValueBn} টাকার পুরস্কার। ক্যালকুলেটরে আয়ের লক্ষ্য সেট করুন, প্ল্যান বানান।`;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: "/partner" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/partner`,
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

export default function PartnerPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "হোম", url: SITE_URL },
    { name: "পার্টনার হোন", url: `${SITE_URL}/partner` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <PartnerView />
    </>
  );
}
