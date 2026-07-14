import type { Metadata } from "next";
import BookingView from "@/components/BookingView";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();
const PAGE_TITLE = "প্রজেক্ট ভিজিট বুক করুন — প্রমিস প্রপার ডেভেলপমেন্ট";
const PAGE_DESC =
  "স্বপ্নের প্রজেক্ট নিজের চোখে দেখে আসুন। সকাল ১১টা – ১২টার মধ্যে সময় বেছে বুকিং করুন — গাড়িতে করে আমরা আপনাকে নিয়ে যাবো।";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: "/booking" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/booking`,
    title: PAGE_TITLE,
    description: PAGE_DESC,
    siteName: "PromisePD",
    locale: "bn_BD",
  },
};

export default function BookingPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "হোম", url: SITE_URL },
    { name: "প্রজেক্ট ভিজিট বুকিং", url: `${SITE_URL}/booking` },
  ]);
  return (
    <>
      <JsonLd data={breadcrumb} />
      <BookingView locale="bn" />
    </>
  );
}
