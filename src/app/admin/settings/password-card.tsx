"use client";

import { useState, useTransition } from "react";
import { Loader2, KeyRound, Check, AlertCircle, Eye, EyeOff } from "lucide-react";

import { Card } from "@/components/admin/ui";
import { changePassword } from "@/app/actions/admin-settings";

const inputCls =
  "w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 pr-10 text-sm outline-none focus:border-brand-blue/50";
const primaryBtn =
  "inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-blue-dark disabled:opacity-60";

export function PasswordCard() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function submit() {
    setErr(null);
    setOk(null);
    if (password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setErr("Passwords don't match.");
      return;
    }
    start(async () => {
      const res = await changePassword({ password, confirm });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setOk(res.message ?? "Password changed.");
      setPassword("");
      setConfirm("");
    });
  }

  return (
    <Card>
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-blue-tint text-brand-blue">
          <KeyRound className="h-[18px] w-[18px]" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-fg">Password</h2>
          <p className="text-xs text-fg-muted">Choose a new password (at least 6 characters).</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-fg-muted">New password</span>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              className={inputCls}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-faint hover:text-fg"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-fg-muted">Confirm password</span>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              className={inputCls}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </div>
        </label>
      </div>

      {err && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-brand-red-dark">
          <AlertCircle className="h-4 w-4 shrink-0" /> {err}
        </p>
      )}
      {ok && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-emerald-700">
          <Check className="h-4 w-4 shrink-0" /> {ok}
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <button type="button" onClick={submit} disabled={pending} className={primaryBtn}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Change password
        </button>
      </div>
    </Card>
  );
}
