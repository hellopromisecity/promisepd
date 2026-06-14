"use client";

/** Fire-and-forget view counter: records one view per reader session for
 *  the given slug (sessionStorage guards against refresh inflation).
 *  Renders nothing. */

import { useEffect } from "react";
import { recordView } from "@/app/actions/view";

export default function ViewCounter({ slug }: { slug: string }) {
  useEffect(() => {
    if (!slug) return;
    const key = `pv:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* private mode — fall through and count it */
    }
    void recordView(slug);
  }, [slug]);

  return null;
}
