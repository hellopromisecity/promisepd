import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import StoryView from "@/components/StoryView";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";
import { STORY_EN } from "@/lib/pages.en";

const SITE_URL = getSiteUrl();
const OG_IMAGE = absoluteUrl("/og-image.jpg");

const PAGE_TITLE = STORY_EN.metaTitle;
const PAGE_DESC = STORY_EN.metaDesc;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: {
    canonical: "/en/story",
    languages: { "bn-BD": "/story", en: "/en/story" },
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/en/story`,
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

export default function EnStoryPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: `${SITE_URL}/en` },
    { name: "The Story Behind", url: `${SITE_URL}/en/story` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <StoryView />
    </>
  );
}
