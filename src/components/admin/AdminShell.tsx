"use client";

/** Frame for the whole /admin dashboard: a sticky sidebar + topbar with
 *  the routed page in the middle.  Role-filters the nav from the member's
 *  role and manages the mobile drawer. */

import { useMemo, useState } from "react";
import type { Member } from "@/lib/auth";
import { filterNav, isGroup, MY_PROJECTS_LEAF } from "@/lib/admin-nav";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

export default function AdminShell({
  member,
  showMyProjects = false,
  children,
}: {
  member: Member;
  showMyProjects?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const nav = useMemo(() => {
    const base = filterNav(member.role);
    if (!showMyProjects) return base;
    // Slot "My Projects" right after "Report".
    const i = base.findIndex((e) => !isGroup(e) && e.href === "/dashboard/report");
    return i >= 0 ? [...base.slice(0, i + 1), MY_PROJECTS_LEAF, ...base.slice(i + 1)] : [...base, MY_PROJECTS_LEAF];
  }, [member.role, showMyProjects]);

  return (
    <div className="min-h-screen bg-bg-soft text-fg">
      {/* Mobile drawer backdrop */}
      {open && (
        <button
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <div className="lg:flex">
        <AdminSidebar
          nav={nav}
          member={member}
          open={open}
          onClose={() => setOpen(false)}
        />

        <div className="flex min-h-screen flex-1 flex-col min-w-0">
          <AdminTopbar member={member} onMenu={() => setOpen(true)} />
          <main className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
          {/* Universal footer — on every dashboard section. */}
          <footer className="border-t border-border px-4 py-4 text-center text-[11px] text-fg-muted sm:px-6">
            © 2026 Promise Proper Development · Design &amp; Developed by{" "}
            <a
              href="https://growthency.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-blue hover:underline"
            >
              Mustaqeem
            </a>
          </footer>
        </div>
      </div>
    </div>
  );
}
