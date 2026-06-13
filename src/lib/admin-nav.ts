/** Admin dashboard navigation — single source of truth for the sidebar.
 *
 *  Each entry carries the minimum role that may see it.  Groups (Finance,
 *  Marketing, Insights) are shown when the viewer can see at least one
 *  child.  filterNav(role) returns only what the given role may open. */

import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Wallet,
  ChartPie,
  Building2,
  Newspaper,
  Building,
  TrendingUp,
  TrendingDown,
  Megaphone,
  UserCheck,
  Lightbulb,
  MessageSquare,
  History,
  Settings,
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

/** Full nav, in display order (mirrors the agreed dashboard sections). */
export const ADMIN_NAV: NavEntry[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, min: "staff" },
  { label: "Staff", href: "/admin/staff", icon: Users, min: "manager" },
  { label: "Attendance", href: "/admin/attendance", icon: CalendarCheck, min: "staff" },
  {
    label: "Finance",
    icon: Wallet,
    children: [
      { label: "Overview", href: "/admin/finance", icon: ChartPie, min: "admin" },
      { label: "Bank & cash", href: "/admin/finance/bank", icon: Building2, min: "admin" },
    ],
  },
  { label: "Blog", href: "/admin/blog", icon: Newspaper, min: "manager" },
  { label: "Projects", href: "/admin/projects", icon: Building, min: "manager" },
  { label: "Income", href: "/admin/income", icon: TrendingUp, min: "admin" },
  { label: "Expenses", href: "/admin/expenses", icon: TrendingDown, min: "manager" },
  {
    label: "Marketing",
    icon: Megaphone,
    children: [
      { label: "Overview", href: "/admin/marketing", icon: ChartPie, min: "manager" },
      { label: "Client follow-up", href: "/admin/marketing/followup", icon: UserCheck, min: "staff" },
    ],
  },
  {
    label: "Insights",
    icon: Lightbulb,
    children: [
      { label: "Message box", href: "/admin/insights/messages", icon: MessageSquare, min: "staff" },
      { label: "Audit log", href: "/admin/insights/audit", icon: History, min: "admin" },
    ],
  },
  { label: "Settings", href: "/admin/settings", icon: Settings, min: "staff" },
];

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
