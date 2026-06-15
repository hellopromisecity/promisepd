"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Briefcase, PlayCircle, Target, Wallet, Users, ArrowRight } from "lucide-react";
import { taka, compact, statusTone, type ProjectCardData } from "./shared";
import ProjectForm from "./ProjectForm";

type SortKey = "raised" | "goal" | "progress" | "investors" | "name";

export default function ProjectsExplorer({ projects }: { projects: ProjectCardData[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("raised");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 40); return () => clearTimeout(t); }, []);

  const statuses = useMemo(() => [...new Set(projects.map((p) => p.status).filter(Boolean))], [projects]);

  const stats = useMemo(() => {
    let ongoing = 0, goal = 0, raised = 0, investors = 0;
    for (const p of projects) {
      if (p.status.toLowerCase().includes("ongoing") || p.status.toLowerCase().includes("active")) ongoing++;
      goal += p.goal || 0; raised += p.raised; investors += p.investors;
    }
    return { total: projects.length, ongoing, goal, raised, investors };
  }, [projects]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const arr = projects.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (!needle) return true;
      return p.project_name.toLowerCase().includes(needle) || p.project_id.toLowerCase().includes(needle) || (p.address ?? "").toLowerCase().includes(needle);
    });
    arr.sort((a, b) => {
      if (sortKey === "name") return a.project_name.localeCompare(b.project_name);
      if (sortKey === "goal") return (b.goal || 0) - (a.goal || 0);
      if (sortKey === "progress") return b.progress - a.progress;
      if (sortKey === "investors") return b.investors - a.investors;
      return b.raised - a.raised;
    });
    return arr;
  }, [projects, q, status, sortKey]);

  const tones: Record<string, string> = {
    blue: "from-brand-blue/10 to-brand-blue/5 text-brand-blue",
    emerald: "from-emerald-500/10 to-emerald-500/5 text-emerald-600",
    amber: "from-amber-500/10 to-amber-500/5 text-amber-600",
    violet: "from-violet-500/10 to-violet-500/5 text-violet-600",
  };
  function Stat({ i, label, value, sub, icon: Icon, tone }: { i: number; label: string; value: string; sub: string; icon: React.ComponentType<{ className?: string }>; tone: string }) {
    return (
      <div style={{ transitionDelay: `${i * 50}ms` }} className={`rounded-2xl border border-border bg-gradient-to-br ${tones[tone]} p-4 transition-all duration-500 ${mounted ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">{label}</span>
          <Icon className="h-4 w-4" />
        </div>
        <p className="mt-1.5 text-2xl font-extrabold tabular-nums text-fg">{value}</p>
        <p className="text-xs text-fg-muted">{sub}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat i={0} label="Projects" value={String(stats.total)} sub={`${stats.ongoing} ongoing`} icon={Briefcase} tone="blue" />
        <Stat i={1} label="Total goal" value={compact(stats.goal)} sub="target across all" icon={Target} tone="amber" />
        <Stat i={2} label="Total raised" value={compact(stats.raised)} sub="paid in so far" icon={Wallet} tone="emerald" />
        <Stat i={3} label="Memberships" value={String(stats.investors)} sub="investor slots" icon={Users} tone="violet" />
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects by name, ID, address…" className="w-full rounded-xl border border-border bg-bg py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-brand-blue/50" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-medium text-fg outline-none focus:border-brand-blue/50">
          <option value="all">All statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-medium text-fg outline-none focus:border-brand-blue/50">
          <option value="raised">Most raised</option>
          <option value="goal">Biggest goal</option>
          <option value="progress">Progress</option>
          <option value="investors">Most investors</option>
          <option value="name">Name (A–Z)</option>
        </select>
        <ProjectForm />
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-border bg-bg p-12 text-center text-sm text-fg-muted">No projects match your search.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((p, idx) => {
            const tone = statusTone(p.status);
            const pct = Math.max(0, Math.min(100, p.progress));
            return (
              <Link
                key={p.project_id}
                href={`/dashboard/investments/projects/${p.project_id}`}
                style={{ transitionDelay: `${Math.min(idx, 12) * 40}ms` }}
                className={`group block rounded-2xl border border-border bg-bg p-5 transition-all duration-500 hover:-translate-y-1 hover:border-brand-blue/40 hover:shadow-lg ${mounted ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-fg transition-colors group-hover:text-brand-blue">{p.project_name}</h3>
                    <p className="font-mono text-xs text-fg-faint">{p.project_id}</p>
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${tone.bg} ${tone.fg}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} /> {p.status}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-fg-muted">Progress</span>
                    <span className="font-bold tabular-nums text-fg">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-bg-soft">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-blue/60 transition-[width] duration-700" style={{ width: mounted ? `${pct}%` : "0%" }} />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/70 pt-3 text-center">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-fg-faint">Goal</p>
                    <p className="text-sm font-bold tabular-nums text-fg">{p.hide_total ? "—" : compact(p.goal || 0)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-fg-faint">Raised</p>
                    <p className="text-sm font-bold tabular-nums text-emerald-600">{compact(p.raised)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-fg-faint">Investors</p>
                    <p className="text-sm font-bold tabular-nums text-fg">{p.investors}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-end gap-1 text-xs font-semibold text-brand-blue opacity-0 transition-opacity group-hover:opacity-100">
                  Manage <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
