"use server";

/** Authentication Server Actions — LIVE (Supabase Auth).
 *
 *  Auth model: "mobile / username + password", NO OTP / SMS.  Supabase
 *  Auth's password flow is email-based, so every member is created
 *  under a deterministic SYNTHETIC email derived from their mobile
 *  (see syntheticEmail) and that address is never mailed — it's purely
 *  the internal auth key.  The real identifiers (name, mobile, optional
 *  username / email) live in public.profiles (see 0004_profiles.sql).
 *
 *    signup  -> admin.createUser({ email_confirm:true, user_metadata })
 *               then sign the new member in (sets the session cookie)
 *    login   -> resolve identifier (mobile | username | email) to the
 *               synthetic email, then signInWithPassword
 *    logout  -> signOut
 *
 *  Phone format: stored as country-coded digits-only e.g. "8801912345678".
 *  We normalise leading 0 / +880 / 880 so users can type whichever form
 *  they're used to. */

import bcrypt from "bcryptjs";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type LoginPayload = {
  /** Mobile (preferred), username, or email. */
  identifier: string;
  password: string;
};

export type SignupPayload = {
  name: string;
  mobile: string;
  email?: string;
  username?: string;
  password: string;
};

export type AuthResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

// ── Config / validators ───────────────────────────────────────────
const MIN_PASSWORD = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Internal domain for the synthetic auth email.  Never receives mail. */
const AUTH_EMAIL_DOMAIN = "users.promisepd.app";
const syntheticEmail = (mobile: string) => `${mobile}@${AUTH_EMAIL_DOMAIN}`;

const NOT_CONFIGURED: AuthResult = {
  ok: false,
  error: "অ্যাকাউন্ট সার্ভিস এখন সচল নেই। একটু পরে চেষ্টা করুন বা সরাসরি যোগাযোগ করুন।",
};

/** Accepts every shape a Bangladeshi mobile is typed in:
 *    "01912345678" · "1912345678" · "+8801912345678" · "8801912345678"
 *    "00880 1912-345678" … (spaces, dashes, +, leading 00 all tolerated).
 *  Returns: canonical "8801912345678" or null if it isn't a BD mobile. */
function normalizeBdMobile(raw: string): string | null {
  let digits = (raw || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2); // intl 00 prefix
  if (digits.length === 13 && digits.startsWith("8801")) return digits;
  if (digits.length === 11 && digits.startsWith("01")) return `880${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith("1")) return `8801${digits.slice(1)}`;
  return null;
}

/** Build the ordered list of Supabase auth emails to try for a login
 *  identifier.  A member can be reached several ways:
 *    • mobile (any format)  → synthetic email of the canonical mobile
 *    • username / id        → synthetic email of the profile's mobile
 *    • email                → the address itself (real-email accounts)
 *                             AND the synthetic email of whatever profile
 *                             lists it as a contact address
 *  Trying each in turn (same password) means the owner gets in no matter
 *  which identifier — or which of their accounts — they sign in with. */
async function candidateEmails(identifier: string): Promise<string[]> {
  const id = identifier.trim();
  const out: string[] = [];

  const mobile = normalizeBdMobile(id);
  if (mobile) out.push(syntheticEmail(mobile));

  const admin = createAdminClient();
  if (admin) {
    if (EMAIL_RE.test(id)) {
      out.push(id.toLowerCase()); // a real-email auth account
      const { data } = await admin
        .from("profiles")
        .select("mobile")
        .ilike("email", id)
        .maybeSingle();
      if (data?.mobile) out.push(syntheticEmail(data.mobile));
    } else if (!mobile) {
      // Treat anything else (username, member id, code) as a username.
      const { data } = await admin
        .from("profiles")
        .select("mobile")
        .eq("username", id.toLowerCase())
        .maybeSingle();
      if (data?.mobile) out.push(syntheticEmail(data.mobile));
    }
  }

  return [...new Set(out)]; // de-dupe, keep order
}

/** Legacy password migration.  For each candidate synthetic email, find the
 *  profile (by the mobile encoded in the address), read its auth user's
 *  user_metadata.legacy_pw (the old bcrypt hash), and if the typed password
 *  verifies, set it as the real Supabase password and clear the legacy hash.
 *  Returns true once a sign-in succeeds. */
async function tryLegacyLogin(
  candidates: string[],
  password: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;
  const suffix = `@${AUTH_EMAIL_DOMAIN}`;

  for (const email of candidates) {
    if (!email.endsWith(suffix)) continue;
    const mobile = email.slice(0, -suffix.length);
    const { data: prof } = await admin
      .from("profiles")
      .select("id")
      .eq("mobile", mobile)
      .maybeSingle();
    if (!prof?.id) continue;

    const { data: got } = await admin.auth.admin.getUserById(prof.id as string);
    const meta = (got?.user?.user_metadata ?? {}) as Record<string, unknown>;
    const legacy = typeof meta.legacy_pw === "string" ? meta.legacy_pw : null;
    if (!legacy) continue;

    let valid = false;
    try {
      valid = bcrypt.compareSync(password, legacy);
    } catch {
      valid = false;
    }
    if (!valid) continue;

    const { error: upErr } = await admin.auth.admin.updateUserById(prof.id as string, {
      password,
      user_metadata: { ...meta, legacy_pw: null },
    });
    if (upErr) {
      console.error("[auth/login] legacy migrate", upErr.message);
      continue;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) return true;
  }
  return false;
}

// ── Actions ───────────────────────────────────────────────────────

export async function login(payload: LoginPayload): Promise<AuthResult> {
  const id = payload.identifier?.trim();
  if (!id) return { ok: false, error: "মোবাইল নম্বর, ইউজারনেম বা ইমেইল দিন।" };
  if (!payload.password || payload.password.length < MIN_PASSWORD) {
    return { ok: false, error: `পাসওয়ার্ড কমপক্ষে ${MIN_PASSWORD} অক্ষরের।` };
  }

  const candidates = await candidateEmails(id);
  if (candidates.length === 0) {
    return { ok: false, error: "এই তথ্য দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি। সাইন আপ করুন।" };
  }

  const supabase = await createClient();
  let lastError: string | undefined;
  for (const email of candidates) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: payload.password,
    });
    if (!error) return { ok: true, message: "সফলভাবে লগইন হয়েছে।" };
    lastError = error.message;
  }

  // Legacy fallback — accounts ported from the old admin.promisepd.com carry
  // their original bcrypt password hash in user_metadata.legacy_pw.  On the
  // first successful match we verify against it, then migrate the password
  // into Supabase Auth (and clear the legacy hash) so every later login uses
  // the normal flow above.  Runs ONLY after the normal sign-in failed, so it
  // never affects accounts that were created natively.
  const legacyOk = await tryLegacyLogin(candidates, payload.password, supabase);
  if (legacyOk) return { ok: true, message: "সফলভাবে লগইন হয়েছে।" };

  console.error("[auth/login]", lastError);
  return { ok: false, error: "ভুল মোবাইল/ইউজারনেম/ইমেইল বা পাসওয়ার্ড।" };
}

export async function signup(payload: SignupPayload): Promise<AuthResult> {
  const name = payload.name?.trim();
  if (!name || name.length < 2) return { ok: false, error: "পূর্ণ নাম দিন।" };

  const mobile = normalizeBdMobile(payload.mobile ?? "");
  if (!mobile) {
    return { ok: false, error: "সঠিক বাংলাদেশী মোবাইল নম্বর দিন (০১XXXXXXXXX)।" };
  }
  if (!payload.password || payload.password.length < MIN_PASSWORD) {
    return { ok: false, error: `পাসওয়ার্ড কমপক্ষে ${MIN_PASSWORD} অক্ষরের হতে হবে।` };
  }

  const email = payload.email?.trim();
  if (email && !EMAIL_RE.test(email)) {
    return { ok: false, error: "ইমেইল ফরম্যাট সঠিক নয়।" };
  }
  const username = payload.username?.trim().toLowerCase() || undefined;

  const admin = createAdminClient();
  if (!admin) return NOT_CONFIGURED;

  // Friendly pre-checks (best-effort; the DB unique constraints are the
  // real guard).  Skipped silently if the table isn't reachable.
  const { data: byMobile } = await admin
    .from("profiles")
    .select("id")
    .eq("mobile", mobile)
    .maybeSingle();
  if (byMobile) {
    return { ok: false, error: "এই মোবাইল নম্বর দিয়ে আগেই অ্যাকাউন্ট আছে। লগইন করুন।" };
  }
  if (username) {
    const { data: byUser } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (byUser) {
      return { ok: false, error: "এই ইউজারনেমটি ইতিমধ্যে নেওয়া হয়েছে — অন্যটি দিন।" };
    }
  }

  // Create the auth user (email pre-confirmed; synthetic address never
  // mailed).  The on_auth_user_created trigger fills public.profiles.
  const { error: createErr } = await admin.auth.admin.createUser({
    email: syntheticEmail(mobile),
    password: payload.password,
    email_confirm: true,
    user_metadata: { name, mobile, username: username ?? null, email: email ?? null },
  });

  if (createErr) {
    const msg = createErr.message?.toLowerCase() ?? "";
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
      return { ok: false, error: "এই মোবাইল নম্বর দিয়ে আগেই অ্যাকাউন্ট আছে। লগইন করুন।" };
    }
    console.error("[auth/signup]", createErr.message);
    return { ok: false, error: "অ্যাকাউন্ট তৈরি করা যায়নি — আবার চেষ্টা করুন।" };
  }

  // Sign the new member straight in so they land logged-in.
  const supabase = await createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: syntheticEmail(mobile),
    password: payload.password,
  });
  if (signInErr) {
    // Account exists but auto-login hiccuped — let them log in manually.
    return { ok: true, message: "অ্যাকাউন্ট তৈরি হয়েছে। এখন লগইন করুন।" };
  }

  return { ok: true, message: "স্বাগতম! আপনার অ্যাকাউন্ট তৈরি হয়েছে।" };
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
