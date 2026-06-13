import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import FormsView from "@/components/FormsView";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";
import { FORMS_EN } from "@/lib/pages.en";

const SITE_URL = getSiteUrl();
const OG_IMAGE = absoluteUrl("/og-image.jpg");

const PAGE_TITLE = FORMS_EN.metaTitle;
const PAGE_DESC = FORMS_EN.metaDesc;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: {
    canonical: "/en/forms",
    languages: { "bn-BD": "/forms", en: "/en/forms" },
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/en/forms`,
    title: PAGE_TITLE,
    description: PAGE_DESC,
    siteName: "PromisePD",
    locale: "en",
    images: [
      { url: OG_IMAGE, secureUrl: OG_IMAGE, type: "image/jpeg", width: 1200, height: 630, alt: PAGE_TITLE },
    ],
  },
  twitter: { card: "summary_large_image", title: PAGE_TITLE, description: PAGE_DESC, images: [{ url: OG_IMAGE, alt: PAGE_TITLE }] },
};

export default function EnFormsPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: `${SITE_URL}/en` },
    { name: "Forms", url: `${SITE_URL}/en/forms` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <FormsView />
    </>
  );
}
