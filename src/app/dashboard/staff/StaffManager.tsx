"use client";

/** Client controls for the Staff table (admin-only):
 *  - AddStaffButton  → opens the create modal
 *  - StaffRowActions → edit + delete per row
 *  Both share StaffFormModal.  Writes go through the admin-staff
 *  server actions; on success we router.refresh() so the server-rendered
 *  table re-reads from the DB. */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Pencil, Trash2, Loader2, X, Check, KeyRound } from "lucide-react";
import { createStaff, updateStaff, deleteStaff, type StaffInput } from "@/app/actions/admin-staff";
import { confirmDialog } from "@/components/ui/Dialog";
import { toast } from "@/components/ui/Toast";
import type { Role } from "@/lib/auth";

export type StaffMember = {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  employee_code: string | null;
  salary: number;
  allowance: number;
  deduction: number;
  status: string;
};

/** Seed values for the create form (used by the roster "Create login"). */
export type StaffPrefill = { name?: string; mobile?: string; employee_code?: string; role?: Role };

const ROLES: Role[] = ["staff", "manager", "admin", "member"];
const STATUSES = ["active", "inactive", "suspended"] as const;

export function AddStaffButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark"
      >
        <UserPlus className="h-4 w-4" /> Add staff
      </button>
      {open && <StaffFormModal mode="create" onClose={() => setOpen(false)} />}
    </>
  );
}

/** Roster row → create a login, prefilled from the office record. */
export function CreateLoginButton({ prefill }: { prefill: StaffPrefill }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-brand-blue hover:bg-brand-blue-tint"
      >
        <KeyRound className="h-3.5 w-3.5" /> Create login
      </button>
      {open && <StaffFormModal mode="create" prefill={prefill} onClose={() => setOpen(false)} />}
    </>
  );
}

export function StaffRowActions({ member, canDelete = true }: { member: StaffMember; canDelete?: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  function onDelete() {
    confirmDialog({
      title: "Remove staff member?",
      message: `Delete ${member.name}'s account permanently? This can't be undone.`,
      confirmText: "Delete",
      danger: true,
    }).then((ok) => {
      if (!ok) return;
      startTransition(async () => {
        const res = await deleteStaff(member.id);
        if (res.ok) {
          toast("Staff member removed.", "success");
          router.refresh();
        } else toast(res.error, "error");
      });
    });
  }

  return (
    <div className="flex items-center gap-0.5">
      <button onClick={() => setEditing(true)} className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted hover:bg-bg-soft hover:text-fg" aria-label="Edit">
        <Pencil className="h-4 w-4" />
      </button>
      {canDelete && (
        <button onClick={onDelete} disabled={pending} className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted hover:bg-brand-red-tint hover:text-brand-red disabled:opacity-50" aria-label="Delete">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
      )}
      {editing && <StaffFormModal mode="edit" member={member} onClose={() => setEditing(false)} />}
    </div>
  );
}

function StaffFormModal({
  mode,
  member,
  prefill,
  onClose,
}: {
  mode: "create" | "edit";
  member?: StaffMember;
  prefill?: StaffPrefill;
  onClose: () => void;
}) {
  const router = useRouter();
  const editing = mode === "edit";
  const [form, setForm] = useState<StaffInput & { role: Role }>({
    name: member?.name ?? prefill?.name ?? "",
    mobile: member?.mobile ?? prefill?.mobile ?? "",
    username: "",
    email: member?.email ?? "",
    password: "",
    role: prefill?.role ?? "staff",
    employee_code: member?.employee_code ?? prefill?.employee_code ?? "",
    salary: member?.salary ?? 0,
    allowance: member?.allowance ?? 0,
    deduction: member?.deduction ?? 0,
    status: (member?.status as StaffInput["status"]) ?? "active",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const net = money(form.salary) + money(form.allowance) - money(form.deduction);

  function save() {
    setError(null);
    startTransition(async () => {
      const res = editing ? await updateStaff(member!.id, form) : await createStaff(form);
      if (res.ok) {
        toast(editing ? "Staff member saved." : "Staff member added.", "success");
        onClose();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-bg shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h3 className="text-sm font-bold text-fg">{editing ? "Edit staff member" : "Add staff member"}</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted hover:bg-bg-soft"><X className="h-4 w-4" /></button>
        </div>

        <div className="max-h-[72vh] space-y-3 overflow-y-auto p-5">
          {error && <p className="rounded-lg bg-brand-red-tint px-3 py-2 text-sm text-brand-red-dark">{error}</p>}

          <Field label="Full name *" value={form.name} onChange={set("name")} placeholder="e.g. Kamrul Hasan" />

          {editing ? (
            <>
              <Field label="Mobile (login — fixed)" value={form.mobile} onChange={() => {}} disabled />
              <Field label="Email (optional)" value={form.email ?? ""} onChange={set("email")} placeholder="staff@example.com" />
            </>
          ) : (
            <>
              <p className="rounded-lg bg-brand-blue-tint px-3 py-2 text-xs leading-relaxed text-brand-blue-dark">
                Dashboard staff log in with <span className="font-semibold">email + password</span>. Leave mobile blank — handy when the person is already an investor (their mobile account stays separate). Add a mobile only if they should also sign in by phone.
              </p>
              <Field label="Email (used to log in)" value={form.email ?? ""} onChange={set("email")} placeholder="staff@example.com" />
              <Field label="Mobile (optional)" value={form.mobile} onChange={set("mobile")} placeholder="01XXXXXXXXX — or leave blank" />
              <Field label="Username (optional)" value={form.username ?? ""} onChange={set("username")} placeholder="kamrul" />
              <Field label="Password *" type="password" value={form.password ?? ""} onChange={set("password")} placeholder="min 6 characters" />
              <Selectish label="Role" value={form.role} onChange={set("role")} options={ROLES.map((r) => [r, r])} />
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Employee code" value={String(form.employee_code ?? "")} onChange={set("employee_code")} placeholder={editing ? "" : "auto if blank · 100"} />
            <Selectish label="Status" value={form.status ?? "active"} onChange={set("status")} options={STATUSES.map((s) => [s, s])} />
          </div>

          <div className="rounded-xl border border-border bg-bg-soft p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-fg-muted">Salary (monthly · ৳)</p>
            <div className="grid grid-cols-3 gap-2">
              <NumField label="Basic" value={form.salary} onChange={set("salary")} />
              <NumField label="Allowance" value={form.allowance} onChange={set("allowance")} />
              <NumField label="Deduction" value={form.deduction} onChange={set("deduction")} />
            </div>
            <p className="mt-2 text-xs text-fg-muted">
              Net pay: <span className="font-bold text-fg">৳{net.toLocaleString("en-US")}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3.5">
          <button onClick={onClose} className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-fg hover:bg-bg-soft">Cancel</button>
          <button onClick={save} disabled={pending} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark disabled:opacity-60">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {editing ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function money(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function Field({
  label, value, onChange, placeholder, type = "text", disabled = false,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-fg-muted">{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} className="w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm text-fg outline-none focus:border-brand-blue/50 disabled:opacity-60" />
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number | string | undefined; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-medium text-fg-faint">{label}</label>
      <input type="number" min={0} step="1" value={value ?? 0} onChange={onChange} className="w-full rounded-lg border border-border bg-bg px-2.5 py-2 text-sm text-fg outline-none focus:border-brand-blue/50" />
    </div>
  );
}

function Selectish({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: [string, string][];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-fg-muted">{label}</label>
      <select value={value} onChange={onChange} className="w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm capitalize text-fg outline-none focus:border-brand-blue/50">
        {options.map(([v, l]) => (
          <option key={v} value={v} className="capitalize">{l}</option>
        ))}
      </select>
    </div>
  );
}
