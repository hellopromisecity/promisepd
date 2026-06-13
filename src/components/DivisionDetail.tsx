import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  Hammer,
  Landmark,
  Plane,
  Palette,
  Phone,
  Mail,
  Home,
  MapPin,
  CreditCard,
  ShieldCheck,
  Store,
  Wrench,
  Ruler,
  Award,
  PiggyBank,
  Wallet,
  TrendingUp,
  Eye,
  Zap,
  Moon,
  Star,
  FileCheck,
  BedDouble,
  Users,
  Headphones,
  Sofa,
  Briefcase,
  Box,
  LayoutGrid,
  Armchair,
  type LucideIcon,
} from "lucide-react";
import { DIVISIONS, PROJECTS, SITE, type Division } from "@/lib/site";
import {
  DIVISION_EN,
  DIVISION_DETAIL_EN,
  PROJECT_EN,
} from "@/lib/site.en";
import { DICT, localizedPath, type Locale } from "@/lib/i18n";
import DivisionHero from "./DivisionHero";

const ICONS: Record<string, LucideIcon> = { Building2, Hammer, Landmark, Plane, Palette };

const FEATURE_ICONS: Record<string, LucideIcon> = {
  Building2, MapPin, CreditCard, ShieldCheck, Home, Store, Wrench, Ruler,
  Award, PiggyBank, Wallet, TrendingUp, Eye, Zap, Moon, Star, FileCheck,
  BedDouble, Users, Headphones, Sofa, Briefcase, Box, LayoutGrid, Armchair, Palette,
};

const ACCENT_SOLID: Record<string, string> = {
  red: "bg-brand-red", blue: "bg-brand-blue", ash: "bg-brand-ash",
  rb: "bg-brand-red", ab: "bg-brand-blue", ar: "bg-brand-red",
};

export default function DivisionDetail({
  division,
  locale = "bn",
}: {
  division: Division;
  locale?: Locale;
}) {
  const isEn = locale === "en";
  const t = DICT[locale].divDetail;
  const lp = (href: string) => localizedPath(href, locale);

  const Icon = ICONS[division.icon] ?? Building2;
  const showProjects = division.slug === "promise-city";
  const currentIdx = DIVISIONS.findIndex((d) => d.slug === division.slug);
  const prev = DIVISIONS[(currentIdx - 1 + DIVISIONS.length) % DIVISIONS.length];
  const next = DIVISIONS[(currentIdx + 1) % DIVISIONS.length];

  const dx = isEn ? DIVISION_EN[division.slug] : null;
  const detail = isEn ? DIVISION_DETAIL_EN[division.slug] : null;
  const dName = dx?.name ?? division.nameBn;
  const dLong = detail?.long ?? division.longDescription;
  const dHi = dx?.highlights ?? division.highlights;
  const dFeatures = detail?.features ?? division.features;

  const enName = (slug: string, fallback: string) =>
    isEn ? PROJECT_EN[slug]?.name ?? fallback : fallback;

  return (
    <>
      <DivisionHero division={division} locale={locale} />

      {/* About this division */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-border px-4 py-1.5 text-xs shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-red animate-pulse" />
              <span className="font-semibold uppercase tracking-[0.18em] text-fg-muted">
                {t.aboutEyebrow}
              </span>
            </div>
            <h2 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.15]">
              {isEn ? (
                <>
                  About <span className="text-grad">{dName}</span>
                </>
              ) : (
                <>
                  <span className="text-grad">{dName}</span> {t.aboutSuffix}
                </>
              )}
            </h2>
          </div>
          <p className="text-base sm:text-lg text-fg-muted leading-relaxed text-center max-w-3xl mx-auto">
            {dLong}
          </p>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {dHi.map((h) => (
              <div key={h} className="grad-border p-4 text-center text-sm font-semibold text-fg">
                {h}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-20 sm:py-28 bg-bg-soft">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-border px-4 py-1.5 text-xs shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-blue animate-pulse" />
              <span className="font-semibold uppercase tracking-[0.18em] text-fg-muted">
                {t.featEyebrow}
              </span>
            </div>
            <h2 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.15]">
              {t.featHeadA} <span className="text-grad">{t.featHeadB}</span>
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {dFeatures.map((f, i) => {
              const FIcon = FEATURE_ICONS[division.features[i]?.icon ?? ""] ?? Check;
              return (
                <div key={f.title} className="card group p-6">
                  <div
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${ACCENT_SOLID[division.accent]} shadow-md group-hover:scale-105 transition-transform`}
                  >
                    <FIcon className={`h-5 w-5 ${division.accent === "ash" ? "text-fg" : "text-white"}`} />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-fg">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-fg-muted leading-relaxed">
                    {f.description}
                  </p>
                  <ul className="mt-4 pt-4 border-t border-border space-y-2">
                    {f.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2 text-[13px] text-fg-soft">
                        <Check className="h-3.5 w-3.5 text-brand-blue shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Projects (Promise City only) */}
      {showProjects && (
        <section className="relative py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 rounded-full bg-white border border-border px-4 py-1.5 text-xs shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-red animate-pulse" />
                <span className="font-semibold uppercase tracking-[0.18em] text-fg-muted">
                  {t.projEyebrow}
                </span>
              </div>
              <h2 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.15]">
                {t.projHeadA} <span className="text-grad">{t.projHeadB}</span>
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {PROJECTS.map((p) => {
                const px = isEn ? PROJECT_EN[p.slug] : null;
                return (
                  <article key={p.slug} className="card group overflow-hidden flex flex-col">
                    <Link
                      href={lp(`/projects/${p.slug}`)}
                      className="relative block h-44 overflow-hidden"
                      aria-label={px?.name ?? p.name}
                    >
                      <Image
                        src={p.cover}
                        alt={px?.name ?? p.name}
                        fill
                        sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-fg/85 via-fg/25 to-transparent" />
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-fg shadow-sm">
                          <span className={`h-1.5 w-1.5 rounded-full ${ACCENT_SOLID[p.accent] ?? ACCENT_SOLID.red}`} />
                          {px?.status ?? p.status}
                        </span>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-5">
                        <h3 className="text-xl font-bold text-white drop-shadow-md">
                          {px?.name ?? p.name}
                        </h3>
                      </div>
                    </Link>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-baseline justify-between">
                        <div className="text-xs text-fg-muted">{px?.location ?? p.location}</div>
                        <div className="text-lg font-bold text-grad-rb whitespace-nowrap">
                          {px?.price ?? p.price}
                        </div>
                      </div>
                      {p.size && (
                        <div className="text-xs text-fg-faint mt-1">{px?.size ?? p.size}</div>
                      )}
                      <p className="mt-3 text-sm text-fg-muted leading-relaxed flex-1">
                        {px?.description ?? p.description}
                      </p>
                      <Link
                        href={lp(`/projects/${p.slug}`)}
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-grad-rb group/btn"
                      >
                        {DICT[locale].home.detailsBtn}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grad-border p-8 sm:p-12 text-center">
            <Icon className="h-12 w-12 mx-auto text-grad-rb" />
            <h2 className="mt-5 text-3xl sm:text-4xl font-bold leading-[1.15]">
              {isEn ? (
                <>
                  {t.ctaMore} <span className="text-grad">about {dName}</span>
                </>
              ) : (
                <>
                  {dName} {t.ctaSuffix} <span className="text-grad">{t.ctaMore}</span>
                </>
              )}
            </h2>
            <p className="mt-4 text-base sm:text-lg text-fg-muted max-w-2xl mx-auto">
              {t.ctaSub}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={`tel:${SITE.phone}`}
                className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-7 py-3.5 text-base font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark hover:scale-[1.02] transition-all"
              >
                <Phone className="h-4 w-4" />
                {isEn ? SITE.phoneDisplayEn : SITE.phoneDisplay}
              </a>
              <Link
                href={lp("/#contact")}
                className="inline-flex items-center gap-2 rounded-2xl bg-white border border-border px-7 py-3.5 text-base font-semibold text-fg hover:border-brand-blue/40 hover:shadow-lg transition-all"
              >
                <Mail className="h-4 w-4 text-brand-red" />
                {t.sendMsg}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Prev / Next division */}
      <section className="relative pb-20 sm:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              href={lp(`/${prev.slug}`)}
              className="card group p-6 flex items-center gap-4 hover:scale-[1.01] transition-transform"
            >
              <ArrowLeft className="h-5 w-5 text-fg-muted group-hover:text-brand-red transition-colors" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-[0.2em] text-fg-faint">{t.prevDiv}</div>
                <div className="text-base font-bold text-fg truncate">
                  {isEn ? DIVISION_EN[prev.slug]?.name ?? prev.nameBn : prev.nameBn}
                </div>
              </div>
            </Link>
            <Link
              href={lp(`/${next.slug}`)}
              className="card group p-6 flex items-center gap-4 sm:text-right hover:scale-[1.01] transition-transform"
            >
              <div className="min-w-0 flex-1 sm:order-1">
                <div className="text-[10px] uppercase tracking-[0.2em] text-fg-faint">{t.nextDiv}</div>
                <div className="text-base font-bold text-fg truncate">
                  {isEn ? DIVISION_EN[next.slug]?.name ?? next.nameBn : next.nameBn}
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-fg-muted group-hover:text-brand-red transition-colors sm:order-2" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
