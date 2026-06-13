"use client";

/** Global branded toasts — replacement for window.alert.
 *  Mount <ToastHost /> once (root layout); call toast("Saved", "success")
 *  from anywhere. */

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";
type T = { id: number; message: string; type: ToastType };

let add: ((t: T) => void) | null = null;
let counter = 0;

export function toast(message: string, type: ToastType = "info") {
  add?.({ id: ++counter, message, type });
}

const STYLE: Record<ToastType, { icon: typeof Info; cls: string; accent: string }> = {
  success: { icon: CheckCircle2, cls: "border-emerald-200", accent: "text-emerald-600" },
  error: { icon: XCircle, cls: "border-brand-red/30", accent: "text-brand-red" },
  info: { icon: Info, cls: "border-border", accent: "text-brand-blue" },
};

export default function ToastHost() {
  const [items, setItems] = useState<T[]>([]);

  useEffect(() => {
    add = (t) => {
      setItems((x) => [...x, t]);
      setTimeout(() => setItems((x) => x.filter((i) => i.id !== t.id)), 4000);
    };
    return () => {
      add = null;
    };
  }, []);

  if (!items.length) return null;

  return (
    <div className="fixed right-4 top-4 z-[3500] flex w-[min(92vw,22rem)] flex-col gap-2">
      {items.map((t) => {
        const s = STYLE[t.type];
        const Icon = s.icon;
        return (
          <div key={t.id} className={`flex items-start gap-2.5 rounded-xl border bg-bg px-4 py-3 shadow-lg ${s.cls}`}>
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${s.accent}`} />
            <span className="min-w-0 flex-1 text-sm text-fg">{t.message}</span>
            <button onClick={() => setItems((x) => x.filter((i) => i.id !== t.id))} className="text-fg-faint hover:text-fg" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
