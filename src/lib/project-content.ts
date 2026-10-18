import "server-only";
import { cache } from "react";
import { getAdmin } from "@/lib/admin-guard";
import { PROJECTS, type Project } from "@/lib/site";
import { PROJECT_EN, PROJECT_DETAIL_EN } from "@/lib/site.en";

/** Dashboard → Website: the text of the five public project pages, editable
 *  by managers (2026-10-18 — "Ahbab Palace 2 is 4,500 per sqft now, the site
 *  still says 4,000"). The built-in copy in site.ts / site.en.ts stays the
 *  default; whatever a manager saves in the dashboard is layered on top,
 *  per language. Stored in project_overrides.facts.page_text (a column that
 *  existed unused since 0006), so no migration is needed.
 *
 *  Only fields that DIFFER from the built-in text are stored, so an edit of
 *  the price never freezes the rest of the page against future code updates. */

export type PaymentText = { rows: { label: string; value: string }[]; note: string };
export type PlotsText = { pricePerShotangsho?: string; pricePerKatha?: string; conversion?: string; note?: string; categories?: { katha: string; shotangsho: string; price: string }[] };

/** One language's editable text. Every field optional = "use the built-in". */
export type ProjectText = {
  name?: string;
  status?: string;
  location?: string;
  price?: string;
  size?: string;
  description?: string;
  longDescription?: string;
  details?: string[];
  highlights?: string[];
  payment?: PaymentText;
  plots?: PlotsText;
  shareNote?: string;
  /** Common to both languages (edited on the Bangla tab). */
  floorPlanUrl?: string;
  videoIds?: string[];
};

export type Locale2 = "bn" | "en";
export type ProjectPageText = { bn?: ProjectText; en?: ProjectText; updated_at?: string; updated_by?: string };

export const BN_STATUSES = ["চলমান", "সম্পন্ন", "আসন্ন"] as const;

const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const strs = (v: unknown): string[] | undefined => (Array.isArray(v) ? v.map((x) => String(x ?? "").trim()).filter(Boolean) : undefined);

/** Defensive parse of whatever sits in the JSON column. */
export function parseProjectText(raw: unknown): ProjectText {
  const r = (raw ?? {}) as Record<string, unknown>;
  const out: ProjectText = {};
  for (const k of ["name", "status", "location", "price", "size", "description", "longDescription", "shareNote", "floorPlanUrl"] as const) {
    const v = str(r[k]); if (v) out[k] = v;
  }
  const details = strs(r.details); if (details?.length) out.details = details;
  const highlights = strs(r.highlights); if (highlights?.length) out.highlights = highlights;
  const videoIds = strs(r.videoIds); if (videoIds?.length) out.videoIds = videoIds;
  const pay = r.payment as Record<string, unknown> | undefined;
  if (pay && typeof pay === "object") {
    const rows = Array.isArray(pay.rows) ? (pay.rows as Record<string, unknown>[]).map((x) => ({ label: String(x?.label ?? "").trim(), value: String(x?.value ?? "").trim() })).filter((x) => x.label || x.value) : [];
    const note = str(pay.note) ?? "";
    if (rows.length || note) out.payment = { rows, note };
  }
  const pl = r.plots as Record<string, unknown> | undefined;
  if (pl && typeof pl === "object") {
    const p: PlotsText = {};
    for (const k of ["pricePerShotangsho", "pricePerKatha", "conversion", "note"] as const) { const v = str(pl[k]); if (v) p[k] = v; }
    const cats = Array.isArray(pl.categories) ? (pl.categories as Record<string, unknown>[]).map((c) => ({ katha: String(c?.katha ?? "").trim(), shotangsho: String(c?.shotangsho ?? "").trim(), price: String(c?.price ?? "").trim() })).filter((c) => c.katha || c.shotangsho || c.price) : [];
    if (cats.length) p.categories = cats;
    if (Object.keys(p).length) out.plots = p;
  }
  return out;
}

/** The built-in Bangla text of a project, in the editable shape. */
export function builtInBn(project: Project): ProjectText {
  return {
    name: project.name, status: project.status, location: project.location, price: project.price, size: project.size,
    description: project.description, longDescription: project.longDescription,
    details: project.details ?? [], highlights: project.highlights,
    payment: project.payment ? { rows: project.payment.rows.map((r) => ({ ...r })), note: project.payment.note } : undefined,
    plots: project.plots ? { pricePerShotangsho: project.plots.pricePerShotangsho, pricePerKatha: project.plots.pricePerKatha, conversion: project.plots.conversion, note: project.plots.note, categories: project.plots.categories.map((c) => ({ ...c })) } : undefined,
    shareNote: project.shareMap?.note,
    floorPlanUrl: project.floorPlanUrl, videoIds: project.videoIds ?? [],
  };
}

/** The built-in English text of a project, in the editable shape. */
export function builtInEn(slug: string): ProjectText {
  const px = PROJECT_EN[slug];
  const pd = PROJECT_DETAIL_EN[slug];
  return {
    name: px?.name, status: px?.status, location: px?.location, price: px?.price, size: px?.size,
    description: px?.description, longDescription: pd?.longDescription,
    details: pd?.details ?? [], highlights: px?.highlights ?? [],
    payment: pd?.payment ? { rows: pd.payment.rows.map((r) => ({ ...r })), note: pd.payment.note } : undefined,
    plots: pd?.plots ? { pricePerShotangsho: pd.plots.pricePerShotangsho, pricePerKatha: pd.plots.pricePerKatha, conversion: pd.plots.conversion, note: pd.plots.note, categories: pd.plots.categories.map((c) => ({ ...c })) } : undefined,
    shareNote: pd?.shareMap?.note,
  };
}

/** Layer an override on a text: a present, non-empty override field wins. */
export function overlayText(base: ProjectText, over?: ProjectText): ProjectText {
  if (!over) return base;
  const out: ProjectText = { ...base };
  for (const k of ["name", "status", "location", "price", "size", "description", "longDescription", "shareNote", "floorPlanUrl"] as const) if (over[k]) out[k] = over[k];
  if (over.details?.length) out.details = over.details;
  if (over.highlights?.length) out.highlights = over.highlights;
  if (over.videoIds?.length) out.videoIds = over.videoIds;
  if (over.payment && (over.payment.rows.length || over.payment.note)) out.payment = { rows: over.payment.rows.length ? over.payment.rows : base.payment?.rows ?? [], note: over.payment.note || base.payment?.note || "" };
  if (over.plots) out.plots = { ...(base.plots ?? {}), ...Object.fromEntries(Object.entries(over.plots).filter(([, v]) => (Array.isArray(v) ? v.length : !!v))) };
  return out;
}

/** Keep only what differs from the built-in text (deep-equal via JSON). */
export function stripDefaults(text: ProjectText, builtIn: ProjectText): ProjectText {
  const out: ProjectText = {};
  const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  for (const k of Object.keys(text) as (keyof ProjectText)[]) {
    const v = text[k];
    if (v === undefined || v === "" || (Array.isArray(v) && !v.length)) continue;
    if (same(v, builtIn[k])) continue;
    (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

/** Every project's saved page text, keyed by slug — one query per request
 *  (React cache), empty when the DB is unreachable so the site still renders
 *  from the built-in copy.
 *
 *  Caching: the public pages stay STATIC (ISR). The query runs through the
 *  default fetch, so Next caches it with the page; a dashboard save calls
 *  revalidatePath on the pages, and each page also carries `revalidate = 60`
 *  as a safety net — a saved change is live at once, or within a minute at
 *  the very latest. (A `no-store` fetch here would turn the homepage and the
 *  project pages into per-request server renders — tested, rejected.) */
export const loadProjectPageText = cache(async (): Promise<Map<string, ProjectPageText>> => {
  const out = new Map<string, ProjectPageText>();
  try {
    const admin = getAdmin();
    if (!admin) return out;
    const { data, error } = await admin.from("project_overrides").select("slug, facts").in("slug", PROJECTS.map((p) => p.slug));
    if (error) console.error("[project-content] could not read project_overrides:", error.message);
    for (const row of (data ?? []) as { slug: string; facts: Record<string, unknown> | null }[]) {
      const pt = (row.facts?.page_text ?? null) as Record<string, unknown> | null;
      if (!pt) continue;
      out.set(row.slug, {
        bn: pt.bn ? parseProjectText(pt.bn) : undefined,
        en: pt.en ? parseProjectText(pt.en) : undefined,
        updated_at: typeof pt.updated_at === "string" ? pt.updated_at : undefined,
        updated_by: typeof pt.updated_by === "string" ? pt.updated_by : undefined,
      });
    }
  } catch (e) {
    // the site must still render from the built-in copy — but say why
    console.error("[project-content] falling back to the built-in text:", (e as Error)?.message ?? e);
  }
  return out;
});

/** The Bangla project object with the saved text applied (what the public
 *  pages, cards and metadata render). */
export function applyBn(project: Project, over?: ProjectText): Project {
  if (!over || !Object.keys(over).length) return project;
  const t = overlayText(builtInBn(project), over);
  const status = (BN_STATUSES as readonly string[]).includes(t.status ?? "") ? (t.status as Project["status"]) : project.status;
  return {
    ...project,
    name: t.name ?? project.name, status, location: t.location ?? project.location, price: t.price ?? project.price, size: t.size ?? project.size,
    description: t.description ?? project.description, longDescription: t.longDescription ?? project.longDescription,
    details: t.details?.length ? t.details : project.details, highlights: t.highlights?.length ? t.highlights : project.highlights,
    payment: t.payment ? { rows: t.payment.rows, note: t.payment.note } : project.payment,
    plots: project.plots ? {
      ...project.plots,
      pricePerShotangsho: t.plots?.pricePerShotangsho ?? project.plots.pricePerShotangsho,
      pricePerKatha: t.plots?.pricePerKatha ?? project.plots.pricePerKatha,
      conversion: t.plots?.conversion ?? project.plots.conversion,
      note: t.plots?.note ?? project.plots.note,
      categories: t.plots?.categories?.length ? t.plots.categories : project.plots.categories,
    } : project.plots,
    shareMap: project.shareMap ? { ...project.shareMap, note: t.shareNote ?? project.shareMap.note } : project.shareMap,
    floorPlanUrl: t.floorPlanUrl ?? project.floorPlanUrl,
    videoIds: t.videoIds?.length ? t.videoIds : project.videoIds,
  };
}

export type EnCard = (typeof PROJECT_EN)[string];
export type EnDetail = (typeof PROJECT_DETAIL_EN)[string];

/** The English overlays (card + detail) with the saved English text applied. */
export function applyEn(slug: string, over?: ProjectText): { px: EnCard | undefined; pd: EnDetail | undefined } {
  const px0 = PROJECT_EN[slug];
  const pd0 = PROJECT_DETAIL_EN[slug];
  if (!over || !Object.keys(over).length) return { px: px0, pd: pd0 };
  const t = overlayText(builtInEn(slug), over);
  const px: EnCard | undefined = px0 || t.name ? {
    name: t.name ?? px0?.name ?? "", status: t.status ?? px0?.status ?? "", location: t.location ?? px0?.location ?? "",
    price: t.price ?? px0?.price ?? "", size: t.size ?? px0?.size, description: t.description ?? px0?.description ?? "",
    highlights: t.highlights?.length ? t.highlights : px0?.highlights ?? [],
  } : undefined;
  const pd: EnDetail | undefined = pd0 || t.longDescription ? {
    ...(pd0 ?? { longDescription: "" }),
    longDescription: t.longDescription ?? pd0?.longDescription ?? "",
    details: t.details?.length ? t.details : pd0?.details,
    payment: t.payment ? { rows: t.payment.rows, note: t.payment.note } : pd0?.payment,
    plots: pd0?.plots || t.plots ? {
      pricePerShotangsho: t.plots?.pricePerShotangsho ?? pd0?.plots?.pricePerShotangsho ?? "",
      pricePerKatha: t.plots?.pricePerKatha ?? pd0?.plots?.pricePerKatha ?? "",
      conversion: t.plots?.conversion ?? pd0?.plots?.conversion ?? "",
      note: t.plots?.note ?? pd0?.plots?.note,
      categories: t.plots?.categories?.length ? t.plots.categories : pd0?.plots?.categories ?? [],
    } : undefined,
    shareMap: t.shareNote ? { note: t.shareNote } : pd0?.shareMap,
  } : undefined;
  return { px, pd };
}

/** The homepage cards' data (both languages) with the saved text applied. */
export async function homeProjects(): Promise<{ projects: Project[]; en: Record<string, EnCard> }> {
  const text = await loadProjectPageText();
  const projects = PROJECTS.map((p) => applyBn(p, text.get(p.slug)?.bn));
  const en: Record<string, EnCard> = {};
  for (const p of PROJECTS) {
    const card = applyEn(p.slug, text.get(p.slug)?.en).px ?? PROJECT_EN[p.slug];
    if (card) en[p.slug] = card;
  }
  return { projects, en };
}

/** Flat "label → value" view of a text, for the audit diff and the form. */
export function flattenText(t: ProjectText): Record<string, string> {
  const j = (a?: { label: string; value: string }[]) => (a ?? []).map((r) => `${r.label}: ${r.value}`).join(" | ");
  return {
    name: t.name ?? "", status: t.status ?? "", location: t.location ?? "", price: t.price ?? "", size: t.size ?? "",
    description: t.description ?? "", longDescription: t.longDescription ?? "",
    details: (t.details ?? []).join(" ¶ "), highlights: (t.highlights ?? []).join(" | "),
    payment_rows: j(t.payment?.rows), payment_note: t.payment?.note ?? "",
    plots_price_per_decimal: t.plots?.pricePerShotangsho ?? "", plots_price_per_katha: t.plots?.pricePerKatha ?? "", plots_conversion: t.plots?.conversion ?? "", plots_note: t.plots?.note ?? "",
    plots_categories: (t.plots?.categories ?? []).map((c) => `${c.katha} / ${c.shotangsho} / ${c.price}`).join(" | "),
    share_note: t.shareNote ?? "", floor_plan_url: t.floorPlanUrl ?? "", video_ids: (t.videoIds ?? []).join(", "),
  };
}
