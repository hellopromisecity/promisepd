import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import LeaderboardView, { type LbOfficer, type LbEntry } from "@/components/LeaderboardView";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { officerTypeLabel } from "@/lib/marketing";

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
    images: [{ url: OG_IMAGE, secureUrl: OG_IMAGE, type: "image/jpeg", width: 1200, height: 630, alt: PAGE_TITLE }],
  },
  twitter: { card: "summary_large_image", title: PAGE_TITLE, description: PAGE_DESC, images: [{ url: OG_IMAGE, alt: PAGE_TITLE }] },
};

// Re-rendered when points change (awardPoints calls revalidatePath), and
// at most every couple of minutes otherwise — stays cached/fast.
export const revalidate = 120;

/** Marketing officers + their point entries for the live board. */
export async function getLeaderboardData(): Promise<{ officers: LbOfficer[]; entries: LbEntry[] }> {
  try {
    const admin = createAdminClient();
    if (!admin) return { officers: [], entries: [] };
    const since = new Date();
    since.setFullYear(since.getFullYear() - 2);

    const [oRes, eRes] = await Promise.all([
      admin
        .from("marketing_officers")
        .select("id, name, officer_type, position, district, officer_code, mobile, points, income_total")
        .eq("active", true),
      admin
        .from("marketing_point_entries")
        .select("officer_id, points, income, created_at")
        .gte("created_at", since.toISOString()),
    ]);

    const officers: LbOfficer[] = (oRes.data ?? []).map((o) => ({
      id: o.id,
      name: o.name,
      code: o.officer_code,
      mobile: o.mobile,
      type: o.officer_type,
      sub: [o.position, o.district].filter(Boolean).join(" · ") || officerTypeLabel(o.officer_type),
      points: Number(o.points) || 0,
      income: Number(o.income_total) || 0,
    }));
    const entries: LbEntry[] = (eRes.data ?? []).map((e) => ({
      officer_id: e.officer_id,
      points: Number(e.points) || 0,
      income: Number(e.income) || 0,
      created_at: e.created_at,
    }));
    return { officers, entries };
  } catch {
    return { officers: [], entries: [] };
  }
}

export default async function LeaderboardPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "হোম", url: SITE_URL },
    { name: "লিডারবোর্ড", url: `${SITE_URL}/leaderboard` },
  ]);
  const { officers, entries } = await getLeaderboardData();

  return (
    <>
      <JsonLd data={breadcrumb} />
      <LeaderboardView officers={officers} entries={entries} />
    </>
  );
}
