/** Admin dashboard navigation — single source of truth for the sidebar.
 *
 *  Each entry carries the minimum role that may see it.  A group is shown
 *  when the viewer can see at least one child.  filterNav(role) returns
 *  only what the given role may open. */

import {
  LayoutDashboard,
  ReceiptText,
  Archive,
  HandCoins,
  BarChart3,
  Users,
  CalendarCheck,
  Wallet,
  Newspaper,
  Building,
  Megaphone,
  UserCheck,
  MessageSquare,
  Send,
  History,
  Settings,
  Rocket,
  KeyRound,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/auth";

const RANK: Record<Role, number> = { member: 0, staff: 1, manager: 2, admin: 3 };
const meets = (role: Role, min: Role) => RANK[role] >= RANK[min];

export type NavLeaf = { label: string; href: string; icon: LucideIcon; min: Role };
export type NavGroup = {
  label: string;
  icon: LucideIcon;
  children: NavLeaf[];
};
export type NavEntry = NavLeaf | NavGroup;

export const isGroup = (e: NavEntry): e is NavGroup => "children" in e;

/** Full nav, in display order (mirrors the agreed dashboard sections).
 *
 *  Access rules (set with the user 2026-07-15):
 *   • Staff see ONLY "Report" (+ "My Projects", injected at render time when
 *     they have a linked investor account). Everything else is manager+.
 *   • Manager = admin, minus "Vault" (admin-only).                        */
export const ADMIN_NAV: NavEntry[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, min: "manager" },
  // Transactionify — every transaction on the platform, one explorer.
  // (The legacy Investments group was removed from the sidebar 2026-07-29 at
  // the user's request; its routes stay alive for deep links.)
  { label: "Transactionify", href: "/dashboard/transactionify", icon: ReceiptText, min: "manager" },
  // Profitify — the deposit schemes' profit-payout history (yearly + lifetime).
  { label: "Profitify", href: "/dashboard/profitify", icon: HandCoins, min: "manager" },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3, min: "manager" },
  { label: "Staff", href: "/dashboard/staff", icon: Users, min: "manager" },
  { label: "Attendance", href: "/dashboard/attendance", icon: CalendarCheck, min: "manager" },
  // Finance / Income / Expenses removed from the sidebar 2026-07-29 (user's
  // request) — routes stay alive for direct links.
  { label: "Blog", href: "/dashboard/blog", icon: Newspaper, min: "manager" },
  { label: "Projectify", href: "/dashboard/projects", icon: Building, min: "manager" },
  // Marketing split into two top-level items 2026-07-29 (was one group).
  { label: "Marketing", href: "/dashboard/marketing", icon: Megaphone, min: "manager" },
  { label: "Client follow-up", href: "/dashboard/marketing/followup", icon: UserCheck, min: "manager" },
  // Report — daily work reports. The one section every staff member gets.
  { label: "Report", href: "/dashboard/report", icon: MessageSquare, min: "staff" },
  // My Projects — injected in AdminShell only when the viewer has a linked
  // investor account (MY_PROJECTS_LEAF below).
  { label: "Vault", href: "/dashboard/vault", icon: KeyRound, min: "admin" },
  { label: "SMS", href: "/dashboard/sms", icon: Send, min: "manager" },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, min: "manager" },
  { label: "Audit log", href: "/dashboard/insights/audit", icon: History, min: "manager" },
  // Archivify — the 30-day recycle bin: deleted users, holdings & transactions.
  { label: "Archivify", href: "/dashboard/archive", icon: Archive, min: "manager" },
  { label: "Changelog", href: "/dashboard/changelog", icon: Rocket, min: "manager" },
];

/** "My Projects" — the investor-portal view for a staff/manager who is also
 *  a customer. Injected into the nav (after Report) only when the viewer has
 *  a linked investor account. Everyone (staff+) may see their own. */
export const MY_PROJECTS_LEAF: NavLeaf = {
  label: "My Projects", href: "/dashboard/my-projects", icon: Wallet, min: "staff",
};

/** Return only the entries (and child leaves) visible to `role`. */
export function filterNav(role: Role): NavEntry[] {
  const out: NavEntry[] = [];
  for (const entry of ADMIN_NAV) {
    if (isGroup(entry)) {
      const kids = entry.children.filter((c) => meets(role, c.min));
      if (kids.length) out.push({ ...entry, children: kids });
    } else if (meets(role, entry.min)) {
      out.push(entry);
    }
  }
  return out;
}
