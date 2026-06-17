import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Settings as SettingsIcon, ShieldOff } from "lucide-react";

import { getCurrentUser, isManager } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, EmptyState } from "@/components/admin/ui";

import { ProfileCard } from "./profile-card";
import { PasswordCard } from "./password-card";
import { OrgSettingsCard } from "./org-settings-card";
import { TwoFactorCard, type EnrolledFactor } from "./two-factor-card";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/** Pull a single org_settings scalar out of the {value:...} jsonb wrapper. */
function readScalar(value: Record<string, unknown> | null | undefined): string {
  if (!value) return "";
  const v = (value as { value?: unknown }).value;
  return typeof v === "string" ? v : "";
}

export default async function SettingsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/account");

  const admin = getAdmin();
  if (!admin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" subtitle="Your account and organisation." />
        <EmptyState
          icon={SettingsIcon}
          title="Data unavailable"
          message="Supabase isn't configured."
        />
      </div>
    );
  }

  const showOrg = isManager(me.role);

  // Current avatar (Member doesn't carry avatar_url, so read it directly).
  const { data: profileRow } = await admin
    .from("profiles")
    .select("avatar_url")
    .eq("id", me.id)
    .maybeSingle();

  // Org settings — only fetched for admins (the only ones who see the card).
  let siteName = "";
  let logoUrl = "";
  if (showOrg) {
    const { data: orgRows } = await admin
      .from("org_settings")
      .select("key, value")
      .in("key", ["site_name", "logo_url"]);
    for (const row of orgRows ?? []) {
      if (row.key === "site_name") siteName = readScalar(row.value);
      else if (row.key === "logo_url") logoUrl = readScalar(row.value);
    }
  }

  // Enrolled MFA factors — gracefully degrades if MFA isn't enabled.
  let factors: EnrolledFactor[] = [];
  let mfaAvailable = true;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      mfaAvailable = false;
    } else {
      factors = (data?.totp ?? []).map((f) => ({
        id: f.id,
        friendlyName: f.friendly_name ?? null,
        status: f.status,
        createdAt: f.created_at,
      }));
    }
  } catch {
    mfaAvailable = false;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Your account and organisation." />

      <ProfileCard
        name={me.name}
        username={me.username ?? ""}
        email={me.email ?? ""}
        avatarUrl={profileRow?.avatar_url ?? null}
      />

      <PasswordCard />

      {showOrg && <OrgSettingsCard siteName={siteName} logoUrl={logoUrl} />}

      <TwoFactorCard factors={factors} available={mfaAvailable} />

      {!showOrg && (
        <Card className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-bg-soft text-fg-faint">
            <ShieldOff className="h-[18px] w-[18px]" />
          </span>
          <p className="text-sm text-fg-muted">
            Organisation settings (site name &amp; logo) are managed by admins.
          </p>
        </Card>
      )}
    </div>
  );
}
