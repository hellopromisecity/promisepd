import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import LeaderboardView, { type LeaderRow } from "@/components/LeaderboardView";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { officerTypeLabel } from "@/lib/marketing";

// Re-rendered when points change (awardPoints calls revalidatePath), and
// at most every few minutes otherwise — stays cached/fast.
export const revalidate = 120;

/** Top marketing officers, ranked by points, for the public board. */
export async function getLeaderboardRows(): Promise<LeaderRow[]> {
  try {
    const admin = createAdminClient();
    if (!admin) return [];
    const { data } = await admin
      .from("marketing_officers")
      .select("name, officer_type, position, district, points")
      .eq("active", true)
      .order("points", { ascending: false })
      .limit(50);
    return (data ?? []).map((o) => ({
      name: o.name,
      sub:
        [o.position, o.district].filter(Boolean).join(" · ") ||
        officerTypeLabel(o.officer_type),
      points: Number(o.points) || 0,
    }));
  } catch {
    return [];
  }
}

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

export default async function LeaderboardPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "হোম", url: SITE_URL },
    { name: "লিডারবোর্ড", url: `${SITE_URL}/leaderboard` },
  ]);
  const rows = await getLeaderboardRows();

  return (
    <>
      <JsonLd data={breadcrumb} />
      <LeaderboardView rows={rows} />
    </>
  );
}
