"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Award,
  Users,
  CreditCard,
  ShieldCheck,
  Headphones,
  Layers,
  type LucideIcon,
} from "lucide-react";
import AnimatedBlobs from "./AnimatedBlobs";
import { WHY_US } from "@/lib/site";
import { WHY_US_EN } from "@/lib/site.en";
import { DICT } from "@/lib/i18n";
import { useLocale } from "./LocaleProvider";

const ICONS: Record<string, LucideIcon> = {
  MapPin,
  Award,
  Users,
  CreditCard,
  ShieldCheck,
  Headphones,
  Layers,
};

export default function WhyUs() {
  const locale = useLocale();
  const isEn = locale === "en";
  const t = DICT[locale].home.why;
  return (
    <section
      id="why"
      className="relative isolate overflow-hidden py-24 sm:py-32 bg-bg-soft"
    >
      <AnimatedBlobs
        blobs={[
          {
            className:
              "left-[10%] top-[5%] w-[40vw] h-[40vw] bg-[radial-gradient(circle,rgba(192,199,209,0.16),transparent_60%)]",
            parallax: -80,
          },
          {
            className:
              "right-[5%] bottom-[10%] w-[45vw] h-[45vw] bg-[radial-gradient(circle,rgba(24,71,161,0.18),transparent_60%)]",
            parallax: 120,
            delay: 6,
          },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-border px-4 py-1.5 text-xs shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-blue animate-pulse" />
            <span className="font-semibold uppercase tracking-[0.18em] text-fg-muted">
              {t.eyebrow}
            </span>
          </div>
          <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1]">
            {t.headA}{" "}
            <span className="text-grad">{t.headB}</span>
          </h2>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_US.map((item, i) => {
            const Icon = ICONS[item.icon];
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, scale: 0.92, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
                whileHover={{ y: -6 }}
                className="card group relative overflow-hidden p-6 sm:p-7"
              >
                <div
                  className={`absolute inset-0 ${
                    i % 2 === 0 ? "bg-brand-red" : "bg-brand-blue"
                  } opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`}
                />
                <div className="relative flex items-start gap-4">
                  <div
                    className={`shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-bg-soft-2 transition-colors duration-300 ${
                      i % 2 === 0
                        ? "group-hover:bg-brand-red"
                        : "group-hover:bg-brand-blue"
                    }`}
                  >
                    {Icon && (
                      <Icon
                        className={`h-5 w-5 transition-colors group-hover:text-white ${
                          i % 2 === 0 ? "text-brand-red" : "text-brand-blue"
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-fg">
                      {isEn ? WHY_US_EN[i].title : item.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-fg-muted leading-relaxed">
                      {isEn ? WHY_US_EN[i].description : item.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
