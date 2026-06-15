import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AccountView from "@/components/AccountView";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { investorPortalData } from "@/lib/investments";

const PAGE_TITLE = "আমার অ্যাকাউন্ট — PromisePD";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: "আপনার PromisePD অ্যাকাউন্ট ড্যাশবোর্ড।",
  alternates: { canonical: "/account" },
  // Member-only screen — never index.
  robots: { index: false, follow: false },
};

// Always render per-request (depends on the session cookie).
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const member = await getCurrentUser();
  if (!member) redirect("/login?next=/account");
  // Staff / managers / admins get the full dashboard, not the member page.
  if (isStaff(member.role)) redirect("/dashboard");

  // If this member is a ported investor, load their balance / investments /
  // transactions (scoped to their own profile id) for the portal.
  const investment = await investorPortalData(member.id);

  return (
    <section className="relative pt-24 pb-10 min-h-[80svh]">
      <div className="absolute inset-0 -z-10 mesh-bg-soft" />
      <AccountView member={member} investment={investment} />
    </section>
  );
}
