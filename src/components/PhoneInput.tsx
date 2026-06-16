"use client";

/** Phone-number input with a country-code selector (Writerify-style).
 *
 *  Layout: a flag + dial-code button on the left, the local number input
 *  on the right.  Clicking the button drops a searchable country list.
 *  Bangladesh is the default; any country can be picked.  No verification —
 *  the field just captures the number; canonicalisation happens server-side
 *  in the signup action (BD numbers stay byte-for-byte identical to before).
 *
 *  The selection is tracked by ISO `code` (not dial) because dial codes are
 *  not unique — USA and Canada are both "+1". */

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Phone, Search } from "lucide-react";
import { COUNTRIES, countryByCode, flagUrl } from "@/lib/countries";

const flagStyle = { height: 14, width: 21 } as const;

export default function PhoneInput({
  label,
  required,
  country,
  onCountryChange,
  value,
  onChange,
  hint,
  searchPlaceholder,
  selectLabel,
}: {
  label: string;
  required?: boolean;
  country: string; // ISO code
  onCountryChange: (code: string) => void;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  searchPlaceholder: string;
  selectLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => countryByCode(country), [country]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return COUNTRIES;
    const digits = s.replace(/\D/g, "");
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.code.includes(s) ||
        (digits && c.dial.includes(digits)),
    );
  }, [q]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // The dial code already sits in the button, so the local part is typed
  // WITHOUT it — for BD that's "1XXXXXXXXX" (the national trunk 0 is dropped).
  // If a user types a leading 0 anyway, the server still accepts it (see
  // normalizeMobile in src/app/actions/auth.ts), so this is a hint, not a rule.
  const localPlaceholder = "1XXXXXXXXX";

  return (
    <div ref={ref} className="relative">
      <label className="text-[11px] uppercase tracking-[0.18em] text-fg-muted font-semibold">
        {label} {required && <span className="text-brand-red">*</span>}
      </label>

      <div className="mt-1.5 flex items-stretch gap-2">
        {/* Country selector button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={selectLabel}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-bg-soft px-2.5 transition-colors hover:border-brand-blue/40 focus:border-brand-blue/50 focus:outline-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={flagUrl(selected.code)}
            alt=""
            style={flagStyle}
            className="rounded-sm object-cover ring-1 ring-black/5"
          />
          <span className="text-sm font-semibold text-fg">+{selected.dial}</span>
          <ChevronDown
            className={`h-4 w-4 text-fg-muted transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* Local number input */}
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-bg-soft px-3 transition-colors focus-within:border-brand-blue/50 focus-within:ring-2 focus-within:ring-brand-blue/15">
          <Phone className="h-4 w-4 shrink-0 text-fg-muted" />
          <input
            type="tel"
            required={required}
            inputMode="tel"
            autoComplete="tel"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={localPlaceholder}
            className="w-full bg-transparent py-3 text-sm text-fg placeholder:text-fg-faint outline-none"
          />
        </div>
      </div>

      {/* Country dropdown */}
      {open && (
        <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-xl border border-border bg-bg shadow-xl">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="h-4 w-4 shrink-0 text-fg-muted" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent py-2.5 text-sm text-fg placeholder:text-fg-faint outline-none"
            />
          </div>
          <ul className="max-h-60 overflow-y-auto py-1" role="listbox">
            {list.map((c) => (
              <li key={c.code} role="option" aria-selected={c.code === country}>
                <button
                  type="button"
                  onClick={() => {
                    onCountryChange(c.code);
                    setOpen(false);
                    setQ("");
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-bg-soft ${
                    c.code === country ? "bg-brand-blue-tint" : ""
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={flagUrl(c.code)}
                    alt=""
                    loading="lazy"
                    style={flagStyle}
                    className="rounded-sm object-cover ring-1 ring-black/5"
                  />
                  <span className="flex-1 truncate text-fg">{c.name}</span>
                  <span className="text-fg-muted">+{c.dial}</span>
                </button>
              </li>
            ))}
            {list.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-fg-faint">—</li>
            )}
          </ul>
        </div>
      )}

      {hint && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-fg-faint">{hint}</p>
      )}
    </div>
  );
}
