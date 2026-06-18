import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AccountView from "@/components/AccountView";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { investorPortalData } from "@/lib/investments";

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
  if (isStaff(member.role)) redirect("/dashboard");

  const investment = await investorPortalData(member.id);

  return (
    <section className="relative acct-shell pb-10 min-h-[100svh]">
      <div className="absolute inset-0 -z-10 mesh-bg-soft" />
      <AccountView member={member} investment={investment} />
    </section>
  );
}
