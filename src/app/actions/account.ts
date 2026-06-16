"use server";

/** Self-service account actions for the logged-in member (investor) portal.
 *  Everything is scoped to getCurrentUser() — a member can only ever change
 *  their OWN name / email / phone / password. */

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type AccountResult = { ok: true; message: string } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AUTH_EMAIL_DOMAIN = "users.promisepd.app";
const syntheticEmail = (mobile: string) => `${mobile}@${AUTH_EMAIL_DOMAIN}`;

/** Canonical Bangladeshi mobile "8801XXXXXXXXX" or null. */
function normalizeBdMobile(raw: string): string | null {
  let d = (raw || "").replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 13 && d.startsWith("8801")) return d;
  if (d.length === 11 && d.startsWith("01")) return `880${d.slice(1)}`;
  if (d.length === 10 && d.startsWith("1")) return `8801${d.slice(1)}`;
  return null;
}

/** Update the member's own name / email, and (optionally) their login phone. */
export async function updateMyProfile(input: { name: string; email: string; phone: string }): Promise<AccountResult> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "আপনি লগইন করা নেই।" };
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "সার্ভিস এখন সচল নেই।" };

  const name = (input.name || "").trim();
  if (name.length < 2) return { ok: false, error: "নাম দিন।" };
  let email = (input.email || "").trim();
  if (/@users\.promisepd\.app$/i.test(email)) email = ""; // never store the internal synthetic email
  if (email && !EMAIL_RE.test(email)) return { ok: false, error: "ইমেইল ঠিক নয়।" };

  // Optional phone (login key) change — BD numbers only, must be free.
  const typed = (input.phone || "").trim();
  const newMobile = typed ? normalizeBdMobile(typed) : me.mobile;
  if (typed && !newMobile) return { ok: false, error: "সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)।" };
  const phoneChanged = !!newMobile && newMobile !== me.mobile;

  if (phoneChanged) {
    const { data: taken } = await admin.from("profiles").select("id").eq("mobile", newMobile).neq("id", me.id).maybeSingle();
    if (taken) return { ok: false, error: "এই নম্বরটি অন্য একটি অ্যাকাউন্টে ব্যবহৃত হচ্ছে।" };
    // move the login identity (synthetic auth email) to the new number
    const { error: aErr } = await admin.auth.admin.updateUserById(me.id, { email: syntheticEmail(newMobile!) });
    if (aErr) return { ok: false, error: aErr.message };
  }

  const { error: pErr } = await admin
    .from("profiles")
    .update({ name, email: email || null, ...(phoneChanged ? { mobile: newMobile } : {}) })
    .eq("id", me.id);
  if (pErr) return { ok: false, error: pErr.message };

  await admin
    .from("investor_accounts")
    .update({ full_name: name, email: email || null, ...(phoneChanged ? { phone_number: `+${newMobile}` } : {}) })
    .eq("profile_id", me.id);

  revalidatePath("/account");
  revalidatePath("/en/account");
  return { ok: true, message: phoneChanged ? "Saved — next time, log in with your new number." : "Profile updated." };
}

/** Change the member's own password (current password required to confirm). */
export async function changeMyPassword(input: { currentPassword: string; newPassword: string }): Promise<AccountResult> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "আপনি লগইন করা নেই।" };
  if (!input.newPassword || input.newPassword.length < 6) return { ok: false, error: "নতুন পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।" };
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "সার্ভিস এখন সচল নেই।" };

  // Confirm the current password by attempting a sign-in (never persisted).
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return { ok: false, error: "সার্ভিস এখন সচল নেই।" };
  const anonClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: signErr } = await anonClient.auth.signInWithPassword({ email: syntheticEmail(me.mobile), password: input.currentPassword });
  if (signErr) return { ok: false, error: "বর্তমান পাসওয়ার্ড ঠিক নয়।" };

  const { error } = await admin.auth.admin.updateUserById(me.id, { password: input.newPassword });
  if (error) return { ok: false, error: error.message };
  return { ok: true, message: "Password changed." };
}
