"use server";

/** Settings section — Server Actions.
 *
 *  Covers the logged-in member's own profile (name / username / email /
 *  avatar), their password, two-factor (TOTP) enrolment, and — for
 *  admins only — the organisation's site name + logo.
 *
 *  Every mutation:
 *    1. asserts the caller's role (require* throws AuthzError → caught),
 *    2. validates input,
 *    3. writes via the service-role client (getAdmin) for profile/org,
 *       or the cookie SSR client for the caller's own auth (password/MFA),
 *    4. logs to audit_logs,
 *    5. revalidates /admin/settings,
 *    6. returns through runAction → consistent ActionResult shape. */

import {
  requireStaff,
  requireAdmin,
  getAdmin,
  logAudit,
  runAction,
  type ActionResult,
} from "@/lib/admin-guard";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const PATH = "/dashboard/settings";

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export async function updateProfile(input: {
  name: string;
  username: string;
  email: string;
}): Promise<ActionResult> {
  return runAction(async () => {
    const me = await requireStaff();

    const name = input.name?.trim() ?? "";
    const username = input.username?.trim() ?? "";
    const email = input.email?.trim() ?? "";

    if (!name) throw new Error("Name is required.");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new Error("That email address doesn't look right.");

    const admin = getAdmin();
    if (!admin) throw new Error("Storage is not configured.");

    const { error } = await admin
      .from("profiles")
      .update({
        name,
        username: username || null,
        email: email || null,
      })
      .eq("id", me.id);

    if (error) throw new Error("Could not save your profile.");

    await logAudit({
      action: "update",
      entity: "profile",
      entityId: me.id,
      detail: "Updated own profile details",
    });
    revalidatePath(PATH);
    return { message: "Profile updated." };
  });
}

/** Persist the public WebP URL produced by the upload-image pipeline
 *  to the caller's own profile.  The client must have already pushed
 *  the bytes through `uploadImage` (the mandatory WebP pipeline) and
 *  pass the resulting public URL here. */
export async function saveAvatar(url: string): Promise<ActionResult> {
  return runAction(async () => {
    const me = await requireStaff();

    const clean = url?.trim() ?? "";
    if (!clean || !/^https?:\/\//i.test(clean))
      throw new Error("Invalid avatar URL.");

    const admin = getAdmin();
    if (!admin) throw new Error("Storage is not configured.");

    const { error } = await admin
      .from("profiles")
      .update({ avatar_url: clean })
      .eq("id", me.id);

    if (error) throw new Error("Could not save your avatar.");

    await logAudit({
      action: "update",
      entity: "profile",
      entityId: me.id,
      detail: "Updated avatar",
    });
    revalidatePath(PATH);
    return { message: "Avatar updated." };
  });
}

/* ------------------------------------------------------------------ */
/* Password                                                            */
/* ------------------------------------------------------------------ */

export async function changePassword(input: {
  password: string;
  confirm: string;
}): Promise<ActionResult> {
  return runAction(async () => {
    await requireStaff();

    const password = input.password ?? "";
    const confirm = input.confirm ?? "";

    if (password.length < 6)
      throw new Error("Password must be at least 6 characters.");
    if (password !== confirm) throw new Error("Passwords don't match.");

    // The caller updates their OWN auth credentials via the cookie
    // SSR client (which carries their session) — never the service role.
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message || "Could not update password.");

    await logAudit({
      action: "update",
      entity: "settings",
      detail: "Changed own password",
    });
    revalidatePath(PATH);
    return { message: "Password changed." };
  });
}

/* ------------------------------------------------------------------ */
/* Org settings (admin only)                                           */
/* ------------------------------------------------------------------ */

export async function saveOrgSettings(input: {
  siteName: string;
  logoUrl: string;
}): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdmin();

    const siteName = input.siteName?.trim() ?? "";
    const logoUrl = input.logoUrl?.trim() ?? "";

    if (!siteName) throw new Error("Site name is required.");
    if (logoUrl && !/^https?:\/\//i.test(logoUrl))
      throw new Error("Invalid logo URL.");

    const admin = getAdmin();
    if (!admin) throw new Error("Storage is not configured.");

    const { error } = await admin.from("org_settings").upsert(
      [
        { key: "site_name", value: { value: siteName } },
        { key: "logo_url", value: { value: logoUrl } },
      ],
      { onConflict: "key" },
    );

    if (error) throw new Error("Could not save organisation settings.");

    await logAudit({
      action: "update",
      entity: "settings",
      detail: `Updated org settings (site name + logo)`,
    });
    revalidatePath(PATH);
    return { message: "Organisation settings saved." };
  });
}

/* ------------------------------------------------------------------ */
/* Two-factor (TOTP)                                                   */
/* ------------------------------------------------------------------ */

export type EnrollTotpResult = ActionResult<{
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
}>;

/** Begin TOTP enrolment.  Returns the QR data-uri + secret so the
 *  client can show them.  All MFA calls are wrapped — if the project
 *  doesn't have MFA enabled the action returns a graceful error
 *  rather than throwing. */
export async function enrollTotp(): Promise<EnrollTotpResult> {
  return runAction(async () => {
    await requireStaff();

    const supabase = await createClient();
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
    });
    if (error || !data) {
      throw new Error(
        error?.message || "2FA isn't available on this project yet.",
      );
    }

    await logAudit({
      action: "enroll",
      entity: "settings",
      entityId: data.id,
      detail: "Started TOTP 2FA enrolment",
    });
    revalidatePath(PATH);
    return {
      data: {
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      },
    };
  });
}

export async function verifyTotp(input: {
  factorId: string;
  code: string;
}): Promise<ActionResult> {
  return runAction(async () => {
    await requireStaff();

    const factorId = input.factorId?.trim() ?? "";
    const code = input.code?.trim() ?? "";
    if (!factorId) throw new Error("Missing factor.");
    if (!/^\d{6}$/.test(code))
      throw new Error("Enter the 6-digit code from your authenticator app.");

    const supabase = await createClient();

    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({
      factorId,
    });
    if (cErr || !challenge)
      throw new Error(cErr?.message || "Could not start the 2FA challenge.");

    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    if (vErr)
      throw new Error(vErr.message || "That code didn't verify. Try again.");

    await logAudit({
      action: "verify",
      entity: "settings",
      entityId: factorId,
      detail: "Verified TOTP 2FA",
    });
    revalidatePath(PATH);
    return { message: "Two-factor authentication enabled." };
  });
}

export async function unenrollTotp(input: {
  factorId: string;
}): Promise<ActionResult> {
  return runAction(async () => {
    await requireStaff();

    const factorId = input.factorId?.trim() ?? "";
    if (!factorId) throw new Error("Missing factor.");

    const supabase = await createClient();
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) throw new Error(error.message || "Could not remove this factor.");

    await logAudit({
      action: "unenroll",
      entity: "settings",
      entityId: factorId,
      detail: "Removed a TOTP 2FA factor",
    });
    revalidatePath(PATH);
    return { message: "Two-factor factor removed." };
  });
}
