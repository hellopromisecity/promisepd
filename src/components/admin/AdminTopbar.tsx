"use client";

/** Admin topbar — mobile menu button, a search field, notifications and
 *  an avatar menu (view site / log out). */

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Search, Bell, ChevronDown, ExternalLink, LogOut, ArrowRight, ArrowUpRight, ArrowDownRight, ReceiptText } from "lucide-react";
import type { Member } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { latestTransactionsForBell, type BellTxn } from "@/app/actions/notifications";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "MS";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

const bellTaka = (n: number) => `৳${Math.round(Math.abs(Number(n) || 0)).toLocaleString("en-US")}`;
const bellDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "Asia/Dhaka" });

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

  // Notification bell — fetches the latest five transactions on open.
  const [bellOpen, setBellOpen] = useState(false);
  const [bellTxns, setBellTxns] = useState<BellTxn[] | null>(null);
  function toggleBell() {
    const opening = !bellOpen;
    setBellOpen(opening);
    if (opening) {
      setBellTxns(null); // fresh every open
      latestTransactionsForBell().then(setBellTxns).catch(() => setBellTxns([]));
    }
  }

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
        <div className="relative">
          <button
            aria-label="Notifications"
            onClick={toggleBell}
            className={`relative rounded-lg p-2 transition-colors ${bellOpen ? "bg-brand-blue-tint text-brand-blue" : "text-fg-muted hover:bg-bg-soft"}`}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand-red" />
          </button>

          {bellOpen && (
            <>
              <button
                aria-hidden
                tabIndex={-1}
                onClick={() => setBellOpen(false)}
                className="fixed inset-0 z-10 cursor-default"
              />
              <div className="absolute right-0 z-20 mt-2 w-[340px] overflow-hidden rounded-xl border border-border bg-bg shadow-lg">
                <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                  <ReceiptText className="h-4 w-4 text-brand-blue" />
                  <p className="text-sm font-bold text-fg">Latest transactions</p>
                </div>
                {bellTxns === null ? (
                  <p className="px-4 py-6 text-center text-sm text-fg-muted">Loading…</p>
                ) : bellTxns.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-fg-muted">No transactions yet.</p>
                ) : (
                  <ul>
                    {bellTxns.map((t) => {
                      const out = t.operator === "-";
                      return (
                        <li key={t.id} className="flex items-center gap-3 border-b border-border/60 px-4 py-2.5">
                          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${out ? "bg-brand-red-tint text-brand-red" : "bg-emerald-500/15 text-emerald-600"}`}>
                            {out ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-fg">{t.name}</p>
                            <p className="truncate text-[11px] text-fg-muted">{t.type} · {bellDate(t.date)}</p>
                          </div>
                          <span className={`shrink-0 text-sm font-bold tabular-nums ${out ? "text-brand-red-dark" : "text-emerald-600"}`}>
                            {out ? "−" : "+"}{bellTaka(t.amount)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <Link
                  href="/dashboard/transactionify"
                  onClick={() => setBellOpen(false)}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-semibold text-brand-blue transition-colors hover:bg-brand-blue-tint"
                >
                  See all transactions <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 hover:bg-bg-soft"
          >
            {member.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.avatarUrl}
                alt={member.name}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-blue text-xs font-bold text-white">
                {initials(member.name)}
              </span>
            )}
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
