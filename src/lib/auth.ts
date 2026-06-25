/** Server-side helper to read the currently logged-in member.
 *
 *  Reads the Supabase session (via the cookie-backed SSR client), then
 *  the member's public.profiles row.  Falls back to the auth user's
 *  metadata if the profile row isn't readable yet (e.g. the migration
 *  hasn't been applied), so the UI degrades gracefully.
 *
 *  Returns null when nobody is logged in or Supabase isn't configured —
 *  callers (server components, the account page) treat null as "guest". */

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Role = "member" | "staff" | "manager" | "admin";

/** Roles allowed to open the /admin dashboard at all. */
export const STAFF_ROLES: Role[] = ["staff", "manager", "admin"];

export const isStaff = (role: Role) => STAFF_ROLES.includes(role);
export const isManager = (role: Role) => role === "manager" || role === "admin";
export const isAdmin = (role: Role) => role === "admin";

/** Owner / super-admin accounts, set via the SUPER_ADMIN_EMAILS env var
 *  (comma-separated emails, optionally mobiles).  These are ALWAYS admin
 *  regardless of their profiles.role — so the owner can't be locked out
 *  by a DB edit, and the email lives only in the environment (never in
 *  the repo, never sent to the browser).  Server-only. */
const SUPER_ADMINS = new Set(
  (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

function isSuperAdmin(email: string | null, mobile: string | null): boolean {
  if (SUPER_ADMINS.size === 0) return false;
  return (
    (!!email && SUPER_ADMINS.has(email.toLowerCase())) ||
    (!!mobile && SUPER_ADMINS.has(mobile.toLowerCase()))
  );
}

export type Member = {
  id: string;
  name: string;
  mobile: string;
  username: string | null;
  email: string | null;
  role: Role;
  /** Env-designated owner (SUPER_ADMIN_EMAILS) — the founder. Always admin,
   *  and the only one allowed to change other members' roles. */
  isOwner: boolean;
  avatarUrl: string | null;
  createdAt: string | null;
};

/** Wrapped in React `cache` so the layout, page and any components in
 *  one request share a SINGLE auth + profile round-trip instead of
 *  repeating it (a big latency win on the auth-gated /admin pages). */
export const getCurrentUser = cache(async (): Promise<Member | null> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;

  try {
    const supabase = await createClient();
    // getClaims() verifies the JWT LOCALLY (no GoTrue round-trip) when the
    // project uses asymmetric signing keys — same cryptographic guarantee
    // as getUser(), one fewer network hop per dashboard navigation.  On a
    // legacy HS256 secret it transparently falls back to getUser(), so the
    // swap is always safe.  The session is refreshed by the middleware.
    const { data: claimsData } = await supabase.auth.getClaims();
    const claims = (claimsData?.claims ?? null) as Record<string, unknown> | null;
    const userId = typeof claims?.sub === "string" ? claims.sub : null;
    if (!userId) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, mobile, username, email, role, avatar_url, created_at")
      .eq("id", userId)
      .maybeSingle();

    const meta = (claims?.user_metadata ?? {}) as Record<string, string | null>;
    const claimEmail = typeof claims?.email === "string" ? claims.email : null;
    const claimPhone = typeof claims?.phone === "string" ? claims.phone : null;
    // Resolve the owner's real-world email / mobile from every place it
    // might live — the profile row, the signup metadata, AND the token's
    // own email/phone.  This matters because one person can have two
    // accounts (a mobile/username login whose auth email is synthetic, and
    // a real-email login); the super-admin override must recognise the
    // owner no matter which one they signed in with.
    // The synthetic auth email (<mobile>@users.promisepd.app) is an internal
    // login key, never a real address — never surface it as the member's
    // email (it must not show on /account, nor satisfy the super-admin check).
    const realClaimEmail =
      claimEmail && !claimEmail.toLowerCase().endsWith("@users.promisepd.app") ? claimEmail : null;
    const email = profile?.email ?? meta.email ?? realClaimEmail ?? null;
    const mobile = profile?.mobile || meta.mobile || claimPhone || "";

    // Env-designated owner is always admin; otherwise use the DB role.
    const owner = isSuperAdmin(email, mobile);
    const role: Role = owner ? "admin" : ((profile?.role ?? "member") as Role);

    return {
      id: userId,
      name: profile?.name || meta.name || "",
      mobile,
      username: profile?.username ?? meta.username ?? null,
      email,
      role,
      isOwner: owner,
      avatarUrl: (profile as { avatar_url?: string | null } | null)?.avatar_url ?? null,
      createdAt: profile?.created_at ?? null,
    };
  } catch {
    return null;
  }
});
