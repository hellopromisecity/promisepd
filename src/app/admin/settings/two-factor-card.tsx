"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Smartphone,
  Loader2,
  Check,
  AlertCircle,
  Trash2,
  QrCode,
} from "lucide-react";

import { Card, Badge, type Tone } from "@/components/admin/ui";
import {
  enrollTotp,
  verifyTotp,
  unenrollTotp,
} from "@/app/actions/admin-settings";

export type EnrolledFactor = {
  id: string;
  friendlyName: string | null;
  status: string;
  createdAt: string;
};

const primaryBtn =
  "inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-blue-dark disabled:opacity-60";
const secondaryBtn =
  "inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-3 py-2 text-xs font-semibold text-fg transition-colors hover:border-brand-blue/40 disabled:opacity-60";
const inputCls =
  "w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm tracking-[0.4em] outline-none focus:border-brand-blue/50";

function statusTone(status: string): Tone {
  return status === "verified" ? "success" : "warning";
}

type Enrolment = {
  factorId: string;
  qrCode: string;
  secret: string;
};

export function TwoFactorCard({
  factors,
  available,
}: {
  factors: EnrolledFactor[];
  available: boolean;
}) {
  const router = useRouter();

  const [enrolment, setEnrolment] = useState<Enrolment | null>(null);
  const [code, setCode] = useState("");
  const [busy, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function beginEnroll() {
    setErr(null);
    setOk(null);
    start(async () => {
      const res = await enrollTotp();
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      if (res.data) {
        setEnrolment({
          factorId: res.data.factorId,
          qrCode: res.data.qrCode,
          secret: res.data.secret,
        });
      }
    });
  }

  function verify() {
    if (!enrolment) return;
    setErr(null);
    setOk(null);
    if (!/^\d{6}$/.test(code.trim())) {
      setErr("Enter the 6-digit code from your authenticator app.");
      return;
    }
    start(async () => {
      const res = await verifyTotp({ factorId: enrolment.factorId, code });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setOk(res.message ?? "Two-factor enabled.");
      setEnrolment(null);
      setCode("");
      router.refresh();
    });
  }

  function cancelEnroll() {
    if (!enrolment) {
      setEnrolment(null);
      return;
    }
    const factorId = enrolment.factorId;
    setErr(null);
    setOk(null);
    start(async () => {
      // Roll back the in-progress (unverified) factor so it doesn't
      // linger on the account.
      await unenrollTotp({ factorId });
      setEnrolment(null);
      setCode("");
      router.refresh();
    });
  }

  function remove(factorId: string) {
    setErr(null);
    setOk(null);
    start(async () => {
      const res = await unenrollTotp({ factorId });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setOk(res.message ?? "Factor removed.");
      router.refresh();
    });
  }

  return (
    <Card>
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-blue-tint text-brand-blue">
          <ShieldCheck className="h-[18px] w-[18px]" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-fg">Two-factor authentication</h2>
          <p className="text-xs text-fg-muted">
            Add a time-based one-time passcode (TOTP) from an authenticator app.
          </p>
        </div>
      </div>

      {!available ? (
        <div className="flex items-center gap-2 rounded-xl bg-bg-soft px-3 py-3 text-sm text-fg-muted">
          <AlertCircle className="h-4 w-4 shrink-0" />
          2FA isn&apos;t available on this project yet.
        </div>
      ) : (
        <>
          {/* Enrolled factors */}
          {factors.length > 0 && (
            <ul className="mb-4 space-y-2">
              {factors.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg-soft px-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="h-4 w-4 text-fg-muted" />
                    <div>
                      <p className="text-sm font-semibold text-fg">
                        {f.friendlyName || "Authenticator app"}
                      </p>
                      <p className="text-xs text-fg-faint">
                        Added{" "}
                        {new Date(f.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge tone={statusTone(f.status)}>{f.status}</Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(f.id)}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-3 py-2 text-xs font-semibold text-brand-red-dark transition-colors hover:border-brand-red/40 disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Enrolment flow */}
          {enrolment ? (
            <div className="rounded-xl border border-border bg-bg-soft p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="shrink-0">
                  {/* qr_code is an SVG data-uri returned by Supabase */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={enrolment.qrCode}
                    alt="Scan this QR code with your authenticator app"
                    className="h-40 w-40 rounded-lg border border-border bg-white p-1"
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-sm text-fg-muted">
                    Scan the QR code with your authenticator app, or enter this secret manually:
                  </p>
                  <code className="block break-all rounded-lg border border-border bg-bg px-3 py-2 text-xs text-fg">
                    {enrolment.secret}
                  </code>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-fg-muted">
                      6-digit code
                    </span>
                    <input
                      className={inputCls}
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="000000"
                    />
                  </label>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={verify} disabled={busy} className={primaryBtn}>
                      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                      Verify &amp; enable
                    </button>
                    <button
                      type="button"
                      onClick={cancelEnroll}
                      disabled={busy}
                      className={secondaryBtn}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button type="button" onClick={beginEnroll} disabled={busy} className={primaryBtn}>
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <QrCode className="h-4 w-4" />
              )}
              {factors.length > 0 ? "Add another authenticator" : "Set up authenticator app"}
            </button>
          )}

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
        </>
      )}
    </Card>
  );
}
