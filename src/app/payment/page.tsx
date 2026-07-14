import type { Metadata } from "next";
import PaymentView from "@/components/PaymentView";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();
const PAGE_TITLE = "পেমেন্ট মেথড — প্রমিস প্রপার ডেভেলপমেন্ট";
const PAGE_DESC =
  "আমাদের ব্যাংক অ্যাকাউন্টের বিস্তারিত — Dutch-Bangla, Al-Arafah Islami, Sonali, Islami ও Bank Asia। যেকোনো অ্যাকাউন্টে নিরাপদে পেমেন্ট পাঠান।";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: "/payment" },
  // Bank details are for our customers, not for search engines to index.
  robots: { index: false, follow: true },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/payment`,
    title: PAGE_TITLE,
    description: PAGE_DESC,
    siteName: "PromisePD",
    locale: "bn_BD",
  },
};

export default function PaymentPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "হোম", url: SITE_URL },
    { name: "পেমেন্ট মেথড", url: `${SITE_URL}/payment` },
  ]);
  return (
    <>
      <JsonLd data={breadcrumb} />
      <PaymentView locale="bn" />
    </>
  );
}
