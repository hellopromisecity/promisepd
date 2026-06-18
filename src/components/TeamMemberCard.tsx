"use client";

/** Team member card — uses the SAME calm hover as the blog cards:
 *  a gentle lift (whileHover y) + a slow image zoom + a colour shift on
 *  the name.  No stacked shine / ring / rotate layers (those felt
 *  jumpy); this matches /blog so the two surfaces feel consistent. */

import Image from "next/image";
import { motion } from "framer-motion";
import { Phone, Mail } from "lucide-react";

/** Facebook "f" mark — lucide dropped brand icons, so inline the logo. */
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}
import { type TeamMember } from "@/lib/team";
import { TEAM_EN } from "@/lib/pages.en";
import { useLocale } from "./LocaleProvider";

const ACCENT_BG_HEX: Record<TeamMember["accent"], string> = {
  red: "#e11924",
  blue: "#1847a1",
  ash: "#c0c7d1",
};

export default function TeamMemberCard({
  member,
  index = 0,
}: {
  member: TeamMember;
  index?: number;
}) {
  const isEn = useLocale() === "en";
  const displayName = isEn ? member.nameEn : member.name;
  const bio = isEn ? TEAM_EN.bios[member.slug] ?? member.bio : member.bio;
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.45, delay: (index % 3) * 0.07 }}
      whileHover={{ y: -6 }}
      className="card group overflow-hidden flex flex-col"
    >
      {/* Photo frame — full photo on the brand-accent surface */}
      <div
        className="relative aspect-[4/3] overflow-hidden"
        style={{ backgroundColor: ACCENT_BG_HEX[member.accent] }}
      >
        <div className="absolute inset-0 opacity-20 mix-blend-overlay grid-bg" />

        <Image
          src={member.photo}
          alt={displayName}
          fill
          quality={92}
          sizes="(min-width:1024px) 380px, (min-width:640px) 50vw, 100vw"
          className="object-contain transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Role chip — static, top-left (mirrors the blog category chip) */}
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-blue shadow-md">
            {member.role}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 flex-1 flex flex-col">
        {!isEn && (
          <div className="text-[10px] uppercase tracking-[0.2em] text-fg-faint">
            {member.nameEn}
          </div>
        )}
        <h3 className="mt-1 text-xl font-bold text-fg leading-tight group-hover:text-brand-blue transition-colors">
          {displayName}
        </h3>
        <div className="mt-1 text-sm font-semibold text-brand-blue">
          {member.role}
        </div>

        {bio && (
          <p className="mt-3 text-sm text-fg-muted leading-relaxed flex-1">
            {bio}
          </p>
        )}

        {(member.phone || member.email || member.socials?.facebook) && (
          <div className="mt-5 pt-5 border-t border-border space-y-2">
            {member.phone && (
              <a
                href={`tel:${member.phone}`}
                className="flex items-center gap-2 text-sm text-fg hover:text-brand-blue transition-colors"
              >
                <Phone className="h-3.5 w-3.5 text-fg-muted shrink-0" />
                <span className="truncate">{member.phone}</span>
              </a>
            )}
            {member.email && (
              <a
                href={`mailto:${member.email}`}
                className="flex items-center gap-2 text-sm text-fg hover:text-brand-blue transition-colors"
              >
                <Mail className="h-3.5 w-3.5 text-fg-muted shrink-0" />
                <span className="truncate">{member.email}</span>
              </a>
            )}
            {member.socials?.facebook && (
              <a
                href={member.socials.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="group/fb flex items-center gap-2 text-sm font-medium text-fg hover:text-brand-blue transition-colors"
              >
                <FacebookIcon className="h-3.5 w-3.5 shrink-0 text-brand-blue" />
                <span className="group-hover/fb:underline">{isEn ? "Facebook profile" : "ফেসবুক প্রোফাইল"}</span>
              </a>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
}
