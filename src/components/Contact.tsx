"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  Check,
  AlertCircle,
} from "lucide-react";
import AnimatedBlobs from "./AnimatedBlobs";
import { SITE, INTERESTS } from "@/lib/site";
import { INTERESTS_EN } from "@/lib/site.en";
import { DICT } from "@/lib/i18n";
import { useLocale } from "./LocaleProvider";
import { submitContact } from "@/app/actions";

export default function Contact() {
  const locale = useLocale();
  const isEn = locale === "en";
  const c = DICT[locale].contact;
  const interests = isEn ? INTERESTS_EN : INTERESTS;
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    interest: interests[0],
    message: "",
  });
  const [status, setStatus] = useState<{
    type: "idle" | "ok" | "err";
    msg?: string;
  }>({ type: "idle" });
  const [pending, startTransition] = useTransition();

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ type: "idle" });
    startTransition(async () => {
      const res = await submitContact(form);
      if (res.ok) {
        setStatus({ type: "ok", msg: c.ok });
        setForm({
          name: "",
          email: "",
          phone: "",
          interest: interests[0],
          message: "",
        });
      } else {
        setStatus({ type: "err", msg: res.error || c.err });
      }
    });
  }

  return (
    <section
      id="contact"
      className="relative isolate overflow-hidden py-24 sm:py-32"
    >
      <AnimatedBlobs
        blobs={[
          {
            className:
              "left-[-10%] top-[10%] w-[40vw] h-[40vw] bg-[radial-gradient(circle,rgba(192,199,209,0.16),transparent_60%)]",
            parallax: -80,
          },
          {
            className:
              "right-[-10%] bottom-[10%] w-[50vw] h-[50vw] bg-[radial-gradient(circle,rgba(24,71,161,0.18),transparent_60%)]",
            parallax: 100,
            delay: 4,
          },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-border px-4 py-1.5 text-xs shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-red animate-pulse" />
            <span className="font-semibold uppercase tracking-[0.18em] text-fg-muted">
              {c.eyebrow}
            </span>
          </div>
          <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1]">
            {c.headA} <span className="text-grad">{c.headB}</span>
          </h2>
          <p className="mt-5 text-base sm:text-lg text-fg-muted leading-relaxed">
            {c.sub}
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-5">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 space-y-4"
          >
            {[
              {
                icon: Phone,
                label: c.labelPhone,
                value: isEn ? SITE.phoneDisplayEn : SITE.phoneDisplay,
                href: `tel:${SITE.phone}`,
                bg: "bg-brand-red",
              },
              {
                icon: Mail,
                label: c.labelEmail,
                value: SITE.email,
                href: `mailto:${SITE.email}`,
                bg: "bg-brand-blue",
              },
              {
                icon: MapPin,
                label: c.labelOffice,
                value: isEn ? SITE.addressEn : SITE.address,
                href: "https://maps.google.com/?q=Kazi+Tower+South+Jatrabari+Dhaka",
                bg: "bg-brand-blue",
              },
              {
                icon: Clock,
                label: c.labelHours,
                value: isEn
                  ? `${SITE.hoursEn} · ${SITE.weeklyOffEn}`
                  : `${SITE.hours} · ${SITE.weeklyOff}`,
                bg: "bg-brand-ash",
              },
            ].map((item) => {
              const Wrapper = item.href ? "a" : "div";
              return (
                <Wrapper
                  key={item.label}
                  href={item.href}
                  target={item.href?.startsWith("http") ? "_blank" : undefined}
                  rel={
                    item.href?.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="card group flex items-start gap-4 p-5"
                >
                  <div
                    className={`shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-xl ${item.bg} shadow-md group-hover:scale-110 transition-transform`}
                  >
                    <item.icon
                      className={`h-5 w-5 ${
                        item.bg === "bg-brand-ash" ? "text-fg" : "text-white"
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-fg-faint">
                      {item.label}
                    </div>
                    <div className="mt-1 text-sm sm:text-base font-medium text-fg break-words">
                      {item.value}
                    </div>
                  </div>
                </Wrapper>
              );
            })}
          </motion.div>

          <motion.form
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
            onSubmit={onSubmit}
            className="lg:col-span-3 grad-border p-6 sm:p-8 space-y-4"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                label={c.fName}
                required
                value={form.name}
                onChange={(v) => update("name", v)}
                placeholder={c.phName}
              />
              <Field
                label={c.fEmail}
                type="email"
                required
                value={form.email}
                onChange={(v) => update("email", v)}
                placeholder="you@example.com"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                label={c.fPhone}
                type="tel"
                value={form.phone}
                onChange={(v) => update("phone", v)}
                placeholder={c.phPhone}
              />
              <div>
                <label className="text-[11px] uppercase tracking-[0.18em] text-fg-muted">
                  {c.fInterest}
                </label>
                <select
                  value={form.interest}
                  onChange={(e) => update("interest", e.target.value)}
                  aria-label={c.fInterest}
                  className="mt-1.5 w-full rounded-xl bg-white border border-border px-4 py-3 text-sm focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 transition-all"
                >
                  {interests.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[0.18em] text-fg-muted">
                {c.fMessage} *
              </label>
              <textarea
                required
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                rows={5}
                placeholder={c.phMessage}
                className="mt-1.5 w-full rounded-xl bg-white border border-border px-4 py-3 text-sm placeholder:text-fg-faint focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 transition-all resize-none"
              />
            </div>

            {status.msg && (
              <div
                className={`flex items-start gap-2 rounded-xl p-3 text-sm ${
                  status.type === "ok"
                    ? "bg-brand-blue-tint border border-brand-blue/30 text-brand-blue-dark"
                    : "bg-brand-red-tint border border-brand-red/30 text-brand-red-dark"
                }`}
              >
                {status.type === "ok" ? (
                  <Check className="h-4 w-4 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                )}
                <span>{status.msg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-blue px-6 py-4 text-base font-semibold text-white shadow-[var(--shadow-brand)] hover:scale-[1.02] disabled:opacity-70 disabled:scale-100 transition-all btn-shine"
            >
              <Send className="h-4 w-4" />
              {pending ? c.sending : c.send}
            </button>
            <p className="text-[11px] text-fg-faint text-center">
              {c.consent}
            </p>
          </motion.form>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  type = "text",
  required,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-[0.18em] text-fg-muted">
        {label} {required && "*"}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl bg-white border border-border px-4 py-3 text-sm placeholder:text-fg-faint focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 transition-all"
      />
    </div>
  );
}
