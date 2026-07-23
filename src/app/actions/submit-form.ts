"use server";

/** Receives a client-generated, faithfully-filled form PDF (base64),
 *  SAVES the lead to the database first (a mail hiccup must never lose a
 *  customer — the row shows up in Dashboard → Messages immediately), then
 *  emails the office inboxes via Resend with the PDF attached.
 *
 *  The PDF is built in the browser (html2canvas + jsPDF) so Bengali text
 *  shapes correctly — the server just relays it. */

import { createAdminClient } from "@/lib/supabase/admin";
import { sendTeamEmail } from "@/lib/email";

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
  if (!input.pdfBase64 || input.pdfBase64.length < 1000) {
    return { ok: false, error: "ফরমের PDF তৈরি হয়নি — আবার চেষ্টা করুন।" };
  }

  // 1) Save the lead FIRST — visible in Dashboard → Messages even if every
  //    email fails, so a submission can never vanish again.
  let saved = false;
  try {
    const admin = createAdminClient();
    if (admin) {
      const { error } = await admin.from("contact_submissions").insert({
        name: input.applicantName?.trim() || "—",
        email: input.applicantEmail?.trim().toLowerCase() || "no-email@form.promisepd.com",
        phone: input.applicantPhone?.trim() || null,
        interest: input.formName,
        message: `ফর্ম জমা — ${input.formName}। পূরণকৃত PDF অফিস ইমেইলে পাঠানো হয়েছে (${input.fileName})।`,
        source: "form",
      });
      saved = !error;
      if (error) console.error("[form] db save failed:", error);
    }
  } catch (e) {
    console.error("[form] db save failed:", e);
  }

  // 2) Email the office — all inboxes (falls back to the deliverable one
  //    until the domain is verified). Best-effort: the save above is the net.
  const mail = await sendTeamEmail({
    subject: `নতুন আবেদন — ${input.formName} · ${input.applicantName || "আবেদনকারী"}`,
    replyTo: input.applicantEmail || undefined,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#0b1220">
        <h2 style="margin:0 0 8px">নতুন ${esc(input.formName)}</h2>
        <p style="margin:0 0 4px"><b>নাম:</b> ${esc(input.applicantName) || "—"}</p>
        <p style="margin:0 0 4px"><b>মোবাইল:</b> ${esc(input.applicantPhone) || "—"}</p>
        ${input.applicantEmail ? `<p style="margin:0 0 4px"><b>ই-মেইল:</b> ${esc(input.applicantEmail)}</p>` : ""}
        <p style="margin:12px 0 0;color:#5a6478">সম্পূর্ণ পূরণকৃত ফরমটি সংযুক্তিতে (PDF) দেখুন। এই জমাটি ড্যাশবোর্ডের Messages-এও রেকর্ড হয়েছে।</p>
      </div>`,
    attachments: [{ filename: input.fileName, content: input.pdfBase64 }],
  });

  if (saved || mail.sent) return { ok: true };
  return { ok: false, error: "জমা রাখা যায়নি — আবার চেষ্টা করুন বা সরাসরি কল করুন।" };
}
