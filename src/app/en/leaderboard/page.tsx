import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import LeaderboardView from "@/components/LeaderboardView";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";
import { LEADERBOARD_EN } from "@/lib/pages.en";
import { getLeaderboardRows } from "@/app/leaderboard/page";

export const revalidate = 120;

const SITE_URL = getSiteUrl();
const OG_IMAGE = absoluteUrl("/og-image.jpg");

const PAGE_TITLE = LEADERBOARD_EN.metaTitle;
const PAGE_DESC = LEADERBOARD_EN.metaDesc;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: {
    canonical: "/en/leaderboard",
    languages: { "bn-BD": "/leaderboard", en: "/en/leaderboard" },
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/en/leaderboard`,
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

export default async function EnLeaderboardPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: `${SITE_URL}/en` },
    { name: "Leaderboard", url: `${SITE_URL}/en/leaderboard` },
  ]);
  const rows = await getLeaderboardRows();

  return (
    <>
      <JsonLd data={breadcrumb} />
      <LeaderboardView rows={rows} />
    </>
  );
}
