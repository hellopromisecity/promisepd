"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Search, X, Loader2, Pencil, UserMinus, Check } from "lucide-react";
import { addInvestorToProject, updateProjectInvestor, removeInvestorFromProject, type ProjectInvestorInput } from "@/app/actions/admin-investments";
import { taka, fmtDate, dateInput, localPhone, initial, avatarTint, type ProjectMemberRow, type InvestorOpt } from "./shared";

const inputCls = "w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand-blue/50";
const labelCls = "mb-1 block text-xs font-semibold text-fg-muted";

export default function ProjectInvestors({
  projectId, members, allInvestors,
}: { projectId: string; members: ProjectMemberRow[]; allInvestors: InvestorOpt[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // add-investor combobox
  const memberUids = useMemo(() => new Set(members.map((m) => m.uid)), [members]);
  const [pick, setPick] = useState<InvestorOpt | null>(null);
  const [addQ, setAddQ] = useState("");
  const matches = useMemo(() => {
    const n = addQ.trim().toLowerCase();
    if (!n) return [];
    return allInvestors.filter((u) => !memberUids.has(u.uid) && (u.name.toLowerCase().includes(n) || u.uid.toLowerCase().includes(n) || (u.phone ?? "").toLowerCase().includes(n))).slice(0, 8);
  }, [addQ, allInvestors, memberUids]);

  // current-investor filter + edit/remove
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return members;
    return members.filter((m) => m.name.toLowerCase().includes(n) || m.uid.toLowerCase().includes(n) || (m.phone ?? "").toLowerCase().includes(n));
  }, [members, q]);
  const [edit, setEdit] = useState<ProjectMemberRow | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  function add(fd: FormData) {
    if (!pick) { setError("Pick an investor first."); return; }
    setError(null);
    const input: ProjectInvestorInput = {
      project_id: projectId, uid: pick.uid,
      custom_share_price: String(fd.get("share") ?? "") || null,
      discount: String(fd.get("discount") ?? "") || null,
      start_date: String(fd.get("start") ?? "") || null,
      end_date: String(fd.get("end") ?? "") || null,
    };
    start(async () => {
      const res = await addInvestorToProject(input);
      if (!res.ok) return setError(res.error);
      setPick(null); setAddQ("");
      router.refresh();
    });
  }

  function saveEdit(fd: FormData) {
    if (!edit) return;
    setError(null);
    const input: ProjectInvestorInput = {
      project_id: projectId, uid: edit.uid,
      custom_share_price: String(fd.get("share") ?? "") || null,
      discount: String(fd.get("discount") ?? "") || null,
      start_date: String(fd.get("start") ?? "") || null,
      end_date: String(fd.get("end") ?? "") || null,
    };
    start(async () => {
      const res = await updateProjectInvestor(input);
      if (!res.ok) return setError(res.error);
      setEdit(null);
      router.refresh();
    });
  }

  function remove(uid: string) {
    setError(null);
    start(async () => {
      const res = await removeInvestorFromProject(projectId, uid);
      if (!res.ok) return setError(res.error);
      setConfirmDel(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* add new investor */}
      <div className="rounded-2xl border border-border bg-bg-soft/40 p-4">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-fg"><UserPlus className="h-4 w-4 text-brand-blue" /> Add investor to project</p>
        <form action={add} className="space-y-3">
          {pick ? (
            <div className="flex items-center gap-2 rounded-xl border border-brand-blue/40 bg-brand-blue-tint px-3 py-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-blue text-xs font-bold text-white">{initial(pick.name)}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">{pick.name} <span className="font-mono text-xs text-fg-muted">{pick.uid}</span></span>
              <button type="button" onClick={() => setPick(null)} className="rounded-md p-1 text-fg-muted hover:text-brand-red" aria-label="Clear"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" />
              <input value={addQ} onChange={(e) => setAddQ(e.target.value)} placeholder="Search users not in this project — name, UID, phone…" className={`${inputCls} pl-9`} />
              {matches.length > 0 && (
                <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-bg shadow-xl">
                  {matches.map((u) => (
                    <button key={u.uid} type="button" onClick={() => { setPick(u); setAddQ(""); }} className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-bg-soft">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-bg-soft text-xs font-bold text-fg-muted">{initial(u.name)}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-fg">{u.name}</span>
                        <span className="block truncate text-xs text-fg-faint">{u.uid} · {localPhone(u.phone)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {addQ.trim() && matches.length === 0 && <p className="absolute mt-1 w-full rounded-xl border border-border bg-bg px-3 py-2 text-xs text-fg-muted shadow">No matching users (or already added).</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div><label className={labelCls}>Share price (৳)</label><input name="share" type="number" min="0" step="0.01" placeholder="default" className={inputCls} /></div>
            <div><label className={labelCls}>Discount (৳)</label><input name="discount" type="number" min="0" step="0.01" placeholder="0" className={inputCls} /></div>
            <div><label className={labelCls}>Start</label><input name="start" type="date" className={inputCls} /></div>
            <div><label className={labelCls}>End</label><input name="end" type="date" className={inputCls} /></div>
          </div>

          {error && !edit && <p className="rounded-lg bg-brand-red-tint px-3 py-2 text-xs font-medium text-brand-red-dark">{error}</p>}

          <button type="submit" disabled={pending || !pick} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-blue-dark disabled:opacity-50">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Add to project
          </button>
        </form>
      </div>

      {/* current investors */}
      <div className="overflow-hidden rounded-2xl border border-border bg-bg">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3">
          <p className="text-sm font-bold text-fg">Current investors <span className="ml-1 rounded-full bg-bg-soft px-2 py-0.5 text-xs font-semibold text-fg-muted">{members.length}</span></p>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search current investors…" className="w-full rounded-xl border border-border bg-bg py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-blue/50" />
          </div>
        </div>
        <div className="max-h-[520px] overflow-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-bg-soft/95 backdrop-blur">
              <tr className="border-b border-border text-left text-[11px] font-bold uppercase tracking-wide text-fg-muted">
                <th className="px-3 py-2.5">Investor</th>
                <th className="px-3 py-2.5">Phone</th>
                <th className="px-3 py-2.5 text-right">Share price</th>
                <th className="px-3 py-2.5 text-right">Discount</th>
                <th className="px-3 py-2.5">Duration</th>
                <th className="px-3 py-2.5 text-right">Paid</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const tint = avatarTint(m.uid);
                return (
                  <tr key={m.uid} className="border-b border-border/60 transition-colors hover:bg-bg-soft/50">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${tint.bg} ${tint.fg}`}>{initial(m.name)}</span>
                        <div className="min-w-0"><p className="truncate font-semibold text-fg">{m.name}</p><p className="font-mono text-[11px] text-fg-faint">{m.uid}</p></div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-fg-muted">{localPhone(m.phone)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-fg-muted">{m.share != null ? taka(m.share) : <span className="text-fg-faint">Default</span>}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-fg-muted">{m.discount ? taka(m.discount) : <span className="text-fg-faint">None</span>}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs text-fg-muted">{m.start_date || m.end_date ? `${fmtDate(m.start_date)} – ${fmtDate(m.end_date)}` : <span className="text-fg-faint">N/A</span>}</td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-emerald-600">{taka(m.paid)}</td>
                    <td className="px-3 py-2.5">
                      {confirmDel === m.uid ? (
                        <span className="flex items-center justify-end gap-1 text-[11px]">
                          <span className="text-fg-muted">Remove?</span>
                          <button type="button" onClick={() => remove(m.uid)} disabled={pending} className="font-bold text-brand-red hover:underline disabled:opacity-50">Yes</button>
                          <button type="button" onClick={() => setConfirmDel(null)} className="text-fg-muted hover:underline">No</button>
                        </span>
                      ) : (
                        <div className="flex justify-end gap-1.5">
                          <button type="button" onClick={() => { setEdit(m); setError(null); }} title="Edit membership" className="grid h-8 w-8 place-items-center rounded-lg border border-border text-fg-muted transition-colors hover:border-brand-blue/40 hover:text-brand-blue"><Pencil className="h-4 w-4" /></button>
                          <button type="button" onClick={() => setConfirmDel(m.uid)} title="Remove from project" className="grid h-8 w-8 place-items-center rounded-lg border border-border text-fg-muted transition-colors hover:border-brand-red/40 hover:text-brand-red"><UserMinus className="h-4 w-4" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={7} className="px-3 py-10 text-center text-sm text-fg-muted">{members.length === 0 ? "No investors in this project yet." : "No investors match your search."}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* edit membership modal */}
      {edit && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => !pending && setEdit(null)}>
          <div className="w-full max-w-md animate-[pop_.18s_ease-out] rounded-2xl border border-border bg-bg p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-base font-bold text-fg">Edit membership</h2>
              <button type="button" onClick={() => setEdit(null)} className="rounded-lg p-1 text-fg-muted hover:bg-bg-soft hover:text-fg" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <p className="mb-3 text-xs text-fg-muted">{edit.name} · <span className="font-mono">{edit.uid}</span></p>
            <form action={saveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Share price (৳)</label><input name="share" type="number" min="0" step="0.01" defaultValue={edit.share ?? ""} placeholder="default" className={inputCls} /></div>
                <div><label className={labelCls}>Discount (৳)</label><input name="discount" type="number" min="0" step="0.01" defaultValue={edit.discount || ""} placeholder="0" className={inputCls} /></div>
                <div><label className={labelCls}>Start date</label><input name="start" type="date" defaultValue={dateInput(edit.start_date)} className={inputCls} /></div>
                <div><label className={labelCls}>End date</label><input name="end" type="date" defaultValue={dateInput(edit.end_date)} className={inputCls} /></div>
              </div>
              {error && <p className="rounded-lg bg-brand-red-tint px-3 py-2 text-xs font-medium text-brand-red-dark">{error}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEdit(null)} disabled={pending} className="rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-brand-blue/40 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={pending} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-blue-dark disabled:opacity-60">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
