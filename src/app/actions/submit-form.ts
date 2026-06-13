"use server";

/** Receives a client-generated, faithfully-filled form PDF (base64)
 *  and emails it to the office via Resend as an attachment.
 *
 *  The PDF is built in the browser (html2canvas + jsPDF) so Bengali
 *  text shapes correctly — the server just relays it. Mirrors the
 *  graceful behaviour of src/lib/email.ts (no key → skip, log). */

import { Resend } from "resend";

const NOTIFY_TO =
  process.env.CONTACT_NOTIFY_EMAIL || "hellopromisecity@gmail.com";
const FROM = process.env.CONTACT_FROM_EMAIL || "PromisePD <onboarding@resend.dev>";

export type SubmitFormInput = {
  formName: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail?: string;
  /** Raw base64 of the PDF (no `data:` prefix). */
  pdfBase64: string;
  fileName: string;
};

export type SubmitFormResult = { ok: boolean; error?: string };

const esc = (s: string) =>
  String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));

export async function submitForm(
  input: SubmitFormInput,
): Promise<SubmitFormResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[form] RESEND_API_KEY not set — skipping send.");
    return { ok: false, error: "ইমেইল সার্ভিস এখন সচল নেই। সরাসরি কল করুন।" };
  }
  if (!input.pdfBase64 || input.pdfBase64.length < 1000) {
    return { ok: false, error: "ফরমের PDF তৈরি হয়নি — আবার চেষ্টা করুন।" };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM,
      to: NOTIFY_TO,
      replyTo: input.applicantEmail || undefined,
      subject: `নতুন আবেদন — ${input.formName} · ${input.applicantName || "আবেদনকারী"}`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#0b1220">
          <h2 style="margin:0 0 8px">নতুন ${esc(input.formName)}</h2>
          <p style="margin:0 0 4px"><b>নাম:</b> ${esc(input.applicantName) || "—"}</p>
          <p style="margin:0 0 4px"><b>মোবাইল:</b> ${esc(input.applicantPhone) || "—"}</p>
          ${input.applicantEmail ? `<p style="margin:0 0 4px"><b>ই-মেইল:</b> ${esc(input.applicantEmail)}</p>` : ""}
          <p style="margin:12px 0 0;color:#5a6478">সম্পূর্ণ পূরণকৃত ফরমটি সংযুক্তিতে (PDF) দেখুন।</p>
        </div>`,
      attachments: [{ filename: input.fileName, content: input.pdfBase64 }],
    });
    if (error) {
      console.error("[form] resend error", error);
      return { ok: false, error: "ইমেইল পাঠানো যায়নি — আবার চেষ্টা করুন।" };
    }
    return { ok: true };
  } catch (e) {
    console.error("[form] send failed", e);
    return { ok: false, error: "সার্ভার ত্রুটি — পরে আবার চেষ্টা করুন।" };
  }
}
