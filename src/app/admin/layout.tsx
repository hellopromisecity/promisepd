import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, isStaff } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · PromisePD Admin" },
  description: "PromisePD admin dashboard.",
  robots: { index: false, follow: false },
};

// The whole dashboard depends on the session — never statically cache.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await getCurrentUser();

  // Not logged in → sign in (middleware also catches this earlier).
  if (!member) redirect("/login?next=/admin");

  // Logged in but a plain member → no dashboard access.
  if (!isStaff(member.role)) redirect("/account");

  return <AdminShell member={member}>{children}</AdminShell>;
}
