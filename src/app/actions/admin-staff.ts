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
  type ActionResult,
} from "@/lib/admin-guard";
import type { Role } from "@/lib/auth";

const ROLES: Role[] = ["member", "staff", "manager", "admin"];
const ATTENDANCE_STATUSES = ["present", "late", "absent", "leave", "holiday"] as const;
type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

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
