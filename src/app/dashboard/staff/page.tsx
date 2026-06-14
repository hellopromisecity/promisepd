import { redirect } from "next/navigation";
import { Users, Shield, ShieldCheck, UserCog } from "lucide-react";
import { getCurrentUser, isManager, isAdmin, type Role } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import {
  PageHeader,
  StatCard,
  Badge,
  EmptyState,
  TableShell,
  thCls,
  tdCls,
  type Tone,
} from "@/components/admin/ui";
import RoleSelect from "./RoleSelect";
import { AddStaffButton, StaffRowActions, type StaffMember } from "./StaffManager";

export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  name: string;
  mobile: string;
  username: string | null;
  email: string | null;
  role: string;
  employee_code: string | null;
  salary: number;
  allowance: number;
  deduction: number;
  status: string;
  created_at: string;
};

const STATUS_TONE: Record<string, Tone> = {
  active: "success",
  inactive: "neutral",
  suspended: "danger",
};

const taka = (n: number) => `৳${(Number(n) || 0).toLocaleString("en-US")}`;

const ROLE_TONE: Record<Role, Tone> = {
  member: "neutral",
  staff: "info",
  manager: "warning",
  admin: "danger",
};

function asRole(r: string): Role {
  return (["member", "staff", "manager", "admin"].includes(r) ? r : "member") as Role;
}

export default async function StaffPage() {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) redirect("/account");

  const canEditRoles = isAdmin(me.role);
  const admin = getAdmin();

  if (!admin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Staff" subtitle="Team members and their access levels." />
        <EmptyState
          icon={Users}
          title="Data unavailable"
          message="Supabase isn't configured."
        />
      </div>
    );
  }

  // Try the full select (with the staff fields from migration 0016); if
  // that migration hasn't been applied yet Postgres errors with 42703 —
  // fall back to the base columns so the roster never goes blank.
  const FULL =
    "id, name, mobile, username, email, role, employee_code, salary, allowance, deduction, status, created_at";
  const BASE = "id, name, mobile, username, email, role, created_at";

  // `cols` is a runtime string so the typed client can't infer the row —
  // we normalise + cast the result below.
  const sel = (cols: string) =>
    admin.from("profiles").select(cols).order("created_at", { ascending: true });

  let res = await sel(FULL);
  if (res.error?.code === "42703") res = await sel(BASE);

  const raw = (res.error ? [] : res.data ?? []) as unknown as Record<string, unknown>[];
  const rows: ProfileRow[] = raw.map((r) => ({
    id: String(r.id),
    name: String(r.name ?? ""),
    mobile: String(r.mobile ?? ""),
    username: (r.username as string | null) ?? null,
    email: (r.email as string | null) ?? null,
    role: String(r.role ?? "member"),
    employee_code: (r.employee_code as string | null) ?? null,
    salary: Number(r.salary) || 0,
    allowance: Number(r.allowance) || 0,
    deduction: Number(r.deduction) || 0,
    status: (r.status as string) || "active",
    created_at: String(r.created_at ?? ""),
  }));

  const counts = {
    total: rows.length,
    staff: rows.filter((r) => r.role === "staff").length,
    managers: rows.filter((r) => r.role === "manager").length,
    admins: rows.filter((r) => r.role === "admin").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        subtitle="Team members, pay & access levels."
        action={canEditRoles ? <AddStaffButton /> : undefined}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Members" value={counts.total} sub="total accounts" icon={Users} tone="info" />
        <StatCard label="Staff" value={counts.staff} sub="role: staff" icon={UserCog} tone="info" />
        <StatCard label="Managers" value={counts.managers} sub="role: manager" icon={Shield} tone="warning" />
        <StatCard label="Admins" value={counts.admins} sub="role: admin" icon={ShieldCheck} tone="danger" />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members yet"
          message="Registered accounts will appear here."
        />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <th className={thCls}>Name</th>
              <th className={thCls}>Code</th>
              <th className={thCls}>Mobile</th>
              <th className={thCls}>Salary (net)</th>
              <th className={thCls}>Role</th>
              <th className={thCls}>Status</th>
              {canEditRoles && <th className={thCls}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const role = asRole(r.role);
              return (
                <tr key={r.id}>
                  <td className={tdCls}>
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-blue-tint text-xs font-bold text-brand-blue">
                        {(r.name?.[0] ?? "?").toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-fg">{r.name || "Unnamed"}</p>
                        {r.email && (
                          <p className="truncate text-xs text-fg-muted">{r.email}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className={`${tdCls} whitespace-nowrap font-mono text-xs text-fg-muted`}>{r.employee_code || "—"}</td>
                  <td className={`${tdCls} whitespace-nowrap`}>{r.mobile || "—"}</td>
                  <td className={`${tdCls} whitespace-nowrap`}>
                    {Number(r.salary) || Number(r.allowance) || Number(r.deduction)
                      ? <span className="font-semibold text-fg">{taka(Number(r.salary) + Number(r.allowance) - Number(r.deduction))}</span>
                      : <span className="text-fg-faint">—</span>}
                  </td>
                  <td className={tdCls}>
                    {canEditRoles ? (
                      <RoleSelect
                        memberId={r.id}
                        name={r.name || "this member"}
                        current={role}
                        isSelf={r.id === me.id}
                      />
                    ) : (
                      <Badge tone={ROLE_TONE[role]}>{role}</Badge>
                    )}
                  </td>
                  <td className={tdCls}>
                    <Badge tone={STATUS_TONE[r.status] ?? "neutral"}>{r.status || "active"}</Badge>
                  </td>
                  {canEditRoles && (
                    <td className={tdCls}>
                      {r.id === me.id ? (
                        <span className="text-[11px] text-fg-faint">—</span>
                      ) : (
                        <StaffRowActions
                          member={{
                            id: r.id,
                            name: r.name,
                            mobile: r.mobile,
                            email: r.email,
                            employee_code: r.employee_code,
                            salary: Number(r.salary) || 0,
                            allowance: Number(r.allowance) || 0,
                            deduction: Number(r.deduction) || 0,
                            status: r.status || "active",
                          } satisfies StaffMember}
                        />
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}
