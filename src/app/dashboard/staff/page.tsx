import { redirect } from "next/navigation";
import { Users, Shield, ShieldCheck, KeyRound } from "lucide-react";
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
import { AddStaffButton, StaffRowActions, CreateLoginButton, type StaffMember } from "./StaffManager";
import { STAFF_ROSTER, canonicalMobile, roleFromTitle } from "@/lib/staff-roster";

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
  investor_ref: string | null;
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

  // Only admins may change staff roles — managers cannot (set with the user
  // 2026-07-15). The last-admin guard in setRole still prevents a lockout.
  const canEditRoles = isAdmin(me.role);
  // Any admin can manage staff records (add / edit / delete / create login).
  const canManageStaff = isAdmin(me.role);
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
    "id, name, mobile, username, email, role, employee_code, salary, allowance, deduction, status, created_at, investor_ref";
  const BASE = "id, name, mobile, username, email, role, created_at";

  // `cols` is a runtime string so the typed client can't infer the row —
  // we normalise + cast the result below.  Members (investor app-users
  // ported from the old system) are NOT staff — exclude them so the roster
  // stays the company team, not hundreds of investors.
  const sel = (cols: string) =>
    admin
      .from("profiles")
      .select(cols)
      .neq("role", "member")
      .order("created_at", { ascending: true });

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
    investor_ref: (r.investor_ref as string | null) ?? null,
  }));

  // ── Merge the office roster (code) with the accounts (DB) by mobile ──
  // Every employee in STAFF_ROSTER is shown; if one also has a login
  // account it's enriched with role / salary / management.  Accounts with
  // no roster entry (e.g. a member who self-registered) are appended.
  const byMobile = new Map<string, ProfileRow>();
  const byCode = new Map<string, ProfileRow>();
  for (const r of rows) {
    if (r.mobile) byMobile.set(canonicalMobile(r.mobile), r);
    if (r.employee_code) byCode.set(r.employee_code.trim().toUpperCase(), r);
  }

  type MergedRow = {
    key: string;
    name: string;
    designation: string | null; // roster job title
    district: string | null;
    code: string; // employee_code (account) || roster idNo
    mobile: string; // display (local 01… preferred)
    account: ProfileRow | null;
  };

  // De-dupe the hand-maintained roster by canonical mobile (the office
  // sheet has no uniqueness guard — the DB does, the code list doesn't),
  // so a person accidentally listed twice can't double-render or collide
  // on React keys.  Keep the first occurrence.
  const seenRoster = new Set<string>();
  const uniqueRoster = STAFF_ROSTER.filter((e) => {
    const c = canonicalMobile(e.mobile) || e.idNo;
    if (seenRoster.has(c)) return false;
    seenRoster.add(c);
    return true;
  });

  const matched = new Set<string>();
  const merged: MergedRow[] = uniqueRoster.map((e) => {
    const canon = canonicalMobile(e.mobile);
    // Match by mobile first; fall back to employee code so an email-only
    // account (no mobile — e.g. a staffer who's also an investor) still
    // links to its roster row instead of showing as a duplicate.
    const account =
      (canon ? byMobile.get(canon) : null) ??
      ((e.idNo ? byCode.get(e.idNo.trim().toUpperCase()) : null) ?? null);
    if (account) matched.add(account.id);
    return {
      key: account?.id ?? (canon || e.idNo),
      name: account?.name || e.name,
      designation: e.title,
      district: e.district,
      code: account?.employee_code || e.idNo,
      mobile: e.mobile || account?.mobile || "",
      account,
    };
  });
  // DB accounts with no roster entry → append (directory + management).
  for (const r of rows) {
    if (matched.has(r.id)) continue;
    if (r.role === "member") continue; // investor app-users aren't staff
    merged.push({
      key: r.id,
      name: r.name,
      designation: null,
      district: null,
      code: r.employee_code || "",
      mobile: r.mobile,
      account: r,
    });
  }

  const withLogin = merged.filter((m) => m.account).length;
  const managers = merged.filter((m) => m.account?.role === "manager").length;
  const admins = merged.filter((m) => m.account?.role === "admin").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        subtitle="Company roster, pay & access."
        action={canManageStaff ? <AddStaffButton /> : undefined}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Employees" value={uniqueRoster.length} sub="on the roster" icon={Users} tone="info" />
        <StatCard label="With login" value={withLogin} sub="have an account" icon={KeyRound} tone="success" />
        <StatCard label="Managers" value={managers} sub="role: manager" icon={Shield} tone="warning" />
        <StatCard label="Admins" value={admins} sub="role: admin" icon={ShieldCheck} tone="danger" />
      </div>

      {merged.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No staff yet"
          message="Employees from the roster and registered accounts will appear here."
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
              {canManageStaff && <th className={thCls}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {merged.map((m) => {
              const acc = m.account;
              const role = acc ? asRole(acc.role) : null;
              const meta = [m.designation, m.district].filter(Boolean).join(" · ") || acc?.email || null;
              return (
                <tr key={m.key}>
                  <td className={tdCls}>
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-blue-tint text-xs font-bold text-brand-blue">
                        {(m.name?.[0] ?? "?").toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-fg">{m.name || "Unnamed"}</p>
                        {meta && <p className="truncate text-xs text-fg-muted">{meta}</p>}
                      </div>
                    </div>
                  </td>
                  <td className={`${tdCls} whitespace-nowrap font-mono text-xs text-fg-muted`}>{m.code || "—"}</td>
                  <td className={`${tdCls} whitespace-nowrap`}>{m.mobile || "—"}</td>
                  <td className={`${tdCls} whitespace-nowrap`}>
                    {acc && (acc.salary || acc.allowance || acc.deduction) ? (
                      <span className="font-semibold text-fg">{taka(acc.salary + acc.allowance - acc.deduction)}</span>
                    ) : (
                      <span className="text-fg-faint">—</span>
                    )}
                  </td>
                  <td className={tdCls}>
                    {acc && role ? (
                      canEditRoles ? (
                        <RoleSelect memberId={acc.id} name={m.name || "this member"} current={role} isSelf={acc.id === me.id} />
                      ) : (
                        <Badge tone={ROLE_TONE[role]}>{role}</Badge>
                      )
                    ) : (
                      <Badge tone="neutral">no login</Badge>
                    )}
                  </td>
                  <td className={tdCls}>
                    {acc ? (
                      <Badge tone={STATUS_TONE[acc.status] ?? "neutral"}>{acc.status || "active"}</Badge>
                    ) : (
                      <span className="text-fg-faint">—</span>
                    )}
                  </td>
                  {canManageStaff && (
                    <td className={tdCls}>
                      {acc ? (
                        // Admin can edit ANY profile — including their own
                        // (name, salary, etc.) — but can't delete themselves.
                        <StaffRowActions
                          canDelete={acc.id !== me.id}
                          member={{
                            id: acc.id,
                            name: acc.name,
                            mobile: acc.mobile,
                            email: acc.email,
                            employee_code: acc.employee_code,
                            salary: acc.salary,
                            allowance: acc.allowance,
                            deduction: acc.deduction,
                            status: acc.status || "active",
                            investor_ref: acc.investor_ref,
                          } satisfies StaffMember}
                        />
                      ) : (
                        <CreateLoginButton
                          prefill={{ name: m.name, mobile: m.mobile, employee_code: m.code, role: roleFromTitle(m.designation ?? "") }}
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
