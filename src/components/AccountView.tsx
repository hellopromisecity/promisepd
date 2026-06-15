"use client";

/** Member dashboard shown at /account (and /en/account).
 *
 *  Renders the logged-in member's profile + quick links into the parts
 *  of the site that matter to a member (forms, projects, contact), plus
 *  a logout button.  Server-gated: the page only renders this once
 *  getCurrentUser() has returned a member, and the middleware redirects
 *  guests away — so `member` is always present here. */

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Phone,
  AtSign,
  Mail,
  FileText,
  Building2,
  MessageCircle,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { DICT, localizedPath, type Locale } from "@/lib/i18n";
import { toBn } from "@/lib/bn";
import { useLocale } from "./LocaleProvider";
import type { Member } from "@/lib/auth";
import type { InvestorPortal as InvestorPortalData } from "@/lib/investments";
import InvestorPortal from "./InvestorPortal";
import { logout } from "@/app/actions/auth";

/** Canonical 8801XXXXXXXXX → local 01XXXXXXXXX, in the right numerals. */
function displayMobile(canonical: string, locale: Locale): string {
  const local = canonical.startsWith("880") ? `0${canonical.slice(3)}` : canonical;
  return locale === "en" ? local : toBn(local);
}

export default function AccountView({
  member,
  investment,
}: {
  member: Member;
  investment?: InvestorPortalData | null;
}) {
  const locale = useLocale();
  const t = DICT[locale].account;
  const lp = (href: string) => localizedPath(href, locale);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onLogout() {
    startTransition(async () => {
      await logout();
      router.push(lp("/login"));
      router.refresh();
    });
  }

  const rows: { icon: typeof User; label: string; value: string | null }[] = [
    { icon: User, label: t.nameLabel, value: member.name || null },
    { icon: Phone, label: t.mobileLabel, value: displayMobile(member.mobile, locale) },
    { icon: AtSign, label: t.usernameLabel, value: member.username },
    { icon: Mail, label: t.emailLabel, value: member.email },
  ];

  const links = [
    { icon: FileText, label: t.forms, sub: t.formsSub, href: "/forms" },
    { icon: Building2, label: t.projects, sub: t.projectsSub, href: "/#projects" },
    { icon: MessageCircle, label: t.contact, sub: t.contactSub, href: "/contact" },
  ];

  const firstName = (member.name || "").trim().split(/\s+/)[0] || member.name;

  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <p className="text-[11px] uppercase tracking-[0.2em] text-brand-blue font-bold">
          {t.title}
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-fg">
          {t.greeting}
          {firstName ? `, ${firstName}` : ""} 👋
        </h1>
        <p className="mt-1.5 text-sm text-fg-muted">{t.subtitle}</p>
      </motion.div>

      {/* Investor portal — rich self-service view for ported investors */}
      {investment && (
        <div className="mt-8">
          <InvestorPortal data={investment} />
        </div>
      )}

      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.06 }}
        className="grad-border mt-8 p-6 sm:p-7"
      >
        <h2 className="text-sm font-bold text-fg-muted uppercase tracking-[0.14em]">
          {t.profileHead}
        </h2>
        <dl className="mt-4 grid sm:grid-cols-2 gap-4">
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-blue-tint text-brand-blue">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <dt className="text-[11px] uppercase tracking-[0.16em] text-fg-faint font-semibold">
                  {label}
                </dt>
                <dd
                  className={`text-sm font-semibold break-words ${
                    value ? "text-fg" : "text-fg-faint italic font-normal"
                  }`}
                >
                  {value || t.notSet}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </motion.div>

      {/* Quick links */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.12 }}
        className="mt-8"
      >
        <h2 className="text-sm font-bold text-fg-muted uppercase tracking-[0.14em]">
          {t.quickHead}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {links.map(({ icon: Icon, label, sub, href }) => (
            <Link
              key={label}
              href={lp(href)}
              className="group rounded-2xl border border-border bg-bg-soft p-5 hover:border-brand-blue/50 hover:shadow-[var(--shadow-brand)] transition-all"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-blue text-white shadow-[var(--shadow-brand)]">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-3 font-bold text-fg flex items-center gap-1">
                {label}
                <ChevronRight className="h-4 w-4 text-fg-faint group-hover:translate-x-0.5 group-hover:text-brand-blue transition-all" />
              </p>
              <p className="mt-0.5 text-xs text-fg-muted leading-relaxed">{sub}</p>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Logout */}
      <div className="mt-10 flex justify-center">
        <button
          onClick={onLogout}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl border border-brand-red/30 bg-brand-red-tint px-5 py-3 text-sm font-semibold text-brand-red-dark hover:bg-brand-red hover:text-white disabled:opacity-70 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {pending ? t.loggingOut : t.logout}
        </button>
      </div>
    </section>
  );
}
