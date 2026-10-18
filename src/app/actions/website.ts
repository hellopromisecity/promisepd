"use server";

/** Dashboard → Website: managers edit the text of the five public project
 *  pages (Bangla and English separately). Saved into
 *  project_overrides.facts.page_text; only fields that differ from the
 *  built-in copy are kept. Every save is audit-logged field by field and the
 *  public pages are regenerated on the spot. */

import { revalidatePath } from "next/cache";
import { requireManager, getAdmin, logAudit, diffDetail, withChanges, runAction, ValidationError, type ActionResult } from "@/lib/admin-guard";
import { PROJECTS } from "@/lib/site";
import { PROJECT_EN } from "@/lib/site.en";
import { builtInBn, builtInEn, overlayText, stripDefaults, parseProjectText, flattenText, BN_STATUSES, type ProjectText, type Locale2 } from "@/lib/project-content";

const LABELS: Record<string, string> = {
  name: "name", status: "status", location: "location", price: "price", size: "size", description: "short description", longDescription: "long description",
  details: "details paragraphs", highlights: "highlights", payment_rows: "payment rows", payment_note: "payment note",
  plots_price_per_decimal: "price per decimal", plots_price_per_katha: "price per katha", plots_conversion: "conversion", plots_note: "plots note", plots_categories: "plot categories",
  share_note: "share note", floor_plan_url: "floor plan URL", video_ids: "video ids",
};

/** Paths that show this project's text: its two pages, both homepages
 *  (cards), the dashboard editor. */
function revalidateProject(slug: string) {
  for (const p of [`/projects/${slug}`, `/en/projects/${slug}`, "/", "/en", `/dashboard/website/${slug}`, "/dashboard/website"]) revalidatePath(p);
}

async function readPageText(admin: NonNullable<ReturnType<typeof getAdmin>>, slug: string): Promise<{ facts: Record<string, unknown>; page: Record<string, unknown> }> {
  const { data } = await admin.from("project_overrides").select("facts").eq("slug", slug).maybeSingle();
  const facts = ((data as { facts?: Record<string, unknown> | null } | null)?.facts ?? {}) as Record<string, unknown>;
  const page = ((facts.page_text ?? {}) as Record<string, unknown>);
  return { facts, page };
}

export async function saveProjectPageText(slug: string, locale: Locale2, input: ProjectText): Promise<ActionResult> {
  return runAction(async () => {
    const me = await requireManager();
    const admin = getAdmin();
    if (!admin) throw new Error("Data unavailable");
    const project = PROJECTS.find((p) => p.slug === slug);
    if (!project) throw new ValidationError("Unknown project.");
    if (locale !== "bn" && locale !== "en") throw new ValidationError("Unknown language.");

    const clean = parseProjectText(input);
    if (locale === "bn" && clean.status && !(BN_STATUSES as readonly string[]).includes(clean.status)) {
      throw new ValidationError(`Status must be one of ${BN_STATUSES.join(" / ")}.`);
    }
    if (!clean.name) throw new ValidationError("The project name can't be empty.");
    if (clean.floorPlanUrl && !/^https?:\/\//i.test(clean.floorPlanUrl)) throw new ValidationError("Floor plan must be a full http(s) link.");

    const builtIn = locale === "bn" ? builtInBn(project) : builtInEn(slug);
    const { facts, page } = await readPageText(admin, slug);
    const before = overlayText(builtIn, page[locale] ? parseProjectText(page[locale]) : undefined);
    const stored = stripDefaults(clean, builtIn);            // keep only what differs from the code
    const after = overlayText(builtIn, stored);

    const nextPage: Record<string, unknown> = { ...page, [locale]: Object.keys(stored).length ? stored : undefined, updated_at: new Date().toISOString(), updated_by: me.name || null };
    if (!nextPage[locale]) delete nextPage[locale];
    const { error } = await admin.from("project_overrides").upsert({ slug, facts: { ...facts, page_text: nextPage } }, { onConflict: "slug" });
    if (error) throw new Error(error.message);

    const displayName = locale === "en" ? PROJECT_EN[slug]?.name ?? project.name : project.name;
    await logAudit({
      action: "update", entity: "website_page", entityId: `${slug}:${locale}`,
      detail: withChanges(`Edited website text of ${displayName} (${locale === "bn" ? "Bangla" : "English"} page)`, diffDetail(flattenText(before), flattenText(after), LABELS, { maxLen: 140 })),
    });
    revalidateProject(slug);
    return { message: Object.keys(stored).length ? "Saved — the website page is updated." : "Saved — every field matches the built-in text, so nothing is overridden." };
  });
}

/** Drop the saved text for one language — the page goes back to the built-in copy. */
export async function resetProjectPageText(slug: string, locale: Locale2): Promise<ActionResult> {
  return runAction(async () => {
    const me = await requireManager();
    const admin = getAdmin();
    if (!admin) throw new Error("Data unavailable");
    const project = PROJECTS.find((p) => p.slug === slug);
    if (!project) throw new ValidationError("Unknown project.");
    const { facts, page } = await readPageText(admin, slug);
    if (!page[locale]) return { message: "Nothing to reset — this language already uses the built-in text." };
    const builtIn = locale === "bn" ? builtInBn(project) : builtInEn(slug);
    const before = overlayText(builtIn, parseProjectText(page[locale]));
    const nextPage: Record<string, unknown> = { ...page, updated_at: new Date().toISOString(), updated_by: me.name || null };
    delete nextPage[locale];
    const { error } = await admin.from("project_overrides").upsert({ slug, facts: { ...facts, page_text: nextPage } }, { onConflict: "slug" });
    if (error) throw new Error(error.message);
    await logAudit({
      action: "update", entity: "website_page", entityId: `${slug}:${locale}`,
      detail: withChanges(`Reset website text of ${project.name} (${locale === "bn" ? "Bangla" : "English"} page) to the built-in copy`, diffDetail(flattenText(before), flattenText(builtIn), LABELS, { maxLen: 140 })),
    });
    revalidateProject(slug);
    return { message: "Reset — the page shows the built-in text again." };
  });
}
