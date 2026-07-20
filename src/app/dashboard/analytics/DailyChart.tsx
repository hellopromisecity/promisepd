"use client";

/** Daily active users bars with a live hover tooltip — hover any day to see
 *  the exact date and how many users came that day. */

import { useState } from "react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** GA4 dates arrive as "YYYYMMDD" → "18 Jul 2026". */
function niceDate(d: string): string {
  if (!/^\d{8}$/.test(d)) return d;
  return `${parseInt(d.slice(6, 8), 10)} ${MONTHS[parseInt(d.slice(4, 6), 10) - 1]} ${d.slice(0, 4)}`;
}

export default function DailyChart({ daily }: { daily: { date: string; users: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 760, H = 150, pad = 6;
  const maxDaily = Math.max(1, ...daily.map((d) => d.users));
  const bw = daily.length ? (W - pad * 2) / daily.length : 0;
  const sel = hover != null ? daily[hover] : null;
  // tooltip anchors to the bar's centre as a % of the chart width, clamped so
  // it never spills past the card edges on the first/last bars
  const cx = hover != null ? Math.min(92, Math.max(8, ((pad + hover * bw + bw / 2) / W) * 100)) : 0;

  return (
    <div className="relative">
      {sel && (
        <div className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-fg px-2.5 py-1.5 text-center shadow-lg" style={{ left: `${cx}%` }}>
          <p className="text-[11px] font-bold leading-tight text-bg">{sel.users.toLocaleString("en-US")} users</p>
          <p className="text-[10px] leading-tight text-bg/70">{niceDate(sel.date)}</p>
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[150px] w-full" preserveAspectRatio="none" role="img" aria-label="Daily active users" onMouseLeave={() => setHover(null)}>
        {daily.map((d, i) => {
          const h = (d.users / maxDaily) * (H - pad * 2);
          return (
            <g key={i} onMouseEnter={() => setHover(i)}>
              {/* full-height invisible hit area so thin bars are easy to hover */}
              <rect x={pad + i * bw} y={0} width={bw} height={H} fill="transparent" />
              <rect x={pad + i * bw + bw * 0.12} y={H - pad - h} width={bw * 0.76} height={Math.max(1, h)} rx="2" fill="#1847A1" opacity={hover === i ? 1 : 0.85}>
                <title>{`${niceDate(d.date)} — ${d.users.toLocaleString("en-US")} users`}</title>
              </rect>
            </g>
          );
        })}
      </svg>
      {sel && <p className="mt-1 text-center text-[11px] font-medium text-fg-muted">{niceDate(sel.date)} · {sel.users.toLocaleString("en-US")} active users</p>}
    </div>
  );
}
