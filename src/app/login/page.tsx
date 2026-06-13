import type { Metadata } from "next";
import { LogIn } from "lucide-react";
import AuthForm from "@/components/AuthForm";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();
const OG_IMAGE = absoluteUrl("/og-image.jpg");

const PAGE_TITLE = "লগইন — PromisePD";
const PAGE_DESC =
  "আপনার PromisePD অ্যাকাউন্টে লগইন করুন — মোবাইল নম্বর ও পাসওয়ার্ড দিয়েই দ্রুত প্রবেশ।";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: "/login" },
  // Login screens don't belong in search results.
  robots: { index: false, follow: true },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/login`,
    title: PAGE_TITLE,
    description: PAGE_DESC,
    siteName: "PromisePD",
    locale: "bn_BD",
    images: [{ url: OG_IMAGE, secureUrl: OG_IMAGE, type: "image/jpeg", width: 1200, height: 630, alt: PAGE_TITLE }],
  },
};

export default function LoginPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "হোম", url: SITE_URL },
    { name: "লগইন", url: `${SITE_URL}/login` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />

      <section className="relative pt-32 pb-20 sm:pt-36 sm:pb-28 min-h-[80svh]">
        <div className="absolute inset-0 -z-10 mesh-bg-soft" />
        <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue text-white shadow-[var(--shadow-brand)]">
              <LogIn className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-3xl sm:text-4xl font-bold leading-tight">
              <span className="text-grad">স্বাগতম</span> ফিরে।
            </h1>
            <p className="mt-3 text-sm sm:text-base text-fg-muted">
              মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে দ্রুত লগইন করুন।
            </p>
          </div>

          <AuthForm mode="login" />
        </div>
      </section>
    </>
  );
}
