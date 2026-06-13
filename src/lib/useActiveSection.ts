"use client";

import { useEffect, useState } from "react";

export function useActiveSection(ids: string[], offset = 100): string {
  const [active, setActive] = useState<string>(ids[0] ?? "");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const sections = ids
      .map((id) => ({ id, el: document.getElementById(id) }))
      .filter((s): s is { id: string; el: HTMLElement } => !!s.el);
    if (sections.length === 0) return;

    const compute = () => {
      const y = window.scrollY + offset;
      let current = sections[0].id;
      for (const s of sections) {
        const top = s.el.offsetTop;
        if (y >= top) current = s.id;
      }
      // bottom-of-page → last section
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 40
      ) {
        current = sections[sections.length - 1].id;
      }
      setActive((prev) => (prev === current ? prev : current));
    };

    compute();
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", compute);
    };
  }, [ids, offset]);

  return active;
}
