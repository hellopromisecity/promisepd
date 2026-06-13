"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Mail, Send, Check, Sparkles, BellRing, Tag, Rocket } from "lucide-react";
import AnimatedBlobs from "./AnimatedBlobs";
import { subscribeNewsletter } from "@/app/actions";
import { DICT } from "@/lib/i18n";
import { useLocale } from "./LocaleProvider";

const PERK_ICONS = [Rocket, Tag, BellRing];

export default function Newsletter() {
  const locale = useLocale();
  const isEn = locale === "en";
  const n = DICT[locale].newsletter;
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await subscribeNewsletter(email);
      if (res.ok) {
        setDone(true);
        setEmail("");
        setTimeout(() => setDone(false), 4000);
      }
    });
  }

  return (
    <section
      id="newsletter"
      className="relative isolate overflow-hidden py-20 sm:py-28"
    >
      <AnimatedBlobs
        blobs={[
          {
            className:
              "left-[-15%] top-[10%] w-[40vw] h-[40vw] bg-[radial-gradient(circle,rgba(192,199,209,0.14),transparent_60%)]",
            parallax: -80,
          },
          {
            className:
              "right-[-15%] bottom-[10%] w-[45vw] h-[45vw] bg-[radial-gradient(circle,rgba(24,71,161,0.16),transparent_60%)]",
            parallax: 100,
            delay: 4,
          },
        ]}
      />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-border px-4 py-1.5 text-xs shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-brand-blue" />
            <span className="font-semibold uppercase tracking-[0.18em] text-fg-muted">
              {isEn ? "Newsletter" : "নিউজলেটার"}
            </span>
          </div>

          <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1]">
            {n.headA} <span className="text-grad">{n.headB}</span>
          </h2>
          <p className="mt-5 text-base sm:text-lg text-fg-muted leading-relaxed max-w-2xl mx-auto">
            {n.sub}
          </p>
        </motion.div>

        {/* Pill-style email form */}
        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="mt-8 relative max-w-xl mx-auto"
        >
          <div className="relative flex flex-col sm:flex-row gap-2 sm:gap-0 sm:items-center">
            <div className="relative flex-1">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={n.placeholder}
                aria-label={isEn ? "Email address" : "ইমেইল ঠিকানা"}
                className="w-full rounded-2xl sm:rounded-full bg-white border border-border pl-11 pr-4 sm:pr-44 py-3.5 text-sm sm:text-base placeholder:text-fg-faint focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 transition-all shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={pending || done}
              className="sm:absolute sm:right-1.5 inline-flex items-center justify-center gap-2 rounded-2xl sm:rounded-full bg-brand-blue hover:bg-brand-blue-dark px-6 sm:px-5 py-3 text-sm font-bold text-white shadow-[var(--shadow-brand)] hover:scale-[1.02] transition-all disabled:opacity-70"
            >
              {done ? (
                <>
                  <Check className="h-4 w-4" /> {n.subscribed}
                </>
              ) : (
                <>
                  {pending ? n.subscribing : n.subscribe}
                  {!pending && <Send className="h-4 w-4" />}
                </>
              )}
            </button>
          </div>
        </motion.form>

        {/* Value-props row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.55, delay: 0.3 }}
          className="mt-7 flex flex-wrap items-center justify-center gap-2 sm:gap-3"
        >
          {n.perks.map((label, pi) => {
            const Icon = PERK_ICONS[pi];
            return (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-border px-3 py-1.5 text-xs sm:text-sm font-medium text-fg-soft shadow-sm"
            >
              <Icon className="h-3.5 w-3.5 text-brand-red" />
              {label}
            </span>
            );
          })}
        </motion.div>

        <p className="mt-5 text-[11px] text-fg-faint">
          {isEn
            ? "By subscribing you agree to our privacy policy."
            : "সাবস্ক্রাইব করে আপনি আমাদের গোপনীয়তা নীতির সাথে সম্মত হচ্ছেন।"}
        </p>
      </div>
    </section>
  );
}
