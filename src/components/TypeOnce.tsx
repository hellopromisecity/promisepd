"use client";

import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** Grapheme-aware single-shot typewriter for Bangla.
 *  Re-types from scratch every time the `text` prop (or parent `key`) changes. */

function getGraphemes(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    try {
      const seg = new Intl.Segmenter("bn", { granularity: "grapheme" });
      return Array.from(seg.segment(text), (s) => s.segment);
    } catch {
      /* fall through */
    }
  }
  return Array.from(text);
}

export default function TypeOnce({
  text,
  speed = 50,
  cursorColor = "#e11924",
  cursorWidth = 3,
  animate = false,
}: {
  text: string;
  speed?: number;
  cursorColor?: string;
  cursorWidth?: number;
  /** When false (the default + first paint) the full text is rendered
   *  instantly so the hero H1 is the LCP element with no delay.  The
   *  parent flips this to true on every rotation so the typewriter
   *  effect plays only AFTER the first load — never blocking LCP. */
  animate?: boolean;
}) {
  const reduce = useReducedMotion();
  const graphemes = useMemo(() => getGraphemes(text), [text]);
  const shouldType = animate && !reduce;
  const [count, setCount] = useState(shouldType ? 0 : graphemes.length);

  useEffect(() => {
    if (!shouldType) {
      setCount(graphemes.length);
      return;
    }
    setCount(0);
    if (graphemes.length === 0) return;
    const t = setInterval(() => {
      setCount((c) => {
        if (c + 1 >= graphemes.length) {
          clearInterval(t);
          return graphemes.length;
        }
        return c + 1;
      });
    }, speed);
    return () => clearInterval(t);
  }, [graphemes, speed, shouldType]);

  const done = count >= graphemes.length;

  return (
    <>
      {graphemes.slice(0, count).join("")}
      <span
        aria-hidden
        className="inline-block align-middle animate-pulse"
        style={{
          width: cursorWidth,
          height: "0.9em",
          background: cursorColor,
          marginLeft: 4,
          verticalAlign: "-0.1em",
          opacity: done ? 0 : 1,
          transition: "opacity 0.4s ease",
          borderRadius: 1,
        }}
      />
    </>
  );
}
