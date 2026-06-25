import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import ForgotPassword from "@/components/ForgotPassword";
import { canEmailArbitraryRecipients } from "@/lib/email";

export const metadata: Metadata = {
  title: "পাসওয়ার্ড রিসেট — PromisePD",
  description: "মোবাইল নম্বর বা ইমেইল দিয়ে আপনার PromisePD পাসওয়ার্ড রিসেট করুন।",
  alternates: { canonical: "/forgot-password" },
  robots: { index: false, follow: true },
};

export default function ForgotPasswordPage() {
  return (
    <section className="relative min-h-[80svh] pt-32 pb-20 sm:pt-36 sm:pb-28">
      <div className="absolute inset-0 -z-10 mesh-bg-soft" />
      <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue text-white shadow-[var(--shadow-brand)]">
            <KeyRound className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl">
            পাসওয়ার্ড <span className="text-grad">রিসেট</span>
          </h1>
          <p className="mt-3 text-sm text-fg-muted sm:text-base">
            ফোন বা ইমেইলে কোড নিয়ে নতুন পাসওয়ার্ড সেট করুন।
          </p>
        </div>
        <ForgotPassword locale="bn" emailEnabled={canEmailArbitraryRecipients()} />
        <p className="mt-6 text-center text-sm text-fg-muted">
          <Link href="/login" className="font-semibold text-brand-blue hover:underline">লগইনে ফিরে যান</Link>
        </p>
      </div>
    </section>
  );
}
