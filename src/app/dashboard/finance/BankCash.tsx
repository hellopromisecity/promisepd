"use client";

/** Finance → Bank & Cash: every place the office keeps money — cash drawer,
 *  bank accounts, bKash / Nagad — with live balances (opening + income −
 *  expense), the total cash position, a split donut, add / edit accounts
 *  and the movements of whichever account you click. */

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Landmark, Wallet, Smartphone, Plus, Pencil, Trash2, Loader2, Save, TrendingUp, TrendingDown, Banknote } from "lucide-react";
import { StatCard } from "@/components/admin/ui";
import { toast } from "@/components/ui/Toast";
import { confirmDialog } from "@/components/ui/Dialog";
import type { FinanceData, FinAccount, FinTxn } from "@/lib/finance";
import { addFinanceAccount, updateFinanceAccount, deleteFinanceAccount, type AccountInput } from "@/app/actions/finance";
import { taka, compact, fmtDate, txnHead, PERIODS, periodRange, inPeriod, type Period, inputCls, labelCls, selectCls, Modal, Donut, ACCOUNT_TYPES, accountTypeLabel } from "./_ui";

const TYPE_ICON = { cash: Banknote, bank: Landmark, mobile: Smartphone } as const;
const TYPE_COLOR: Record<string, string> = { cash: "#f59e0b", bank: "#1847A1", mobile: "#8b5cf6" };

export default function BankCash({ data, canEdit }: { data: FinanceData; canEdit: boolean }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 40); return () => clearTimeout(t); }, []);
  const [period, setPeriod] = useState<Period>("month");
  const range = useMemo(() => periodRange(period), [period]);
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<FinAccount | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const total = data.accounts.reduce((s, a) => s + (data.balances[a.id] ?? 0), 0);
  const byType = ["cash", "bank", "mobile"].map((t) => ({ type: t, accounts: data.accounts.filter((a) => a.type === t), value: data.accounts.filter((a) => a.type === t).reduce((s, a) => s + (data.balances[a.id] ?? 0), 0) }));
  const inRange = useMemo(() => data.txns.filter((t) => inPeriod(t, range)), [data.txns, range]);
  const flow = (id: string) => { const rows = inRange.filter((t) => t.account_id === id); return { in: rows.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0), out: rows.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0), n: rows.length }; };
  const movements = useMemo(() => (selected ? inRange.filter((t) => t.account_id === selected) : inRange.filter((t) => t.account_id)).slice(0, 50), [inRange, selected]);
  const selectedAcc = data.accounts.find((a) => a.id === selected) ?? null;
  const positive = Math.max(0, total);

  async function remove(a: FinAccount) {
    const ok = await confirmDialog({ title: "Remove account", message: `Remove “${a.name}”? Only possible while it has no entries. Opening balance ${taka(a.opening_balance)} goes with it.`, confirmText: "Remove" });
    if (!ok) return;
    setRemoving(a.id);
    const r = await deleteFinanceAccount(a.id);
    setRemoving(null);
    if (r.ok) { toast(r.message || "Removed.", "success"); if (selected === a.id) setSelected(null); router.refresh(); } else toast(r.error, "error");
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total position" value={compact(total)} sub={`${data.accounts.length} account${data.accounts.length === 1 ? "" : "s"} · opening + in − out`} icon={Wallet} tone={total >= 0 ? "success" : "danger"} />
        {byType.map((b) => {
          const Icon = TYPE_ICON[b.type as keyof typeof TYPE_ICON];
          return <StatCard key={b.type} label={accountTypeLabel(b.type)} value={compact(b.value)} sub={`${b.accounts.length} account${b.accounts.length === 1 ? "" : "s"}`} icon={Icon} tone={b.type === "cash" ? "warning" : b.type === "bank" ? "info" : "neutral"} />;
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {/* account cards */}
        <div className="lg:col-span-2">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-fg">Accounts <span className="text-[11px] font-normal text-fg-faint">— click one to see its movements</span></p>
            <div className="flex items-center gap-2">
              <select value={period} onChange={(e) => setPeriod(e.target.value as Period)} className={selectCls}>{PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select>
              {canEdit && <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark"><Plus className="h-4 w-4" /> Add account</button>}
            </div>
          </div>
          {data.accounts.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-bg px-6 py-14 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-blue-tint text-brand-blue"><Landmark className="h-6 w-6" /></span>
              <h2 className="mt-4 text-base font-bold text-fg">No accounts yet</h2>
              <p className="mt-1 max-w-sm text-sm text-fg-muted">Add the office cash drawer, each bank account and the bKash / Nagad wallets — every income and expense then moves the right balance.</p>
              {canEdit && <button onClick={() => setAdding(true)} className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue-dark"><Plus className="h-4 w-4" /> Add the first account</button>}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {data.accounts.map((a, i) => {
                const Icon = TYPE_ICON[a.type as keyof typeof TYPE_ICON] ?? Landmark;
                const bal = data.balances[a.id] ?? 0;
                const f = flow(a.id);
                const active = selected === a.id;
                return (
                  <div key={a.id} onClick={() => setSelected(active ? null : a.id)} className={`group cursor-pointer rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${active ? "border-brand-blue ring-2 ring-brand-blue/20" : "border-border"}`} style={{ backgroundImage: `linear-gradient(135deg, ${TYPE_COLOR[a.type] ?? "#64748b"}20, ${TYPE_COLOR[a.type] ?? "#64748b"}06)`, transitionDelay: mounted ? "0ms" : `${i * 60}ms`, opacity: mounted ? 1 : 0, transform: mounted ? undefined : "translateY(8px)" }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-bg/80" style={{ color: TYPE_COLOR[a.type] }}><Icon className="h-[18px] w-[18px]" /></span>
                        <div>
                          <p className="font-bold text-fg">{a.name}</p>
                          <p className="text-[11px] text-fg-muted">{accountTypeLabel(a.type)}{a.account_number ? ` · ${a.account_number}` : ""}</p>
                        </div>
                      </div>
                      {canEdit && (
                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button onClick={(e) => { e.stopPropagation(); setEditing(a); }} title="Edit account" className="grid h-7 w-7 place-items-center rounded-lg border border-border bg-bg text-fg-faint hover:border-brand-blue/40 hover:text-brand-blue"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={(e) => { e.stopPropagation(); remove(a); }} disabled={removing === a.id} title="Remove (only when empty)" className="grid h-7 w-7 place-items-center rounded-lg border border-border bg-bg text-fg-faint hover:border-brand-red/40 hover:text-brand-red disabled:opacity-40">{removing === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}</button>
                        </div>
                      )}
                    </div>
                    <p className={`mt-3 text-2xl font-extrabold tabular-nums ${bal < 0 ? "text-brand-red-dark" : "text-fg"}`}>{taka(bal)}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-fg-muted">
                      <span>opening {taka(a.opening_balance)}</span>
                      <span className="text-emerald-600">+{taka(f.in)}</span>
                      <span className="text-brand-red-dark">−{taka(f.out)}</span>
                      <span className="text-fg-faint">{range.label}</span>
                    </div>
                    {a.note && <p className="mt-1.5 text-[11px] italic text-fg-faint">{a.note}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* split */}
        <div className="rounded-2xl border border-border bg-bg p-4">
          <p className="mb-3 text-sm font-bold text-fg">Where the money sits</p>
          <div className="flex items-center justify-around">
            {byType.filter((b) => b.value > 0).length === 0 ? <p className="py-6 text-sm text-fg-muted">No balances yet.</p> : byType.filter((b) => b.value > 0).map((b) => (
              <Donut key={b.type} mounted={mounted} pct={positive > 0 ? (Math.max(0, b.value) / positive) * 100 : 0} color={TYPE_COLOR[b.type]} label={accountTypeLabel(b.type)} a={compact(b.value)} size={80} />
            ))}
          </div>
          <ul className="mt-4 space-y-1.5 border-t border-border pt-3 text-xs">
            {data.accounts.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 truncate text-fg-muted"><i className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: TYPE_COLOR[a.type] }} />{a.name}</span>
                <span className="font-semibold tabular-nums text-fg">{taka(data.balances[a.id] ?? 0)}</span>
              </li>
            ))}
            <li className="flex items-center justify-between gap-2 border-t border-border pt-1.5 font-bold"><span className="text-fg">Total</span><span className="tabular-nums text-fg">{taka(total)}</span></li>
          </ul>
        </div>
      </div>

      {/* movements */}
      <div className="rounded-2xl border border-border bg-bg">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <p className="text-sm font-bold text-fg">Movements {selectedAcc ? <span className="text-brand-blue">· {selectedAcc.name}</span> : <span className="text-[11px] font-normal text-fg-faint">· every account</span>}</p>
          <span className="text-[11px] text-fg-faint">{range.label} · newest first · up to 50</span>
        </div>
        {movements.length === 0 ? <p className="px-4 py-10 text-center text-sm text-fg-muted">No movements in this period.</p> : (
          <ul className="divide-y divide-border/60">
            {movements.map((t: FinTxn) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${t.type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-brand-red-tint text-brand-red-dark"}`}>{t.type === "income" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-fg">{txnHead(t)}{t.party ? <span className="font-normal text-fg-muted"> · {t.party}</span> : null}</p>
                  <p className="text-[11px] text-fg-faint">{fmtDate(t.txn_date)}{!selected ? ` · ${data.accounts.find((a) => a.id === t.account_id)?.name ?? ""}` : ""}{t.method ? ` · ${t.method}` : ""}{t.reference ? ` · ${t.reference}` : ""}</p>
                </div>
                <span className={`shrink-0 font-bold tabular-nums ${t.type === "income" ? "text-emerald-600" : "text-brand-red-dark"}`}>{t.type === "income" ? "+" : "−"}{taka(t.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {(adding || editing) && <AccountModal account={editing} onClose={() => { setAdding(false); setEditing(null); }} />}
    </div>
  );
}

function AccountModal({ account, onClose }: { account: FinAccount | null; onClose: () => void }) {
  const router = useRouter();
  const editing = !!account;
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState(account?.type ?? "cash");
  const [number, setNumber] = useState(account?.account_number ?? "");
  const [opening, setOpening] = useState(account ? String(account.opening_balance) : "0");
  const [note, setNote] = useState(account?.note ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    setErr(null);
    if (!name.trim()) return setErr("Give the account a name.");
    const input: AccountInput = { name, type, account_number: number, opening_balance: Number(opening) || 0, note };
    start(async () => {
      const r = editing ? await updateFinanceAccount(account!.id, input) : await addFinanceAccount(input);
      if (r.ok) { toast(r.message || "Saved.", "success"); router.refresh(); onClose(); } else setErr(r.error);
    });
  }

  return (
    <Modal title={editing ? "Edit account" : "Add account"} subtitle="Cash drawer, bank account or mobile wallet" onClose={onClose}>
      {err && <div className="mb-3 rounded-xl border border-brand-red/30 bg-brand-red-tint px-3 py-2 text-sm text-brand-red-dark">{err}</div>}
      <div className="space-y-3">
        <div><label className={labelCls}>Account name *</label><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Islami Bank — Promise City, bKash (office), Office cash drawer" autoFocus /></div>
        <div>
          <label className={labelCls}>Type *</label>
          <div className="grid grid-cols-3 gap-2">
            {ACCOUNT_TYPES.map((t) => {
              const Icon = TYPE_ICON[t.value as keyof typeof TYPE_ICON];
              return (
                <button key={t.value} type="button" onClick={() => setType(t.value)} className={`rounded-xl border px-2 py-2.5 text-left transition-colors ${type === t.value ? "border-brand-blue bg-brand-blue-tint" : "border-border bg-bg-soft hover:border-brand-blue/40"}`}>
                  <Icon className="h-4 w-4" style={{ color: TYPE_COLOR[t.value] }} />
                  <p className="mt-1 text-xs font-bold text-fg">{t.label}</p>
                  <p className="text-[10px] text-fg-muted">{t.hint}</p>
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Account / wallet number <span className="font-normal normal-case text-fg-faint">(optional)</span></label><input className={inputCls} value={number} onChange={(e) => setNumber(e.target.value)} placeholder="2050113…  /  01…" /></div>
          <div><label className={labelCls}>Opening balance ৳</label><input type="number" step="any" className={inputCls} value={opening} onChange={(e) => setOpening(e.target.value)} /></div>
        </div>
        <div><label className={labelCls}>Note <span className="font-normal normal-case text-fg-faint">(optional)</span></label><input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Branch, who holds it, purpose…" /></div>
        <p className="text-[11px] text-fg-muted">Balance = opening balance + every income deposited here − every expense paid from here. Change the opening balance to correct a starting figure.</p>
        <button onClick={submit} disabled={pending} className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark disabled:opacity-60">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {editing ? "Save changes" : "Add account"}
        </button>
      </div>
    </Modal>
  );
}
