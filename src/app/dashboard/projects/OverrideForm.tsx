"use client";

/** Override editor for one project (manager-only).
 *
 *  Two shapes depending on the project's availability model:
 *   - "share"     → status + share map {total, sold, note}
 *   - "buildings" → status + buildings {total, soldOut, nowBooking}
 *  Anything else ("units" / "none") is read-only here — the unit grid
 *  is edited in code, never through this form.
 *
 *  Code defaults are shown as placeholders so the editor always sees
 *  what they're overriding.  Blank fields fall back to code defaults
 *  (on the public site), so leaving a field empty == "use code value". */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react";
import { upsertOverride, resetOverride } from "@/app/actions/admin-projects";
import type { ProjectModel } from "./availability";

type Defaults = {
  status: string;
  share: { total: number; sold: number; note: string } | null;
  buildings: { total: number; soldOut: number; nowBooking: number } | null;
};

type Current = {
  status: string;
  share: { total: number; sold: number; note: string } | null;
  buildings: { total: number; soldOut: number; nowBooking: number } | null;
};

const inputCls =
  "w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm outline-none focus:border-brand-blue/50";
const labelCls = "mb-1.5 block text-xs font-semibold text-fg-muted";

/** Controlled number input that stays a string so blank == "use code". */
function numStr(n: number | null | undefined): string {
  return n === null || n === undefined ? "" : String(n);
}

export default function OverrideForm({
  slug,
  model,
  hasOverride,
  defaults,
  current,
}: {
  slug: string;
  model: ProjectModel;
  hasOverride: boolean;
  defaults: Defaults;
  current: Current;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [resetting, startReset] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // Form state — seeded with the saved override (or blank → code default).
  const ov = hasOverride ? current : null;
  const [status, setStatus] = useState(ov?.status ?? "");
  const [shTotal, setShTotal] = useState(numStr(ov?.share?.total));
  const [shSold, setShSold] = useState(numStr(ov?.share?.sold));
  const [shNote, setShNote] = useState(ov?.share?.note ?? "");
  const [bTotal, setBTotal] = useState(numStr(ov?.buildings?.total));
  const [bSoldOut, setBSoldOut] = useState(numStr(ov?.buildings?.soldOut));
  const [bNowBooking, setBNowBooking] = useState(numStr(ov?.buildings?.nowBooking));

  const editable = model === "share" || model === "buildings";

  function save() {
    setError(null);
    setOk(null);

    if (model === "share") {
      const total = shTotal.trim();
      const sold = shSold.trim();
      if ((total === "") !== (sold === "")) {
        setError("Enter both total and sold shares, or leave both blank to use the code default.");
        return;
      }
    }
    if (model === "buildings") {
      const vals = [bTotal.trim(), bSoldOut.trim(), bNowBooking.trim()];
      const filled = vals.filter((v) => v !== "").length;
      if (filled !== 0 && filled !== 3) {
        setError("Fill in all three building fields, or leave them all blank to use the code default.");
        return;
      }
    }

    start(async () => {
      const input =
        model === "share"
          ? {
              status: status || null,
              shareMap:
                shTotal.trim() === "" && shSold.trim() === ""
                  ? null
                  : { total: Number(shTotal), sold: Number(shSold), note: shNote || null },
            }
          : model === "buildings"
            ? {
                status: status || null,
                buildings:
                  bTotal.trim() === ""
                    ? null
                    : {
                        total: Number(bTotal),
                        soldOut: Number(bSoldOut),
                        nowBooking: Number(bNowBooking),
                      },
              }
            : { status: status || null };

      const res = await upsertOverride(slug, input);
      if (res.ok) {
        setOk(res.message ?? "Saved.");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  function reset() {
    setError(null);
    setOk(null);
    startReset(async () => {
      const res = await resetOverride(slug);
      if (res.ok) {
        setStatus("");
        setShTotal("");
        setShSold("");
        setShNote("");
        setBTotal("");
        setBSoldOut("");
        setBNowBooking("");
        setOk(res.message ?? "Reverted to code defaults.");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Status — every model has one */}
      <div>
        <label htmlFor="status" className={labelCls}>
          Status
        </label>
        <input
          id="status"
          type="text"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          placeholder={defaults.status || "e.g. চলমান"}
          className={inputCls}
        />
        <p className="mt-1 text-xs text-fg-faint">
          Code default: <span className="font-medium text-fg-muted">{defaults.status || "—"}</span>. Leave blank to keep it.
        </p>
      </div>

      {model === "share" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="sh-total" className={labelCls}>
                Total shares
              </label>
              <input
                id="sh-total"
                type="number"
                min={0}
                inputMode="numeric"
                value={shTotal}
                onChange={(e) => setShTotal(e.target.value)}
                placeholder={numStr(defaults.share?.total)}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="sh-sold" className={labelCls}>
                Sold shares
              </label>
              <input
                id="sh-sold"
                type="number"
                min={0}
                inputMode="numeric"
                value={shSold}
                onChange={(e) => setShSold(e.target.value)}
                placeholder={numStr(defaults.share?.sold)}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label htmlFor="sh-note" className={labelCls}>
              Note (optional)
            </label>
            <textarea
              id="sh-note"
              rows={3}
              value={shNote}
              onChange={(e) => setShNote(e.target.value)}
              placeholder={defaults.share?.note || "Shown under the share map on the public site."}
              className={`${inputCls} resize-y`}
            />
          </div>
          <p className="text-xs text-fg-faint">
            Code default: {defaults.share ? `${defaults.share.sold}/${defaults.share.total} sold` : "—"}.
            Enter both numbers to override, or leave both blank to keep the code values.
          </p>
        </div>
      )}

      {model === "buildings" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="b-total" className={labelCls}>
                Total buildings
              </label>
              <input
                id="b-total"
                type="number"
                min={0}
                inputMode="numeric"
                value={bTotal}
                onChange={(e) => setBTotal(e.target.value)}
                placeholder={numStr(defaults.buildings?.total)}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="b-soldout" className={labelCls}>
                Sold out
              </label>
              <input
                id="b-soldout"
                type="number"
                min={0}
                inputMode="numeric"
                value={bSoldOut}
                onChange={(e) => setBSoldOut(e.target.value)}
                placeholder={numStr(defaults.buildings?.soldOut)}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="b-booking" className={labelCls}>
                Now booking (#)
              </label>
              <input
                id="b-booking"
                type="number"
                min={0}
                inputMode="numeric"
                value={bNowBooking}
                onChange={(e) => setBNowBooking(e.target.value)}
                placeholder={numStr(defaults.buildings?.nowBooking)}
                className={inputCls}
              />
            </div>
          </div>
          <p className="text-xs text-fg-faint">
            Code default:{" "}
            {defaults.buildings
              ? `${defaults.buildings.soldOut}/${defaults.buildings.total} sold out · building #${defaults.buildings.nowBooking} booking`
              : "—"}
            . Fill all three to override, or leave them all blank to keep the code values.
          </p>
        </div>
      )}

      {!editable && (
        <div className="rounded-xl border border-border bg-bg-soft px-4 py-3 text-sm text-fg-muted">
          This project’s detailed availability (the floor-by-floor unit grid) is managed in code and
          can’t be edited here. You can still override its status text above.
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-brand-red-tint px-3.5 py-2.5 text-sm text-brand-red-dark">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {ok && (
        <div className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{ok}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          onClick={save}
          disabled={pending || resetting}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-blue-dark disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {pending ? "Saving…" : "Save override"}
        </button>

        <button
          type="button"
          onClick={reset}
          disabled={!hasOverride || pending || resetting}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-brand-blue/40 disabled:cursor-not-allowed disabled:opacity-50"
          title={hasOverride ? "Delete the override row and use code defaults" : "No override to reset"}
        >
          <RotateCcw className="h-4 w-4" /> {resetting ? "Resetting…" : "Reset to code defaults"}
        </button>
      </div>
    </div>
  );
}
