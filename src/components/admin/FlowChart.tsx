"use client";

/** Interactive money-flow chart shared by the Dashboard (Capital flow) and
 *  every project page (Monthly flow): In as a filled area + line, Out as a
 *  line, hover tooltip with In / Out / Net for the bucket under the cursor.
 *  Pure SVG, no chart library. */

import { useRef, useState } from "react";
import { Activity, Download } from "lucide-react";
import type { FlowBar } from "./flow";

export type { FlowBar };

export const compactTaka = (n: number) => {
  const v = Number(n) || 0, a = Math.abs(v);
  if (a >= 1e7) return `৳${(v / 1e7).toFixed(2)} Cr`;
  if (a >= 1e5) return `৳${(v / 1e5).toFixed(2)} L`;
  return `৳${Math.round(v).toLocaleString("en-US")}`;
};

export default function FlowChart({ flow, on, title = "Capital flow", subtitle, count, onExport, headerExtra, gradientId = "flowIn", height = 230 }: {
  flow: FlowBar[];
  on: boolean;
  title?: string;
  subtitle: string;
  count?: number;
  onExport?: () => void;
  /** Extra control in the header (e.g. a date-range filter), before the CSV button. */
  headerExtra?: React.ReactNode;
  /** Unique per chart when two charts share a page (SVG gradient ids are global). */
  gradientId?: string;
  height?: number;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const W = 1000, H = height, padL = 10, padR = 10, padT = 18, padB = 30;
  const n = Math.max(1, flow.length);
  const stepX = n > 1 ? (W - padL - padR) / (n - 1) : 0;
  const maxV = Math.max(1, ...flow.map((f) => Math.max(f.in, f.out)));
  const x = (i: number) => padL + i * stepX;
  const y = (v: number) => H - padB - (v / maxV) * (H - padT - padB);
  const line = (key: "in" | "out") => flow.map((f, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(f[key]).toFixed(1)}`).join(" ");
  const inArea = `${line("in")} L ${x(n - 1).toFixed(1)} ${(H - padB).toFixed(1)} L ${x(0).toFixed(1)} ${(H - padB).toFixed(1)} Z`;

  const totIn = flow.reduce((s, f) => s + f.in, 0);
  const totOut = flow.reduce((s, f) => s + f.out, 0);

  function onMove(e: React.MouseEvent) {
    const svg = ref.current; if (!svg) return;
    const r = svg.getBoundingClientRect();
    const vx = ((e.clientX - r.left) / r.width) * W;
    const idx = Math.round((vx - padL) / (stepX || 1));
    setHover(Math.max(0, Math.min(n - 1, idx)));
  }

  const h = hover !== null && flow[hover] ? flow[hover] : null;
  const net = h ? h.in - h.out : 0;

  return (
    <div className="rounded-2xl border border-border bg-bg p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-fg"><Activity className="h-4 w-4 text-brand-blue" /> {title}</h2>
          <p className="text-xs text-fg-muted">money in vs out · {subtitle}{count != null && ` · ${count.toLocaleString("en-US")} txns`}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> In {compactTaka(totIn)}</span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-brand-red"><span className="h-2.5 w-2.5 rounded-full bg-brand-red" /> Out {compactTaka(totOut)}</span>
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-600">Net {compactTaka(totIn - totOut)}</span>
          {headerExtra}
          {onExport && (
            <button type="button" onClick={onExport} title="Export this period (CSV)" className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 font-semibold text-fg-muted transition-colors hover:border-emerald-500/40 hover:text-emerald-600">
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
          )}
        </div>
      </div>

      {flow.length === 0 ? (
        <p className="py-10 text-center text-sm text-fg-muted">No dated transactions yet.</p>
      ) : (
        <div className="relative">
          {/* preserveAspectRatio="none" stretches the plot across the full card
              width — the default (meet) centred it with blank gutters on both
              sides while the label row spanned the whole width. */}
          <svg ref={ref} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height: H }} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1847A1" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#1847A1" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={inArea} fill={`url(#${gradientId})`} style={{ opacity: on ? 1 : 0, transition: "opacity .8s ease" }} />
            {/* opacity fade-in, NOT the dasharray draw-on trick — pathLength
                normalisation breaks under non-scaling-stroke on a stretched
                viewBox and left the last months of the line invisible */}
            <path d={line("in")} fill="none" stroke="#1847A1" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"
              style={{ opacity: on ? 1 : 0, transition: "opacity 1.1s ease" }} />
            <path d={line("out")} fill="none" stroke="#E11924" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" strokeOpacity="0.85" vectorEffect="non-scaling-stroke"
              style={{ opacity: on ? 1 : 0, transition: "opacity 1.3s ease" }} />
            {hover !== null && h && (
              <g>
                <line x1={x(hover)} y1={padT - 6} x2={x(hover)} y2={H - padB} stroke="var(--color-border-strong)" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
                <circle cx={x(hover)} cy={y(h.in)} r="4" fill="#1847A1" stroke="#fff" strokeWidth="1.5" />
                <circle cx={x(hover)} cy={y(h.out)} r="4" fill="#E11924" stroke="#fff" strokeWidth="1.5" />
              </g>
            )}
          </svg>

          {hover !== null && h && (
            <div className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[11px] shadow-lg"
              style={{ left: `${(x(hover) / W) * 100}%` }}>
              <p className="font-bold text-fg">{h.label}</p>
              <p className="text-emerald-600">In {compactTaka(h.in)}</p>
              <p className="text-brand-red">Out {compactTaka(h.out)}</p>
              <p className={`border-t border-border pt-0.5 font-semibold ${net < 0 ? "text-brand-red" : "text-fg"}`}>Net {compactTaka(net)}</p>
            </div>
          )}

          <div className="mt-1 flex justify-between px-1 text-[10px] text-fg-faint">
            {flow.map((f, i) => <span key={i} className={hover === i ? "font-bold text-fg" : ""}>{f.label}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}
