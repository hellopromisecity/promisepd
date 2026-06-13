import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AccountView from "@/components/AccountView";
import { getCurrentUser } from "@/lib/auth";

const PAGE_TITLE = "My account — PromisePD";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: "Your PromisePD account dashboard.",
  alternates: { canonical: "/en/account" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountPageEn() {
  const member = await getCurrentUser();
  if (!member) redirect("/en/login?next=/en/account");

  return (
    <section className="relative pt-24 pb-10 min-h-[80svh]">
      <div className="absolute inset-0 -z-10 mesh-bg-soft" />
      <AccountView member={member} />
    </section>
  );
}
