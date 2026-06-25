/** Transactional email — contact-form notifications via Resend.
 *
 *  Server-only.  Fired from the submitContact Server Action AFTER
 *  the Supabase row is written, so a mail hiccup never blocks the
 *  lead from being saved.
 *
 *  Graceful: if RESEND_API_KEY isn't set (fresh clone, preview
 *  deploy), the send is skipped and logged — the form still works.
 *
 *  Why Resend: cleanest transactional-email API, generous free tier,
 *  and sending to your own Resend-account email works without domain
 *  verification — so hellopromisecity@gmail.com receives mail the
 *  moment the key is wired in (sign up at resend.com with that
 *  address).  Verify the promisepd.com domain later to send from a
 *  branded `noreply@promisepd.com` address. */

import "server-only";
import { Resend } from "resend";

export type ContactEmailPayload = {
  name: string;
  email: string;
  phone?: string;
  interest?: string;
  message: string;
};

/** Where lead notifications land + who they're "from". */
const NOTIFY_TO = process.env.CONTACT_NOTIFY_EMAIL || "hellopromisecity@gmail.com";
const FROM = process.env.CONTACT_FROM_EMAIL || "PromisePD <onboarding@resend.dev>";

/** Resend's shared `onboarding@resend.dev` sender can ONLY deliver
 *  to your own Resend-account email until you verify a domain.  So
 *  the subscriber welcome mail only actually sends once a real
 *  domain (promisepd.com) is verified + CONTACT_FROM_EMAIL points at
 *  it.  Until then we still save the subscriber to the DB and skip
 *  the welcome silently — no broken UX. */
export const canEmailArbitraryRecipients = () =>
  !!process.env.CONTACT_FROM_EMAIL &&
  !process.env.CONTACT_FROM_EMAIL.includes("resend.dev");

/** Email a password-reset code.  Sends only when a verified domain is
 *  configured (Resend's shared sender can't reach arbitrary inboxes);
 *  otherwise a silent no-op (the caller steers the user to phone reset).
 *  Returns whether it actually sent. */
export async function sendResetCodeEmail(
  email: string,
  code: string,
): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !canEmailArbitraryRecipients()) return { sent: false };
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: "PromisePD — পাসওয়ার্ড রিসেট কোড",
      html: `<div style="font-family:system-ui,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1847A1;margin:0 0 8px">PromisePD পাসওয়ার্ড রিসেট</h2>
        <p style="color:#475569;font-size:14px;margin:0 0 16px">আপনার পাসওয়ার্ড রিসেট কোড:</p>
        <div style="font-size:32px;font-weight:800;letter-spacing:8px;color:#0b1220;background:#f1f5f9;border-radius:12px;padding:16px;text-align:center">${code}</div>
        <p style="color:#64748b;font-size:13px;margin:16px 0 0">কোডটি ১০ মিনিট পর্যন্ত বৈধ। আপনি যদি রিসেট না চান, এই ইমেইল উপেক্ষা করুন।</p>
      </div>`,
    });
    if (error) {
      console.error("[email] reset code send failed:", error);
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error("[email] reset code unexpected error:", err);
    return { sent: false };
  }
}

export async function sendContactNotification(
  payload: ContactEmailPayload,
): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[email] RESEND_API_KEY not set — skipping notification.");
    return { sent: false };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM,
      to: NOTIFY_TO,
      // Team can hit "Reply" and write straight back to the lead.
      replyTo: payload.email,
      subject: `নতুন যোগাযোগ — ${payload.name}`,
      html: buildContactEmailHtml(payload),
    });
    if (error) {
      console.error("[email] resend send failed:", error);
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error("[email] unexpected send error:", err);
    return { sent: false };
  }
}

/** Branded "thanks for subscribing" welcome email to a newsletter
 *  signup.  Sends only when:
 *    - RESEND_API_KEY is set, AND
 *    - a verified domain is configured (Resend's shared sender can't
 *      reach arbitrary inboxes).
 *  Otherwise it's a silent no-op — the subscriber is still saved to
 *  the DB, so the team can email the list later regardless. */
export async function sendNewsletterWelcome(
  email: string,
): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !canEmailArbitraryRecipients()) {
    return { sent: false };
  }
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: "স্বাগতম — PromisePD নিউজলেটারে যুক্ত হয়েছেন 🎉",
      html: buildWelcomeEmailHtml(),
    });
    if (error) {
      console.error("[email] welcome send failed:", error);
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error("[email] welcome unexpected error:", err);
    return { sent: false };
  }
}

/** Brand-styled, table-based HTML email — inline styles only (email
 *  clients strip <style> + @font-face), web-safe layout, Bangla text
 *  renders via the recipient's system Bengali font. */
function buildContactEmailHtml(p: ContactEmailPayload): string {
  const now = new Intl.DateTimeFormat("bn-BD", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(new Date());

  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const row = (label: string, value: string, accent = "#1847a1") => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #eef2ff;">
        <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#8a93a6;font-weight:700;">${label}</div>
        <div style="margin-top:4px;font-size:15px;color:#0b1220;font-weight:600;line-height:1.5;border-left:3px solid ${accent};padding-left:10px;">${value}</div>
      </td>
    </tr>`;

  const phoneRow = p.phone
    ? row("ফোন", `<a href="tel:${esc(p.phone)}" style="color:#1847a1;text-decoration:none;">${esc(p.phone)}</a>`, "#e11924")
    : "";
  const interestRow = p.interest
    ? row("আগ্রহের বিষয়", esc(p.interest), "#c0c7d1")
    : "";

  return `<!doctype html>
<html lang="bn">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f9ff;font-family:'Noto Sans Bengali',-apple-system,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9ff;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 32px -10px rgba(24,71,161,0.18);">

          <!-- Header band -->
          <tr>
            <td style="background:linear-gradient(135deg,#1847a1 0%,#133680 60%,#e11924 140%);padding:28px 32px;">
              <div style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:.3px;">Promise&nbsp;PPD</div>
              <div style="margin-top:2px;font-size:12px;color:rgba(255,255,255,0.8);">স্বপ্ন যেখানে বাস্তব</div>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding:28px 32px 8px;">
              <div style="display:inline-block;background:#dce6f8;color:#1847a1;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:6px 12px;border-radius:999px;">নতুন যোগাযোগ বার্তা</div>
              <h1 style="margin:14px 0 4px;font-size:22px;color:#0b1220;font-weight:800;line-height:1.3;">
                ${esc(p.name)} আপনার সাথে যোগাযোগ করতে চান
              </h1>
              <p style="margin:0;font-size:14px;color:#5a6478;line-height:1.6;">
                ওয়েবসাইটের যোগাযোগ ফর্ম থেকে একটি নতুন বার্তা এসেছে। বিস্তারিত নিচে —
              </p>
            </td>
          </tr>

          <!-- Detail rows -->
          <tr>
            <td style="padding:8px 32px 4px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${row("নাম", esc(p.name))}
                ${row("ইমেইল", `<a href="mailto:${esc(p.email)}" style="color:#1847a1;text-decoration:none;">${esc(p.email)}</a>`)}
                ${phoneRow}
                ${interestRow}
              </table>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding:12px 32px 4px;">
              <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#8a93a6;font-weight:700;margin-bottom:8px;">বার্তা</div>
              <div style="background:#f7f9ff;border:1px solid #eef2ff;border-radius:12px;padding:16px 18px;font-size:15px;color:#1f2a44;line-height:1.7;white-space:pre-wrap;">${esc(p.message)}</div>
            </td>
          </tr>

          <!-- Reply CTA -->
          <tr>
            <td style="padding:22px 32px 8px;">
              <a href="mailto:${esc(p.email)}?subject=${encodeURIComponent("Re: আপনার বার্তা — PromisePD")}"
                 style="display:inline-block;background:#1847a1;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:13px 28px;border-radius:14px;">
                ↩&nbsp; সরাসরি উত্তর দিন
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #eef2ff;margin-top:12px;">
              <p style="margin:0 0 4px;font-size:12px;color:#8a93a6;line-height:1.6;">
                📅 ${now} (ঢাকা)
              </p>
              <p style="margin:0;font-size:12px;color:#8a93a6;line-height:1.6;">
                Promise Proper Development Ltd. · ১২৩/১/২ কাজী টাওয়ার, দক্ষিণ যাত্রাবাড়ী, ঢাকা-১২০৪<br/>
                এই মেইলটি স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে — সরাসরি Reply করলে গ্রাহকের কাছে পৌঁছাবে।
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Subscriber-facing welcome email — warm, on-brand, with the five
 *  divisions teased so they know what they've signed up to hear
 *  about. */
function buildWelcomeEmailHtml(): string {
  const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://promisepd.com";
  return `<!doctype html>
<html lang="bn">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f9ff;font-family:'Noto Sans Bengali',-apple-system,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9ff;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 32px -10px rgba(24,71,161,0.18);">

          <tr>
            <td style="background:linear-gradient(135deg,#1847a1 0%,#133680 60%,#e11924 140%);padding:32px;text-align:center;">
              <div style="font-size:22px;font-weight:800;color:#ffffff;">Promise&nbsp;PPD</div>
              <div style="margin-top:4px;font-size:13px;color:rgba(255,255,255,0.85);">স্বপ্ন যেখানে বাস্তব</div>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 32px 12px;text-align:center;">
              <div style="font-size:40px;line-height:1;">🎉</div>
              <h1 style="margin:16px 0 8px;font-size:24px;color:#0b1220;font-weight:800;">স্বাগতম প্রমিস পরিবারে!</h1>
              <p style="margin:0;font-size:15px;color:#5a6478;line-height:1.7;">
                আপনি সফলভাবে আমাদের নিউজলেটারে যুক্ত হয়েছেন। এখন থেকে নতুন
                প্রকল্প, কিস্তি অফার ও প্রি-লঞ্চ সুবিধার খবর সবার আগে আপনার
                ইনবক্সে পৌঁছে দেবো — কোনো স্প্যাম নেই।
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:12px 32px;">
              <div style="background:#f7f9ff;border:1px solid #eef2ff;border-radius:14px;padding:18px 20px;">
                <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#8a93a6;font-weight:700;margin-bottom:10px;">যা যা পাবেন</div>
                <div style="font-size:14px;color:#1f2a44;line-height:2;">
                  🏢 প্রমিস সিটি — নতুন ফ্ল্যাট ও প্লট<br/>
                  🔨 আহবাব রিয়েল এস্টেট — নির্মাণ আপডেট<br/>
                  💰 প্রমিস ইন্টারন্যাশনাল — সঞ্চয় সুবিধা<br/>
                  🕋 আহবাব ট্রাভেলস — হজ্জ ও উমরাহ প্যাকেজ<br/>
                  🎨 ইন্টেরিয়র ও 3D ডিজাইন
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px 8px;text-align:center;">
              <a href="${SITE}" style="display:inline-block;background:#1847a1;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:13px 30px;border-radius:14px;">
                ওয়েবসাইট ঘুরে দেখুন
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #eef2ff;text-align:center;">
              <p style="margin:0;font-size:12px;color:#8a93a6;line-height:1.6;">
                Promise Proper Development Ltd.<br/>
                ১২৩/১/২ কাজী টাওয়ার, দক্ষিণ যাত্রাবাড়ী, ঢাকা-১২০৪<br/>
                📞 +৮৮০ ১৯১০-০৬৫১৩৬
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
