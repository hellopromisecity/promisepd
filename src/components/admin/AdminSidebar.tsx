"use client";

/** Admin sidebar — brand header + role-filtered nav with collapsible
 *  groups (Finance, Marketing, Insights).  Sticky on desktop, slide-in
 *  drawer on mobile. */

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { isGroup, type NavEntry } from "@/lib/admin-nav";
import { CURRENT_VERSION } from "@/lib/changelog";
import type { Member } from "@/lib/auth";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrator",
  manager: "Manager",
  staff: "Staff",
  member: "Member",
};

export default function AdminSidebar({
  nav,
  member,
  open,
  onClose,
}: {
  nav: NavEntry[];
  member: Member;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  // Only the single most-specific matching link is "active".  Collect
  // every leaf href, keep the longest one the current path matches
  // (exact, or a sub-path), so /admin/marketing/followup highlights only
  // "Client follow-up" — not the "/dashboard/marketing" overview as well.
  const activeHref = useMemo(() => {
    const hrefs: string[] = [];
    for (const e of nav) {
      if (isGroup(e)) e.children.forEach((c) => hrefs.push(c.href));
      else hrefs.push(e.href);
    }
    let best = "";
    for (const h of hrefs) {
      if ((pathname === h || pathname.startsWith(h + "/")) && h.length > best.length) {
        best = h;
      }
    }
    return best;
  }, [nav, pathname]);

  const isActive = (href: string) => href === activeHref;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-bg transition-transform lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-4">
        <Image src="/logo.png" alt="" width={32} height={32} className="rounded-lg" />
        <div className="leading-tight">
          <p className="text-sm font-bold text-fg">Promise City</p>
          <p className="text-[11px] text-fg-muted">{ROLE_LABEL[member.role]} panel</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="ml-auto rounded-lg p-1.5 text-fg-muted hover:bg-bg-soft lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {nav.map((entry) =>
            isGroup(entry) ? (
              <GroupItem key={entry.label} entry={entry} isActive={isActive} onNavigate={onClose} />
            ) : (
              <li key={entry.href}>
                <Link
                  href={entry.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive(entry.href)
                      ? "bg-brand-blue text-white shadow-[var(--shadow-brand)]"
                      : "text-fg-muted hover:bg-bg-soft hover:text-fg"
                  }`}
                >
                  <entry.icon className="h-[18px] w-[18px] shrink-0" />
                  {entry.label}
                </Link>
              </li>
            ),
          )}
        </ul>
      </nav>

      {/* Footer — fills the sidebar's empty tail + a quick link to what's new. */}
      <div className="border-t border-border px-3 py-3">
        <Link
          href="/dashboard/changelog"
          onClick={onClose}
          className="flex items-center justify-between rounded-xl px-3 py-2 text-[11px] font-medium text-fg-muted transition-colors hover:bg-bg-soft hover:text-fg"
        >
          <span>What&apos;s new</span>
          <span className="rounded-md bg-bg-soft px-2 py-0.5 font-bold text-fg">v{CURRENT_VERSION}</span>
        </Link>
      </div>
    </aside>
  );
}

function GroupItem({
  entry,
  isActive,
  onNavigate,
}: {
  entry: Extract<NavEntry, { children: unknown }>;
  isActive: (href: string) => boolean;
  onNavigate: () => void;
}) {
  const childActive = entry.children.some((c) => isActive(c.href));
  const [open, setOpen] = useState(childActive);

  return (
    <li>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
          childActive ? "text-fg" : "text-fg-muted hover:bg-bg-soft hover:text-fg"
        }`}
      >
        <entry.icon className="h-[18px] w-[18px] shrink-0" />
        {entry.label}
        <ChevronDown
          className={`ml-auto h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul className="mt-0.5 space-y-0.5 pl-4">
          {entry.children.map((c) => (
            <li key={c.href}>
              <Link
                href={c.href}
                onClick={onNavigate}
                className={`flex items-center gap-2.5 rounded-lg py-2 pl-4 pr-3 text-[13px] transition-colors ${
                  isActive(c.href)
                    ? "bg-brand-blue-tint font-semibold text-brand-blue-dark"
                    : "text-fg-muted hover:bg-bg-soft hover:text-fg"
                }`}
              >
                <c.icon className="h-4 w-4 shrink-0" />
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
