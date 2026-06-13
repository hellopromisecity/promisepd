/** Server-side Supabase client wired to Next.js cookies — required for
 *  Supabase Auth to round-trip the user's session between Server
 *  Components and Server Actions.
 *
 *  Use from Server Components, Server Actions, and Route Handlers.
 *  For unauthenticated public writes (e.g. contact form when not
 *  logged in), prefer ./admin.ts which bypasses RLS via service role.
 *
 *  Next 16 has switched cookies() to be async; the createServerClient
 *  cookie adapter accepts both sync and async getters, so we await
 *  cookies() once and pass the resolved store. */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component — cookies are read-only there.
            // Safe to ignore; the middleware (when added) will refresh
            // the session.
          }
        },
      },
    },
  );
}
