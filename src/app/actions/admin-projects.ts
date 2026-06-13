"use server";

/** Projects section — Server Actions (min role: manager).
 *
 *  The rich project content lives in code (`PROJECTS` in @/lib/site).
 *  These actions only let a manager OVERRIDE the small, fast-moving
 *  availability facts per project — status text plus either a share
 *  map {total,sold,note} or a buildings count {total,soldOut,nowBooking}.
 *  Overrides are stored in public.project_overrides (jsonb columns) and
 *  the public site / admin grid layer them on top of the code values.
 *
 *  We never touch the full unit grid here — that stays in code. */

import { runAction, requireManager, getAdmin, logAudit, type ActionResult } from "@/lib/admin-guard";
import { PROJECTS } from "@/lib/site";
import { revalidatePath } from "next/cache";

export type ShareMapOverride = { total: number; sold: number; note: string | null };
export type BuildingsOverride = { total: number; soldOut: number; nowBooking: number };

export type OverrideInput = {
  /** Free-text status (e.g. "চলমান").  Empty → cleared. */
  status?: string | null;
  /** Limited-share projects only. */
  shareMap?: ShareMapOverride | null;
  /** Multi-building projects only. */
  buildings?: BuildingsOverride | null;
};

/** Coerce a form value to a non-negative integer, or null when blank. */
function toCount(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/** Upsert (or partially clear) a project's override row.
 *
 *  Only the field set that matches the project's model is written:
 *  share-map projects write share_map, building projects write
 *  buildings.  Passing `null`/blank for a sub-field clears it. */
export async function upsertOverride(slug: string, input: OverrideInput): Promise<ActionResult> {
  return runAction(async () => {
    await requireManager();

    const project = PROJECTS.find((p) => p.slug === slug);
    if (!project) throw new Error("Unknown project");

    const admin = getAdmin();
    if (!admin) throw new Error("Data unavailable. Supabase isn't configured.");

    // Build the row we upsert.  We always include slug; the rest is
    // whatever the project's model supports, validated here.
    const status = typeof input.status === "string" ? input.status.trim() : "";

    let share_map: ShareMapOverride | null = null;
    let buildings: BuildingsOverride | null = null;

    if ("shareMap" in input && input.shareMap) {
      const total = toCount(input.shareMap.total);
      const sold = toCount(input.shareMap.sold);
      if (total === null) throw new Error("Total shares must be a non-negative number.");
      if (sold === null) throw new Error("Sold shares must be a non-negative number.");
      if (sold > total) throw new Error("Sold shares can't exceed total shares.");
      const note = typeof input.shareMap.note === "string" ? input.shareMap.note.trim() : "";
      share_map = { total, sold, note: note || null };
    }

    if ("buildings" in input && input.buildings) {
      const total = toCount(input.buildings.total);
      const soldOut = toCount(input.buildings.soldOut);
      const nowBooking = toCount(input.buildings.nowBooking);
      if (total === null) throw new Error("Total buildings must be a non-negative number.");
      if (soldOut === null) throw new Error("Sold-out buildings must be a non-negative number.");
      if (nowBooking === null) throw new Error("Now-booking building must be a non-negative number.");
      if (soldOut > total) throw new Error("Sold-out buildings can't exceed total buildings.");
      buildings = { total, soldOut, nowBooking };
    }

    const { error } = await admin.from("project_overrides").upsert(
      {
        slug,
        status: status || null,
        share_map: share_map as Record<string, unknown> | null,
        buildings: buildings as Record<string, unknown> | null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" },
    );
    if (error) throw new Error(error.message);

    await logAudit({
      action: "update",
      entity: "project",
      entityId: slug,
      detail: `Override saved for "${project.name}"`,
    });

    revalidatePath("/admin/projects");
    revalidatePath(`/admin/projects/${slug}`);
    revalidatePath("/");

    return { message: "Override saved." };
  });
}

/** Delete a project's override row — reverts to the code defaults. */
export async function resetOverride(slug: string): Promise<ActionResult> {
  return runAction(async () => {
    await requireManager();

    const project = PROJECTS.find((p) => p.slug === slug);
    if (!project) throw new Error("Unknown project");

    const admin = getAdmin();
    if (!admin) throw new Error("Data unavailable. Supabase isn't configured.");

    const { error } = await admin.from("project_overrides").delete().eq("slug", slug);
    if (error) throw new Error(error.message);

    await logAudit({
      action: "delete",
      entity: "project",
      entityId: slug,
      detail: `Override reset to code defaults for "${project.name}"`,
    });

    revalidatePath("/admin/projects");
    revalidatePath(`/admin/projects/${slug}`);
    revalidatePath("/");

    return { message: "Reverted to code defaults." };
  });
}
