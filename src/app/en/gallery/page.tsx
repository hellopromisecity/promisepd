import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import GalleryHeader from "@/components/GalleryHeader";
import GalleryView from "@/components/GalleryView";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";
import { GALLERY_EN } from "@/lib/pages.en";

const SITE_URL = getSiteUrl();
const OG_IMAGE = absoluteUrl("/og-image.jpg");

const PAGE_TITLE = GALLERY_EN.metaTitle;
const PAGE_DESC = GALLERY_EN.metaDesc;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: {
    canonical: "/en/gallery",
    languages: { "bn-BD": "/gallery", en: "/en/gallery" },
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/en/gallery`,
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

export default function EnGalleryPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: `${SITE_URL}/en` },
    { name: "Gallery", url: `${SITE_URL}/en/gallery` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <GalleryHeader />
      <GalleryView />
    </>
  );
}
