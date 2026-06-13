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

export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  name: string;
  mobile: string;
  username: string | null;
  email: string | null;
  role: string;
  created_at: string;
};

const ROLE_TONE: Record<Role, Tone> = {
  member: "neutral",
  staff: "info",
  manager: "warning",
  admin: "danger",
};

function asRole(r: string): Role {
  return (["member", "staff", "manager", "admin"].includes(r) ? r : "member") as Role;
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

  const { data, error } = await admin
    .from("profiles")
    .select("id, name, mobile, username, email, role, created_at")
    .order("created_at", { ascending: true });

  const rows: ProfileRow[] = error ? [] : (data ?? []);

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
        subtitle="Team members and their access levels."
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
              <th className={thCls}>Mobile</th>
              <th className={thCls}>Username</th>
              <th className={thCls}>Role</th>
              <th className={thCls}>Joined</th>
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
                  <td className={`${tdCls} whitespace-nowrap`}>{r.mobile || "—"}</td>
                  <td className={`${tdCls} text-fg-muted`}>{r.username || "—"}</td>
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
                  <td className={`${tdCls} whitespace-nowrap text-fg-muted`}>{fmtDate(r.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}
