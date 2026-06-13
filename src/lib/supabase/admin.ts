/** Service-role Supabase client — bypasses Row Level Security.
 *  Use ONLY from server-side code (Server Actions, Route Handlers,
 *  cron jobs).  Never import this in a Client Component, and never
 *  expose the service-role key to the browser.
 *
 *  Typical use case: writing anonymous public submissions (the
 *  contact form) where the visitor isn't authenticated and we'd
 *  rather not loosen RLS to "anyone can insert". */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/** Lazily-instantiated singleton.  Returns null if env vars aren't
 *  set so dev/preview deploys without Supabase configured still build
 *  and the callers can fall back to console-logging. */
let cached: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createAdminClient() {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  cached = createSupabaseClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  return cached;
}
