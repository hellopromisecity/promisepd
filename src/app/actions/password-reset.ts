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
import { sendResetCodeEmail } from "@/lib/email";

export type Channel = "phone" | "email";
/** need:"mobile" → the typed email is on no account; the UI asks for the
 *  login mobile so a NEW email can be attached during this reset. */
export type ResetResult = { ok: true; message: string } | { ok: false; error: string; need?: "mobile" };

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
  // 1) profiles.email (staff + members who set it at signup)
  const { data: profs } = await admin.from("profiles").select("id, mobile, email").ilike("email", email).limit(1);
  const p = (profs ?? [])[0] as { id: string; mobile: string | null; email: string | null } | undefined;
  if (p?.id) return { id: p.id, mobile: p.mobile ?? null, email: p.email ?? null };
  // 2) investor_accounts.email — where the manager's Edit-user form (and most
  //    book imports) store a member's contact address
  const { data: accs } = await admin
    .from("investor_accounts")
    .select("profile_id, email")
    .ilike("email", email)
    .not("profile_id", "is", null)
    .limit(1);
  const hit = (accs ?? [])[0] as { profile_id: string | null; email: string | null } | undefined;
  if (hit?.profile_id) {
    const { data: p2 } = await admin.from("profiles").select("id, mobile, email").eq("id", hit.profile_id).maybeSingle();
    const prof2 = p2 as { id?: string; mobile?: string | null; email?: string | null } | null;
    if (prof2?.id) return { id: prof2.id, mobile: prof2.mobile ?? null, email: prof2.email ?? hit.email ?? null };
  }
  return null;
}

/** Account found by mobile, no email set yet → send the code to the TYPED
 *  email; it's attached to the account only after the code confirms. An
 *  account that already carries a different email is never overwritten. */
async function requestEmailResetByMobile(admin: Admin, typedEmail: string, rawMobile: string): Promise<ResetResult> {
  const email = typedEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: "সঠিক ইমেইল দিন।" };
  const mobile = canonMobile(rawMobile);
  if (!mobile) return { ok: false, error: "সঠিক মোবাইল নম্বর দিন।" };
  const { data: profs } = await admin.from("profiles").select("id, mobile, email").eq("mobile", mobile).limit(1);
  const prof = (profs ?? [])[0] as { id: string; mobile: string | null; email: string | null } | undefined;
  if (!prof?.id) return { ok: false, error: "এই মোবাইল নম্বরে কোনো অ্যাকাউন্ট পাওয়া যায়নি — নম্বরটি মিলিয়ে দেখুন, অথবা অফিসে (+৮৮০ ১৯১০-০৬৫১৩৬) যোগাযোগ করুন।" };

  let existing = prof.email?.trim() || null;
  if (!existing) {
    const { data: accs } = await admin.from("investor_accounts").select("email").eq("profile_id", prof.id).not("email", "is", null).neq("email", "").limit(1);
    existing = ((accs ?? [])[0] as { email?: string } | undefined)?.email?.trim() || null;
  }
  if (existing && existing.toLowerCase() !== email) {
    // never overwrite an already-set email — the owner must type THAT one
    return { ok: false, error: "আপনার ইমেইল মিলছে না — এই অ্যাকাউন্টে আগে থেকে যে ইমেইলটি সেট করা আছে, সেটিই দিন।" };
  }

  const { data: got } = await admin.auth.admin.getUserById(prof.id);
  const meta = (got?.user?.user_metadata ?? {}) as Record<string, unknown>;
  const lastSent = typeof meta.reset_sent === "number" ? (meta.reset_sent as number) : 0;
  if (Date.now() - lastSent < RESEND_COOLDOWN_MS) {
    return { ok: true, message: "কোড পাঠানো হয়েছে। আবার চাইলে এক মিনিট পরে চেষ্টা করুন।" };
  }

  const code = sixDigit();
  const { sent } = await sendResetCodeEmail(email, code);
  if (!sent) {
    return { ok: false, error: "ইমেইল সিস্টেম এই মুহূর্তে চালু হচ্ছে — কিছুক্ষণ পরে আবার চেষ্টা করুন, অথবা অফিসে (+৮৮০ ১৯১০-০৬৫১৩৬) যোগাযোগ করুন।" };
  }
  await admin.auth.admin.updateUserById(prof.id, {
    user_metadata: { ...meta, reset_code: sha(code), reset_exp: Date.now() + CODE_TTL_MS, reset_ch: "email", reset_tries: 0, reset_sent: Date.now(), reset_new_email: email },
  });
  return { ok: true, message: "আপনার ইমেইলে একটি ৬-সংখ্যার কোড পাঠানো হয়েছে — কোডটি দিলেই ইমেইলটি অ্যাকাউন্টে যুক্ত হয়ে যাবে।" };
}

/** Step 1 — send a reset code over the chosen channel. */
export async function requestPasswordReset(input: { channel: Channel; identifier: string; mobile?: string }): Promise<ResetResult> {
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "সার্ভিস এখন সচল নেই। একটু পরে চেষ্টা করুন।" };
  const channel: Channel = input.channel === "email" ? "email" : "phone";
  const identifier = (input.identifier || "").trim();
  if (!identifier) return { ok: false, error: channel === "email" ? "ইমেইল দিন।" : "মোবাইল নম্বর দিন।" };

  const prof = await resolveProfile(admin, channel, identifier);
  if (!prof) {
    // email on no account: with a mobile we can attach it during this reset;
    // without one, ask the UI to collect it
    if (channel === "email" && input.mobile?.trim()) {
      return requestEmailResetByMobile(admin, identifier, input.mobile.trim());
    }
    if (channel === "email") {
      return { ok: false, need: "mobile", error: "এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি — নিচে আপনার লগইন মোবাইল নম্বরটি দিন, কোড কনফার্ম করলেই এই ইমেইল অ্যাকাউন্টে যুক্ত হয়ে যাবে।" };
    }
    // phone channel: never leak whether the account exists
    return { ok: true, message: "যদি এই নম্বরে অ্যাকাউন্ট থাকে, একটি কোড পাঠানো হয়েছে।" };
  }

  const { data: got } = await admin.auth.admin.getUserById(prof.id);
  const meta = (got?.user?.user_metadata ?? {}) as Record<string, unknown>;
  const lastSent = typeof meta.reset_sent === "number" ? (meta.reset_sent as number) : 0;
  if (Date.now() - lastSent < RESEND_COOLDOWN_MS) {
    return { ok: true, message: "কোড পাঠানো হয়েছে। আবার চাইলে এক মিনিট পরে চেষ্টা করুন।" };
  }

  const code = sixDigit();

  if (channel === "phone") {
    await admin.auth.admin.updateUserById(prof.id, {
      user_metadata: { ...meta, reset_code: sha(code), reset_exp: Date.now() + CODE_TTL_MS, reset_ch: channel, reset_tries: 0, reset_sent: Date.now() },
    });
    await sendResetCodeSms("+" + (prof.mobile ?? canonMobile(identifier) ?? ""), code);
    return { ok: true, message: "আপনার ফোনে একটি ৬-সংখ্যার কোড পাঠানো হয়েছে।" };
  }

  // Email: deliver FIRST, persist after — a failed send (e.g. the sending
  // domain isn't verified yet) must not burn the cooldown or store a code
  // the user can never receive.
  const { sent } = await sendResetCodeEmail(prof.email ?? identifier, code);
  if (!sent) {
    return { ok: false, error: "ইমেইল সিস্টেম এই মুহূর্তে চালু হচ্ছে — কিছুক্ষণ পরে আবার চেষ্টা করুন, অথবা অফিসে (+৮৮০ ১৯১০-০৬৫১৩৬) যোগাযোগ করুন।" };
  }
  await admin.auth.admin.updateUserById(prof.id, {
    user_metadata: { ...meta, reset_code: sha(code), reset_exp: Date.now() + CODE_TTL_MS, reset_ch: channel, reset_tries: 0, reset_sent: Date.now() },
  });
  return { ok: true, message: "আপনার ইমেইলে একটি ৬-সংখ্যার কোড পাঠানো হয়েছে।" };
}

/** Step 2 — verify the code and set the new password. */
export async function confirmPasswordReset(input: {
  channel: Channel;
  identifier: string;
  code: string;
  newPassword: string;
  mobile?: string;
}): Promise<ResetResult> {
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "সার্ভিস এখন সচল নেই।" };
  const channel: Channel = input.channel === "email" ? "email" : "phone";
  const code = (input.code || "").replace(/\D/g, "");
  if (code.length !== 6) return { ok: false, error: "৬-সংখ্যার কোড দিন।" };
  if (!input.newPassword || input.newPassword.length < MIN_PW) {
    return { ok: false, error: `পাসওয়ার্ড কমপক্ষে ${MIN_PW} অক্ষরের হতে হবে।` };
  }

  let prof = await resolveProfile(admin, channel, input.identifier);
  if (!prof && channel === "email" && input.mobile?.trim()) {
    // the new-email path: the account is identified by its login mobile
    const m = canonMobile(input.mobile.trim());
    if (m) {
      const { data: profs } = await admin.from("profiles").select("id, mobile, email").eq("mobile", m).limit(1);
      const p = (profs ?? [])[0] as { id: string; mobile: string | null; email: string | null } | undefined;
      if (p?.id) prof = { id: p.id, mobile: p.mobile ?? null, email: p.email ?? null };
    }
  }
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

  const pendingEmail = typeof meta.reset_new_email === "string" ? (meta.reset_new_email as string) : null;
  const { error } = await admin.auth.admin.updateUserById(prof.id, {
    password: input.newPassword,
    user_metadata: { ...meta, reset_code: null, reset_exp: null, reset_ch: null, reset_tries: null, reset_sent: null, reset_new_email: null, legacy_pw: null, ...(pendingEmail ? { email: pendingEmail } : {}) },
  });
  if (error) return { ok: false, error: "পাসওয়ার্ড পরিবর্তন করা যায়নি — আবার চেষ্টা করুন।" };

  // The code confirmed ownership of the new inbox → NOW attach it to the
  // account (profile + any of their investor accounts without an email).
  // No SMS anywhere in this flow (owner's call 2026-08-16): typing the FULL
  // account mobile in the identify step IS the ownership check.
  if (pendingEmail) {
    try {
      if (!prof.email) await admin.from("profiles").update({ email: pendingEmail }).eq("id", prof.id);
      const { data: accs } = await admin.from("investor_accounts").select("uid, email").eq("profile_id", prof.id);
      for (const a of (accs ?? []) as { uid: string; email: string | null }[]) {
        if (!(a.email ?? "").trim()) await admin.from("investor_accounts").update({ email: pendingEmail }).eq("uid", a.uid);
      }
    } catch { /* the reset itself already succeeded */ }
  }

  return { ok: true, message: "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে। এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।" };
}
