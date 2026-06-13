import type { Metadata } from "next";
import { UserPlus } from "lucide-react";
import AuthForm from "@/components/AuthForm";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();
const OG_IMAGE = absoluteUrl("/og-image.jpg");

const PAGE_TITLE = "অ্যাকাউন্ট তৈরি করুন — PromisePD";
const PAGE_DESC =
  "PromisePD-এ নতুন অ্যাকাউন্ট তৈরি করুন। নাম ও মোবাইল নম্বর — শুধু এই দুটো দিয়েই শুরু।";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: "/signup" },
  robots: { index: false, follow: true },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/signup`,
    title: PAGE_TITLE,
    description: PAGE_DESC,
    siteName: "PromisePD",
    locale: "bn_BD",
    images: [{ url: OG_IMAGE, secureUrl: OG_IMAGE, type: "image/jpeg", width: 1200, height: 630, alt: PAGE_TITLE }],
  },
};

export default function SignupPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "হোম", url: SITE_URL },
    { name: "সাইন আপ", url: `${SITE_URL}/signup` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />

      <section className="relative pt-32 pb-20 sm:pt-36 sm:pb-28">
        <div className="absolute inset-0 -z-10 mesh-bg-soft" />
        <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue text-white shadow-[var(--shadow-brand)]">
              <UserPlus className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-3xl sm:text-4xl font-bold leading-tight">
              আপনার <span className="text-grad">যাত্রা শুরু</span> করুন।
            </h1>
            <p className="mt-3 text-sm sm:text-base text-fg-muted">
              শুধু নাম + মোবাইল + পাসওয়ার্ড — এক মিনিটেই অ্যাকাউন্ট তৈরি।
            </p>
          </div>

          <AuthForm mode="signup" />
        </div>
      </section>
    </>
  );
}
