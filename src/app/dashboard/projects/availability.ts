/** Shared availability helpers for the admin Projects section.
 *
 *  Computes a project's sell-through % from whatever availability data
 *  it carries, after layering any public.project_overrides row on top
 *  of the code values.  Used by both the list grid and the detail page
 *  so the two always agree.
 *
 *  Pure (no I/O) — callers fetch the override rows and pass them in. */

import type { Project } from "@/lib/site";

/** A project_overrides row, narrowed to the fields this section reads. */
export type OverrideRow = {
  slug: string;
  status: string | null;
  share_map: Record<string, unknown> | null;
  buildings: Record<string, unknown> | null;
};

export type ShareMap = { total: number; sold: number; note?: string };
export type Buildings = { total: number; soldOut: number; nowBooking: number };

/** Which availability model a project uses — drives the edit form. */
export type ProjectModel = "share" | "buildings" | "units" | "none";

export function projectModel(p: Project): ProjectModel {
  if (p.shareMap?.total) return "share";
  if (p.buildings?.total) return "buildings";
  if (p.unitMap?.floors?.length) return "units";
  return "none";
}

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Read a share map from an override row (validated shape), else null. */
export function shareMapFromOverride(o?: OverrideRow | null): ShareMap | null {
  const sm = o?.share_map;
  if (!sm || typeof sm !== "object") return null;
  const total = num((sm as Record<string, unknown>).total);
  const sold = num((sm as Record<string, unknown>).sold);
  if (total === null || sold === null) return null;
  const noteRaw = (sm as Record<string, unknown>).note;
  const note = typeof noteRaw === "string" ? noteRaw : undefined;
  return { total, sold, note };
}

/** Read a buildings count from an override row, else null. */
export function buildingsFromOverride(o?: OverrideRow | null): Buildings | null {
  const b = o?.buildings;
  if (!b || typeof b !== "object") return null;
  const total = num((b as Record<string, unknown>).total);
  const soldOut = num((b as Record<string, unknown>).soldOut);
  const nowBooking = num((b as Record<string, unknown>).nowBooking);
  if (total === null || soldOut === null || nowBooking === null) return null;
  return { total, soldOut, nowBooking };
}

/** Effective status: override wins over code. */
export function effectiveStatus(p: Project, o?: OverrideRow | null): string {
  return (o?.status && o.status.trim()) || p.status;
}

/** Effective share map: override wins over code. */
export function effectiveShareMap(p: Project, o?: OverrideRow | null): ShareMap | null {
  return shareMapFromOverride(o) ?? (p.shareMap?.total ? p.shareMap : null);
}

/** Effective buildings: override wins over code. */
export function effectiveBuildings(p: Project, o?: OverrideRow | null): Buildings | null {
  return buildingsFromOverride(o) ?? (p.buildings?.total ? p.buildings : null);
}

export type SellThrough = { sold: number; total: number; pct: number; unit: string };

/** Effective sell-through, override-aware.
 *  Preference order: share map → unit grid (code only) → buildings. */
export function sellThrough(p: Project, o?: OverrideRow | null): SellThrough | null {
  const sm = effectiveShareMap(p, o);
  if (sm && sm.total) {
    return { sold: sm.sold, total: sm.total, pct: pct(sm.sold, sm.total), unit: "shares" };
  }

  if (p.unitMap?.floors?.length) {
    let total = 0;
    let sold = 0;
    for (const f of p.unitMap.floors)
      for (const u of f.units) {
        total++;
        if (u.status === "sold" || u.status === "rented") sold++;
      }
    if (total) return { sold, total, pct: pct(sold, total), unit: "units" };
  }

  const b = effectiveBuildings(p, o);
  if (b && b.total) {
    return { sold: b.soldOut, total: b.total, pct: pct(b.soldOut, b.total), unit: "buildings" };
  }

  return null;
}

function pct(sold: number, total: number): number {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((sold / total) * 100)));
}
