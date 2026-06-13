"use client";

/** Project image gallery — responsive grid + click-to-zoom lightbox.
 *  Used on /projects/<slug>.  Same robust lightbox behaviour as the
 *  main Gallery: click outside the image (or the X) closes, ESC closes,
 *  body scroll locks. */

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useLocale } from "./LocaleProvider";

export default function ProjectGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const isEn = useLocale() === "en";
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [active]);

  if (images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(src)}
            className={`group relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-bg-soft shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50 ${
              // First image spans both columns on phones for a hero feel;
              // uniform 4:3 keeps single-image galleries from collapsing.
              i === 0 ? "col-span-2 sm:col-span-1" : ""
            }`}
          >
            <Image
              src={src}
              alt={`${name} — ${isEn ? "photo" : "ছবি"} ${i + 1}`}
              fill
              sizes="(min-width:1024px) 33vw, 50vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setActive(null)}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-8"
          >
            <div className="absolute inset-0 bg-fg/85 backdrop-blur-md" aria-hidden />
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-5xl"
            >
              <button
                type="button"
                onClick={() => setActive(null)}
                aria-label={isEn ? "Close" : "বন্ধ করুন"}
                className="absolute -top-12 right-0 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-fg shadow-lg hover:scale-110 hover:bg-brand-red hover:text-white transition-all"
              >
                <X className="h-5 w-5" />
              </button>
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full h-[70vh] sm:h-[78vh] rounded-2xl overflow-hidden shadow-2xl bg-black ring-1 ring-white/10"
              >
                <Image
                  src={active}
                  alt={name}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
