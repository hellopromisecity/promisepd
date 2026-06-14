"use client";

/** Header auth control — shows "Login" to guests and an avatar +
 *  "Dashboard" pill to signed-in users.  It asks /api/me who's logged in
 *  so the link points STRAIGHT at the right place (staff → /dashboard,
 *  members → /account) — no /account → /dashboard redirect hop — and
 *  live-updates on sign in / out.
 *
 *  Two visual variants keep the existing Navbar styling intact:
 *    desktop → the brand-blue chip in the top bar (hidden < sm)
 *    mobile  → the bordered button inside the slide-out menu. */

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogIn, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  variant: "desktop" | "mobile";
  loginHref: string;
  accountHref: string;
  loginLabel: string;
  accountLabel: string;
  onSelect?: () => void;
};

export default function AuthNavButton({
  variant,
  loginHref,
  accountHref,
  loginLabel,
  accountLabel,
  onSelect,
}: Props) {
  const [authed, setAuthed] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  // Where the pill links once we know the role.  Defaults to the account
  // entry (which still redirects correctly) until /api/me resolves.
  const [dest, setDest] = useState(accountHref);

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const data = await res.json();
        if (!active) return;
        setAuthed(!!data.authed);
        setAvatar(data.avatar ?? null);
        // Staff jump straight to /dashboard (single-locale); members go
        // to their localized account page.  Either way: no extra hop.
        setDest(data.authed && data.staff ? "/dashboard" : accountHref);
      } catch {
        /* network/misconfig — stay in the guest state */
      }
    };

    refresh();

    // Reflect sign in / out without a reload.
    let unsub: (() => void) | undefined;
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const supabase = createClient();
        const { data: sub } = supabase.auth.onAuthStateChange(() => refresh());
        unsub = () => sub.subscription.unsubscribe();
      } catch {
        /* Supabase misconfigured — guest state */
      }
    }

    return () => {
      active = false;
      unsub?.();
    };
  }, [accountHref]);

  // Logged in → an avatar + "Dashboard" pill linking straight to `dest`.
  if (authed) {
    const authedCls =
      variant === "desktop"
        ? "hidden sm:inline-flex items-center gap-2 rounded-xl border border-border bg-white py-1 pl-1 pr-3.5 text-sm font-semibold text-fg shadow-sm transition-all hover:border-brand-blue/50 hover:shadow-md"
        : "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white py-1.5 pl-1.5 pr-4 text-sm font-semibold text-fg transition-colors hover:border-brand-blue/50";
    return (
      <Link href={dest} onClick={onSelect} className={authedCls}>
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt=""
            className="h-7 w-7 rounded-full object-cover ring-1 ring-border"
          />
        ) : (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-brand-blue to-brand-red text-white shadow-sm">
            <UserRound className="h-4 w-4" />
          </span>
        )}
        <span>{accountLabel}</span>
      </Link>
    );
  }

  // Guest → the brand-blue "Login" chip.
  const guestCls =
    variant === "desktop"
      ? "hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark hover:scale-[1.02] transition-all"
      : "inline-flex items-center justify-center gap-1.5 rounded-xl bg-white border border-border px-4 py-3 text-sm font-semibold text-fg hover:border-brand-blue/50 transition-colors";

  return (
    <Link href={loginHref} onClick={onSelect} className={guestCls}>
      <LogIn className="h-4 w-4" />
      <span>{loginLabel}</span>
    </Link>
  );
}
