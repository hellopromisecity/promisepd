"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Building2, Heart, Handshake } from "lucide-react";
import AnimatedBlobs from "./AnimatedBlobs";
import { SITE } from "@/lib/site";
import { ABOUT_PILLARS_EN } from "@/lib/site.en";
import { DICT } from "@/lib/i18n";
import { useLocale } from "./LocaleProvider";

export default function About() {
  const locale = useLocale();
  const isEn = locale === "en";
  const tx = DICT[locale].home.about;
  const pillars = [
    {
      icon: Building2,
      title: "সঠিকভাবে নির্মিত",
      copy: "আমরা নিজেদের বাড়িতে যে উপাদান ব্যবহার করবো — ঠিক সেটাই। মানদণ্ড আমরা মাপি দশকে, দিনে নয়।",
      bg: "bg-brand-red",
    },
    {
      icon: Heart,
      title: "মানুষ সবার আগে",
      copy: "ফি-এর আগে পরিবার। প্রতিটি সিদ্ধান্ত শুরু হয় সেই মানুষটিকে ভেবে — যে এখানে থাকবে।",
      bg: "bg-brand-blue",
    },
    {
      icon: Handshake,
      title: "প্রতিশ্রুতি রক্ষিত",
      copy: "সময়মতো মাইলস্টোন, কোনো লুকানো খরচ নেই, চাবি হস্তান্তরের পরেও কোনো চমক নেই।",
      bg: "bg-brand-ash",
    },
  ];

  return (
    <section
      id="about"
      className="relative isolate overflow-hidden py-24 sm:py-32"
    >
      <AnimatedBlobs
        blobs={[
          {
            className:
              "left-[-15%] top-[10%] w-[45vw] h-[45vw] bg-[radial-gradient(circle,rgba(24,71,161,0.18),transparent_60%)]",
            parallax: -100,
          },
          {
            className:
              "right-[-10%] bottom-[10%] w-[40vw] h-[40vw] bg-[radial-gradient(circle,rgba(192,199,209,0.16),transparent_60%)]",
            parallax: 120,
            delay: 4,
          },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-5"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-border px-4 py-1.5 text-xs shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-red animate-pulse" />
              <span className="font-semibold uppercase tracking-[0.18em] text-fg-muted">
                {tx.eyebrow}
              </span>
            </div>
            <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1]">
              {tx.headA}{" "}
              <span className="text-grad">{tx.headB}</span>
            </h2>
            {isEn ? (
              <>
                <p className="mt-6 text-base sm:text-lg text-fg-muted leading-relaxed">
                  {tx.body1}
                </p>
                <p className="mt-4 text-base sm:text-lg text-fg-muted leading-relaxed">
                  {tx.body2}
                </p>
              </>
            ) : (
              <>
                <p className="mt-6 text-base sm:text-lg text-fg-muted leading-relaxed">
                  {SITE.founded} সাল থেকে প্রমিস গ্রুপ ঢাকার মাটিতে নিঃশব্দে এক
                  অবিচল শক্তি — পরিবারগুলোকে এমন বাড়িতে পৌঁছে দিচ্ছি যা তাঁদের
                  জীবন, বাজেট ও ভবিষ্যতের সাথে মেলে।
                </p>
                <p className="mt-4 text-base sm:text-lg text-fg-muted leading-relaxed">
                  আজ আমরা ৫টি বিভাগে কাজ করি — <strong>প্রমিস সিটি</strong> (রিয়েল
                  এস্টেট), <strong>আহবাব রিয়েল এস্টেট</strong> (নির্মাণ),{" "}
                  <strong>প্রমিস ইন্টারন্যাশনাল</strong> (সঞ্চয়),{" "}
                  <strong>আহবাব ট্রাভেলস</strong> (হজ্জ/উমরাহ), এবং{" "}
                  <strong>ইন্টেরিয়র ও 3D ডিজাইন</strong>।
                </p>
              </>
            )}

            <div className="mt-8 inline-flex items-center gap-4 rounded-2xl bg-white border border-border p-3 pr-5 shadow-sm">
              <Image
                src="/logo-tight.webp"
                alt={SITE.shortName}
                width={463}
                height={482}
                className="h-16 w-auto shrink-0"
              />
              <div className="leading-tight">
                <div className="text-sm font-bold text-fg">
                  {SITE.shortName}
                </div>
                <div className="text-xs text-fg-muted">
                  {isEn ? DICT[locale].footer.tagline : SITE.tagline}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="lg:col-span-7"
          >
            <div className="grid gap-4">
              {pillars.map((p, i) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.12 }}
                  whileHover={{ y: -6 }}
                  className="card group relative p-6 sm:p-7"
                >
                  <div className="flex gap-5">
                    <div className={`shrink-0 h-14 w-14 rounded-2xl ${p.bg} flex items-center justify-center shadow-md`}>
                      <p.icon
                        className={`h-7 w-7 ${
                          p.bg === "bg-brand-ash" ? "text-fg" : "text-white"
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-fg">
                        {isEn ? ABOUT_PILLARS_EN[i].title : p.title}
                      </h3>
                      <p className="mt-1.5 text-sm sm:text-base text-fg-muted leading-relaxed">
                        {isEn ? ABOUT_PILLARS_EN[i].copy : p.copy}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
