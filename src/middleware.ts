/** Edge middleware — keeps the Supabase session fresh on every request
 *  and gates the member area.
 *
 *   • Refreshes the auth cookie (required by @supabase/ssr so Server
 *     Components see a valid session).
 *   • /account (+ /en/account) → redirect guests to the login page,
 *     remembering where they were headed via ?next=.
 *   • /login + /signup → if already logged in, skip straight to
 *     /account (so the PWA, which opens on /login, doesn't show a
 *     sign-in form to members who are already authenticated).
 *
 *  No-ops gracefully when Supabase env vars aren't set. */

import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isEn = path === "/en" || path.startsWith("/en/");
  const bare = isEn ? path.replace(/^\/en/, "") || "/" : path;

  const isAccount = bare === "/account" || bare.startsWith("/account/");
  const isAdmin = path === "/admin" || path.startsWith("/admin/");
  const isAuthPage = bare === "/login" || bare === "/signup";

  // Guests can't see the member area or the admin dashboard.  (Admin
  // also enforces the role itself in its layout — this just blocks
  // logged-out visitors early.)
  if ((isAccount || isAdmin) && !user) {
    const to = request.nextUrl.clone();
    to.pathname = isEn ? "/en/login" : "/login";
    to.search = "";
    to.searchParams.set("next", path);
    return NextResponse.redirect(to);
  }

  // Members shouldn't sit on the login / signup screens.
  if (isAuthPage && user) {
    const to = request.nextUrl.clone();
    to.pathname = isEn ? "/en/account" : "/account";
    to.search = "";
    return NextResponse.redirect(to);
  }

  return response;
}

export const config = {
  // Run on everything except Next internals and static asset files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|xml)$).*)",
  ],
};
