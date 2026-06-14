"use client";

/** Frame for the whole /admin dashboard: a sticky sidebar + topbar with
 *  the routed page in the middle.  Role-filters the nav from the member's
 *  role and manages the mobile drawer. */

import { useState } from "react";
import type { Member } from "@/lib/auth";
import { filterNav } from "@/lib/admin-nav";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

export default function AdminShell({
  member,
  children,
}: {
  member: Member;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const nav = filterNav(member.role);

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
