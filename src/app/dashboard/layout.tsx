import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser, isStaff, isManager } from "@/lib/auth";
import { getInvestorRef, hasLinkedInvestor } from "@/lib/investments";
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

  // Plain staff (not manager/admin) only get Report + My Projects — everything
  // else in the dashboard is off-limits.  The middleware forwards the path via
  // a header so we can gate here without an extra round-trip.
  if (!isManager(member.role)) {
    const path = (await headers()).get("x-pathname") ?? "";
    const bare = path.replace(/^\/en/, "") || "/";
    const staffOk =
      bare.startsWith("/dashboard/report") || bare.startsWith("/dashboard/my-projects");
    if (!staffOk) redirect("/dashboard/report");
  }

  // Show "My Projects" only if this person is ALSO a linked investor.
  const ref = await getInvestorRef(member.id);
  const showMyProjects = await hasLinkedInvestor(ref, member.mobile);

  return (
    <AdminShell member={member} showMyProjects={showMyProjects}>
      {children}
    </AdminShell>
  );
}
