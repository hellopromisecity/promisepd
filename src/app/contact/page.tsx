import type { Metadata } from "next";
import ContactView from "@/components/ContactView";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();
const OG_IMAGE = absoluteUrl("/og-image.jpg");

const PAGE_TITLE = "যোগাযোগ — PromisePD";
const PAGE_DESC =
  "প্রমিস গ্রুপের সাথে সরাসরি যোগাযোগ করুন — ফোন, ইমেইল, অফিস ঠিকানা এবং বার্তা পাঠানোর ফর্ম। আমরা খুব শীঘ্রই আপনার সাথে যোগাযোগ করি।";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/contact`,
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

// ContactPage Schema.org — declares this URL as the canonical contact
// surface so search engines know exactly where to send "phone number"
// or "office address" intent traffic.
const contactPageSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "@id": `${SITE_URL}/contact#contactpage`,
  name: PAGE_TITLE,
  url: `${SITE_URL}/contact`,
  inLanguage: "bn-BD",
  isPartOf: { "@id": `${SITE_URL}#website` },
  about: { "@id": `${SITE_URL}#organization` },
};

export default function ContactPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "হোম", url: SITE_URL },
    { name: "যোগাযোগ", url: `${SITE_URL}/contact` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <JsonLd data={contactPageSchema} />
      <ContactView />
    </>
  );
}
