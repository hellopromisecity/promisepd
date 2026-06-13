"use server";

/** Public form Server Actions — writes flow into Supabase via the
 *  service-role admin client (RLS is enabled on the table so the
 *  anon key cannot reach it).
 *
 *  Graceful: if Supabase env vars aren't set yet (e.g. fresh dev
 *  clone, preview deploy), the action still resolves `ok` and logs
 *  the payload to stdout so the UI keeps working while the database
 *  is being provisioned. */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendContactNotification,
  sendNewsletterWelcome,
} from "@/lib/email";

export type ContactPayload = {
  name: string;
  email: string;
  phone?: string;
  interest?: string;
  message: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitContact(
  payload: ContactPayload,
): Promise<{ ok: boolean; error?: string }> {
  if (
    !payload.name?.trim() ||
    !payload.email?.trim() ||
    !payload.message?.trim()
  ) {
    return { ok: false, error: "Please fill in name, email and message." };
  }
  if (!EMAIL_RE.test(payload.email)) {
    return { ok: false, error: "Please enter a valid email." };
  }

  const supabase = createAdminClient();
  if (!supabase) {
    // Env not configured yet — fall back to a log so dev / preview
    // builds don't blow up.
    console.log("[contact] received (Supabase not configured):", payload);
    return { ok: true };
  }

  const { error } = await supabase.from("contact_submissions").insert({
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    phone: payload.phone?.trim() || null,
    interest: payload.interest?.trim() || null,
    message: payload.message.trim(),
    source: "website",
  });

  if (error) {
    console.error("[contact] supabase insert failed:", error);
    return {
      ok: false,
      error: "Something went wrong saving your message. Please try again.",
    };
  }

  // Fire the branded email notification AFTER the row is safely
  // stored — `await` so serverless doesn't kill the function before
  // the request finishes, but a mail failure never fails the form
  // (sendContactNotification swallows its own errors).
  await sendContactNotification({
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    phone: payload.phone?.trim() || undefined,
    interest: payload.interest?.trim() || undefined,
    message: payload.message.trim(),
  });

  return { ok: true };
}

export async function subscribeNewsletter(
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email." };
  }

  const normalized = email.trim().toLowerCase();

  const supabase = createAdminClient();
  if (!supabase) {
    console.log("[newsletter] received (Supabase not configured):", normalized);
    return { ok: true };
  }

  const { error } = await supabase
    .from("newsletter_subscriptions")
    .insert({ email: normalized, source: "website" });

  // 23505 = unique_violation.  Already subscribed → treat as success
  // (don't re-send the welcome) so a re-submit isn't a scary error.
  if (error) {
    if (error.code === "23505") {
      return { ok: true };
    }
    console.error("[newsletter] supabase insert failed:", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  // New subscriber → fire the branded welcome email.  No-op if a
  // verified domain isn't configured yet; the row is already saved
  // either way so the list keeps growing.
  await sendNewsletterWelcome(normalized);

  return { ok: true };
}
