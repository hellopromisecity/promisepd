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
import { OFFICER_TYPES, type OfficerType } from "@/lib/marketing";

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

// ── Marketing officers + points (leaderboard) ─────────────────────

const VALID_TYPES = new Set(OFFICER_TYPES.map((t) => t.code));

/** Round to 2 decimals (points can be fractional, e.g. 0.20). */
const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

function revalidateLeaderboard() {
  revalidatePath("/admin/marketing");
  revalidatePath("/leaderboard");
  revalidatePath("/en/leaderboard");
}

export type OfficerInput = {
  name: string;
  officer_type: OfficerType;
  position?: string;
  officer_code?: string;
  district?: string;
  mobile?: string;
  reference?: string;
};

/** Add a marketing officer (MO / AMO / MD / HM). */
export async function addOfficer(input: OfficerInput): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    await requireManager();
    const admin = getAdmin();
    if (!admin) throw new Error("Database is not configured.");

    const name = (input.name ?? "").trim();
    if (!name) throw new Error("Officer name is required.");
    const type = VALID_TYPES.has(input.officer_type) ? input.officer_type : "MO";

    const { data, error } = await admin
      .from("marketing_officers")
      .insert({
        name,
        officer_type: type,
        position: clean(input.position),
        officer_code: clean(input.officer_code),
        district: clean(input.district),
        mobile: clean(input.mobile),
        reference: clean(input.reference),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await logAudit({ action: "create", entity: "marketing_officer", entityId: data.id, detail: `Added ${type} “${name}”` });
    revalidateLeaderboard();
    return { data: { id: data.id }, message: "Officer added." };
  });
}

export async function updateOfficer(id: string, input: OfficerInput): Promise<ActionResult> {
  return runAction(async () => {
    await requireManager();
    if (!id) throw new Error("Missing officer id.");
    const admin = getAdmin();
    if (!admin) throw new Error("Database is not configured.");

    const name = (input.name ?? "").trim();
    if (!name) throw new Error("Officer name is required.");
    const type = VALID_TYPES.has(input.officer_type) ? input.officer_type : "MO";

    const { error } = await admin
      .from("marketing_officers")
      .update({
        name,
        officer_type: type,
        position: clean(input.position),
        officer_code: clean(input.officer_code),
        district: clean(input.district),
        mobile: clean(input.mobile),
        reference: clean(input.reference),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);

    await logAudit({ action: "update", entity: "marketing_officer", entityId: id, detail: `Updated officer “${name}”` });
    revalidateLeaderboard();
    return { message: "Officer updated." };
  });
}

export async function deleteOfficer(id: string): Promise<ActionResult> {
  return runAction(async () => {
    await requireManager();
    if (!id) throw new Error("Missing officer id.");
    const admin = getAdmin();
    if (!admin) throw new Error("Database is not configured.");

    const { data: o } = await admin.from("marketing_officers").select("name").eq("id", id).maybeSingle();
    const { error } = await admin.from("marketing_officers").delete().eq("id", id);
    if (error) throw new Error(error.message);

    await logAudit({ action: "delete", entity: "marketing_officer", entityId: id, detail: o ? `Deleted officer “${o.name}”` : `Deleted officer ${id}` });
    revalidateLeaderboard();
    return { message: "Officer deleted." };
  });
}

/** Award points: officer + point item (admin-set value) × quantity →
 *  added to the officer's running total and recorded as a point entry. */
export async function awardPoints(input: {
  officerId: string;
  itemId: string;
  quantity: number;
  note?: string;
}): Promise<ActionResult<{ points: number }>> {
  return runAction(async () => {
    const me = await requireManager();
    const admin = getAdmin();
    if (!admin) throw new Error("Database is not configured.");

    if (!input.officerId) throw new Error("Pick an officer.");
    if (!input.itemId) throw new Error("Pick a point item.");
    const qty = Math.max(1, Math.floor(Number(input.quantity) || 1));

    const { data: item, error: itemErr } = await admin
      .from("marketing_point_items")
      .select("label, points, afr")
      .eq("id", input.itemId)
      .maybeSingle();
    if (itemErr) throw new Error(itemErr.message);
    if (!item) throw new AuthzError("Point item not found");
    const added = round2(Number(item.points || 0) * qty);
    const afrAdded = round2(Number(item.afr || 0) * qty);

    const { data: officer, error: readErr } = await admin
      .from("marketing_officers")
      .select("points, afr_total, name")
      .eq("id", input.officerId)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!officer) throw new AuthzError("Officer not found");

    const { error: entryErr } = await admin.from("marketing_point_entries").insert({
      officer_id: input.officerId,
      item_label: item.label,
      quantity: qty,
      points: added,
      afr: afrAdded,
      note: clean(input.note),
      created_by: me.id,
    });
    if (entryErr) throw new Error(entryErr.message);

    const { error: updErr } = await admin
      .from("marketing_officers")
      .update({
        points: round2(Number(officer.points || 0) + added),
        afr_total: round2(Number(officer.afr_total || 0) + afrAdded),
      })
      .eq("id", input.officerId);
    if (updErr) throw new Error(updErr.message);

    await logAudit({
      action: "award",
      entity: "marketing_points",
      entityId: input.officerId,
      detail: `+${added} pts to “${officer.name}” (${item.label} ×${qty})`,
    });
    revalidateLeaderboard();
    return { data: { points: added }, message: `+${added} points added.` };
  });
}

// ── Point catalogue (admin-editable points per item / sale) ───────

export async function addPointItem(label: string, points: number, afr = 0): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    await requireManager();
    const admin = getAdmin();
    if (!admin) throw new Error("Database is not configured.");
    const l = (label ?? "").trim();
    if (!l) throw new Error("Item name is required.");
    const p = Math.max(0, round2(points));

    const { data, error } = await admin
      .from("marketing_point_items")
      .insert({ label: l, points: p, afr: Math.max(0, round2(afr)), sort: 99 })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await logAudit({ action: "create", entity: "point_item", entityId: data.id, detail: `Added point item “${l}” (${p} pts)` });
    revalidatePath("/admin/marketing");
    return { data: { id: data.id }, message: "Point item added." };
  });
}

export async function updatePointItem(
  id: string,
  input: { label?: string; points?: number; afr?: number },
): Promise<ActionResult> {
  return runAction(async () => {
    await requireManager();
    if (!id) throw new Error("Missing item id.");
    const admin = getAdmin();
    if (!admin) throw new Error("Database is not configured.");

    const patch: { label?: string; points?: number; afr?: number } = {};
    if (typeof input.label === "string" && input.label.trim()) patch.label = input.label.trim();
    if (input.points != null) patch.points = Math.max(0, round2(input.points));
    if (input.afr != null) patch.afr = Math.max(0, round2(input.afr));
    if (!Object.keys(patch).length) throw new Error("Nothing to update.");

    const { error } = await admin.from("marketing_point_items").update(patch).eq("id", id);
    if (error) throw new Error(error.message);

    await logAudit({ action: "update", entity: "point_item", entityId: id, detail: `Updated point item (${JSON.stringify(patch)})` });
    revalidatePath("/admin/marketing");
    return { message: "Point item updated." };
  });
}

export async function deletePointItem(id: string): Promise<ActionResult> {
  return runAction(async () => {
    await requireManager();
    if (!id) throw new Error("Missing item id.");
    const admin = getAdmin();
    if (!admin) throw new Error("Database is not configured.");

    const { error } = await admin.from("marketing_point_items").delete().eq("id", id);
    if (error) throw new Error(error.message);

    await logAudit({ action: "delete", entity: "point_item", entityId: id, detail: `Deleted point item ${id}` });
    revalidatePath("/admin/marketing");
    return { message: "Point item deleted." };
  });
}
