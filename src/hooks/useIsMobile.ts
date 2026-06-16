"use client";

import { useEffect, useState } from "react";

/** True when the viewport is phone-sized. SSR-safe: returns false on the
 *  server + first client render (so markup matches), then resolves after
 *  mount. Use it to skip cosmetic JS animations on mobile — gate effects
 *  that only run AFTER first paint so there's no visible flash. */
export function useIsMobile(query = "(max-width: 768px)"): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return isMobile;
}
