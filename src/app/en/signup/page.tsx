import type { Metadata } from "next";
import { UserPlus } from "lucide-react";
import AuthForm from "@/components/AuthForm";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { DICT } from "@/lib/i18n";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();
const a = DICT.en.auth;

export const metadata: Metadata = {
  title: "Create account — PromisePD",
  description:
    "Create a new PromisePD account. Just your name and mobile number to get started.",
  alternates: { canonical: "/en/signup", languages: { "bn-BD": "/signup", en: "/en/signup" } },
  robots: { index: false, follow: true },
};

export default function EnSignupPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: `${SITE_URL}/en` },
    { name: "Sign up", url: `${SITE_URL}/en/signup` },
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
              {a.signupH} <span className="text-grad">{a.signupHb}</span>
            </h1>
            <p className="mt-3 text-sm sm:text-base text-fg-muted">{a.signupSub}</p>
          </div>
          <AuthForm mode="signup" />
        </div>
      </section>
    </>
  );
}
