import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, isManager } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { loadArchiveData } from "@/app/actions/hub";
import ArchiveExplorer from "./ArchiveExplorer";

export const metadata: Metadata = { title: "Archivify", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) redirect("/account");
  // loading the page also runs the lazy 30-day auto-purge
  const data = await loadArchiveData();
  return (
    <div className="space-y-6">
      <PageHeader title="Archivify" subtitle="The 30-day recycle bin — deleted users, project holdings and transactions wait here, restorable in one click. After 30 days they're gone for good." />
      <ArchiveExplorer data={data} />
    </div>
  );
}
