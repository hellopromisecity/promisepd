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

/** Accepts: "01912345678" · "+8801912345678" · "8801912345678".
 *  Returns: canonical "8801912345678" or null if invalid. */
function normalizeBdMobile(raw: string): string | null {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 11 && digits.startsWith("01")) return `880${digits.slice(1)}`;
  if (digits.length === 13 && digits.startsWith("8801")) return digits;
  return null;
}

/** Resolve a login identifier to the canonical mobile that backs the
 *  synthetic auth email.  Mobile resolves directly; username / email
 *  are looked up in profiles via the service role (RLS-exempt). */
async function resolveMobile(identifier: string): Promise<string | null> {
  const id = identifier.trim();

  const direct = normalizeBdMobile(id);
  if (direct) return direct;

  const admin = createAdminClient();
  if (!admin) return null;

  const column = EMAIL_RE.test(id) ? "email" : "username";
  const value = column === "username" ? id.toLowerCase() : id;
  const { data } = await admin
    .from("profiles")
    .select("mobile")
    .eq(column, value)
    .maybeSingle();

  return data?.mobile ?? null;
}

// ── Actions ───────────────────────────────────────────────────────

export async function login(payload: LoginPayload): Promise<AuthResult> {
  const id = payload.identifier?.trim();
  if (!id) return { ok: false, error: "মোবাইল নম্বর, ইউজারনেম বা ইমেইল দিন।" };
  if (!payload.password || payload.password.length < MIN_PASSWORD) {
    return { ok: false, error: `পাসওয়ার্ড কমপক্ষে ${MIN_PASSWORD} অক্ষরের।` };
  }

  const mobile = await resolveMobile(id);
  if (!mobile) {
    return { ok: false, error: "এই তথ্য দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি। সাইন আপ করুন।" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: syntheticEmail(mobile),
    password: payload.password,
  });

  if (error) {
    console.error("[auth/login]", error.message);
    return { ok: false, error: "ভুল মোবাইল/ইউজারনেম বা পাসওয়ার্ড।" };
  }

  return { ok: true, message: "সফলভাবে লগইন হয়েছে।" };
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
