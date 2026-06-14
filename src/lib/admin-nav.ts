/** Admin dashboard navigation — single source of truth for the sidebar.
 *
 *  Each entry carries the minimum role that may see it.  Groups (Finance,
 *  Marketing, Insights) are shown when the viewer can see at least one
 *  child.  filterNav(role) returns only what the given role may open. */

import {
  LayoutDashboard,
  BarChart3,
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
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, min: "staff" },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3, min: "admin" },
  { label: "Staff", href: "/dashboard/staff", icon: Users, min: "manager" },
  { label: "Attendance", href: "/dashboard/attendance", icon: CalendarCheck, min: "staff" },
  {
    label: "Finance",
    icon: Wallet,
    children: [
      { label: "Overview", href: "/dashboard/finance", icon: ChartPie, min: "admin" },
      { label: "Bank & cash", href: "/dashboard/finance/bank", icon: Building2, min: "admin" },
    ],
  },
  { label: "Blog", href: "/dashboard/blog", icon: Newspaper, min: "manager" },
  { label: "Projects", href: "/dashboard/projects", icon: Building, min: "manager" },
  { label: "Income", href: "/dashboard/income", icon: TrendingUp, min: "admin" },
  { label: "Expenses", href: "/dashboard/expenses", icon: TrendingDown, min: "manager" },
  {
    label: "Marketing",
    icon: Megaphone,
    children: [
      { label: "Overview", href: "/dashboard/marketing", icon: ChartPie, min: "manager" },
      { label: "Client follow-up", href: "/dashboard/marketing/followup", icon: UserCheck, min: "staff" },
    ],
  },
  {
    label: "Insights",
    icon: Lightbulb,
    children: [
      { label: "Message box", href: "/dashboard/insights/messages", icon: MessageSquare, min: "staff" },
      { label: "Audit log", href: "/dashboard/insights/audit", icon: History, min: "admin" },
    ],
  },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, min: "staff" },
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
