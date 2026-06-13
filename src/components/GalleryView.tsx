"use client";

/** Gallery — two tabs (ছবি / ভিডিও), 4-per-row grid, 12-per-page
 *  pagination, and a shared lightbox.
 *
 *  - Images come from the curated GALLERY_IMAGES data (static).
 *  - Videos are fetched once (on first switch to the ভিডিও tab) from
 *    /api/gallery/videos, which proxies the channel's YouTube RSS feed
 *    server-side.  Cached in component state so switching tabs back and
 *    forth doesn't re-fetch.
 *  - Clicking an image opens it large; clicking a video opens an inline
 *    YouTube embed.  ESC / backdrop-click closes; body scroll locked. */

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  Images as ImagesIcon,
  Video,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  GALLERY_IMAGES,
  GALLERY_PAGE_SIZE,
  YOUTUBE,
  type GalleryVideo,
} from "@/lib/gallery";
import { toBn } from "@/lib/bn";
import { GALLERY_EN } from "@/lib/pages.en";
import { useLocale } from "./LocaleProvider";

type Tab = "images" | "videos";

type Lightbox =
  | { type: "image"; src: string; title: string }
  | { type: "video"; id: string; title: string }
  | null;

/** Windowed page list: 1 … (cur-1) cur (cur+1) … total. */
function pageList(current: number, total: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
      out.push(i);
    } else if (out[out.length - 1] !== "…") {
      out.push("…");
    }
  }
  return out;
}

function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (p: number) => void;
}) {
  const isEn = useLocale() === "en";
  const num = (n: number) => (isEn ? String(n) : toBn(n));
  if (total <= 1) return null;
  return (
    <div className="mt-10 flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label={isEn ? GALLERY_EN.prev : "পূর্ববর্তী"}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-fg disabled:opacity-40 disabled:cursor-not-allowed hover:border-brand-blue/50 hover:text-brand-blue transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pageList(page, total).map((p, i) =>
        p === "…" ? (
          <span
            key={`gap-${i}`}
            className="inline-flex h-10 w-9 items-center justify-center text-fg-faint"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-bold tnum transition-colors ${
              p === page
                ? "bg-brand-blue text-white shadow-[var(--shadow-brand)]"
                : "border border-border bg-white text-fg hover:border-brand-blue/50 hover:text-brand-blue"
            }`}
          >
            {num(p)}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === total}
        aria-label={isEn ? GALLERY_EN.next : "পরবর্তী"}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-fg disabled:opacity-40 disabled:cursor-not-allowed hover:border-brand-blue/50 hover:text-brand-blue transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function GalleryView() {
  const isEn = useLocale() === "en";
  const g = GALLERY_EN;
  const imgTitle = (src: string, fallback: string) =>
    isEn ? g.titles[src] ?? fallback : fallback;

  const [tab, setTab] = useState<Tab>("images");
  const [imgPage, setImgPage] = useState(1);
  const [vidPage, setVidPage] = useState(1);

  const [videos, setVideos] = useState<GalleryVideo[] | null>(null);
  const [vidLoading, setVidLoading] = useState(false);
  const [vidError, setVidError] = useState(false);

  const [lightbox, setLightbox] = useState<Lightbox>(null);

  // Fetch videos lazily — only when the visitor first opens the ভিডিও
  // tab, and only once (result cached in state).
  useEffect(() => {
    if (tab !== "videos" || videos !== null || vidLoading) return;
    setVidLoading(true);
    setVidError(false);
    fetch("/api/gallery/videos")
      .then((r) => r.json())
      .then((data: { videos?: GalleryVideo[] }) => {
        setVideos(data.videos ?? []);
      })
      .catch(() => {
        setVideos([]);
        setVidError(true);
      })
      .finally(() => setVidLoading(false));
  }, [tab, videos, vidLoading]);

  // Lightbox: ESC to close + body scroll lock while open.
  useEffect(() => {
    if (!lightbox) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox]);

  const switchTab = useCallback((t: Tab) => setTab(t), []);

  // ── Image tab pagination ──────────────────────────────────────────
  const imgTotalPages = Math.max(
    1,
    Math.ceil(GALLERY_IMAGES.length / GALLERY_PAGE_SIZE),
  );
  const imgStart = (imgPage - 1) * GALLERY_PAGE_SIZE;
  const imgSlice = GALLERY_IMAGES.slice(imgStart, imgStart + GALLERY_PAGE_SIZE);

  // ── Video tab pagination ──────────────────────────────────────────
  const vidList = videos ?? [];
  const vidTotalPages = Math.max(
    1,
    Math.ceil(vidList.length / GALLERY_PAGE_SIZE),
  );
  const vidStart = (vidPage - 1) * GALLERY_PAGE_SIZE;
  const vidSlice = vidList.slice(vidStart, vidStart + GALLERY_PAGE_SIZE);

  return (
    <section className="relative pb-20 sm:pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-2xl bg-bg-soft border border-border p-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => switchTab("images")}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
                tab === "images"
                  ? "bg-brand-blue text-white shadow-[var(--shadow-brand)]"
                  : "text-fg-soft hover:text-fg"
              }`}
            >
              <ImagesIcon className="h-4 w-4" />
              {isEn ? g.tabPhotos : "ছবি"}
            </button>
            <button
              type="button"
              onClick={() => switchTab("videos")}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
                tab === "videos"
                  ? "bg-brand-red text-white shadow-md"
                  : "text-fg-soft hover:text-fg"
              }`}
            >
              <Video className="h-4 w-4" />
              {isEn ? g.tabVideos : "ভিডিও"}
            </button>
          </div>
        </div>

        {/* ── IMAGES ───────────────────────────────────────────────── */}
        {tab === "images" && (
          <div className="mt-10">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {imgSlice.map((img) => (
                <button
                  key={img.src}
                  type="button"
                  onClick={() =>
                    setLightbox({
                      type: "image",
                      src: img.src,
                      title: imgTitle(img.src, img.title),
                    })
                  }
                  className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-bg-soft shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
                >
                  <Image
                    src={img.src}
                    alt={imgTitle(img.src, img.title)}
                    fill
                    sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-fg/80 via-fg/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3 text-left">
                    <span className="text-xs sm:text-sm font-semibold text-white drop-shadow line-clamp-2">
                      {imgTitle(img.src, img.title)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <Pagination
              page={imgPage}
              total={imgTotalPages}
              onChange={(p) => {
                setImgPage(p);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        )}

        {/* ── VIDEOS ───────────────────────────────────────────────── */}
        {tab === "videos" && (
          <div className="mt-10">
            {vidLoading && (
              <div className="flex flex-col items-center justify-center py-24 text-fg-muted">
                <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
                <p className="mt-4 text-sm">{isEn ? g.loadingVideos : "ভিডিও লোড হচ্ছে…"}</p>
              </div>
            )}

            {!vidLoading && vidList.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <AlertCircle className="h-8 w-8 text-fg-faint" />
                <p className="mt-4 text-sm text-fg-muted max-w-sm">
                  {isEn
                    ? vidError
                      ? g.videoErr
                      : g.videoEmpty
                    : vidError
                      ? "এই মুহূর্তে ভিডিও লোড করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।"
                      : "শীঘ্রই নতুন ভিডিও যুক্ত হবে — আমাদের YouTube চ্যানেল ঘুরে আসুন।"}
                </p>
                <a
                  href={YOUTUBE.channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-red px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:scale-[1.02] transition-transform"
                >
                  <Video className="h-4 w-4" />
                  {isEn ? g.viewChannel : "চ্যানেল দেখুন"}
                </a>
              </div>
            )}

            {!vidLoading && vidList.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {vidSlice.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() =>
                        setLightbox({ type: "video", id: v.id, title: v.title })
                      }
                      className="group relative overflow-hidden rounded-2xl border border-border bg-bg-soft shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-red/50 text-left"
                    >
                      <div className="relative aspect-video overflow-hidden">
                        <Image
                          src={v.thumbnail}
                          alt={v.title}
                          fill
                          sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-fg/20 group-hover:bg-fg/5 transition-colors" />
                        {/* Play badge */}
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-red/95 text-white shadow-xl group-hover:scale-110 transition-transform">
                            <Play className="h-6 w-6 translate-x-0.5 fill-white" />
                          </span>
                        </span>
                      </div>
                      <div className="p-3">
                        <span className="text-sm font-semibold text-fg leading-snug line-clamp-2">
                          {v.title}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                <Pagination
                  page={vidPage}
                  total={vidTotalPages}
                  onChange={(p) => {
                    setVidPage(p);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* ── LIGHTBOX ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={lightbox.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-8"
          >
            <div
              className="absolute inset-0 bg-fg/85 backdrop-blur-md"
              aria-hidden
            />

            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-5xl"
            >
              <button
                type="button"
                onClick={() => setLightbox(null)}
                aria-label={isEn ? g.close : "বন্ধ করুন"}
                className="absolute -top-12 right-0 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-fg shadow-lg hover:scale-110 hover:bg-brand-red hover:text-white transition-all"
              >
                <X className="h-5 w-5" />
              </button>

              {lightbox.type === "video" ? (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black ring-1 ring-white/10"
                >
                  <iframe
                    src={`https://www.youtube.com/embed/${lightbox.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                    title={lightbox.title}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full h-[70vh] sm:h-[78vh] rounded-2xl overflow-hidden shadow-2xl bg-black ring-1 ring-white/10"
                >
                  <Image
                    src={lightbox.src}
                    alt={lightbox.title}
                    fill
                    sizes="100vw"
                    className="object-contain"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-fg/85 to-transparent p-5">
                    <span className="text-sm sm:text-base font-semibold text-white">
                      {lightbox.title}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
