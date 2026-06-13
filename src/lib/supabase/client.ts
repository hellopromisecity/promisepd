/** Browser-side Supabase client.  Uses the public ANON key only —
 *  never the service-role key.  All writes from the browser go through
 *  RLS policies defined in the migration SQL.
 *
 *  Use this from Client Components ("use client" files).  For Server
 *  Components / Server Actions / Route Handlers, use ./server.ts or
 *  ./admin.ts instead. */

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
