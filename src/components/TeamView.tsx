"use client";

/** Shared, locale-aware body for the Team page. Rendered by both /team
 *  (Bengali, root) and /en/team (English). Self-detects locale via
 *  LocaleProvider (defaults to "bn" at the root, "en" under /en). */

import { Users, Sparkles } from "lucide-react";
import TeamMemberCard from "./TeamMemberCard";
import { TEAM_MEMBERS } from "@/lib/team";
import { TEAM_EN } from "@/lib/pages.en";
import { useLocale } from "./LocaleProvider";

export default function TeamView() {
  const isEn = useLocale() === "en";
  const t = TEAM_EN;

  return (
    <>
      {/* Header */}
      <section className="relative pt-32 pb-12 sm:pt-36 sm:pb-16">
        <div className="absolute inset-0 -z-10 mesh-bg-soft" />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white border border-border px-4 py-1.5 text-xs shadow-sm">
            <Users className="h-3.5 w-3.5 text-brand-blue" />
            <span className="font-semibold uppercase tracking-[0.18em] text-fg-muted">
              {isEn ? t.eyebrow : "আমাদের টিম"}
            </span>
          </span>
          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08]">
            {isEn ? t.h1Plain : "যাঁদের কাজ"}{" "}
            <span className="text-grad">
              {isEn ? t.h1Accent : "আপনার স্বপ্ন গড়ে।"}
            </span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-fg-muted leading-relaxed max-w-2xl mx-auto">
            {isEn
              ? t.sub
              : "প্রমিস গ্রুপের নেতৃত্ব ও অপারেশন টিম — প্রতিটি প্রকল্পের পেছনে দাঁড়িয়ে।"}
          </p>
        </div>
      </section>

      {/* Team grid */}
      <section className="relative pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM_MEMBERS.map((member, i) => (
              <TeamMemberCard key={member.slug} member={member} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Coming-soon scaffold */}
      <section className="relative pb-20 sm:pb-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border-2 border-dashed border-border-strong bg-bg-soft p-10 text-center cursor-default">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md">
              <Sparkles className="h-7 w-7 text-brand-blue" />
            </div>
            <h2 className="mt-5 text-xl sm:text-2xl font-bold text-fg">
              {isEn ? `${t.comingHeadPlain} ${t.comingHeadAccent}` : "আরও সদস্য — খুব শীঘ্রই"}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-fg-muted max-w-2xl mx-auto leading-relaxed">
              {isEn
                ? t.comingBody
                : "মার্কেটিং, প্রজেক্ট ম্যানেজমেন্ট, ইঞ্জিনিয়ারিং, কাস্টমার কেয়ার — প্রমিস পরিবারের পুরো টিমের পরিচিতি এখানে শীঘ্রই যুক্ত হবে।"}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
