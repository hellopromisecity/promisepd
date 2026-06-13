"use client";

import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { STATS } from "@/lib/site";
import { STATS_EN_LABELS } from "@/lib/site.en";
import { toBn } from "@/lib/bn";
import { useLocale } from "./LocaleProvider";

function Counter({ value, suffix, en }: { value: number; suffix: string; en: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) =>
    en ? String(Math.round(v)) : toBn(Math.round(v)),
  );

  useEffect(() => {
    if (!inView) return;
    const controls = animate(motionVal, value, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
    });
    return controls.stop;
  }, [inView, value, motionVal]);

  return (
    <span ref={ref} className="tabular-nums">
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

export default function Stats() {
  const isEn = useLocale() === "en";
  return (
    <section id="stats" className="relative py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="grad-border p-6 sm:p-8 text-center"
            >
              <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-grad-rb">
                <Counter value={stat.value} suffix={stat.suffix} en={isEn} />
              </div>
              <div className="mt-2 text-xs sm:text-sm font-medium tracking-wider text-fg-muted">
                {isEn ? STATS_EN_LABELS[i] : stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
