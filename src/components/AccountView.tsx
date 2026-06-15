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
  Wallet,
  TrendingUp,
  ArrowDownRight,
  PiggyBank,
  Receipt,
  BadgeCheck,
} from "lucide-react";
import { DICT, localizedPath, type Locale } from "@/lib/i18n";
import { toBn } from "@/lib/bn";
import { useLocale } from "./LocaleProvider";
import type { Member } from "@/lib/auth";
import type { InvestorPortal } from "@/lib/investments";
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
  investment?: InvestorPortal | null;
}) {
  const locale = useLocale();
  const t = DICT[locale].account;
  const lp = (href: string) => localizedPath(href, locale);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Bilingual money / date helpers for the investor portal.
  const en = locale === "en";
  const money = (n: number) => {
    const s = Math.round(Number(n) || 0).toLocaleString("en-US");
    return `৳${en ? s : toBn(s)}`;
  };
  const fmtD = (d: string) => {
    if (!d) return "—";
    const out = new Date(d.includes("T") ? d : `${d}T00:00:00`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return en ? out : toBn(out);
  };
  const L = {
    invHead: en ? "My Investment" : "আমার বিনিয়োগ",
    invested: en ? "Invested" : "বিনিয়োগ",
    profit: en ? "Profit" : "মুনাফা",
    withdrawn: en ? "Withdrawn" : "উত্তোলন",
    balance: en ? "Balance" : "ব্যালেন্স",
    projects: en ? "My Projects" : "আমার প্রকল্প",
    paid: en ? "Paid" : "মোট জমা",
    transactions: en ? "Transactions" : "লেনদেন",
    receipt: en ? "রসিদ" : "রসিদ",
    showing: en ? "Showing latest 60" : "সর্বশেষ ৬০টি দেখানো হচ্ছে",
    verified: en ? "Verified" : "ভেরিফাইড",
  };

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

      {/* Investor portal — only for members ported from the investment app */}
      {investment && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.03 }}
          className="mt-8 space-y-6"
        >
          {/* Balance hero */}
          <div className="grad-border p-6 sm:p-7">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] uppercase tracking-[0.16em] text-fg-faint font-semibold">{L.balance}</p>
              {investment.is_verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  <BadgeCheck className="h-3 w-3" /> {L.verified}
                </span>
              )}
            </div>
            <p className="mt-1 flex items-center gap-2 text-3xl font-extrabold text-brand-blue tabular-nums">
              <Wallet className="h-7 w-7 text-brand-blue/70" />
              {money(investment.balance.total_balance)}
            </p>
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4">
              {[
                { icon: TrendingUp, label: L.invested, value: investment.balance.total_investment, cls: "text-emerald-600" },
                { icon: PiggyBank, label: L.profit, value: investment.balance.total_profit, cls: "text-brand-blue" },
                { icon: ArrowDownRight, label: L.withdrawn, value: investment.balance.total_withdrawn, cls: "text-brand-red-dark" },
              ].map(({ icon: Icon, label, value, cls }) => (
                <div key={label}>
                  <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-fg-faint font-semibold">
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </p>
                  <p className={`mt-0.5 text-base font-extrabold tabular-nums ${cls}`}>{money(value)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Projects invested in */}
          {investment.investments.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-fg-muted uppercase tracking-[0.14em]">{L.projects}</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {investment.investments.map((iv) => (
                  <div key={iv.project_id} className="rounded-2xl border border-border bg-bg-soft p-4">
                    <div className="flex items-start gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-blue-tint text-brand-blue">
                        <Building2 className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-fg">{iv.project_name}</p>
                        <p className="mt-0.5 text-xs text-fg-muted">
                          {L.paid}: <span className="font-semibold text-fg">{money(iv.total_paid)}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transaction history */}
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-fg-muted uppercase tracking-[0.14em]">
              <Receipt className="h-4 w-4" /> {L.transactions}
            </h2>
            {investment.transactions.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-dashed border-border bg-bg-soft px-4 py-6 text-center text-sm text-fg-muted">
                {en ? "No transactions yet." : "এখনো কোনো লেনদেন নেই।"}
              </p>
            ) : (
              <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-bg">
                <ul className="divide-y divide-border">
                  {investment.transactions.slice(0, 60).map((tx) => {
                    const minus = tx.operator === "-";
                    return (
                      <li key={tx.transaction_id} className="flex items-center gap-3 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold capitalize text-fg">{tx.type.replace(/_/g, " ")}</p>
                          <p className="truncate text-[11px] text-fg-muted">
                            {fmtD(tx.date)}
                            {tx.project_name ? ` · ${tx.project_name}` : ""}
                            {tx.rashid_number ? ` · ${L.receipt} ${en ? tx.rashid_number : toBn(tx.rashid_number)}` : ""}
                          </p>
                        </div>
                        <span className={`shrink-0 text-sm font-bold tabular-nums ${minus ? "text-brand-red-dark" : "text-emerald-600"}`}>
                          {minus ? "−" : "+"}{money(tx.amount)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {investment.transactions.length > 60 && (
                  <p className="border-t border-border px-4 py-2 text-center text-[11px] text-fg-muted">{L.showing}</p>
                )}
              </div>
            )}
          </div>
        </motion.div>
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
