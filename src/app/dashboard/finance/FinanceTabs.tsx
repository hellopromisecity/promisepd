import Link from "next/link";
import { LayoutDashboard, Landmark, TrendingUp, TrendingDown } from "lucide-react";

const TABS = [
  { key: "overview", label: "Overview", href: "/dashboard/finance", icon: LayoutDashboard },
  { key: "bank", label: "Bank & Cash", href: "/dashboard/finance/bank", icon: Landmark },
  { key: "income", label: "Income", href: "/dashboard/finance/income", icon: TrendingUp },
  { key: "expense", label: "Expense", href: "/dashboard/finance/expense", icon: TrendingDown },
] as const;

/** The four Finance sections as a pill switcher (mirrors the sidebar group). */
export default function FinanceTabs({ active }: { active: (typeof TABS)[number]["key"] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-bg-soft p-1">
      {TABS.map((t) => (
        <Link key={t.key} href={t.href} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${active === t.key ? "bg-bg text-brand-blue shadow-sm" : "text-fg-muted hover:text-fg"}`}>
          <t.icon className="h-3.5 w-3.5" /> {t.label}
        </Link>
      ))}
    </nav>
  );
}
