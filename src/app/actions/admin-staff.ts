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
  requireOwner,
  getAdmin,
  logAudit,
  runAction,
  ValidationError,
  type ActionResult,
} from "@/lib/admin-guard";
import type { Role } from "@/lib/auth";
import { refForMember } from "@/lib/staff-directory";
import { STAFF_ROSTER } from "@/lib/staff-roster";

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
    await requireOwner(); // role changes are owner-only
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

    if (!input.password || input.password.length < 6) {
      throw new ValidationError("Password must be at least 6 characters.");
    }

    const username = input.username?.trim().toLowerCase() || null;
    const email = input.email?.trim() || null;
    if (email && !EMAIL_RE.test(email)) throw new ValidationError("Email format is invalid.");

    // Login id: a mobile (→ synthetic auth email) OR, for dashboard staff who
    // sign in with EMAIL, the real email itself (no mobile needed). So someone
    // who's already an investor (a mobile account) can get a SEPARATE admin
    // account keyed by their email — no collision with their investment.
    const mobileRaw = (input.mobile ?? "").trim();
    let mobile: string | null = null;
    let authEmail: string;
    if (mobileRaw) {
      mobile = normalizeBdMobile(mobileRaw);
      if (!mobile) throw new ValidationError("Enter a valid Bangladeshi mobile (01XXXXXXXXX), or leave it blank and use email as the login.");
      authEmail = syntheticEmail(mobile);
    } else {
      if (!email) throw new ValidationError("Give an email (the dashboard login) or a mobile number.");
      authEmail = email.toLowerCase();
    }

    const role: Role = ROLES.includes(input.role as Role) ? (input.role as Role) : "staff";
    const employee_code = input.employee_code?.trim() || (await nextEmployeeCode(admin));

    // Create the auth user (email pre-confirmed, never mailed).  The
    // on_auth_user_created trigger seeds public.profiles.
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email: authEmail,
      password: input.password,
      email_confirm: true,
      user_metadata: { name, mobile, username, email },
    });
    if (cErr || !created?.user) {
      const m = cErr?.message?.toLowerCase() ?? "";
      if (m.includes("already") || m.includes("registered") || m.includes("exists")) {
        throw new ValidationError(
          mobile
            ? "An account with this mobile already exists."
            : "An account with this email already exists.",
        );
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

/** Set (upsert) one employee's attendance for a date, keyed by the
 *  stable staff_ref (roster employee code, or uid:<id>).  Works for
 *  roster employees with NO login account.  Manager+ only. */
export async function setStaffAttendance(
  ref: string,
  date: string,
  status: AttendanceStatus,
  note?: string,
  opts?: { memberId?: string | null; name?: string | null },
): Promise<ActionResult> {
  return runAction(async () => {
    await requireManager();
    if (!ref) throw new Error("Missing staff");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Invalid date");
    if (!ATTENDANCE_STATUSES.includes(status)) throw new Error("Invalid status");

    const admin = getAdmin();
    if (!admin) throw new Error("Data unavailable");

    const { error } = await admin.from("attendance").upsert(
      {
        staff_ref: ref,
        member_id: opts?.memberId ?? null,
        date,
        status,
        note: note?.trim() || null,
      },
      { onConflict: "staff_ref,date" },
    );
    if (error) throw new Error(error.message);

    await logAudit({
      action: "update",
      entity: "attendance",
      entityId: ref,
      detail: `Marked ${opts?.name ?? ref} ${status} on ${date}`,
    });
    revalidatePath("/dashboard/attendance");
    return { message: "Attendance saved." };
  });
}

export type AttendanceEntry = {
  ref: string;
  memberId?: string | null;
  status: AttendanceStatus;
};

/** Save the whole roster for a date in ONE batch (the bulk-marking UI).
 *  Manager+ only.  Upserts every entry keyed by staff_ref. */
export async function saveAttendanceBatch(
  date: string,
  entries: AttendanceEntry[],
): Promise<ActionResult<{ saved: number }>> {
  return runAction(async () => {
    await requireManager();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ValidationError("Invalid date.");
    const admin = getAdmin();
    if (!admin) throw new Error("Data unavailable");

    const rows = (entries ?? [])
      .filter((e) => e.ref && ATTENDANCE_STATUSES.includes(e.status))
      .map((e) => ({
        staff_ref: e.ref,
        member_id: e.memberId ?? null,
        date,
        status: e.status,
      }));
    if (rows.length === 0) throw new ValidationError("Nothing to save.");

    const { error } = await admin.from("attendance").upsert(rows, { onConflict: "staff_ref,date" });
    if (error) throw new Error(error.message);

    await logAudit({
      action: "bulk_update",
      entity: "attendance",
      detail: `Saved attendance for ${rows.length} staff on ${date}`,
    });
    revalidatePath("/dashboard/attendance");
    return { data: { saved: rows.length }, message: `Saved attendance for ${rows.length} staff.` };
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
    const ref = refForMember({ id: me.id, mobile: me.mobile });

    // Fetch the caller's own row for today (if any).
    const { data: existing, error: readErr } = await admin
      .from("attendance")
      .select("id, check_in, check_out, status")
      .eq("staff_ref", ref)
      .eq("date", today)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);

    if (kind === "in") {
      if (existing?.check_in) return { message: "Already checked in." };
      // Late if checking in after 10:00 local.
      const late = new Date().getHours() >= 10;
      const { error } = await admin.from("attendance").upsert(
        {
          staff_ref: ref,
          member_id: me.id,
          date: today,
          check_in: nowIso,
          status: late ? "late" : "present",
        },
        { onConflict: "staff_ref,date" },
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
        .eq("staff_ref", ref)
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

// ── ZKTeco fingerprint import ──────────────────────────────────────
// The K40/K50/K60/K90 series export an attendance log (CSV / TSV / TXT
// / .dat) of punches: an employee code + a date + a time per row.  We
// fold the punches per (employee, day) — earliest = check-in, latest =
// check-out — match the device's code to a roster employee code, and
// upsert one attendance row per day.  Unknown codes are reported, never
// fatal.  Dependency-free parser (no xlsx) — exports save as CSV/TXT.

export type ImportSummary = {
  imported: number;
  rows: number;
  unknownCodes: string[];
  preview: { code: string; name: string; date: string; status: string }[];
};

const normCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

/** Split a CSV/TSV/whitespace line into trimmed, unquoted cells. */
function splitLine(line: string, delim: "," | "\t" | "ws"): string[] {
  if (delim === "ws") return line.trim().split(/\s+/);
  return line.split(delim).map((c) => c.trim().replace(/^"|"$/g, ""));
}

function detectDelim(line: string): "," | "\t" | "ws" {
  if (line.includes(",")) return ",";
  if (line.includes("\t")) return "\t";
  return "ws";
}

/** Build a real calendar ISO date, or null for an impossible one (so a
 *  garbage punch is skipped instead of throwing RangeError later). */
function isoIfValid(y: number, mo: number, d: number): string | null {
  if (!Number.isFinite(y) || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const iso = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const t = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(t.getTime()) || t.getUTCMonth() + 1 !== mo || t.getUTCDate() !== d) return null;
  return iso;
}

function normDate(input: string): string | null {
  const s = (input || "").trim();
  if (!s) return null;
  // ISO YYYY-MM-DD (still validate the actual day/month).
  const isoM = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoM) return isoIfValid(+isoM[1], +isoM[2], +isoM[3]);
  // YYYY/MM/DD or YYYY.MM.DD
  const ymd = s.match(/^(\d{4})[/.](\d{1,2})[/.](\d{1,2})/);
  if (ymd) return isoIfValid(+ymd[1], +ymd[2], +ymd[3]);
  // D/M/Y or M/D/Y — disambiguate: a field > 12 can only be the day.
  const dm = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (dm) {
    const a = +dm[1];
    const b = +dm[2];
    const y = dm[3].length === 2 ? 2000 + +dm[3] : +dm[3];
    const monthFirst = b > 12 && a <= 12; // US M/D export
    const day = monthFirst ? b : a;
    const mo = monthFirst ? a : b;
    return isoIfValid(y, mo, day);
  }
  return null;
}

function normTime(input: string): string | null {
  const m = (input || "").match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  const [, h, mi, se] = m;
  return `${h.padStart(2, "0")}:${mi.padStart(2, "0")}:${(se ?? "00").padStart(2, "0")}`;
}

const ID_ALIASES = ["enrollno", "enrollnumber", "userid", "usrid", "empid", "employeeid", "employeecode", "acno", "pin", "code", "id", "user"];
const DATE_ALIASES = ["date", "attendancedate", "punchdate"];
const TIME_ALIASES = ["time", "punchtime", "intime", "checkin", "clockin", "onduty"];
const DT_ALIASES = ["datetime", "timestamp", "punchdatetime"];

type Punch = { code: string; date: string; earliest: string | null; latest: string | null };

/** Parse the export into folded per-(code, date) punches. */
function parsePunches(text: string): {
  punches: Map<string, Punch>;
  total: number;
} {
  const lines = text
    .replace(/﻿/g, "")
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "");
  const punches = new Map<string, Punch>();
  if (!lines.length) return { punches, total: 0 };

  const delim = detectDelim(lines[0]);
  const head = splitLine(lines[0], delim).map((c) => c.toLowerCase().replace(/[^a-z0-9]/g, ""));

  // Treat row 0 as a header only if it names known columns and isn't itself data.
  const findCol = (aliases: string[]) => head.findIndex((h) => aliases.includes(h));
  let idCol = -1;
  for (const a of ID_ALIASES) {
    const i = head.indexOf(a);
    if (i !== -1) { idCol = i; break; }
  }
  const dateCol = findCol(DATE_ALIASES);
  const timeCol = findCol(TIME_ALIASES);
  const dtCol = findCol(DT_ALIASES);
  const hasHeader = idCol !== -1 && (dateCol !== -1 || dtCol !== -1);
  const start = hasHeader ? 1 : 0;

  let total = 0;
  for (let i = start; i < lines.length; i++) {
    const cells = splitLine(lines[i], delim);
    if (!cells.length) continue;

    let code = "";
    let date: string | null = null;
    let time: string | null = null;

    if (hasHeader) {
      code = (cells[idCol] ?? "").trim();
      const dCell = dateCol !== -1 ? cells[dateCol] ?? "" : "";
      const tCell = timeCol !== -1 ? cells[timeCol] ?? "" : "";
      date = normDate(dCell);
      time = normTime(tCell);
      if ((!date || !time) && dtCol !== -1) {
        const dt = cells[dtCol] ?? "";
        if (!date) date = normDate(dt);
        if (!time) time = normTime(dt);
      }
    } else {
      // Positional / raw .dat: first cell is the code; scan the rest for
      // a date and a time (a combined datetime cell yields both).
      code = (cells[0] ?? "").trim();
      for (let c = 1; c < cells.length; c++) {
        if (!date) date = normDate(cells[c]);
        if (!time) time = normTime(cells[c]);
      }
    }

    if (!code || !date) continue;
    total++;

    const key = `${normCode(code)}::${date}`;
    let cur = punches.get(key);
    if (!cur) {
      cur = { code, date, earliest: null, latest: null };
      punches.set(key, cur);
    }
    // A timeless punch still marks the day present, but must NOT corrupt
    // the earliest/latest fold (which drives check-in + late detection).
    if (time) {
      if (!cur.earliest || time < cur.earliest) cur.earliest = time;
      if (!cur.latest || time > cur.latest) cur.latest = time;
    }
  }
  return { punches, total };
}

export async function importAttendance(formData: FormData): Promise<ActionResult<ImportSummary>> {
  return runAction(async () => {
    await requireManager();
    const admin = getAdmin();
    if (!admin) throw new Error("Data unavailable");

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw new ValidationError("Upload the device export (CSV / TXT).");
    }
    if (file.size > 8 * 1024 * 1024) {
      throw new ValidationError("File over 8 MB — split a large export by day.");
    }
    const lateAfterRaw = String(formData.get("late_after") ?? "").trim();
    const lateAfter = /^\d{2}:\d{2}$/.test(lateAfterRaw) ? `${lateAfterRaw}:00` : null;
    const onlyDateRaw = String(formData.get("only_date") ?? "").trim();
    const onlyDate = /^\d{4}-\d{2}-\d{2}$/.test(onlyDateRaw) ? onlyDateRaw : null;

    const text = await file.text();
    const { punches, total } = parsePunches(text);
    if (total === 0) {
      throw new ValidationError("No punches found — the file needs an employee code + a date per row.");
    }

    // Match device codes to roster employee codes (case/spacing/hyphen
    // insensitive).  This is the staff_ref we key attendance on.
    const codeToRoster = new Map<string, { idNo: string; name: string }>();
    for (const e of STAFF_ROSTER) codeToRoster.set(normCode(e.idNo), { idNo: e.idNo, name: e.name });

    const unknown = new Set<string>();
    const rowsToWrite: {
      staff_ref: string;
      date: string;
      status: AttendanceStatus;
      check_in: string | null;
      check_out: string | null;
      note: string;
    }[] = [];
    const preview: ImportSummary["preview"] = [];

    // Build a BD-local timestamp; null if the time is missing/invalid.
    const stamp = (date: string, time: string | null): string | null => {
      if (!time) return null;
      const d = new Date(`${date}T${time}+06:00`);
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    };

    for (const p of punches.values()) {
      if (onlyDate && p.date !== onlyDate) continue;
      const hit = codeToRoster.get(normCode(p.code));
      if (!hit) {
        unknown.add(p.code);
        continue;
      }
      // Late only when we actually have a check-in time after the cutoff.
      const status: AttendanceStatus = lateAfter && p.earliest && p.earliest > lateAfter ? "late" : "present";
      const checkIn = stamp(p.date, p.earliest);
      const checkOut = p.latest && p.latest !== p.earliest ? stamp(p.date, p.latest) : null;
      rowsToWrite.push({
        staff_ref: hit.idNo,
        date: p.date,
        status,
        check_in: checkIn,
        check_out: checkOut,
        note: "Imported from device",
      });
      if (preview.length < 6) preview.push({ code: hit.idNo, name: hit.name, date: p.date, status });
    }

    if (rowsToWrite.length === 0) {
      throw new ValidationError(
        unknown.size > 0
          ? `No codes matched the roster. Device codes seen: ${Array.from(unknown).slice(0, 8).join(", ")}. Set each employee's code to match the device.`
          : "Nothing to import for the chosen filters.",
      );
    }

    const { error } = await admin.from("attendance").upsert(rowsToWrite, { onConflict: "staff_ref,date" });
    if (error) throw new Error(error.message);

    await logAudit({
      action: "bulk_import",
      entity: "attendance",
      detail: `Imported ${rowsToWrite.length} attendance rows from device (${total} punches, ${unknown.size} unknown codes)`,
    });
    revalidatePath("/dashboard/attendance");

    return {
      data: {
        imported: rowsToWrite.length,
        rows: total,
        unknownCodes: Array.from(unknown).slice(0, 50),
        preview,
      },
      message: `Imported ${rowsToWrite.length} day(s) of attendance.`,
    };
  });
}
