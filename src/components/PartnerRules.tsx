"use client";

/** Commission lookup grid + standalone marketing-rule cards.
 *  Lists every commission line and the four meta-rules (office attendance,
 *  promotion threshold, active-officer qualification, 10% deposit cap). */

import { motion } from "framer-motion";
import { BadgeCheck, FileText } from "lucide-react";
import {
  PARTNER_COMMISSIONS,
  PARTNER_RULES,
  PARTNER_PERIOD,
  bnNumber,
} from "@/lib/partner";
import { PARTNER_EN } from "@/lib/pages.en";
import { useLocale } from "./LocaleProvider";

const ACCENT_BG: Record<string, string> = {
  red: "bg-brand-red",
  blue: "bg-brand-blue",
  ash: "bg-brand-ash",
};

const ACCENT_TINT: Record<string, string> = {
  red: "bg-brand-red-tint",
  blue: "bg-brand-blue-tint",
  ash: "bg-brand-ash-tint",
};

export default function PartnerRules() {
  const isEn = useLocale() === "en";
  const u = PARTNER_EN.ui;
  const periodStart = isEn ? PARTNER_EN.periodStart : PARTNER_PERIOD.startBn;
  const num = (n: number) => (isEn ? String(n) : bnNumber(n));

  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-border px-4 py-1.5 text-xs shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-red animate-pulse" />
            <span className="font-semibold uppercase tracking-[0.18em] text-fg-muted">
              {isEn ? u.rulesEyebrow : "মার্কেটিং নিয়মাবলী"}
            </span>
          </div>
          <h2 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.15]">
            {isEn ? u.rulesH1A : "২০২৬-এর"}{" "}
            <span className="text-grad">
              {isEn ? u.rulesH1Grad : "কমিশন স্ট্রাকচার"}
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-fg-muted leading-relaxed">
            {isEn
              ? u.rulesSub.replace("{start}", periodStart)
              : `${periodStart} থেকে কার্যকর — পূর্বের সব নীতিমালা বাতিল। স্বচ্ছ, সরাসরি, কোনো লুকানো শর্ত নেই।`}
          </p>
        </motion.div>

        {/* Commission grid */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PARTNER_COMMISSIONS.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
              whileHover={{ y: -4 }}
              className="card p-6 relative overflow-hidden"
            >
              <div
                className={`absolute -top-10 -right-10 h-28 w-28 rounded-full ${
                  ACCENT_TINT[c.accent]
                } blur-2xl opacity-80`}
                aria-hidden
              />
              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`inline-flex h-9 items-center rounded-full px-3 text-[11px] font-bold uppercase tracking-wider text-white ${
                      ACCENT_BG[c.accent]
                    } ${c.accent === "ash" ? "!text-fg" : ""}`}
                  >
                    {isEn ? PARTNER_EN.commissions[c.id]?.unit ?? c.unit : c.unit}
                  </span>
                  {c.points > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-fg-muted">
                      <BadgeCheck className="h-3.5 w-3.5 text-brand-blue" />
                      {num(c.points)} {isEn ? (c.points > 1 ? u.pointsWord : u.pointWord) : "পয়েন্ট"}
                    </span>
                  )}
                </div>
                <h3 className="mt-4 text-lg font-bold text-fg leading-tight">
                  {isEn ? c.nameEn : c.nameBn}
                </h3>
                <div className="mt-2 text-2xl sm:text-3xl font-bold text-grad-rb">
                  ৳ {num(c.commission)}
                </div>
                <p className="mt-2 text-sm text-fg-muted leading-relaxed">
                  {isEn ? PARTNER_EN.commissions[c.id]?.description ?? c.description : c.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Standalone rules */}
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue text-white shadow-md">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-fg">
              {isEn ? u.additionalRules : "অতিরিক্ত নিয়মাবলী"}
            </h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {PARTNER_RULES.map((rule, i) => {
              const r = isEn ? { ...rule, ...PARTNER_EN.rules[i] } : rule;
              return (
              <motion.div
                key={rule.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.45, delay: (i % 2) * 0.08 }}
                className="card p-6"
              >
                <span className="inline-flex items-center rounded-full bg-bg-soft border border-border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-fg-muted">
                  {r.tag}
                </span>
                <h4 className="mt-3 text-base sm:text-lg font-bold text-fg leading-tight">
                  {r.title}
                </h4>
                <p className="mt-2 text-sm text-fg-muted leading-relaxed">
                  {r.body}
                </p>
              </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
