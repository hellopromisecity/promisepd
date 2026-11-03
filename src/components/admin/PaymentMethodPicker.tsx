"use client";

import { useState } from "react";
import { PAYMENT_GROUPS, paymentGroupOf, type PaymentGroup } from "@/lib/payment-methods";

const selectCls = "w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand-blue/50 disabled:opacity-50";

/** Two-step payment method (the owner's ask, 2026-11-03): first Cash or Bank,
 *  then the channel under it — Cash → Cash / Bkash / Nagad / Rocket, Bank →
 *  the office's six accounts (Kamrul DBBL, PPD DBBL, Sonali Bank, Bank Asia,
 *  Islami Bank, Al Arafah Bank). Only the channel name is stored.
 *
 *  Uncontrolled (`defaultValue` + a hidden input named `name`, for forms read
 *  through FormData) or controlled (`value` + `onChange`). Everything derives
 *  from the one value: picking Bank before a bank holds the plain "Bank" that
 *  older rows carry, so the second select reads "which bank?" until one is
 *  chosen; picking Cash starts on Cash itself (the common case). */
export default function PaymentMethodPicker({ name = "payment_method", value, defaultValue, onChange, className, idPrefix }: {
  name?: string;
  value?: string;
  defaultValue?: string | null;
  onChange?: (v: string) => void;
  className?: string;
  /** Gives the two selects ids (`${idPrefix}-group`, `${idPrefix}-channel`) for a label's htmlFor. */
  idPrefix?: string;
}) {
  const controlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue ?? "");
  const current = controlled ? value : inner;
  const set = (v: string) => { setInner(v); onChange?.(v); };

  const group: PaymentGroup | "" = paymentGroupOf(current) ?? "";
  const channels: readonly string[] = PAYMENT_GROUPS.find((g) => g.key === group)?.channels ?? [];
  const channel = channels.includes(current) ? current : "";

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-2">
        <select
          id={idPrefix ? `${idPrefix}-group` : undefined}
          value={group}
          onChange={(e) => { const g = e.target.value; set(g === "Cash" ? "Cash" : g === "Bank" ? "Bank" : ""); }}
          className={selectCls}
          aria-label="Cash or Bank"
        >
          <option value="">— Select —</option>
          {PAYMENT_GROUPS.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
        </select>
        <select
          id={idPrefix ? `${idPrefix}-channel` : undefined}
          value={channel}
          onChange={(e) => set(e.target.value || (group === "Bank" ? "Bank" : ""))}
          disabled={!group}
          className={selectCls}
          aria-label={group === "Bank" ? "Which bank" : "Which channel"}
        >
          <option value="" disabled={group === "Cash"}>{group === "Bank" ? "— which bank? —" : group === "Cash" ? "— which? —" : "—"}</option>
          {channels.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {group === "Bank" && !channel && (
        <p className="mt-1 text-[11px] font-medium text-amber-600">কোন ব্যাংক? — pick the bank (otherwise it is saved as plain “Bank”)</p>
      )}
      {!controlled && <input type="hidden" name={name} value={current} />}
    </div>
  );
}
