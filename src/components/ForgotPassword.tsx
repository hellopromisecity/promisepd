"use client";

/** Forgot-password flow — pick phone or email, get a 6-digit code, then set a
 *  new password.  Phone reset works now (SMS, BD numbers); email reset is
 *  shown only when a verified mail domain is configured (`emailEnabled`). */

import { useState, useTransition } from "react";
import Link from "next/link";
import { Phone, Mail, KeyRound, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { requestPasswordReset, confirmPasswordReset, type Channel } from "@/app/actions/password-reset";

type Status = { ok: boolean; text: string } | null;

const T = {
  bn: {
    sub: "পাসওয়ার্ড ভুলে গেছেন? নিচের যেকোনো উপায়ে নতুন পাসওয়ার্ড সেট করুন।",
    phone: "ফোন", email: "ইমেইল",
    phoneLabel: "মোবাইল নম্বর", emailLabel: "ইমেইল ঠিকানা",
    phonePh: "01XXXXXXXXX", emailPh: "you@example.com",
    sendCode: "কোড পাঠান", sending: "পাঠানো হচ্ছে...",
    codeLabel: "৬-সংখ্যার কোড", codePh: "______",
    newPw: "নতুন পাসওয়ার্ড", newPwPh: "নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)",
    reset: "পাসওয়ার্ড রিসেট করুন", resetting: "রিসেট হচ্ছে...",
    resend: "আবার কোড পাঠান", back: "ফিরে যান",
    show: "দেখান", hide: "লুকান",
    doneTitle: "হয়ে গেছে!", toLogin: "লগইন করুন",
    sentTo: "কোড পাঠানো হয়েছে —",
  },
  en: {
    sub: "Forgot your password? Set a new one using either method below.",
    phone: "Phone", email: "Email",
    phoneLabel: "Mobile number", emailLabel: "Email address",
    phonePh: "01XXXXXXXXX", emailPh: "you@example.com",
    sendCode: "Send code", sending: "Sending...",
    codeLabel: "6-digit code", codePh: "______",
    newPw: "New password", newPwPh: "New password (min 6 characters)",
    reset: "Reset password", resetting: "Resetting...",
    resend: "Resend code", back: "Back",
    show: "Show", hide: "Hide",
    doneTitle: "All done!", toLogin: "Log in",
    sentTo: "Code sent to —",
  },
} as const;

export default function ForgotPassword({
  locale = "bn",
  emailEnabled = false,
}: {
  locale?: "bn" | "en";
  emailEnabled?: boolean;
}) {
  const t = T[locale];
  const loginHref = locale === "en" ? "/en/login" : "/login";
  const [channel, setChannel] = useState<Channel>("phone");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [step, setStep] = useState<"request" | "confirm" | "done">("request");
  const [status, setStatus] = useState<Status>(null);
  const [pending, start] = useTransition();

  function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    start(async () => {
      const r = await requestPasswordReset({ channel, identifier });
      if (r.ok) {
        setStatus({ ok: true, text: r.message });
        setStep("confirm");
      } else {
        setStatus({ ok: false, text: r.error });
      }
    });
  }

  function doReset(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    start(async () => {
      const r = await confirmPasswordReset({ channel, identifier, code, newPassword });
      if (r.ok) setStep("done");
      else setStatus({ ok: false, text: r.error });
    });
  }

  const banner =
    status &&
    `rounded-xl px-4 py-3 text-sm ${status.ok ? "bg-brand-blue-tint border border-brand-blue/30 text-brand-blue-dark" : "bg-brand-red-tint border border-brand-red/30 text-brand-red-dark"}`;

  if (step === "done") {
    return (
      <div className="grad-border p-6 sm:p-8 text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-fg">{t.doneTitle}</h2>
        <p className="mt-2 text-sm text-fg-muted">
          {locale === "en" ? "Your password has been changed. Log in with the new password." : "আপনার পাসওয়ার্ড পরিবর্তন হয়েছে। নতুন পাসওয়ার্ড দিয়ে লগইন করুন।"}
        </p>
        <Link href={loginHref} className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 py-3 text-sm font-bold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark transition-colors">
          {t.toLogin}
        </Link>
      </div>
    );
  }

  return (
    <div className="grad-border p-6 sm:p-7">
      {step === "request" ? (
        <form onSubmit={sendCode} className="space-y-4">
          {emailEnabled && (
            <div className="grid grid-cols-2 gap-1 rounded-2xl bg-bg-soft p-1">
              {(["phone", "email"] as Channel[]).map((c) => (
                <button key={c} type="button" onClick={() => { setChannel(c); setIdentifier(""); setStatus(null); }}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold transition-colors ${channel === c ? "bg-fg text-bg shadow" : "text-fg-muted hover:text-fg"}`}>
                  {c === "phone" ? <Phone className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                  {c === "phone" ? t.phone : t.email}
                </button>
              ))}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-fg">{channel === "phone" ? t.phoneLabel : t.emailLabel}</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint">
                {channel === "phone" ? <Phone className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
              </span>
              <input
                type={channel === "phone" ? "tel" : "email"}
                inputMode={channel === "phone" ? "tel" : "email"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={channel === "phone" ? t.phonePh : t.emailPh}
                required
                className="w-full rounded-xl border border-border bg-bg py-3 pl-9 pr-4 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
          </div>
          {banner && <div className={banner}>{status!.text}</div>}
          <button type="submit" disabled={pending} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-3 text-sm font-bold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark disabled:opacity-70 transition-all">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {pending ? t.sending : t.sendCode}
          </button>
        </form>
      ) : (
        <form onSubmit={doReset} className="space-y-4">
          <p className="text-xs text-fg-muted">{t.sentTo} <span className="font-semibold text-fg">{identifier}</span></p>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-fg">{t.codeLabel}</label>
            <input
              inputMode="numeric" maxLength={6} value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder={t.codePh} required
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-center text-lg font-bold tracking-[0.5em] outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-fg">{t.newPw}</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"} value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t.newPwPh} required minLength={6}
                className="w-full rounded-xl border border-border bg-bg py-3 pl-4 pr-10 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
              <button type="button" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? t.hide : t.show}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-faint hover:text-fg">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {banner && <div className={banner}>{status!.text}</div>}
          <button type="submit" disabled={pending} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-3 text-sm font-bold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark disabled:opacity-70 transition-all">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {pending ? t.resetting : t.reset}
          </button>
          <button type="button" onClick={() => { setStep("request"); setStatus(null); setCode(""); }}
            className="inline-flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-fg-muted hover:text-brand-blue">
            <ArrowLeft className="h-3.5 w-3.5" /> {t.back}
          </button>
        </form>
      )}
    </div>
  );
}
