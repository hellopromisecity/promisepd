import type { Metadata } from "next";
import ContactView from "@/components/ContactView";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";
import { CONTACT_EN } from "@/lib/pages.en";

const SITE_URL = getSiteUrl();
const OG_IMAGE = absoluteUrl("/og-image.jpg");

const PAGE_TITLE = CONTACT_EN.metaTitle;
const PAGE_DESC = CONTACT_EN.metaDesc;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: {
    canonical: "/en/contact",
    languages: { "bn-BD": "/contact", en: "/en/contact" },
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/en/contact`,
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

const contactPageSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "@id": `${SITE_URL}/en/contact#contactpage`,
  name: PAGE_TITLE,
  url: `${SITE_URL}/en/contact`,
  inLanguage: "en",
  isPartOf: { "@id": `${SITE_URL}#website` },
  about: { "@id": `${SITE_URL}#organization` },
};

export default function EnContactPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: `${SITE_URL}/en` },
    { name: "Contact", url: `${SITE_URL}/en/contact` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <JsonLd data={contactPageSchema} />
      <ContactView />
    </>
  );
}
