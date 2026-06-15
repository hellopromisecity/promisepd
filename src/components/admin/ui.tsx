/** Shared admin UI primitives.  Pure presentational (no hooks / no
 *  event handlers), so this is a "shared" module usable from both
 *  Server Components (section pages) and Client Components (forms).
 *  Keep it that way — interactive bits live in each section's own
 *  client components.  Brand Tailwind tokens keep every section
 *  visually consistent. */

import type { LucideIcon } from "lucide-react";

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const TONE: Record<Tone, string> = {
  neutral: "bg-bg-soft text-fg-muted",
  info: "bg-brand-blue-tint text-brand-blue-dark",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-brand-red-tint text-brand-red-dark",
};

/** Icon colours + soft gradient tints for the colourful StatCards. The gradient
 *  is applied inline (rgb) rather than via Tailwind gradient-stop utilities — in
 *  this Tailwind v4 setup some colour/opacity gradient stops don't get generated
 *  reliably, so an inline gradient guarantees the colour always shows. */
const TONE_FG: Record<Tone, string> = {
  neutral: "text-fg-muted",
  info: "text-brand-blue",
  success: "text-emerald-600",
  warning: "text-amber-600",
  danger: "text-brand-red-dark",
};
const TONE_RGB: Record<Tone, string> = {
  neutral: "100, 116, 139",
  info: "24, 71, 161", // brand blue
  success: "16, 185, 129", // emerald
  warning: "245, 158, 11", // amber
  danger: "225, 25, 36", // brand red
};
const toneGradient = (tone: Tone) =>
  `linear-gradient(135deg, rgba(${TONE_RGB[tone]}, 0.13), rgba(${TONE_RGB[tone]}, 0.04))`;

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-fg sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-fg-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
  pad = true,
}: {
  children: React.ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-bg ${pad ? "p-5" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "info",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div className="group rounded-2xl border border-border p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" style={{ backgroundImage: toneGradient(tone) }}>
      <span className={`grid h-9 w-9 place-items-center rounded-xl bg-bg/70 ${TONE_FG[tone]} transition-transform duration-300 group-hover:scale-110`}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <p className="mt-3 text-2xl font-extrabold tabular-nums text-fg">{value}</p>
      <p className="text-[13px] font-semibold text-fg">{label}</p>
      {sub && <p className="text-xs text-fg-muted">{sub}</p>}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
}: {
  icon: LucideIcon;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-bg px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-blue-tint text-brand-blue">
        <Icon className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-base font-bold text-fg">{title}</h2>
      {message && <p className="mt-1 max-w-sm text-sm text-fg-muted">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Table shell — caller supplies <thead>/<tbody>.  Scrolls on overflow. */
export function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-bg">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}

export const thCls = "border-b border-border px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-fg-faint";
export const tdCls = "border-b border-border/60 px-4 py-3 text-fg";
