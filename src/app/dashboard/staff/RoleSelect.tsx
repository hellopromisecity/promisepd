"use client";

/** Admin-only per-row role picker.  Optimistically reflects the chosen
 *  role while the server action runs; rolls back and surfaces the error
 *  if it fails (e.g. demoting the last admin). */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { setRole } from "@/app/actions/admin-staff";
import type { Role } from "@/lib/auth";

const ROLES: Role[] = ["member", "staff", "manager", "admin"];

export default function RoleSelect({
  memberId,
  name,
  current,
  isSelf,
}: {
  memberId: string;
  name: string;
  current: Role;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState<Role>(current);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onChange(next: Role) {
    if (next === value) return;
    const previous = value;
    setValue(next);
    setError(null);
    startTransition(async () => {
      const res = await setRole(memberId, next);
      if (!res.ok) {
        setValue(previous);
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <select
          aria-label={`Role for ${name}`}
          value={value}
          disabled={pending}
          onChange={(e) => onChange(e.target.value as Role)}
          className="rounded-xl border border-border bg-bg-soft px-3 py-1.5 text-sm capitalize outline-none focus:border-brand-blue/50 disabled:opacity-60"
        >
          {ROLES.map((r) => (
            <option key={r} value={r} className="capitalize">
              {r}
            </option>
          ))}
        </select>
        {pending && <Loader2 className="h-4 w-4 animate-spin text-fg-faint" />}
        {isSelf && !pending && (
          <span className="text-[11px] font-medium text-fg-faint">you</span>
        )}
      </div>
      {error && <p className="text-[11px] font-medium text-brand-red-dark">{error}</p>}
    </div>
  );
}
