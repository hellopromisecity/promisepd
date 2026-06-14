"use server";

/** Record one blog-post view.  Best-effort: a counter hiccup must never
 *  surface to the reader.  Dedup (once per session) is done client-side
 *  in <ViewCounter/>; this just bumps the atomic per-slug counter. */

import { createAdminClient } from "@/lib/supabase/admin";

export async function recordView(slug: string): Promise<void> {
  try {
    const clean = (slug ?? "").trim();
    if (!clean) return;
    const admin = createAdminClient();
    if (!admin) return;
    // RPC isn't in the generated types — call it through a loose shape.
    const client = admin as unknown as {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<unknown>;
    };
    await client.rpc("increment_post_view", { p_slug: clean });
  } catch {
    /* swallow — never break the page over a view count */
  }
}
