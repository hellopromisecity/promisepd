import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { listCredentials } from "@/app/actions/admin-vault";
import VaultManager from "./VaultManager";

export const metadata: Metadata = {
  title: "Vault",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const me = await getCurrentUser();
  // Credentials are sensitive — ADMIN only (managers can't open the Vault).
  if (!me || !isAdmin(me.role)) redirect("/dashboard");

  const credentials = await listCredentials();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Secure Vault"
        subtitle="Company logins & access keys — kept in one private, encrypted-at-rest place."
      />
      <VaultManager initial={credentials} />
    </div>
  );
}
