import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import LeaderboardView from "@/components/LeaderboardView";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();
const OG_IMAGE = absoluteUrl("/og-image.jpg");

const PAGE_TITLE = "লিডারবোর্ড — প্রমিস পার্টনার র‍্যাঙ্কিং";
const PAGE_DESC =
  "প্রমিস গ্রুপের পার্টনার প্রোগ্রামের শীর্ষ সেলস পারফরমার র‍্যাঙ্কিং। সর্বোচ্চ পয়েন্ট অর্জনকারীদের জন্য ফ্রি উমরাহ ও বিদেশ ট্যুর পুরস্কার।";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: "/leaderboard" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/leaderboard`,
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

export default function LeaderboardPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "হোম", url: SITE_URL },
    { name: "লিডারবোর্ড", url: `${SITE_URL}/leaderboard` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <LeaderboardView />
    </>
  );
}
