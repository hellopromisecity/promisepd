import type { Metadata } from "next";
import BookingView from "@/components/BookingView";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();
const PAGE_TITLE = "Book a Project Visit — Promise Proper Development";
const PAGE_DESC =
  "See your dream project with your own eyes. Pick a slot between 11 AM – 12 PM and book — we'll drive you there.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: "/en/booking" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/en/booking`,
    title: PAGE_TITLE,
    description: PAGE_DESC,
    siteName: "PromisePD",
    locale: "en_US",
  },
};

export default function BookingPageEn() {
  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: `${SITE_URL}/en` },
    { name: "Booking", url: `${SITE_URL}/en/booking` },
  ]);
  return (
    <>
      <JsonLd data={breadcrumb} />
      <BookingView locale="en" />
    </>
  );
}
