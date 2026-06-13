import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  Ruler,
  Phone,
  PlayCircle,
  FileText,
  Building2,
  Wallet,
  Calendar,
  KeyRound,
  ZoomIn,
  Sparkles,
  LandPlot,
  Car,
} from "lucide-react";
import { SITE, type Project } from "@/lib/site";
import { PROJECT_EN, PROJECT_DETAIL_EN, FLOOR_EN } from "@/lib/site.en";
import { toBn } from "@/lib/bn";
import { DICT, localizedPath, type Locale } from "@/lib/i18n";
import ProjectGallery from "./ProjectGallery";
import ShareAvailability from "./ShareAvailability";

const STATUS_DOT: Record<string, string> = {
  red: "bg-brand-red",
  blue: "bg-brand-blue",
  ash: "bg-brand-ash-dark",
};

/** Bengali → Western digits (for the English unit-map sizes etc.). */
const enDigits = (s: string) =>
  s.replace(/[০-৯]/g, (d) => "0123456789"["০১২৩৪৫৬৭৮৯".indexOf(d)]);

export default function ProjectDetail({
  project,
  locale = "bn",
}: {
  project: Project;
  locale?: Locale;
}) {
  const isEn = locale === "en";
  const t = DICT[locale].projDetail;
  const lp = (href: string) => localizedPath(href, locale);
  const px = isEn ? PROJECT_EN[project.slug] : null;
  const pd = isEn ? PROJECT_DETAIL_EN[project.slug] : null;

  const name = px?.name ?? project.name;
  const status = px?.status ?? project.status;
  const location = px?.location ?? project.location;
  const price = px?.price ?? project.price;
  const size = px?.size ?? project.size;
  const longDescription = pd?.longDescription ?? project.longDescription;
  const highlights = px?.highlights ?? project.highlights;
  const num = (n: number) => (isEn ? String(n) : toBn(n));
  const sz = (s?: string) => (s ? (isEn ? enDigits(s) : s) : s);

  const details = (isEn ? pd?.details : project.details) ?? [];
  const mid = Math.ceil(details.length / 2);
  const firstHalf = details.slice(0, mid);
  const secondHalf = details.slice(mid);
  const midVideo = details.length > 0 ? project.videoIds?.[0] : undefined;
  const bottomVideos =
    details.length > 0 ? (project.videoIds ?? []).slice(1) : project.videoIds ?? [];

  const payment = pd?.payment ?? project.payment;
  const plots = project.plots
    ? {
        ...project.plots,
        ...(pd?.plots ?? {}),
      }
    : undefined;
  const shareNote = pd?.shareMap?.note ?? project.shareMap?.note;

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden pt-28 sm:pt-32">
        <div className="absolute inset-0 -z-10">
          <Image src={project.cover} alt={name} fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-fg/90 via-fg/55 to-fg/35" />
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-20 pb-12 sm:pt-28 sm:pb-16">
          <Link href={lp("/#projects")} className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/85 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t.allProjects}
          </Link>

          <div className="mt-5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md px-3 py-1 text-[11px] font-semibold tracking-wide text-fg shadow-sm">
              <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${STATUS_DOT[project.accent] ?? STATUS_DOT.red}`} />
              {status}
            </span>
            {size && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 backdrop-blur-md px-3 py-1 text-[11px] font-medium text-white">
                <Ruler className="h-3 w-3" />
                {size}
              </span>
            )}
          </div>

          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.08] drop-shadow-md">
            {name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-white/90">
            <span className="inline-flex items-center gap-1.5 text-sm">
              <MapPin className="h-4 w-4" />
              {location}
            </span>
            <span className="text-sm whitespace-nowrap">
              <span className="text-white/70">{t.fromPrice} </span>
              <span className="font-bold">{price}</span>
            </span>
          </div>

          <p className="mt-5 max-w-2xl text-base sm:text-lg text-white/90 leading-relaxed">
            {longDescription}
          </p>

          <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link href={lp("/contact")} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-blue px-6 py-3.5 text-sm sm:text-base font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark hover:scale-[1.02] transition-all">
              {t.bookVisit}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href={`tel:${SITE.phone}`} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm sm:text-base font-semibold text-fg hover:scale-[1.02] transition-transform">
              <Phone className="h-4 w-4 text-brand-blue" />
              {isEn ? SITE.phoneDisplayEn : SITE.phoneDisplay}
            </a>
            {project.floorPlanUrl && (
              <a href={project.floorPlanUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 border border-white/30 backdrop-blur-md px-6 py-3.5 text-sm sm:text-base font-semibold text-white hover:bg-white/25 transition-colors">
                <FileText className="h-4 w-4" />
                {t.floorPlan}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Building availability */}
      {project.buildings && (
        <section className="relative py-12 sm:py-16 bg-bg-soft">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-6 w-6 text-brand-blue" />
              <h2 className="text-2xl sm:text-3xl font-bold">
                {t.bldgStatusA} <span className="text-grad">{t.bldgStatusB}</span>
              </h2>
            </div>
            <p className="text-sm sm:text-base text-fg-muted mb-6">
              {t.bldgSummary(num(project.buildings.total), num(project.buildings.soldOut), num(project.buildings.nowBooking))}
            </p>

            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-2.5">
              {Array.from({ length: project.buildings.total }, (_, idx) => {
                const n = idx + 1;
                const sold = n <= project.buildings!.soldOut;
                const booking = n === project.buildings!.nowBooking;
                return (
                  <div key={n} className={`relative flex flex-col items-center justify-center rounded-xl border py-3 text-center ${booking ? "bg-brand-blue text-white border-brand-blue shadow-[var(--shadow-brand)]" : sold ? "bg-bg-soft-2 text-fg-faint border-border" : "bg-white text-fg-soft border-border"}`}>
                    <span className="text-base font-extrabold tnum">{num(n)}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wide mt-0.5">
                      {booking ? t.booking : sold ? t.soldOut : t.coming}
                    </span>
                    {booking && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-75 animate-ping" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-brand-red" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 grad-border p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="text-sm font-bold text-fg">{t.bldgNowBooking(num(project.buildings.nowBooking))}</div>
                <p className="text-sm text-fg-muted mt-0.5">{t.bldgCta}</p>
              </div>
              <a href={`tel:${SITE.phone}`} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-red px-6 py-3 text-sm font-bold text-white shadow-md hover:scale-[1.02] transition-transform whitespace-nowrap">
                <Phone className="h-4 w-4" />
                {t.urgentContact}
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Share availability */}
      {project.shareMap && (
        <ShareAvailability total={project.shareMap.total} sold={project.shareMap.sold} note={shareNote} phone={SITE.phone} locale={locale} />
      )}

      {/* Payment & deed */}
      {payment && (
        <section className="relative py-12 sm:py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-6">
              <Wallet className="h-6 w-6 text-brand-blue" />
              <h2 className="text-2xl sm:text-3xl font-bold">
                {t.paymentA} <span className="text-grad">{t.paymentB}</span>
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {payment.rows.map((row, i) => {
                const RIcon = [Wallet, Calendar, KeyRound][i % 3];
                const box = ["bg-brand-blue", "bg-brand-red", "bg-brand-ash-dark"][i % 3];
                return (
                  <div key={row.label} className="card p-5">
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${box} text-white shadow-md`}>
                      <RIcon className="h-5 w-5" />
                    </div>
                    <div className="mt-3 text-[11px] uppercase tracking-wider text-fg-faint font-bold">{row.label}</div>
                    <div className="text-xl font-bold text-grad-rb">{row.value}</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-2xl bg-bg-soft border border-border px-5 py-4">
              <KeyRound className="h-5 w-5 text-brand-blue shrink-0 mt-0.5" />
              <p className="text-sm text-fg-muted leading-relaxed">{payment.note}</p>
            </div>
          </div>
        </section>
      )}

      {/* Rules image */}
      {project.rulesImage && (
        <section className="relative pb-12 sm:pb-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="h-6 w-6 text-brand-blue" />
              <h2 className="text-2xl sm:text-3xl font-bold">
                {t.rulesA} <span className="text-grad">{t.rulesB}</span>
              </h2>
            </div>
            <a href={project.rulesImage} target="_blank" rel="noopener noreferrer" className="group relative block rounded-2xl overflow-hidden border border-border shadow-lg">
              <Image src={project.rulesImage} alt={`${name} — ${t.rulesA} ${t.rulesB}`} width={1280} height={904} sizes="(min-width:1024px) 896px, 100vw" className="w-full h-auto" />
              <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-fg/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md group-hover:bg-brand-blue transition-colors">
                <ZoomIn className="h-3.5 w-3.5" />
                {t.zoom}
              </span>
            </a>
          </div>
        </section>
      )}

      {/* Unit availability */}
      {project.unitMap && (
        <section className="relative py-12 sm:py-16 bg-bg-soft">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-6 w-6 text-brand-blue" />
              <h2 className="text-2xl sm:text-3xl font-bold">
                {t.unitA} <span className="text-grad">{t.unitB}</span>
              </h2>
            </div>
            <p className="text-sm sm:text-base text-fg-muted mb-5">{t.unitSub}</p>

            <div className="flex flex-wrap items-center gap-4 mb-5 text-xs font-medium text-fg-soft">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded bg-brand-blue/15 border border-brand-blue/50" />
                {t.legendOpen}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded bg-brand-red/10 border border-brand-red/30" />
                {t.legendSold}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded bg-brand-ash/40 border border-brand-ash" />
                {t.legendRented}
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-white overflow-hidden divide-y divide-border">
              {project.unitMap.floors.map((floor) => (
                <div key={floor.label} className="flex items-center gap-3 px-3 sm:px-4 py-2.5">
                  <div className="w-16 sm:w-20 shrink-0 text-xs sm:text-sm font-bold text-fg">
                    {isEn ? FLOOR_EN[floor.label] ?? floor.label : floor.label}
                  </div>
                  <div className="flex flex-wrap gap-2 flex-1">
                    {floor.units.map((u) => {
                      if (u.status === "available") {
                        return (
                          <a key={u.id} href={`tel:${SITE.phone}`} title={`#${u.id} — ${t.open}`} className="group relative inline-flex min-w-[4rem] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-brand-blue/50 bg-gradient-to-b from-brand-blue/12 to-brand-blue/5 px-3 py-2 text-brand-blue shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.08] hover:border-brand-blue hover:bg-brand-blue hover:text-white hover:shadow-[var(--shadow-brand)]">
                            <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-80" />
                              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                            </span>
                            <span className="text-sm font-extrabold leading-none">#{u.id}</span>
                            {u.size && <span className="mt-0.5 text-[9px] font-semibold leading-none opacity-90">{sz(u.size)} sqft</span>}
                            <span className="mt-0.5 text-[8px] font-bold uppercase leading-none opacity-85 group-hover:opacity-100">{t.open}</span>
                          </a>
                        );
                      }
                      const isRented = u.status === "rented";
                      return (
                        <span key={u.id} className={`relative inline-flex min-w-[4rem] flex-col items-center justify-center rounded-xl border px-3 py-2 ${isRented ? "border-brand-ash bg-brand-ash/30 text-fg-muted" : "border-brand-red/25 bg-brand-red/10 text-brand-red/80"}`}>
                          <span className={`text-sm font-bold leading-none ${isRented ? "" : "line-through"}`}>#{u.id}</span>
                          {u.size && !isRented && <span className="mt-0.5 text-[9px] font-medium leading-none">{sz(u.size)} sqft</span>}
                          {isRented ? (
                            <span className="mt-1 rounded-full bg-brand-ash/50 px-1.5 py-0.5 text-[8px] font-bold uppercase leading-none text-fg-muted">{t.rented}</span>
                          ) : (
                            <span className="mt-1 whitespace-nowrap rounded-full bg-brand-red px-1.5 py-0.5 text-[8px] font-bold uppercase leading-none text-white shadow-sm">{t.soldOut}</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {project.unitMap.parking && (
              <div className="mt-4 rounded-2xl border border-border bg-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 sm:flex-1">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-blue text-white shadow-md">
                    <Car className="h-5 w-5" />
                  </span>
                  <div className="text-base font-bold text-fg">{t.parkingTitle}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-bg-soft px-3 py-2 text-sm font-semibold text-fg">
                    {t.parkingTotal}
                    <span className="font-extrabold">
                      {isEn ? project.unitMap.parking.total : toBn(project.unitMap.parking.total)}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-brand-red/25 bg-brand-red/10 px-3 py-2 text-sm font-semibold text-brand-red">
                    {t.parkingSold}
                    <span className="font-extrabold">
                      {isEn ? project.unitMap.parking.sold : toBn(project.unitMap.parking.sold)}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl border-2 border-brand-blue/50 bg-brand-blue/10 px-3 py-2 text-sm font-semibold text-brand-blue">
                    {t.parkingFree}
                    <span className="font-extrabold">
                      {isEn ? project.unitMap.parking.available : toBn(project.unitMap.parking.available)}
                    </span>
                  </span>
                </div>
              </div>
            )}

            <div className="mt-5 grad-border p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 text-sm text-fg-muted">{t.unitCta}</div>
              <a href={`tel:${SITE.phone}`} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-blue px-6 py-3 text-sm font-bold text-white shadow-[var(--shadow-brand)] hover:scale-[1.02] transition-transform whitespace-nowrap">
                <Phone className="h-4 w-4" />
                {t.bookingContact}
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Land plots */}
      {plots && (
        <section className="relative py-12 sm:py-16 bg-bg-soft">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-2">
              <LandPlot className="h-6 w-6 text-brand-blue" />
              <h2 className="text-2xl sm:text-3xl font-bold">
                {t.plotsA} <span className="text-grad">{t.plotsB}</span>
              </h2>
            </div>
            <p className="text-sm sm:text-base text-fg-muted mb-6">{t.plotsSub}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[
                { label: t.perDecimal, value: plots.pricePerShotangsho },
                { label: t.perKatha, value: plots.pricePerKatha },
                { label: t.conversion, value: plots.conversion },
              ].map((row) => (
                <div key={row.label} className="card p-5">
                  <div className="text-[11px] uppercase tracking-wider text-fg-faint font-bold">{row.label}</div>
                  <div className="text-xl font-bold text-grad-rb">{row.value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {plots.categories.map((c) => (
                <div key={c.katha} className="grad-border p-6 text-center transition-transform hover:-translate-y-1">
                  <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue text-white shadow-md">
                    <Ruler className="h-6 w-6" />
                  </div>
                  <div className="mt-3 text-2xl font-extrabold text-fg">{c.katha}</div>
                  <div className="text-sm text-fg-muted">{c.shotangsho}</div>
                  <div className="mt-3 text-xl font-bold text-grad-rb">{c.price}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-4">
              {project.plots?.layoutPlanUrl && (
                <a href={project.plots.layoutPlanUrl} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-blue px-6 py-3.5 text-sm sm:text-base font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark hover:scale-[1.01] transition-all sm:w-auto sm:self-start">
                  <FileText className="h-4 w-4" />
                  {t.layoutPlan}
                  <ZoomIn className="h-4 w-4" />
                </a>
              )}
              {plots.note && (
                <div className="flex items-start gap-3 rounded-2xl bg-white border border-border px-5 py-4">
                  <Sparkles className="h-5 w-5 text-brand-blue shrink-0 mt-0.5" />
                  <p className="text-sm text-fg-muted leading-relaxed">{plots.note}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Highlights */}
      <section className="relative py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 gap-3">
            {highlights.map((h) => (
              <div key={h} className="flex items-center gap-3 rounded-2xl bg-bg-soft border border-border px-5 py-4">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-blue text-white">
                  <Check className="h-4 w-4" />
                </span>
                <span className="text-sm sm:text-base font-medium text-fg">{h}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      {details.length > 0 && (
        <section className="relative pb-12 sm:pb-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">
              {t.aboutA} <span className="text-grad">{t.aboutB}</span>
            </h2>
            <div className="space-y-5 text-base sm:text-lg text-fg-muted leading-relaxed">
              {firstHalf.map((para, i) => <p key={i}>{para}</p>)}
            </div>
            {midVideo && (
              <figure className="my-10 sm:my-12">
                <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl ring-1 ring-border bg-black">
                  <iframe src={`https://www.youtube.com/embed/${midVideo}?rel=0&modestbranding=1&playsinline=1`} title={`${name} — ${t.docCaption}`} loading="lazy" className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
                </div>
                <figcaption className="mt-3 text-center text-sm text-fg-faint">{name} — {t.docCaption}</figcaption>
              </figure>
            )}
            <div className="space-y-5 text-base sm:text-lg text-fg-muted leading-relaxed">
              {secondHalf.map((para, i) => <p key={i}>{para}</p>)}
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      <section className="relative pb-12 sm:pb-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">
            {t.galleryA}<span className="text-grad"> {t.galleryB}</span>
          </h2>
          <ProjectGallery images={project.gallery} name={name} />
        </div>
      </section>

      {/* Videos */}
      {bottomVideos.length > 0 && (
        <section className="relative pb-16 sm:pb-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-2">
              <PlayCircle className="h-7 w-7 text-brand-red" />
              {t.videos}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {bottomVideos.map((id) => (
                <div key={id} className="relative aspect-video rounded-2xl overflow-hidden shadow-xl bg-black ring-1 ring-border">
                  <iframe src={`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`} title={name} loading="lazy" className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="relative pb-20 sm:pb-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grad-border p-8 sm:p-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold leading-[1.15]">
              {name} <span className="text-grad">{t.ctaSuffix}</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-fg-muted max-w-2xl mx-auto">{t.bldgCta}</p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href={lp("/contact")} className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-7 py-3.5 text-base font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark hover:scale-[1.02] transition-all">
                {t.contactBtn}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href={`tel:${SITE.phone}`} className="inline-flex items-center gap-2 rounded-2xl bg-white border border-border px-7 py-3.5 text-base font-semibold text-fg hover:border-brand-blue/40 hover:shadow-lg transition-all">
                <Phone className="h-4 w-4 text-brand-blue" />
                {isEn ? SITE.phoneDisplayEn : SITE.phoneDisplay}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
