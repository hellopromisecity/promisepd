"use client";

/** Admin sidebar — brand header + role-filtered nav with collapsible
 *  groups (Finance, Marketing, Insights).  Sticky on desktop, slide-in
 *  drawer on mobile.  Top-level items are drag-and-drop reorderable (grab
 *  the handle that appears on hover); the chosen order is remembered per
 *  browser in localStorage. */

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X, GripVertical } from "lucide-react";
import { isGroup, type NavEntry } from "@/lib/admin-nav";
import { CURRENT_VERSION } from "@/lib/changelog";
import type { Member } from "@/lib/auth";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrator",
  manager: "Manager",
  staff: "Staff",
  member: "Member",
};

const ORDER_KEY = "pc-nav-order";
const keyOf = (e: NavEntry) => (isGroup(e) ? `g:${e.label}` : `l:${e.href}`);

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

  // Only the single most-specific matching link is "active".
  const activeHref = useMemo(() => {
    const hrefs: string[] = [];
    for (const e of nav) {
      if (isGroup(e)) e.children.forEach((c) => hrefs.push(c.href));
      else hrefs.push(e.href);
    }
    let best = "";
    for (const h of hrefs) {
      if ((pathname === h || pathname.startsWith(h + "/")) && h.length > best.length) best = h;
    }
    return best;
  }, [nav, pathname]);
  const isActive = (href: string) => href === activeHref;

  // Reorderable copy of the nav. Starts in source order (so SSR + first
  // client render match), then re-applies the saved order after mount.
  const [items, setItems] = useState<NavEntry[]>(nav);
  const dragFrom = useRef<number | null>(null);

  useEffect(() => {
    let saved: string[] = [];
    try {
      saved = JSON.parse(localStorage.getItem(ORDER_KEY) || "[]");
    } catch {
      saved = [];
    }
    if (!saved.length) {
      setItems(nav);
      return;
    }
    const byKey = new Map(nav.map((e) => [keyOf(e), e] as const));
    const out: NavEntry[] = [];
    for (const k of saved) {
      const e = byKey.get(k);
      if (e) {
        out.push(e);
        byKey.delete(k);
      }
    }
    // New entries not yet in the saved order keep their natural position.
    for (const e of nav) if (byKey.has(keyOf(e))) out.push(e);
    setItems(out);
  }, [nav]);

  const onDragStart = (i: number) => (dragFrom.current = i);
  const onDragEnter = (i: number) => {
    const from = dragFrom.current;
    if (from === null || from === i) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(i, 0, moved);
      return next;
    });
    dragFrom.current = i;
  };
  const onDragEnd = () => {
    dragFrom.current = null;
    setItems((prev) => {
      try {
        localStorage.setItem(ORDER_KEY, JSON.stringify(prev.map(keyOf)));
      } catch {
        /* ignore */
      }
      return prev;
    });
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-bg transition-transform lg:static lg:z-auto lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex h-full flex-col lg:sticky lg:top-0 lg:h-screen">
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
            {items.map((entry, i) => (
              <li
                key={keyOf(entry)}
                onDragEnter={() => onDragEnter(i)}
                onDragOver={(e) => e.preventDefault()}
                className="group/nav relative flex items-center"
              >
                {/* Drag handle (appears on hover; only this is draggable, so
                    links still click normally) */}
                <span
                  draggable
                  onDragStart={() => onDragStart(i)}
                  onDragEnd={onDragEnd}
                  title="Drag to reorder"
                  className="grid h-7 w-4 shrink-0 cursor-grab place-items-center text-fg-faint opacity-0 transition-opacity group-hover/nav:opacity-70 active:cursor-grabbing"
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  {isGroup(entry) ? (
                    <GroupContent entry={entry} isActive={isActive} onNavigate={onClose} />
                  ) : (
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
                  )}
                </div>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
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
      </div>
    </aside>
  );
}

function GroupContent({
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
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
          childActive ? "text-fg" : "text-fg-muted hover:bg-bg-soft hover:text-fg"
        }`}
      >
        <entry.icon className="h-[18px] w-[18px] shrink-0" />
        {entry.label}
        <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
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
    </>
  );
}
