"use client";

/** Header auth control — shows "Login" to guests and "Account" (→
 *  /account) to logged-in members.  Detects the session client-side via
 *  the browser Supabase client and live-updates on sign in / out.
 *
 *  Two visual variants keep the existing Navbar styling intact:
 *    desktop → the brand-blue chip in the top bar (hidden < sm)
 *    mobile  → the bordered button inside the slide-out menu. */

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogIn, UserCircle } from "lucide-react";
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

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    let active = true;
    let unsub: (() => void) | undefined;
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (active) setAuthed(!!data.user);
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (active) setAuthed(!!session?.user);
      });
      unsub = () => sub.subscription.unsubscribe();
    } catch {
      /* Supabase misconfigured — stay in the guest (login) state. */
    }
    return () => {
      active = false;
      unsub?.();
    };
  }, []);

  const href = authed ? accountHref : loginHref;
  const label = authed ? accountLabel : loginLabel;
  const Icon = authed ? UserCircle : LogIn;

  const cls =
    variant === "desktop"
      ? "hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark hover:scale-[1.02] transition-all"
      : "inline-flex items-center justify-center gap-1.5 rounded-xl bg-white border border-border px-4 py-3 text-sm font-semibold text-fg hover:border-brand-blue/50 transition-colors";

  return (
    <Link href={href} onClick={onSelect} className={cls}>
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}
