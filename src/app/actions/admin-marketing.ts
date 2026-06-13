"use server";

/** Server Actions for the Marketing section (overview + client follow-up).
 *
 *  All mutations: assert role → validate → write via service-role client →
 *  audit → revalidate → return through runAction so client forms get a
 *  consistent ActionResult shape. */

import { revalidatePath } from "next/cache";
import {
  requireStaff,
  requireManager,
  getAdmin,
  logAudit,
  runAction,
  AuthzError,
  type ActionResult,
} from "@/lib/admin-guard";
import { isManager } from "@/lib/auth";
import { FOLLOWUP_STATUSES, type FollowupStatus } from "@/app/admin/marketing/status";

function isStatus(v: unknown): v is FollowupStatus {
  return typeof v === "string" && (FOLLOWUP_STATUSES as readonly string[]).includes(v);
}

/** Empty string → null; trims everything else. */
function clean(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

/** Validate a YYYY-MM-DD date string (from <input type="date">). */
function cleanDate(v: string | null | undefined): string | null {
  const t = clean(v);
  if (!t) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) throw new AuthzError("Invalid date");
  return t;
}

function bothPaths() {
  revalidatePath("/admin/marketing");
  revalidatePath("/admin/marketing/followup");
}

/** Create a follow-up.  Any staff may add; created_by = caller. */
export async function addFollowup(input: {
  client_name: string;
  mobile?: string | null;
  email?: string | null;
  interest?: string | null;
  source?: string | null;
  status?: string | null;
  assigned_to?: string | null;
  next_followup?: string | null;
  note?: string | null;
}): Promise<ActionResult> {
  return runAction(async () => {
    const me = await requireStaff();
    const admin = getAdmin();
    if (!admin) throw new Error("no db");

    const client_name = clean(input.client_name);
    if (!client_name) throw new AuthzError("Client name is required");

    const status = isStatus(input.status) ? input.status : "new";

    const { data, error } = await admin
      .from("client_followups")
      .insert({
        client_name,
        mobile: clean(input.mobile),
        email: clean(input.email),
        interest: clean(input.interest),
        source: clean(input.source),
        status,
        assigned_to: clean(input.assigned_to),
        next_followup: cleanDate(input.next_followup),
        note: clean(input.note),
        created_by: me.id,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await logAudit({
      action: "create",
      entity: "client_followup",
      entityId: data.id,
      detail: `Added follow-up for ${client_name}`,
    });
    bothPaths();
    return { message: "Follow-up added" };
  });
}

/** Update status / next_followup / assignment / note.
 *  Plain staff may edit only rows they created or are assigned to;
 *  managers and admins may edit any row. */
export async function updateFollowup(
  id: string,
  patch: {
    status?: string | null;
    next_followup?: string | null;
    assigned_to?: string | null;
    note?: string | null;
  },
): Promise<ActionResult> {
  return runAction(async () => {
    const me = await requireStaff();
    const admin = getAdmin();
    if (!admin) throw new Error("no db");

    const rowId = clean(id);
    if (!rowId) throw new AuthzError("Missing follow-up id");

    // Authorise against the existing row.
    const { data: existing, error: readErr } = await admin
      .from("client_followups")
      .select("id, client_name, created_by, assigned_to")
      .eq("id", rowId)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!existing) throw new AuthzError("Follow-up not found");

    const owns =
      existing.created_by === me.id || existing.assigned_to === me.id;
    if (!isManager(me.role) && !owns) {
      throw new AuthzError("You can only edit your own follow-ups");
    }

    // Build the update from only the provided fields.
    const update: {
      status?: string;
      next_followup?: string | null;
      assigned_to?: string | null;
      note?: string | null;
    } = {};

    if (patch.status !== undefined) {
      if (!isStatus(patch.status)) throw new AuthzError("Invalid status");
      update.status = patch.status;
    }
    if (patch.next_followup !== undefined) {
      update.next_followup = cleanDate(patch.next_followup);
    }
    if (patch.assigned_to !== undefined) {
      update.assigned_to = clean(patch.assigned_to);
    }
    if (patch.note !== undefined) {
      update.note = clean(patch.note);
    }

    if (Object.keys(update).length === 0) {
      return { message: "Nothing to update" };
    }

    const { error } = await admin
      .from("client_followups")
      .update(update)
      .eq("id", rowId);
    if (error) throw new Error(error.message);

    await logAudit({
      action: "update",
      entity: "client_followup",
      entityId: rowId,
      detail: `Updated follow-up for ${existing.client_name} (${Object.keys(update).join(", ")})`,
    });
    bothPaths();
    return { message: "Follow-up updated" };
  });
}

/** Convert an inbound contact submission into a tracked follow-up. */
export async function convertLead(
  contactSubmissionId: string,
): Promise<ActionResult> {
  return runAction(async () => {
    const me = await requireStaff();
    const admin = getAdmin();
    if (!admin) throw new Error("no db");

    const subId = clean(contactSubmissionId);
    if (!subId) throw new AuthzError("Missing submission id");

    const { data: sub, error: readErr } = await admin
      .from("contact_submissions")
      .select("id, name, email, phone, interest, source")
      .eq("id", subId)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!sub) throw new AuthzError("Submission not found");

    const { data, error } = await admin
      .from("client_followups")
      .insert({
        client_name: clean(sub.name) ?? "Unknown",
        mobile: clean(sub.phone),
        email: clean(sub.email),
        interest: clean(sub.interest),
        source: clean(sub.source) ?? "contact form",
        status: "new",
        created_by: me.id,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await logAudit({
      action: "convert",
      entity: "client_followup",
      entityId: data.id,
      detail: `Converted lead "${sub.name}" to a follow-up`,
    });
    bothPaths();
    return { message: "Lead converted to follow-up" };
  });
}
