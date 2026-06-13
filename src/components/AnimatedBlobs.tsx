"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRef } from "react";

type Blob = {
  className: string;
  parallax: number;
  delay?: number;
};

// Default 4-blob set matches the logo's colour weighting — 3 blue
// blobs carry the atmosphere, 1 red blob is the single accent.  Red
// opacity is kept lower than blue so the canvas doesn't wash pink.
const DEFAULT_BLOBS: Blob[] = [
  {
    className:
      "left-[-10%] top-[10%] w-[50vw] h-[50vw] bg-[radial-gradient(circle_at_30%_30%,rgba(24,71,161,0.22),transparent_60%)]",
    parallax: -120,
  },
  {
    className:
      "right-[-15%] top-[30%] w-[50vw] h-[50vw] bg-[radial-gradient(circle_at_70%_30%,rgba(24,71,161,0.20),transparent_60%)]",
    parallax: 80,
    delay: 4,
  },
  {
    className:
      "left-[20%] bottom-[-20%] w-[55vw] h-[55vw] bg-[radial-gradient(circle_at_50%_70%,rgba(24,71,161,0.16),transparent_60%)]",
    parallax: -60,
    delay: 8,
  },
  // Neutral ASH accent blob — the old red one washed the canvas pink;
  // ash keeps a soft tonal corner that stays in the blue/ash brand family.
  {
    className:
      "right-[10%] bottom-[5%] w-[36vw] h-[36vw] bg-[radial-gradient(circle_at_70%_70%,rgba(192,199,209,0.18),transparent_55%)]",
    parallax: 140,
    delay: 12,
  },
];

export default function AnimatedBlobs({
  blobs = DEFAULT_BLOBS,
  containerClass = "",
}: {
  blobs?: Blob[];
  containerClass?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${containerClass}`}
    >
      {blobs.map((blob, i) => (
        <ParallaxBlob
          key={i}
          blob={blob}
          progress={scrollYProgress}
          reduce={!!reduce}
        />
      ))}
    </div>
  );
}

function ParallaxBlob({
  blob,
  progress,
  reduce,
}: {
  blob: Blob;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  reduce: boolean;
}) {
  const y = useTransform(progress, [0, 1], [0, reduce ? 0 : blob.parallax]);
  return (
    <motion.div
      style={{ y, animationDelay: `${blob.delay ?? 0}s` }}
      className={`absolute rounded-full blur-3xl will-change-transform animate-blob ${blob.className}`}
    />
  );
}
