// One-off check: is the member-auth backend ready?
//   • Supabase env keys valid / reachable?
//   • Does public.profiles exist (migration 0004 applied)?
// Run with:  node --env-file=.env.local scripts/verify-auth-setup.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.log("❌ Supabase env keys missing (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  process.exit(0);
}
console.log("• Supabase URL:", url.replace(/^https?:\/\//, "").slice(0, 30) + "…");

const admin = createClient(url, key, { auth: { persistSession: false } });

// 1. Can we reach Auth (validates the service-role key)?
try {
  const { error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
  console.log(error ? `❌ Auth check failed: ${error.message}` : "✅ Auth reachable (service-role key valid).");
} catch (e) {
  console.log("❌ Auth check threw:", e.message);
}

// 2. Does public.profiles exist?
const { error: pErr } = await admin.from("profiles").select("id").limit(1);
if (!pErr) {
  console.log("✅ public.profiles EXISTS — migration 0004 already applied. Auth is ready.");
} else if (/does not exist|schema cache|find the table/i.test(pErr.message)) {
  console.log("⚠️  public.profiles NOT found — run migration 0004_profiles.sql in Supabase SQL Editor.");
} else {
  console.log("❓ profiles probe returned:", pErr.message);
}
