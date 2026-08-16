"use client";

/** Forgot-password flow — EMAIL ONLY (the old phone/SMS channel was retired
 *  2026-08-16 at the owner's request): type your email, get a 6-digit code in
 *  the inbox, then set a new password.  Accounts without an email yet add one
 *  first (app settings, or the office does it from Edit user). */

import { useState, useTransition } from "react";
import Link from "next/link";
import { Mail, Phone, KeyRound, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2, Info } from "lucide-react";
import { requestPasswordReset, confirmPasswordReset } from "@/app/actions/password-reset";

type Status = { ok: boolean; text: string } | null;

const T = {
  bn: {
    emailLabel: "ইমেইল ঠিকানা", emailPh: "you@example.com",
    mobileLabel: "আপনার লগইন মোবাইল নম্বর", mobilePh: "01XXXXXXXXX বা +XX…",
    sendCode: "কোড পাঠান", sending: "পাঠানো হচ্ছে...",
    codeLabel: "৬-সংখ্যার কোড", codePh: "______",
    newPw: "নতুন পাসওয়ার্ড", newPwPh: "নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)",
    reset: "পাসওয়ার্ড রিসেট করুন", resetting: "রিসেট হচ্ছে...",
    back: "ফিরে যান",
    show: "দেখান", hide: "লুকান",
    doneTitle: "হয়ে গেছে!", toLogin: "লগইন করুন",
    sentTo: "কোড পাঠানো হয়েছে —",
    newEmailFor: "নতুন ইমেইল —",
    noEmailHint: "ইমেইল আগে সেট করা না থাকলেও সমস্যা নেই — ইমেইল লিখে এগোন, আপনার লগইন মোবাইল নম্বর দিলে কোড কনফার্মের সাথে সাথেই ইমেইলটি অ্যাকাউন্টে যুক্ত হয়ে যাবে।",
  },
  en: {
    emailLabel: "Email address", emailPh: "you@example.com",
    mobileLabel: "Your login mobile number", mobilePh: "01XXXXXXXXX or +XX…",
    sendCode: "Send code", sending: "Sending...",
    codeLabel: "6-digit code", codePh: "______",
    newPw: "New password", newPwPh: "New password (min 6 characters)",
    reset: "Reset password", resetting: "Resetting...",
    back: "Back",
    show: "Show", hide: "Hide",
    doneTitle: "All done!", toLogin: "Log in",
    sentTo: "Code sent to —",
    newEmailFor: "New email —",
    noEmailHint: "No email on your account yet? No problem — enter the email you want, then your login mobile number; the moment the code confirms, that email is attached to your account.",
  },
} as const;

export default function ForgotPassword({ locale = "bn" }: { locale?: "bn" | "en" }) {
  const t = T[locale];
  const loginHref = locale === "en" ? "/en/login" : "/login";
  const [identifier, setIdentifier] = useState("");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [step, setStep] = useState<"request" | "identify" | "confirm" | "done">("request");
  const [status, setStatus] = useState<Status>(null);
  const [pending, start] = useTransition();

  function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    start(async () => {
      const r = await requestPasswordReset({ channel: "email", identifier, mobile: step === "identify" ? mobile : undefined });
      if (r.ok) {
        setStatus({ ok: true, text: r.message });
        setStep("confirm");
      } else if ("need" in r && r.need === "mobile") {
        // email not on any account → collect the login mobile so this email
        // can be attached during the reset
        setStatus({ ok: true, text: r.error });
        setStep("identify");
      } else {
        setStatus({ ok: false, text: r.error });
      }
    });
  }

  function doReset(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    start(async () => {
      const r = await confirmPasswordReset({ channel: "email", identifier, code, newPassword, mobile: mobile || undefined });
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
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-fg">{t.emailLabel}</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={t.emailPh}
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
          <p className="flex items-start gap-2 rounded-xl bg-bg-soft px-3.5 py-3 text-xs leading-relaxed text-fg-muted">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-blue" />
            <span>{t.noEmailHint}</span>
          </p>
        </form>
      ) : step === "identify" ? (
        <form onSubmit={sendCode} className="space-y-4">
          <p className="text-xs text-fg-muted">{t.newEmailFor} <span className="font-semibold text-fg">{identifier}</span></p>
          {banner && <div className={banner}>{status!.text}</div>}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-fg">{t.mobileLabel}</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint">
                <Phone className="h-4 w-4" />
              </span>
              <input
                type="tel"
                inputMode="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder={t.mobilePh}
                required
                className="w-full rounded-xl border border-border bg-bg py-3 pl-9 pr-4 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
          </div>
          <button type="submit" disabled={pending} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-3 text-sm font-bold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark disabled:opacity-70 transition-all">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {pending ? t.sending : t.sendCode}
          </button>
          <button type="button" onClick={() => { setStep("request"); setStatus(null); setMobile(""); }}
            className="inline-flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-fg-muted hover:text-brand-blue">
            <ArrowLeft className="h-3.5 w-3.5" /> {t.back}
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
