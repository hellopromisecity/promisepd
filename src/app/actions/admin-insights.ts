"use server";

/** Server Actions for the Insights section (Message box).
 *
 *  The audit log is read-only, so the only mutation here is staff
 *  submitting their daily report into `daily_reports`. */

import { revalidatePath } from "next/cache";
import {
  requireStaff,
  getAdmin,
  logAudit,
  runAction,
  type ActionResult,
} from "@/lib/admin-guard";
import { isManager } from "@/lib/auth";

/** Submit (or re-submit) the signed-in member's daily report. */
export async function submitReport(input: {
  report_date: string;
  body: string;
}): Promise<ActionResult> {
  return runAction(async () => {
    const me = await requireStaff();

    const body = (input.body ?? "").trim();
    if (!body) throw new Error("Report can't be empty.");

    // Today only (the owner's rule, 2026-11-07): a report is for the day it
    // is written — nobody back-fills yesterday. The day is the Bangladesh
    // calendar day; the form shows the same date, locked.
    const todayBD = new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 10);
    const sent = typeof input.report_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.report_date) ? input.report_date : todayBD;
    if (sent !== todayBD && !me.isOwner) throw new Error(`Reports can only be filed for today (${todayBD}).`);
    const report_date = sent;

    const admin = getAdmin();
    if (!admin) throw new Error("Database isn't configured.");

    const { error } = await admin.from("daily_reports").insert({
      member_id: me.id,
      report_date,
      body,
    });
    if (error) throw new Error(error.message);

    await logAudit({
      action: "create",
      entity: "daily_report",
      detail: `Submitted daily report for ${report_date}`,
      actor: { id: me.id, name: me.name },
    });

    revalidatePath("/dashboard/report");
    return { message: "Report submitted." };
  });
}

/** Delete one or many daily reports. Managers/admins may delete anyone's;
 *  a plain staff member may only delete their own. */
export async function deleteReports(ids: string[]): Promise<ActionResult> {
  return runAction(async () => {
    const me = await requireStaff();
    const admin = getAdmin();
    if (!admin) throw new Error("Database isn't configured.");
    const clean = (ids ?? []).filter((x) => typeof x === "string" && x);
    if (!clean.length) throw new Error("Nothing selected.");

    // A submitted report is final for the person who wrote it (the owner's
    // rule, 2026-11-07): only managers delete, and never their own — the MD
    // (owner login) may delete anything.
    if (!isManager(me.role)) throw new Error("A submitted report can't be deleted or edited.");
    const { data: owned } = await admin.from("daily_reports").select("id, member_id").in("id", clean);
    if (!me.isOwner && (owned ?? []).some((r) => r.member_id === me.id)) throw new Error("You can't delete your own submitted reports.");
    const { error } = await admin.from("daily_reports").delete().in("id", clean);
    if (error) throw new Error(error.message);

    await logAudit({
      action: "delete",
      entity: "daily_report",
      detail: `Deleted ${clean.length} daily report(s)`,
      actor: { id: me.id, name: me.name },
    });
    revalidatePath("/dashboard/report");
    return { message: `Deleted ${clean.length} report${clean.length > 1 ? "s" : ""}.` };
  });
}
