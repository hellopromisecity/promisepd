"use client";

/** Soft architectural-photo backdrop for hero sections.
 *
 *  Two modes:
 *   - Single image: `src="/path.webp"` — same as before, no JS state.
 *   - Slideshow: `src={["/a.webp", "/b.webp", ...]}` — auto-rotates
 *     every `intervalMs` (default 7 s) with a smooth 1.4 s crossfade.
 *
 *  The photo always sits at the very back of the stack (-z-30),
 *  behind any mesh-bg / blobs / grid-bg the caller stacks on top.
 *  Three layered treatments stay constant across rotations:
 *
 *   1. Brand-blue diagonal wash       — anchors the canvas in
 *      primary, so the photo never reads as "stock photo".
 *   2. Top-to-bottom white gradient   — keeps content readable.
 *   3. Optional CSS blur on the photo — premium bokeh feel.
 *
 *  Respects `prefers-reduced-motion`: if the visitor opted out of
 *  animations, the slideshow stays on its first frame. */

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";

export type PropertyBackdropProps = {
  /** Path under /public — always a .webp from the optimiser.
   *  Pass an array to enable the slideshow. */
  src: string | string[];
  /** Slideshow tick in milliseconds.  Default 7000 (matches the
   *  hero's rotating division cadence). */
  intervalMs?: number;
  /** Alt text (visual-only by default — empty, role=presentation). */
  alt?: string;
  /** Photo opacity 0-100.  Default 34 — high enough to read the
   *  architecture, low enough that text on top still sits clean. */
  intensity?: number;
  /** object-position string ("top", "center", "right top", etc.). */
  position?: string;
  /** Whether to blur the photo for the "premium bokeh" look. */
  blur?: boolean;
  /** Blue overlay strength.  Higher = more brand-anchored, lower
   *  = more photographic. */
  bluewash?: "soft" | "medium" | "strong";
};

const BLUE_WASH = {
  soft:
    "bg-[linear-gradient(135deg,rgba(24,71,161,0.15)_0%,rgba(255,255,255,0.05)_50%,rgba(225,25,36,0.08)_100%)]",
  medium:
    "bg-[linear-gradient(135deg,rgba(24,71,161,0.35)_0%,rgba(255,255,255,0.1)_50%,rgba(225,25,36,0.12)_100%)]",
  strong:
    "bg-[linear-gradient(135deg,rgba(24,71,161,0.55)_0%,rgba(24,71,161,0.25)_50%,rgba(225,25,36,0.15)_100%)]",
} as const;

export default function PropertyBackdrop({
  src,
  intervalMs = 7000,
  alt = "",
  intensity = 34,
  position = "center",
  blur = false,
  bluewash = "soft",
}: PropertyBackdropProps) {
  const sources = Array.isArray(src) ? src : [src];
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    // Single image, or reduced-motion preference → no rotation.
    if (sources.length < 2 || reduce) return;
    const t = setInterval(
      () => setIdx((i) => (i + 1) % sources.length),
      intervalMs,
    );
    return () => clearInterval(t);
  }, [sources.length, intervalMs, reduce]);

  const currentSrc = sources[idx];
  const targetOpacity = Math.max(0, Math.min(100, intensity)) / 100;

  return (
    <div
      aria-hidden
      className="absolute inset-0 -z-30 overflow-hidden pointer-events-none"
    >
      {/* Crossfading photo stack.  AnimatePresence with mode=
          "popLayout" lets the outgoing photo fade as the incoming
          one fades in (both visible mid-transition) — smoother than
          mode="wait" which causes a brief blank flash. */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentSrc}
          // First frame paints instantly at target opacity (no 1.4 s
          // fade-in) so the hero backdrop is visible with first paint —
          // later rotations still crossfade.
          initial={{ opacity: idx === 0 ? targetOpacity : 0 }}
          animate={{ opacity: targetOpacity }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          <Image
            src={currentSrc}
            alt={alt}
            fill
            // Only the first frame is LCP — later ones load while
            // the hero is already painted.
            priority={idx === 0}
            sizes="100vw"
            className={`object-cover scale-105 ${blur ? "blur-[2px]" : ""}`}
            style={{ objectPosition: position }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Brand-coloured diagonal wash — stays put across rotations
          so the colour identity remains constant while the photo
          changes underneath. */}
      <div className={`absolute inset-0 ${BLUE_WASH[bluewash]}`} />

      {/* Bottom-half white fade — guarantees readable text
          regardless of how busy the photo is at that area. */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-white" />
    </div>
  );
}
