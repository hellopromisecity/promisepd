"use server";

/** Password reset — custom OTP flow.
 *
 *  Supabase's built-in email reset is useless here: the auth email is a
 *  synthetic <mobile>@users.promisepd.app that never receives mail.  So we
 *  run our own — a 6-digit code, sha256-hashed into the auth user's
 *  user_metadata with a 10-minute expiry, delivered by SMS (phone) or email.
 *  Confirm verifies the code and sets the new Supabase password directly
 *  (and clears any legacy_pw so the new password is the only one). */

import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendResetCodeSms } from "@/lib/sms";
import { sendResetCodeEmail, canEmailArbitraryRecipients } from "@/lib/email";

export type Channel = "phone" | "email";
export type ResetResult = { ok: true; message: string } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PW = 6;
const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_TRIES = 5;

const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
const sixDigit = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");

/** Canonicalise a typed phone the same way signup does (BD-first), else null. */
function canonMobile(raw: string): string | null {
  let d = (raw || "").replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 13 && d.startsWith("8801")) return d;
  if (d.length === 11 && d.startsWith("01")) return `880${d.slice(1)}`;
  if (d.length === 10 && d.startsWith("1")) return `8801${d.slice(1)}`;
  if (d.length >= 8 && d.length <= 15) return d; // international, as typed
  return null;
}

type Admin = NonNullable<ReturnType<typeof createAdminClient>>;
type Prof = { id: string; mobile: string | null; email: string | null };

async function resolveProfile(admin: Admin, channel: Channel, identifier: string): Promise<Prof | null> {
  if (channel === "phone") {
    const mobile = canonMobile(identifier);
    if (!mobile) return null;
    const { data } = await admin.from("profiles").select("id, mobile, email").eq("mobile", mobile).maybeSingle();
    return data?.id ? { id: data.id as string, mobile: (data.mobile as string) ?? null, email: (data.email as string) ?? null } : null;
  }
  const email = identifier.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return null;
  const { data } = await admin.from("profiles").select("id, mobile, email").ilike("email", email).maybeSingle();
  return data?.id ? { id: data.id as string, mobile: (data.mobile as string) ?? null, email: (data.email as string) ?? null } : null;
}

/** Step 1 — send a reset code over the chosen channel. */
export async function requestPasswordReset(input: { channel: Channel; identifier: string }): Promise<ResetResult> {
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "সার্ভিস এখন সচল নেই। একটু পরে চেষ্টা করুন।" };
  const channel: Channel = input.channel === "email" ? "email" : "phone";
  const identifier = (input.identifier || "").trim();
  if (!identifier) return { ok: false, error: channel === "email" ? "ইমেইল দিন।" : "মোবাইল নম্বর দিন।" };

  if (channel === "email" && !canEmailArbitraryRecipients()) {
    return { ok: false, error: "ইমেইলে রিসেট এই মুহূর্তে সম্ভব নয় — ফোন নম্বর দিয়ে চেষ্টা করুন।" };
  }

  const prof = await resolveProfile(admin, channel, identifier);
  // Never leak whether the account exists.
  if (!prof) {
    return {
      ok: true,
      message: channel === "email"
        ? "যদি এই ইমেইলে অ্যাকাউন্ট থাকে, একটি কোড পাঠানো হয়েছে।"
        : "যদি এই নম্বরে অ্যাকাউন্ট থাকে, একটি কোড পাঠানো হয়েছে।",
    };
  }

  const { data: got } = await admin.auth.admin.getUserById(prof.id);
  const meta = (got?.user?.user_metadata ?? {}) as Record<string, unknown>;
  const lastSent = typeof meta.reset_sent === "number" ? (meta.reset_sent as number) : 0;
  if (Date.now() - lastSent < RESEND_COOLDOWN_MS) {
    return { ok: true, message: "কোড পাঠানো হয়েছে। আবার চাইলে এক মিনিট পরে চেষ্টা করুন।" };
  }

  const code = sixDigit();
  await admin.auth.admin.updateUserById(prof.id, {
    user_metadata: { ...meta, reset_code: sha(code), reset_exp: Date.now() + CODE_TTL_MS, reset_ch: channel, reset_tries: 0, reset_sent: Date.now() },
  });

  if (channel === "phone") {
    await sendResetCodeSms("+" + (prof.mobile ?? canonMobile(identifier) ?? ""), code);
    return { ok: true, message: "আপনার ফোনে একটি ৬-সংখ্যার কোড পাঠানো হয়েছে।" };
  }
  await sendResetCodeEmail(prof.email ?? identifier, code);
  return { ok: true, message: "আপনার ইমেইলে একটি ৬-সংখ্যার কোড পাঠানো হয়েছে।" };
}

/** Step 2 — verify the code and set the new password. */
export async function confirmPasswordReset(input: {
  channel: Channel;
  identifier: string;
  code: string;
  newPassword: string;
}): Promise<ResetResult> {
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "সার্ভিস এখন সচল নেই।" };
  const channel: Channel = input.channel === "email" ? "email" : "phone";
  const code = (input.code || "").replace(/\D/g, "");
  if (code.length !== 6) return { ok: false, error: "৬-সংখ্যার কোড দিন।" };
  if (!input.newPassword || input.newPassword.length < MIN_PW) {
    return { ok: false, error: `পাসওয়ার্ড কমপক্ষে ${MIN_PW} অক্ষরের হতে হবে।` };
  }

  const prof = await resolveProfile(admin, channel, input.identifier);
  if (!prof) return { ok: false, error: "কোড বা তথ্য সঠিক নয়।" };

  const { data: got } = await admin.auth.admin.getUserById(prof.id);
  const meta = (got?.user?.user_metadata ?? {}) as Record<string, unknown>;
  const storedHash = typeof meta.reset_code === "string" ? (meta.reset_code as string) : null;
  const exp = typeof meta.reset_exp === "number" ? (meta.reset_exp as number) : 0;
  const tries = typeof meta.reset_tries === "number" ? (meta.reset_tries as number) : 0;

  if (!storedHash || Date.now() > exp) return { ok: false, error: "কোডের মেয়াদ শেষ — আবার নতুন কোড নিন।" };
  if (tries >= MAX_TRIES) return { ok: false, error: "অনেকবার ভুল চেষ্টা হয়েছে — আবার নতুন কোড নিন।" };

  if (sha(code) !== storedHash) {
    await admin.auth.admin.updateUserById(prof.id, { user_metadata: { ...meta, reset_tries: tries + 1 } });
    return { ok: false, error: "কোড সঠিক নয়।" };
  }

  const { error } = await admin.auth.admin.updateUserById(prof.id, {
    password: input.newPassword,
    user_metadata: { ...meta, reset_code: null, reset_exp: null, reset_ch: null, reset_tries: null, reset_sent: null, legacy_pw: null },
  });
  if (error) return { ok: false, error: "পাসওয়ার্ড পরিবর্তন করা যায়নি — আবার চেষ্টা করুন।" };

  return { ok: true, message: "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে। এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।" };
}
