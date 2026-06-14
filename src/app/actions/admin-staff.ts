"use server";

/** Server Actions for the Staff + Attendance admin sections.
 *
 *  Every mutation runs through runAction (so client forms get a
 *  consistent ActionResult), asserts the caller's role first, writes
 *  through the service-role client, audit-logs, then revalidates the
 *  relevant route. */

import { revalidatePath } from "next/cache";
import {
  requireStaff,
  requireManager,
  requireAdmin,
  getAdmin,
  logAudit,
  runAction,
  ValidationError,
  type ActionResult,
} from "@/lib/admin-guard";
import type { Role } from "@/lib/auth";

const ROLES: Role[] = ["member", "staff", "manager", "admin"];
const ATTENDANCE_STATUSES = ["present", "late", "absent", "leave", "holiday"] as const;
type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];
const STAFF_STATUSES = ["active", "inactive", "suspended"] as const;
type StaffStatus = (typeof STAFF_STATUSES)[number];

// ── Staff identity helpers (mirror src/app/actions/auth.ts) ────────
// Members log in with a synthetic email derived from their canonical
// mobile; admin-created staff use the same scheme so they can sign in
// with mobile + password right away.
const AUTH_EMAIL_DOMAIN = "users.promisepd.app";
const syntheticEmail = (mobile: string) => `${mobile}@${AUTH_EMAIL_DOMAIN}`;

function normalizeBdMobile(raw: string): string | null {
  let digits = (raw || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 13 && digits.startsWith("8801")) return digits;
  if (digits.length === 11 && digits.startsWith("01")) return `880${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith("1")) return `8801${digits.slice(1)}`;
  return null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const money = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0;
};

export type StaffInput = {
  name: string;
  mobile: string;
  username?: string;
  email?: string;
  password?: string;
  role?: Role;
  employee_code?: string;
  salary?: number | string;
  allowance?: number | string;
  deduction?: number | string;
  status?: StaffStatus;
};

/** Next free numeric employee code (100, 101, …) for blank submissions. */
async function nextEmployeeCode(
  admin: NonNullable<ReturnType<typeof getAdmin>>,
): Promise<string> {
  const { data } = await admin
    .from("profiles")
    .select("employee_code")
    .not("employee_code", "is", null);
  let max = 99;
  for (const r of data ?? []) {
    const n = parseInt((r as { employee_code: string | null }).employee_code ?? "", 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return String(max + 1);
}

/** Change a member's role.  Admin-only.  Guards against demoting the
 *  last remaining admin (which would lock everyone out of role
 *  management). */
export async function setRole(memberId: string, role: Role): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdmin();
    if (!memberId) throw new Error("Missing member");
    if (!ROLES.includes(role)) throw new Error("Invalid role");

    const admin = getAdmin();
    if (!admin) throw new Error("Data unavailable");

    // Read the target's current role so we can detect a no-op and the
    // last-admin case.
    const { data: target, error: readErr } = await admin
      .from("profiles")
      .select("id, name, role")
      .eq("id", memberId)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!target) throw new Error("Member not found");
    if (target.role === role) return { message: "No change." };

    // Never let the only admin be demoted.
    if (target.role === "admin" && role !== "admin") {
      const { count, error: cErr } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");
      if (cErr) throw new Error(cErr.message);
      if ((count ?? 0) <= 1) {
        throw new Error("Can't demote the last admin. Promote another admin first.");
      }
    }

    const { error } = await admin.from("profiles").update({ role }).eq("id", memberId);
    if (error) throw new Error(error.message);

    await logAudit({
      action: "update",
      entity: "profile",
      entityId: memberId,
      detail: `Set role of ${target.name || "member"} to ${role}`,
    });
    revalidatePath("/dashboard/staff");
    return { message: "Role updated." };
  });
}

/** Create a staff member directly (admin hands out mobile + password).
 *  Mirrors the public signup: an auth user under the synthetic email,
 *  then the profile is filled with role / employee code / salary. */
export async function createStaff(input: StaffInput): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    await requireAdmin();
    const admin = getAdmin();
    if (!admin) throw new Error("Data unavailable");

    const name = input.name?.trim();
    if (!name || name.length < 2) throw new ValidationError("Full name is required.");

    const mobile = normalizeBdMobile(input.mobile ?? "");
    if (!mobile) throw new ValidationError("Enter a valid Bangladeshi mobile (01XXXXXXXXX).");

    if (!input.password || input.password.length < 6) {
      throw new ValidationError("Password must be at least 6 characters.");
    }

    const role: Role = ROLES.includes(input.role as Role) ? (input.role as Role) : "staff";
    const username = input.username?.trim().toLowerCase() || null;
    const email = input.email?.trim() || null;
    if (email && !EMAIL_RE.test(email)) throw new ValidationError("Email format is invalid.");

    const employee_code = input.employee_code?.trim() || (await nextEmployeeCode(admin));

    // Create the auth user (synthetic email, pre-confirmed).  The
    // on_auth_user_created trigger seeds public.profiles.
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email: syntheticEmail(mobile),
      password: input.password,
      email_confirm: true,
      user_metadata: { name, mobile, username, email },
    });
    if (cErr || !created?.user) {
      const m = cErr?.message?.toLowerCase() ?? "";
      if (m.includes("already") || m.includes("registered") || m.includes("exists")) {
        throw new ValidationError("An account with this mobile already exists.");
      }
      throw cErr ?? new Error("Could not create the user.");
    }
    const id = created.user.id;

    // Upsert the profile so the row is correct whether or not the
    // trigger has run yet.
    const { error: uErr } = await admin.from("profiles").upsert(
      {
        id,
        name,
        mobile,
        username,
        email,
        role,
        employee_code,
        salary: money(input.salary),
        allowance: money(input.allowance),
        deduction: money(input.deduction),
        status: STAFF_STATUSES.includes(input.status as StaffStatus) ? input.status : "active",
      },
      { onConflict: "id" },
    );
    if (uErr) {
      // Roll back the orphaned auth user so a retry can succeed.
      await admin.auth.admin.deleteUser(id).catch(() => {});
      if (/duplicate key|unique/i.test(uErr.message)) {
        throw new ValidationError("That mobile or username is already taken.");
      }
      throw new Error(uErr.message);
    }

    await logAudit({ action: "create", entity: "profile", entityId: id, detail: `Added staff ${name} (${role})` });
    revalidatePath("/dashboard/staff");
    revalidatePath("/dashboard/attendance");
    return { data: { id }, message: "Staff member added." };
  });
}

/** Edit a staff member's details + salary.  Does NOT touch mobile (the
 *  login key), username, or role — role changes go through setRole, and
 *  identity is fixed at creation. */
export async function updateStaff(id: string, input: StaffInput): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdmin();
    if (!id) throw new ValidationError("Missing member.");
    const admin = getAdmin();
    if (!admin) throw new Error("Data unavailable");

    const name = input.name?.trim();
    if (!name || name.length < 2) throw new ValidationError("Full name is required.");
    const email = input.email?.trim() || null;
    if (email && !EMAIL_RE.test(email)) throw new ValidationError("Email format is invalid.");
    const status: StaffStatus = STAFF_STATUSES.includes(input.status as StaffStatus)
      ? (input.status as StaffStatus)
      : "active";

    const { error } = await admin
      .from("profiles")
      .update({
        name,
        email,
        employee_code: input.employee_code?.trim() || null,
        salary: money(input.salary),
        allowance: money(input.allowance),
        deduction: money(input.deduction),
        status,
      })
      .eq("id", id);
    if (error) {
      if (/duplicate key|unique/i.test(error.message)) {
        throw new ValidationError("That email is already in use.");
      }
      throw new Error(error.message);
    }

    // Keep the auth user's contact email in sync when one is set.
    if (email) await admin.auth.admin.updateUserById(id, { email }).catch(() => {});

    await logAudit({ action: "update", entity: "profile", entityId: id, detail: `Updated staff ${name}` });
    revalidatePath("/dashboard/staff");
    return { message: "Staff member saved." };
  });
}

/** Remove a staff member entirely (auth user + profile).  Can't delete
 *  yourself or the last remaining admin. */
export async function deleteStaff(id: string): Promise<ActionResult> {
  return runAction(async () => {
    const me = await requireAdmin();
    if (!id) throw new ValidationError("Missing member.");
    if (id === me.id) throw new ValidationError("You can't delete your own account.");
    const admin = getAdmin();
    if (!admin) throw new Error("Data unavailable");

    const { data: target } = await admin
      .from("profiles")
      .select("name, role")
      .eq("id", id)
      .maybeSingle();

    if (target?.role === "admin") {
      const { count } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");
      if ((count ?? 0) <= 1) {
        throw new ValidationError("Can't delete the last admin. Promote another admin first.");
      }
    }

    // Deleting the auth user cascades to the profile; delete the profile
    // too as a belt-and-braces in case the FK isn't ON DELETE CASCADE.
    await admin.from("profiles").delete().eq("id", id);
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error && !/not found/i.test(error.message)) throw new Error(error.message);

    await logAudit({
      action: "delete",
      entity: "profile",
      entityId: id,
      detail: target ? `Deleted staff ${target.name}` : `Deleted staff ${id}`,
    });
    revalidatePath("/dashboard/staff");
    revalidatePath("/dashboard/attendance");
    return { message: "Staff member removed." };
  });
}

/** Set (upsert) a staff member's attendance for a given date.
 *  Manager+ only — used by the team view. */
export async function setAttendance(
  memberId: string,
  date: string,
  status: AttendanceStatus,
  note?: string,
): Promise<ActionResult> {
  return runAction(async () => {
    await requireManager();
    if (!memberId) throw new Error("Missing member");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Invalid date");
    if (!ATTENDANCE_STATUSES.includes(status)) throw new Error("Invalid status");

    const admin = getAdmin();
    if (!admin) throw new Error("Data unavailable");

    const { error } = await admin
      .from("attendance")
      .upsert(
        {
          member_id: memberId,
          date,
          status,
          note: note?.trim() || null,
        },
        { onConflict: "member_id,date" },
      );
    if (error) throw new Error(error.message);

    await logAudit({
      action: "update",
      entity: "attendance",
      entityId: memberId,
      detail: `Marked ${status} on ${date}`,
    });
    revalidatePath("/dashboard/attendance");
    return { message: "Attendance saved." };
  });
}

/** Self check-in / check-out for today.  Staff-only, and may only ever
 *  touch the caller's own attendance row. */
export async function setOwnCheck(kind: "in" | "out"): Promise<ActionResult> {
  return runAction(async () => {
    const me = await requireStaff();
    if (kind !== "in" && kind !== "out") throw new Error("Invalid action");

    const admin = getAdmin();
    if (!admin) throw new Error("Data unavailable");

    const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, local
    const nowIso = new Date().toISOString();

    // Fetch the caller's own row for today (if any).
    const { data: existing, error: readErr } = await admin
      .from("attendance")
      .select("id, check_in, check_out, status")
      .eq("member_id", me.id)
      .eq("date", today)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);

    if (kind === "in") {
      if (existing?.check_in) return { message: "Already checked in." };
      // Late if checking in after 10:00 local.
      const late = new Date().getHours() >= 10;
      const { error } = await admin.from("attendance").upsert(
        {
          member_id: me.id,
          date: today,
          check_in: nowIso,
          status: late ? "late" : "present",
        },
        { onConflict: "member_id,date" },
      );
      if (error) throw new Error(error.message);
      await logAudit({
        action: "check_in",
        entity: "attendance",
        entityId: me.id,
        detail: `Self check-in on ${today}`,
      });
    } else {
      if (!existing?.check_in) throw new Error("Check in first.");
      if (existing.check_out) return { message: "Already checked out." };
      const { error } = await admin
        .from("attendance")
        .update({ check_out: nowIso })
        .eq("member_id", me.id)
        .eq("date", today);
      if (error) throw new Error(error.message);
      await logAudit({
        action: "check_out",
        entity: "attendance",
        entityId: me.id,
        detail: `Self check-out on ${today}`,
      });
    }

    revalidatePath("/dashboard/attendance");
    return { message: kind === "in" ? "Checked in." : "Checked out." };
  });
}
