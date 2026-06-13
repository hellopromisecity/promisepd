"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Phone,
  ChevronDown,
  Building2,
  Hammer,
  Landmark,
  Plane,
  Palette,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  NAV,
  SITE,
  SECTION_META,
  NAV_IDS,
  DIVISIONS,
  DIVISION_LOGO,
  PROJECTS,
  HOME_BRAND_CYCLES,
} from "@/lib/site";
import { useActiveSection } from "@/lib/useActiveSection";
import { DICT, stripLocale, localizedPath } from "@/lib/i18n";
import {
  DIVISION_EN,
  PROJECT_EN,
  NAV_META_EN,
  HOME_BRAND_CYCLES_EN,
} from "@/lib/site.en";
import { FORMS_EN } from "@/lib/pages.en";
import LangSwitcher from "./LangSwitcher";
import AuthNavButton from "./AuthNavButton";

/** English overlay for a dropdown item (division / project / form) by the
 *  parent nav-section id + the item slug. Falls back to the Bengali label
 *  when no overlay exists. */
function dropdownEn(
  sectionId: string,
  slug: string,
  bnLabel: string,
  bnTagline: string,
): { label: string; tagline: string } {
  if (sectionId === "divisions") {
    const e = DIVISION_EN[slug];
    return { label: e?.name ?? bnLabel, tagline: e?.tagline ?? bnTagline };
  }
  if (sectionId === "projects") {
    const e = PROJECT_EN[slug];
    return { label: e?.name ?? bnLabel, tagline: e?.location ?? bnTagline };
  }
  if (sectionId === "forms") {
    const e = FORMS_EN.names[slug];
    // Dropdown subtitle stays short (one line), mirroring the Bengali shortBn.
    return { label: e?.name ?? bnLabel, tagline: e?.short ?? bnTagline };
  }
  return { label: bnLabel, tagline: bnTagline };
}

const DIV_ICONS: Record<string, LucideIcon> = {
  Building2,
  Hammer,
  Landmark,
  Plane,
  Palette,
};

const ACCENT_TO_SOLID: Record<string, string> = {
  red: "bg-brand-red",
  blue: "bg-brand-blue",
  ash: "bg-brand-ash",
  rb: "bg-brand-red",
  ab: "bg-brand-blue",
  ar: "bg-brand-red",
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  // Which mega-dropdown is open — keyed by NAV item id ("divisions" /
  // "projects").  null = none.  Lets multiple nav items each own a
  // dropdown without clobbering each other.
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpenDropdown, setMobileOpenDropdown] = useState<string | null>(
    null,
  );
  const [homeCycle, setHomeCycle] = useState(0);
  const pathname = usePathname();
  // Locale-aware: `/en/...` is the English mirror; everything else is
  // Bengali at the root. `rest` is the locale-neutral path used for all
  // active-state matching so highlighting works in both versions.
  const { locale, rest } = stripLocale(pathname);
  const t = DICT[locale];
  const isEn = locale === "en";
  const lp = (href: string) => localizedPath(href, locale);
  const isHome = rest === "/";

  // Only track sections on home page
  const activeSection = useActiveSection(isHome ? NAV_IDS : [], 120);

  // Determine the navbar meta to display. Division pages now live at the
  // root (e.g. /interior-3d-design), so match the first path segment
  // against the known division slugs rather than a /divisions/ prefix.
  const firstSegment = rest.startsWith("/")
    ? rest.slice(1).split("/")[0]
    : null;
  const currentDivision = firstSegment
    ? DIVISIONS.find((d) => d.slug === firstSegment)
    : null;
  // Project detail pages live at /projects/<slug>; match the 2nd segment.
  const currentProject =
    firstSegment === "projects"
      ? PROJECTS.find((p) => p.slug === rest.split("/")[2])
      : null;
  const isPartner = firstSegment === "partner";
  const isBlog = firstSegment === "blog";
  const isTeam = firstSegment === "team";
  const isLeaderboard = firstSegment === "leaderboard";
  const isGallery = firstSegment === "gallery";
  const isContact = firstSegment === "contact";

  // Cycle brand identities only while sitting on the home section
  useEffect(() => {
    if (!isHome || activeSection !== "home") return;
    const t = setInterval(
      () => setHomeCycle((i) => (i + 1) % HOME_BRAND_CYCLES.length),
      4500,
    );
    return () => clearInterval(t);
  }, [isHome, activeSection]);

  const bnMeta = currentDivision
    ? { title: currentDivision.nameBn, tagline: currentDivision.tagline }
    : currentProject
    ? { title: currentProject.name, tagline: currentProject.location }
    : isPartner
      ? { title: "পার্টনার হোন", tagline: "নিজের আয়ের লক্ষ্য নিজে ঠিক করুন" }
      : isBlog
        ? { title: "প্রমিস জার্নাল", tagline: "রিয়েল এস্টেট জ্ঞান, আপনার ভাষায়" }
        : isTeam
          ? { title: "আমাদের টিম", tagline: "যাঁদের কাজ আপনার স্বপ্ন গড়ে" }
          : isLeaderboard
            ? { title: "লিডারবোর্ড", tagline: "শীর্ষে যাঁরা — তাঁদের পুরস্কার" }
            : isGallery
              ? { title: "গ্যালারি", tagline: "ছবি ও ভিডিওতে আমাদের কাজ" }
              : isContact
                ? { title: "যোগাযোগ", tagline: "যেকোনো প্রশ্নে আমরা পাশে" }
                : isHome && activeSection === "home"
                  ? HOME_BRAND_CYCLES[homeCycle]
                  : (isHome ? SECTION_META[activeSection] : null) ?? SECTION_META.home;

  const enMeta = currentDivision
    ? {
        title: DIVISION_EN[currentDivision.slug]?.name ?? currentDivision.nameBn,
        tagline: DIVISION_EN[currentDivision.slug]?.tagline ?? currentDivision.tagline,
      }
    : currentProject
    ? {
        title: PROJECT_EN[currentProject.slug]?.name ?? currentProject.name,
        tagline: PROJECT_EN[currentProject.slug]?.location ?? currentProject.location,
      }
    : isPartner
      ? NAV_META_EN.partner
      : isBlog
        ? NAV_META_EN.blog
        : isTeam
          ? NAV_META_EN.team
          : isLeaderboard
            ? NAV_META_EN.leaderboard
            : isGallery
              ? NAV_META_EN.gallery
              : isContact
                ? NAV_META_EN.contact
                : isHome && activeSection === "home"
                  ? HOME_BRAND_CYCLES_EN[homeCycle % HOME_BRAND_CYCLES_EN.length]
                  : (isHome ? NAV_META_EN[activeSection] : null) ?? NAV_META_EN.home;

  const meta = isEn ? enMeta : bnMeta;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Always render the solid "condensed" navbar — even at the top of the
  // homepage.  The old transparent-over-hero state blended into the
  // hero photo and was hard to read; a consistent solid bar everywhere
  // (matching the inner pages) is cleaner.
  const isCondensed = true;

  return (
    <>
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed inset-x-0 top-0 z-50"
      >
        <motion.div
          animate={{
            backgroundColor: isCondensed
              ? "rgba(255,255,255,0.82)"
              : "rgba(255,255,255,0)",
            borderBottomColor: isCondensed
              ? "rgba(229,231,235,0.9)"
              : "rgba(229,231,235,0)",
            boxShadow: isCondensed
              ? "0 6px 24px -10px rgba(15,23,42,0.12)"
              : "0 0 0 0 rgba(0,0,0,0)",
            backdropFilter: isCondensed ? "blur(22px) saturate(180%)" : "blur(0px)",
          }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full border-b"
          style={{
            WebkitBackdropFilter: isCondensed ? "blur(22px) saturate(180%)" : "none",
          }}
        >
          <motion.div
            animate={{
              paddingTop: isCondensed ? 8 : 14,
              paddingBottom: isCondensed ? 8 : 14,
            }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between"
          >
            <Link
              href={lp("/")}
              onClick={(e) => {
                // Smooth-scroll to top + strip any #hash from the URL bar
                if (isHome) {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  if (window.location.hash) {
                    window.history.replaceState(
                      null,
                      "",
                      window.location.pathname + window.location.search,
                    );
                  }
                }
              }}
              className="flex items-center gap-3 sm:gap-4 group min-w-0 py-1.5"
              aria-label={SITE.shortName}
            >
              <Image
                src="/logo-tight.webp"
                alt={SITE.shortName}
                width={463}
                height={482}
                priority
                className={`shrink-0 w-auto transition-[height] duration-300 ease-out ${
                  isCondensed ? "h-12 sm:h-14" : "h-16 sm:h-20"
                }`}
              />

              {/* Dynamic per-section meta (home cycles between brand identities) */}
              <div className="hidden sm:flex flex-col leading-tight min-w-0">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={meta.title}
                    initial={{ y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 8, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm sm:text-base font-bold tracking-wide text-grad-rb truncate"
                  >
                    {meta.title}
                  </motion.span>
                </AnimatePresence>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={meta.tagline}
                    initial={{ y: -6, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 6, opacity: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 }}
                    className="text-[11px] text-fg-muted truncate"
                  >
                    {meta.tagline}
                  </motion.span>
                </AnimatePresence>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {NAV.map((item) => {
                // Home is a special case: it points at `/` but should
                // only light up at the top of the homepage (or when the
                // visitor has scrolled back into the home section), not
                // on every other on-page section.  Standalone pages
                // (e.g. /partner) match by URL.  Hash anchors track
                // activeSection.
                const isActive =
                  item.id === "home"
                    ? isHome && activeSection === "home"
                    : item.id === "divisions"
                      ? // Light up on any division page too, not just the
                        // homepage #divisions section.
                        !!currentDivision ||
                        (isHome && activeSection === "divisions")
                      : item.id === "projects"
                        ? !!currentProject ||
                          (isHome && activeSection === "projects")
                        : item.href.startsWith("/#")
                          ? isHome && activeSection === item.id
                          : rest === item.href ||
                            rest.startsWith(`${item.href}/`);
                if (item.dropdown) {
                  return (
                    <div
                      key={item.href}
                      className="relative"
                      onMouseEnter={() => setOpenDropdown(item.id)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      <Link
                        href={lp(item.href)}
                        data-active={isActive}
                        className={`link-underline flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors ${
                          isActive ? "text-fg" : "text-fg-soft hover:text-fg"
                        }`}
                      >
                        {t.nav[item.id] ?? item.label}
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform ${
                            openDropdown === item.id ? "rotate-180" : ""
                          }`}
                        />
                      </Link>

                      <AnimatePresence>
                        {openDropdown === item.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.96 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            // pt-3 keeps the 12px gap inside the hover area —
                            // using mt-3 instead created an unreachable strip
                            // where the cursor triggered mouseleave on the
                            // parent and the panel closed before it could be
                            // clicked.
                            className="absolute left-1/2 -translate-x-1/2 top-full pt-3 w-[440px]"
                          >
                            <div className="glass-strong rounded-2xl p-3 shadow-2xl">
                              <div className="grid gap-1">
                                {item.dropdown.map((d) => {
                                  const Icon = DIV_ICONS[d.icon ?? ""] ?? Building2;
                                  const logo = DIVISION_LOGO[d.slug];
                                  const cover = d.image;
                                  const { label: dLabel, tagline: dTag } = isEn
                                    ? dropdownEn(item.id, d.slug, d.label, d.tagline)
                                    : { label: d.label, tagline: d.tagline };
                                  return (
                                    <Link
                                      key={d.slug}
                                      href={lp(d.href)}
                                      onClick={() => setOpenDropdown(null)}
                                      className="group flex items-start gap-3 rounded-xl p-3 hover:bg-bg-soft transition-colors"
                                    >
                                      {cover ? (
                                        // Project → a small real cover photo.
                                        <div className="shrink-0 h-11 w-14 rounded-lg overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                                          <Image
                                            src={cover}
                                            alt={dLabel}
                                            width={56}
                                            height={44}
                                            className="h-full w-full object-cover"
                                          />
                                        </div>
                                      ) : logo ? (
                                        // Division → its brand logo, sitting
                                        // straight on the surface (no white
                                        // box / letterbox).
                                        <div className="shrink-0 inline-flex h-11 w-12 items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                                          <Image
                                            src={logo}
                                            alt={dLabel}
                                            width={48}
                                            height={44}
                                            className="h-full w-full object-contain"
                                          />
                                        </div>
                                      ) : (
                                        <div
                                          className={`shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-lg ${
                                            ACCENT_TO_SOLID[d.accent] ?? ACCENT_TO_SOLID.red
                                          } shadow-md group-hover:scale-105 transition-transform ${
                                            d.accent === "ash"
                                              ? "text-fg"
                                              : "text-white"
                                          }`}
                                        >
                                          <Icon className="h-5 w-5" />
                                        </div>
                                      )}
                                      <div className="min-w-0">
                                        <div className="text-sm font-bold text-fg leading-tight">
                                          {dLabel}
                                        </div>
                                        <div className="mt-0.5 text-xs text-fg-muted leading-snug">
                                          {dTag}
                                        </div>
                                      </div>
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={lp(item.href)}
                    data-active={isActive}
                    onClick={
                      // Home: when already on `/`, suppress the
                      // navigation, scroll to top, and clear any
                      // `#section` hash that earlier in-page links
                      // may have left in the URL bar.
                      item.id === "home"
                        ? (e) => {
                            if (isHome) {
                              e.preventDefault();
                              window.scrollTo({ top: 0, behavior: "smooth" });
                              if (window.location.hash) {
                                window.history.replaceState(
                                  null,
                                  "",
                                  window.location.pathname +
                                    window.location.search,
                                );
                              }
                            }
                          }
                        : undefined
                    }
                    className={`link-underline px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? "text-fg" : "text-fg-soft hover:text-fg"
                    }`}
                  >
                    {t.nav[item.id] ?? item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2 py-1">
              {/* EN / BN language switcher — two separate versions. */}
              <LangSwitcher />

              {/* Login / Account — primary header action (replaced the
                  Call CTA).  Shows "Account" once signed in.  Hidden on
                  the smallest screens; mobile users get the row inside
                  the slide-out menu instead. */}
              <AuthNavButton
                variant="desktop"
                loginHref={lp("/login")}
                accountHref={lp("/account")}
                loginLabel={t.login}
                accountLabel={t.accountNav}
              />
              <button
                onClick={() => setOpen(true)}
                className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-border hover:border-brand-blue/50 transition-colors"
                aria-label={t.openMenu}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] lg:hidden"
          >
            <div
              className="absolute inset-0 bg-fg/30 backdrop-blur-md"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 24, stiffness: 220 }}
              className="absolute right-0 top-0 h-full w-[min(360px,85vw)] bg-white shadow-2xl p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-lg font-bold text-grad-rb">{t.menu}</span>
                <button
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-bg-soft hover:bg-bg-soft-2 transition-colors"
                  aria-label={t.closeMenu}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-1">
                {NAV.map((item, i) => {
                  // Same special-case as desktop: Home tracks
                  // activeSection rather than pathname so it doesn't
                  // stay highlighted on every section of `/`.
                  const isActive =
                    item.id === "home"
                      ? isHome && activeSection === "home"
                      : item.id === "divisions"
                        ? !!currentDivision ||
                          (isHome && activeSection === "divisions")
                        : item.id === "projects"
                          ? !!currentProject ||
                            (isHome && activeSection === "projects")
                          : item.href.startsWith("/#")
                            ? isHome && activeSection === item.id
                            : rest === item.href;
                  if (item.dropdown) {
                    return (
                      <motion.div
                        key={item.href}
                        initial={{ x: 30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.05 * i }}
                      >
                        <button
                          onClick={() =>
                            setMobileOpenDropdown((v) =>
                              v === item.id ? null : item.id,
                            )
                          }
                          className="w-full group flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-medium hover:bg-bg-soft text-fg transition-colors"
                        >
                          <span>{t.nav[item.id] ?? item.label}</span>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              mobileOpenDropdown === item.id ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        <AnimatePresence initial={false}>
                          {mobileOpenDropdown === item.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden"
                            >
                              <div className="pl-2 pt-1 pb-2 grid gap-1">
                                {item.dropdown.map((d) => {
                                  const Icon = DIV_ICONS[d.icon ?? ""] ?? Building2;
                                  const logo = DIVISION_LOGO[d.slug];
                                  const cover = d.image;
                                  const { label: dLabel, tagline: dTag } = isEn
                                    ? dropdownEn(item.id, d.slug, d.label, d.tagline)
                                    : { label: d.label, tagline: d.tagline };
                                  return (
                                    <Link
                                      key={d.slug}
                                      href={lp(d.href)}
                                      onClick={() => setOpen(false)}
                                      className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-bg-soft transition-colors"
                                    >
                                      {cover ? (
                                        <div className="shrink-0 h-9 w-12 rounded-md overflow-hidden shadow-sm">
                                          <Image
                                            src={cover}
                                            alt={dLabel}
                                            width={48}
                                            height={36}
                                            className="h-full w-full object-cover"
                                          />
                                        </div>
                                      ) : logo ? (
                                        <div className="shrink-0 inline-flex h-9 w-10 items-center justify-center overflow-hidden">
                                          <Image
                                            src={logo}
                                            alt={dLabel}
                                            width={40}
                                            height={36}
                                            className="h-full w-full object-contain"
                                          />
                                        </div>
                                      ) : (
                                        <div
                                          className={`shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-md ${
                                            ACCENT_TO_SOLID[d.accent] ?? ACCENT_TO_SOLID.red
                                          } shadow-sm ${
                                            d.accent === "ash"
                                              ? "text-fg"
                                              : "text-white"
                                          }`}
                                        >
                                          <Icon className="h-4 w-4" />
                                        </div>
                                      )}
                                      <div className="min-w-0">
                                        <div className="text-sm font-semibold text-fg leading-tight">
                                          {dLabel}
                                        </div>
                                        <div className="mt-0.5 text-[11px] text-fg-muted leading-snug">
                                          {dTag}
                                        </div>
                                      </div>
                                    </Link>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  }
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ x: 30, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.05 * i }}
                    >
                      <Link
                        href={lp(item.href)}
                        onClick={(e) => {
                          setOpen(false);
                          // Home on `/`: suppress nav + scroll to top
                          // + strip any leftover #hash from the URL.
                          if (item.id === "home" && isHome) {
                            e.preventDefault();
                            window.scrollTo({ top: 0, behavior: "smooth" });
                            if (window.location.hash) {
                              window.history.replaceState(
                                null,
                                "",
                                window.location.pathname +
                                  window.location.search,
                              );
                            }
                          }
                        }}
                        className={`group flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-medium transition-colors ${
                          isActive
                            ? "bg-brand-blue text-white"
                            : "hover:bg-bg-soft text-fg"
                        }`}
                      >
                        <span>{t.nav[item.id] ?? item.label}</span>
                        <span
                          className={
                            isActive
                              ? "text-white"
                              : "text-fg-faint group-hover:text-brand-blue transition-colors"
                          }
                        >
                          →
                        </span>
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Auth row — small screens don't show the desktop Login
                  chip, so we surface Login + Sign Up inside the menu. */}
              <div className="mt-6 grid grid-cols-2 gap-2">
                <AuthNavButton
                  variant="mobile"
                  loginHref={lp("/login")}
                  accountHref={lp("/account")}
                  loginLabel={t.login}
                  accountLabel={t.accountNav}
                  onSelect={() => setOpen(false)}
                />
                <Link
                  href={lp("/signup")}
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-bg-soft border border-border px-4 py-3 text-sm font-semibold text-fg hover:border-brand-blue/50 transition-colors"
                >
                  {t.signup}
                </Link>
              </div>

              <a
                href={`tel:${SITE.phone}`}
                className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] btn-shine"
                onClick={() => setOpen(false)}
              >
                <Phone className="h-4 w-4" />
                {isEn ? SITE.phoneDisplayEn : SITE.phoneDisplay}
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
