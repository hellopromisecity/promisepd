"use client";

/** Admin topbar — mobile menu button, a search field, notifications and
 *  an avatar menu (view site / log out). */

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Search, Bell, ChevronDown, ExternalLink, LogOut } from "lucide-react";
import type { Member } from "@/lib/auth";
import { logout } from "@/app/actions/auth";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "MS";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function AdminTopbar({
  member,
  onMenu,
}: {
  member: Member;
  onMenu: () => void;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onLogout() {
    startTransition(async () => {
      await logout();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-bg/80 px-4 backdrop-blur sm:px-6">
      <button
        onClick={onMenu}
        aria-label="Open menu"
        className="rounded-lg p-2 text-fg-muted hover:bg-bg-soft lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden max-w-sm flex-1 items-center gap-2 rounded-xl border border-border bg-bg-soft px-3 py-2 text-fg-muted sm:flex">
        <Search className="h-4 w-4 shrink-0" />
        <input
          type="search"
          placeholder="Search projects, clients, staff…"
          className="w-full bg-transparent text-sm text-fg placeholder:text-fg-faint outline-none"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-fg-muted hover:bg-bg-soft"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand-red" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 hover:bg-bg-soft"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-blue text-xs font-bold text-white">
              {initials(member.name)}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-semibold leading-tight text-fg">
                {member.name.split(/\s+/)[0] || "Admin"}
              </span>
              <span className="block text-[11px] capitalize leading-tight text-fg-muted">
                {member.role}
              </span>
            </span>
            <ChevronDown className="hidden h-4 w-4 text-fg-muted sm:block" />
          </button>

          {menuOpen && (
            <>
              <button
                aria-hidden
                tabIndex={-1}
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-10 cursor-default"
              />
              <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-bg shadow-lg">
                <div className="border-b border-border px-4 py-3">
                  <p className="truncate text-sm font-semibold text-fg">{member.name}</p>
                  <p className="truncate text-xs text-fg-muted">
                    {member.username ? `@${member.username}` : member.mobile}
                  </p>
                </div>
                <Link
                  href="/"
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-fg-muted hover:bg-bg-soft hover:text-fg"
                >
                  <ExternalLink className="h-4 w-4" />
                  View website
                </Link>
                <button
                  onClick={onLogout}
                  disabled={pending}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-brand-red hover:bg-brand-red-tint disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" />
                  {pending ? "Logging out…" : "Log out"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
