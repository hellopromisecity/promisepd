"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Coins, Pencil, CalendarClock, Loader2, Check, X } from "lucide-react";
import { Card } from "@/components/admin/ui";
import { toast } from "@/components/ui/Toast";
import { saveProfitConfig, type ProfitConfigInput } from "@/app/actions/deposit-profit";

export type PanelConfig = {
  enabled: boolean;
  per_lakh: number;
  cycle_days: number;
  cycle_start: string | null;
  payout_date: string | null;
  next_payout: string | null;
};

const fmt = (n: number) => "৳" + Math.round(Number(n) || 0).toLocaleString("en-IN");
const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  try { return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); } catch { return iso; }
};
const inputCls = "w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm text-fg outline-none focus:border-brand-blue/50";
const labelCls = "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-fg-muted";

export default function DepositProfitPanel({
  projectKey, cfg, dailyPerLakh,
}: {
  projectKey: string;
  cfg: PanelConfig;
  dailyPerLakh: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const set = cfg.enabled && cfg.per_lakh > 0;
  const cycleYears = Math.max(1, Math.round(cfg.cycle_days / 360));
  const cycleLabel = cycleYears === 1 ? "yearly" : `${cycleYears}-year`;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><Coins className="h-5 w-5" /></span>
          <div>
            <h2 className="text-sm font-bold text-fg">Dividend / লভ্যাংশ — this {cycleLabel} cycle</h2>
            <p className="text-xs text-fg-muted">Day-weighted on the running balance: profit = rate × how much money was in × how many days.</p>
          </div>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-3 py-2 text-sm font-semibold text-fg transition-colors hover:border-brand-blue/40 hover:text-brand-blue">
            <Pencil className="h-4 w-4" /> {set ? "Edit rate" : "Set rate"}
          </button>
        )}
      </div>

      {editing ? (
        <RateForm projectKey={projectKey} cfg={cfg} onDone={() => { setEditing(false); router.refresh(); }} onCancel={() => setEditing(false)} />
      ) : !set ? (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-bg-soft px-4 py-6 text-center text-sm text-fg-muted">
          No profit rate set for this scheme yet. Click <b className="text-fg">Set rate</b> to enter the per-lakh dividend and dates.
        </div>
      ) : (
        <>
          <div className="mt-4 sm:max-w-xs">
            <Tile tone="slate" icon={CalendarClock} value={`${fmt(cfg.per_lakh)}/lakh`} label={cycleYears === 1 ? "Rate · per year" : `Rate · over ${cycleYears} years`} sub={`= ৳${dailyPerLakh.toFixed(3)} / lakh / day`} />
          </div>
          <p className="mt-3 text-xs text-fg-muted">
            Cycle <b className="text-fg">{fmtDate(cfg.cycle_start)} → {fmtDate(cfg.payout_date)}</b>. Balance already in at the start earns from the start date; each withdrawal stops earning from its own date. Each member's dividend shows in the Profit column.
          </p>
        </>
      )}
    </Card>
  );
}

function Tile({ tone, icon: Icon, value, label, sub }: { tone: "emerald" | "blue" | "slate"; icon: typeof Coins; value: string; label: string; sub: string }) {
  const box = tone === "emerald" ? "bg-emerald-50 border-emerald-200" : tone === "blue" ? "bg-brand-blue-tint border-brand-blue/20" : "bg-bg-soft border-border";
  const ic = tone === "emerald" ? "text-emerald-600" : tone === "blue" ? "text-brand-blue" : "text-fg-muted";
  const vv = tone === "emerald" ? "text-emerald-700" : tone === "blue" ? "text-brand-blue-dark" : "text-fg";
  return (
    <div className={`rounded-xl border p-4 ${box}`}>
      <Icon className={`h-4 w-4 ${ic}`} />
      <p className={`mt-2 text-2xl font-extrabold tabular-nums ${vv}`}>{value}</p>
      <p className="text-[13px] font-semibold text-fg">{label}</p>
      <p className="text-[11px] text-fg-muted">{sub}</p>
    </div>
  );
}

function RateForm({ projectKey, cfg, onDone, onCancel }: { projectKey: string; cfg: PanelConfig; onDone: () => void; onCancel: () => void }) {
  const [perLakh, setPerLakh] = useState(cfg.per_lakh ? String(cfg.per_lakh) : "");
  const [cycleDays, setCycleDays] = useState(String(cfg.cycle_days || 720));
  const [cycleStart, setCycleStart] = useState(cfg.cycle_start ?? "");
  const [payout, setPayout] = useState(cfg.payout_date ?? "");
  const [nextPayout, setNextPayout] = useState(cfg.next_payout ?? "");
  const [enabled, setEnabled] = useState(cfg.enabled);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const days = Math.max(1, Math.round(Number(cycleDays) || 720));
  const daily = (Number(perLakh) || 0) / days;

  function save() {
    setErr(null);
    if (enabled && !(Number(perLakh) > 0)) { setErr("Per-lakh rate must be greater than 0."); return; }
    const input: ProfitConfigInput = { enabled, per_lakh: Number(perLakh) || 0, cycle_days: days, cycle_start: cycleStart, payout_date: payout, next_payout: nextPayout };
    start(async () => {
      const r = await saveProfitConfig(projectKey, input);
      if (r.ok) { toast(r.message || "Saved.", "success"); onDone(); } else setErr(r.error);
    });
  }

  return (
    <div className="mt-4 rounded-xl border border-border bg-bg-soft p-4">
      {err && <div className="mb-3 rounded-lg border border-brand-red/30 bg-brand-red-tint px-3 py-2 text-sm text-brand-red-dark">{err}</div>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Dividend per lakh (per cycle) ৳</label>
          <input type="number" className={inputCls} value={perLakh} onChange={(e) => setPerLakh(e.target.value)} placeholder="25000" />
          <p className="mt-1 text-[11px] text-fg-muted">= ৳{daily.toFixed(3)} per lakh per day</p>
        </div>
        <div>
          <label className={labelCls}>Cycle length (days)</label>
          <input type="number" className={inputCls} value={cycleDays} onChange={(e) => setCycleDays(e.target.value)} placeholder="360" />
          <p className="mt-1 text-[11px] text-fg-muted">360 = 1 year · 720 = 2 years (30-day months)</p>
        </div>
        <div>
          <label className={labelCls}>Cycle start</label>
          <input type="date" className={inputCls} value={cycleStart} onChange={(e) => setCycleStart(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Payout date (as of)</label>
          <input type="date" className={inputCls} value={payout} onChange={(e) => setPayout(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Next payout (projection)</label>
          <input type="date" className={inputCls} value={nextPayout} onChange={(e) => setNextPayout(e.target.value)} />
        </div>
        <label className="flex items-end gap-2 pb-2.5 text-sm text-fg">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4 rounded border-border" />
          Show profit for this scheme
        </label>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button onClick={save} disabled={pending} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark disabled:opacity-60">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save rate
        </button>
        <button onClick={onCancel} disabled={pending} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold text-fg hover:bg-bg-soft disabled:opacity-60">
          <X className="h-4 w-4" /> Cancel
        </button>
      </div>
    </div>
  );
}
