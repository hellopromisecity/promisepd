"use client";

/** Global, branded replacement for window.confirm / window.prompt.
 *
 *  Mount <DialogHost /> once (root layout).  Anywhere else, call:
 *    if (await confirmDialog({ message, danger:true })) { ... }
 *    const url = await promptDialog({ message, defaultValue });
 *  No context/props threading needed — a module-level emitter bridges
 *  the call to the single mounted host. */

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

type Req = {
  mode: "confirm" | "prompt";
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  danger: boolean;
  placeholder?: string;
  defaultValue?: string;
  resolve: (v: boolean | string | null) => void;
};

let emit: ((r: Req | null) => void) | null = null;

export function confirmDialog(opts: {
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}): Promise<boolean> {
  return new Promise((resolve) => {
    if (!emit) return resolve(false);
    emit({
      mode: "confirm",
      title: opts.title ?? "Are you sure?",
      message: opts.message,
      confirmText: opts.confirmText ?? "Confirm",
      cancelText: opts.cancelText ?? "Cancel",
      danger: opts.danger ?? false,
      resolve: (v) => resolve(v === true),
    });
  });
}

export function promptDialog(opts: {
  message: string;
  title?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmText?: string;
}): Promise<string | null> {
  return new Promise((resolve) => {
    if (!emit) return resolve(null);
    emit({
      mode: "prompt",
      title: opts.title ?? "",
      message: opts.message,
      confirmText: opts.confirmText ?? "OK",
      cancelText: "Cancel",
      danger: false,
      placeholder: opts.placeholder,
      defaultValue: opts.defaultValue ?? "",
      resolve: (v) => resolve(typeof v === "string" ? v : null),
    });
  });
}

export default function DialogHost() {
  const [req, setReq] = useState<Req | null>(null);
  const [val, setVal] = useState("");

  useEffect(() => {
    emit = (r) => {
      setReq(r);
      setVal(r?.defaultValue ?? "");
    };
    return () => {
      emit = null;
    };
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape")
        setReq((r) => {
          r?.resolve(r.mode === "prompt" ? null : false);
          return null;
        });
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  if (!req) return null;

  const cancel = () => {
    req.resolve(req.mode === "prompt" ? null : false);
    setReq(null);
  };
  const ok = () => {
    req.resolve(req.mode === "prompt" ? val : true);
    setReq(null);
  };

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) cancel();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-bg p-5 shadow-2xl" role="dialog" aria-modal="true">
        <div className="flex items-start gap-3">
          {req.danger && (
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-red-tint text-brand-red">
              <AlertTriangle className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            {req.title && <h3 className="text-base font-bold text-fg">{req.title}</h3>}
            <p className="mt-1 text-sm leading-relaxed text-fg-muted">{req.message}</p>
            {req.mode === "prompt" && (
              <input
                autoFocus
                value={val}
                onChange={(e) => setVal(e.target.value)}
                placeholder={req.placeholder}
                onKeyDown={(e) => {
                  if (e.key === "Enter") ok();
                }}
                className="mt-3 w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm text-fg outline-none focus:border-brand-blue/50"
              />
            )}
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={cancel} className="rounded-xl border border-border bg-bg px-4 py-2 text-sm font-semibold text-fg hover:bg-bg-soft">
            {req.cancelText}
          </button>
          <button
            onClick={ok}
            autoFocus={req.mode !== "prompt"}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-brand)] ${req.danger ? "bg-brand-red hover:bg-brand-red-dark" : "bg-brand-blue hover:bg-brand-blue-dark"}`}
          >
            {req.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
