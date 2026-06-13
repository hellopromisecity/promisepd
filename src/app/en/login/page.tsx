import type { Metadata } from "next";
import { LogIn } from "lucide-react";
import AuthForm from "@/components/AuthForm";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { DICT } from "@/lib/i18n";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();
const a = DICT.en.auth;

export const metadata: Metadata = {
  title: "Login — PromisePD",
  description:
    "Log in to your PromisePD account — quick access with your mobile number and password.",
  alternates: { canonical: "/en/login", languages: { "bn-BD": "/login", en: "/en/login" } },
  robots: { index: false, follow: true },
};

export default function EnLoginPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: `${SITE_URL}/en` },
    { name: "Login", url: `${SITE_URL}/en/login` },
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
              <span className="text-grad">{a.loginH}</span> {a.loginHb}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-fg-muted">{a.loginSub}</p>
          </div>
          <AuthForm mode="login" />
        </div>
      </section>
    </>
  );
}
