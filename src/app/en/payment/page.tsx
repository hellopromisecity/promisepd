import type { Metadata } from "next";
import PaymentView from "@/components/PaymentView";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();
const PAGE_TITLE = "Payment Method — Promise Proper Development";
const PAGE_DESC =
  "Our bank account details — Dutch-Bangla, Al-Arafah Islami, Sonali, Islami and Bank Asia. Send your payment safely to any account.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: "/en/payment" },
  // Bank details are for our customers, not for search engines to index.
  robots: { index: false, follow: true },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/en/payment`,
    title: PAGE_TITLE,
    description: PAGE_DESC,
    siteName: "PromisePD",
    locale: "en_US",
  },
};

export default function PaymentPageEn() {
  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: `${SITE_URL}/en` },
    { name: "Payment Method", url: `${SITE_URL}/en/payment` },
  ]);
  return (
    <>
      <JsonLd data={breadcrumb} />
      <PaymentView locale="en" />
    </>
  );
}
