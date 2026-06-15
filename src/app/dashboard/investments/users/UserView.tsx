"use client";

import { useMemo, useState } from "react";
import { Eye, X, Phone, Mail, Calendar, Clock, Globe, Hash, Briefcase, Receipt } from "lucide-react";
import { taka, fmtDate, fmtDateTime, localPhone, initial, avatarTint, type AppUser } from "./shared";

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-0">
      <span className="flex items-center gap-2 text-xs font-medium text-fg-muted">
        <Icon className="h-3.5 w-3.5 text-fg-faint" /> {label}
      </span>
      <span className="truncate text-right text-sm font-semibold text-fg">{value}</span>
    </div>
  );
}

export default function UserView({ user }: { user: AppUser }) {
  const [open, setOpen] = useState(false);
  const tint = avatarTint(user.uid);
  const projectCount = useMemo(() => new Set(user.txns.filter((t) => t.project_id).map((t) => t.project_id)).size, [user.txns]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="View details"
        className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-bg text-fg-muted transition-all hover:-translate-y-0.5 hover:border-brand-blue/40 hover:text-brand-blue hover:shadow-sm"
      >
        <Eye className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-2xl animate-[pop_.18s_ease-out] overflow-y-auto rounded-2xl border border-border bg-bg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* header */}
            <div className="flex items-start justify-between gap-3 border-b border-border bg-bg-soft/50 p-5">
              <div className="flex items-center gap-3">
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-lg font-bold ${tint.bg} ${tint.fg}`}>{initial(user.full_name)}</span>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-fg">{user.full_name || "Unnamed"}</h2>
                  <p className="font-mono text-xs text-fg-muted">
                    {user.uid}{user.fid ? <span className="text-fg-faint"> · FID {user.fid}</span> : null}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${user.is_active ? "bg-emerald-500/15 text-emerald-600" : "bg-fg-faint/15 text-fg-muted"}`}>{user.is_active ? "Active" : "Inactive"}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${user.is_verified ? "bg-brand-blue-tint text-brand-blue" : "bg-amber-500/15 text-amber-600"}`}>{user.is_verified ? "Verified" : "Unverified"}</span>
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-fg-muted transition-colors hover:bg-bg-soft hover:text-fg" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2">
              {/* balance hero */}
              <div className="sm:col-span-2 rounded-2xl border border-border bg-gradient-to-br from-brand-blue/5 to-emerald-500/5 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">Current Balance</p>
                <p className={`mt-0.5 text-3xl font-extrabold tabular-nums ${user.balance < 0 ? "text-brand-red-dark" : "text-fg"}`}>{taka(user.balance)}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-bg/70 p-2">
                    <p className="text-[10px] uppercase tracking-wide text-fg-faint">Invested</p>
                    <p className="text-sm font-bold tabular-nums text-fg">{taka(user.invested)}</p>
                  </div>
                  <div className="rounded-xl bg-bg/70 p-2">
                    <p className="text-[10px] uppercase tracking-wide text-fg-faint">Profit</p>
                    <p className="text-sm font-bold tabular-nums text-emerald-600">{taka(user.profit)}</p>
                  </div>
                  <div className="rounded-xl bg-bg/70 p-2">
                    <p className="text-[10px] uppercase tracking-wide text-fg-faint">Withdrawn</p>
                    <p className="text-sm font-bold tabular-nums text-brand-red-dark">{taka(user.withdrawn)}</p>
                  </div>
                </div>
              </div>

              {/* user info */}
              <div className="rounded-2xl border border-border bg-bg p-4">
                <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-fg-muted">User information</h3>
                <Row icon={Phone} label="Phone" value={localPhone(user.phone_number)} />
                <Row icon={Mail} label="Email" value={user.email || "—"} />
                <Row icon={Hash} label="File ID" value={user.fid || "—"} />
                <Row icon={Globe} label="Language" value={user.language === "en" ? "English" : "বাংলা"} />
              </div>

              {/* activity */}
              <div className="rounded-2xl border border-border bg-bg p-4">
                <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-fg-muted">Activity</h3>
                <Row icon={Calendar} label="Joined" value={fmtDate(user.created_at)} />
                <Row icon={Clock} label="Last login" value={user.last_login ? fmtDateTime(user.last_login) : "Never"} />
                <Row icon={Briefcase} label="Projects" value={projectCount} />
                <Row icon={Receipt} label="Transactions" value={user.txns.length} />
              </div>
            </div>

            <div className="flex justify-end border-t border-border p-4">
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-brand-blue/40">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
