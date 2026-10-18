"use client";

/** Dashboard → Website → one project: edit the public page's text, Bangla and
 *  English on separate tabs. Fields start at what the site shows right now
 *  (built-in copy + whatever was saved); the built-in value is shown under a
 *  field once you change it, so the editor always knows what they override.
 *  Save stores only the fields that differ from the built-in text. */

import { useMemo, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Save, RotateCcw, Loader2, ExternalLink, Globe } from "lucide-react";
import { saveProjectPageText, resetProjectPageText } from "@/app/actions/website";
import type { ProjectText, Locale2 } from "@/lib/project-content";
import { confirmDialog } from "@/components/ui/Dialog";
import { toast } from "@/components/ui/Toast";

const inputCls = "w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm text-fg outline-none transition-colors focus:border-brand-blue/50";
const labelCls = "mb-1 block text-xs font-semibold text-fg-muted";
const BN_STATUSES = ["চলমান", "সম্পন্ন", "আসন্ন"];

/** The form's string view of one language's text. */
type Draft = {
  name: string; status: string; location: string; price: string; size: string;
  description: string; longDescription: string; details: string; highlights: string;
  paymentRows: string; paymentNote: string;
  plotsPerDecimal: string; plotsPerKatha: string; plotsConversion: string; plotsNote: string; plotsCategories: string;
  shareNote: string; floorPlanUrl: string; videoIds: string;
};

function toDraft(t: ProjectText): Draft {
  return {
    name: t.name ?? "", status: t.status ?? "", location: t.location ?? "", price: t.price ?? "", size: t.size ?? "",
    description: t.description ?? "", longDescription: t.longDescription ?? "",
    details: (t.details ?? []).join("\n"), highlights: (t.highlights ?? []).join("\n"),
    paymentRows: (t.payment?.rows ?? []).map((r) => `${r.label} | ${r.value}`).join("\n"), paymentNote: t.payment?.note ?? "",
    plotsPerDecimal: t.plots?.pricePerShotangsho ?? "", plotsPerKatha: t.plots?.pricePerKatha ?? "", plotsConversion: t.plots?.conversion ?? "", plotsNote: t.plots?.note ?? "",
    plotsCategories: (t.plots?.categories ?? []).map((c) => `${c.katha} | ${c.shotangsho} | ${c.price}`).join("\n"),
    shareNote: t.shareNote ?? "", floorPlanUrl: t.floorPlanUrl ?? "", videoIds: (t.videoIds ?? []).join(", "),
  };
}

const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const pipe = (s: string) => s.split("|").map((x) => x.trim());

function fromDraft(d: Draft, opts: { hasPayment: boolean; hasPlots: boolean; hasShare: boolean; common: boolean }): ProjectText {
  const t: ProjectText = {
    name: d.name.trim(), status: d.status.trim(), location: d.location.trim(), price: d.price.trim(), size: d.size.trim(),
    description: d.description.trim(), longDescription: d.longDescription.trim(),
    details: lines(d.details), highlights: lines(d.highlights),
  };
  if (opts.hasPayment) {
    t.payment = { rows: lines(d.paymentRows).map((l) => { const [label = "", value = ""] = pipe(l); return { label, value }; }), note: d.paymentNote.trim() };
  }
  if (opts.hasPlots) {
    t.plots = {
      pricePerShotangsho: d.plotsPerDecimal.trim(), pricePerKatha: d.plotsPerKatha.trim(), conversion: d.plotsConversion.trim(), note: d.plotsNote.trim(),
      categories: lines(d.plotsCategories).map((l) => { const [katha = "", shotangsho = "", price = ""] = pipe(l); return { katha, shotangsho, price }; }),
    };
  }
  if (opts.hasShare) t.shareNote = d.shareNote.trim();
  if (opts.common) { t.floorPlanUrl = d.floorPlanUrl.trim(); t.videoIds = d.videoIds.split(",").map((x) => x.trim()).filter(Boolean); }
  return t;
}

type OnChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;

/** "built-in: …" under a field once it differs from the code copy. Top-level
 *  components (not created during render) so the inputs keep focus. */
function Hint({ value, builtIn }: { value: string; builtIn: string }) {
  return value.trim() !== builtIn.trim() && builtIn.trim() ? <p className="mt-1 line-clamp-2 text-[11px] text-fg-faint">built-in: {builtIn}</p> : null;
}

function Field({ label, hint, rows, wide, value, builtIn, onChange }: { label: string; hint?: string; rows?: number; wide?: boolean; value: string; builtIn: string; onChange: OnChange }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label className={labelCls}>{label}{hint && <span className="ml-1 font-normal normal-case text-fg-faint">({hint})</span>}</label>
      {rows ? <textarea rows={rows} className={`${inputCls} resize-y`} value={value} onChange={onChange} /> : <input className={inputCls} value={value} onChange={onChange} />}
      <Hint value={value} builtIn={builtIn} />
    </div>
  );
}

export default function WebsiteProjectForm({
  slug, title, publicUrls, hasPayment, hasPlots, hasShare, builtIn, effective, saved, updatedAt, updatedBy,
}: {
  slug: string; title: string; publicUrls: { bn: string; en: string };
  hasPayment: boolean; hasPlots: boolean; hasShare: boolean;
  builtIn: { bn: ProjectText; en: ProjectText };
  effective: { bn: ProjectText; en: ProjectText };
  saved: { bn: boolean; en: boolean };
  updatedAt?: string; updatedBy?: string;
}) {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale2>("bn");
  const [drafts, setDrafts] = useState<Record<Locale2, Draft>>({ bn: toDraft(effective.bn), en: toDraft(effective.en) });
  const [pending, start] = useTransition();
  const [resetting, startReset] = useTransition();
  const base = useMemo(() => ({ bn: toDraft(builtIn.bn), en: toDraft(builtIn.en) }), [builtIn]);
  const d = drafts[locale];
  const b = base[locale];
  const set = (k: keyof Draft): OnChange => (e) => setDrafts((s) => ({ ...s, [locale]: { ...s[locale], [k]: e.target.value } }));
  /** value / built-in / onChange trio for one field */
  const fp = (k: keyof Draft) => ({ value: d[k], builtIn: b[k], onChange: set(k) });
  const dirtyCount = (Object.keys(d) as (keyof Draft)[]).filter((k) => d[k].trim() !== b[k].trim()).length;

  function save() {
    const text = fromDraft(d, { hasPayment, hasPlots, hasShare, common: locale === "bn" });
    start(async () => {
      const r = await saveProjectPageText(slug, locale, text);
      if (r.ok) { toast(r.message || "Saved.", "success"); router.refresh(); } else toast(r.error, "error");
    });
  }

  async function reset() {
    const ok = await confirmDialog({ title: "Back to the built-in text", message: `Throw away every saved ${locale === "bn" ? "Bangla" : "English"} change for ${title} and show the built-in text again on the website?`, confirmText: "Reset", danger: true });
    if (!ok) return;
    startReset(async () => {
      const r = await resetProjectPageText(slug, locale);
      if (r.ok) { toast(r.message || "Reset.", "success"); setDrafts((s) => ({ ...s, [locale]: base[locale] })); router.refresh(); } else toast(r.error, "error");
    });
  }

  return (
    <div className="space-y-4">
      {/* language tabs + page links */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-bg-soft p-1">
          {(["bn", "en"] as Locale2[]).map((l) => (
            <button key={l} type="button" onClick={() => setLocale(l)} className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${locale === l ? "bg-fg text-bg shadow" : "text-fg-muted hover:text-fg"}`}>
              {l === "bn" ? "বাংলা page" : "English page"}{saved[l] && <span className="ml-1.5 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-700">edited</span>}
            </button>
          ))}
        </div>
        <a href={publicUrls[locale]} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-fg-muted hover:border-brand-blue/40 hover:text-brand-blue"><ExternalLink className="h-3.5 w-3.5" /> Open the {locale === "bn" ? "Bangla" : "English"} page</a>
      </div>

      {updatedAt && (
        <p className="text-[11px] text-fg-faint">Last saved {new Date(updatedAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Dhaka" })}{updatedBy ? ` by ${updatedBy}` : ""}.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Project name" {...fp("name")} />
        <div>
          <label className={labelCls}>Status</label>
          {locale === "bn" ? (
            <select className={inputCls} value={d.status} onChange={set("status")}>
              {BN_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <>
              <input className={inputCls} list="en-status" value={d.status} onChange={set("status")} />
              <datalist id="en-status"><option value="Ongoing" /><option value="Completed" /><option value="Upcoming" /></datalist>
            </>
          )}
          <Hint value={d.status} builtIn={b.status} />
        </div>
        <Field label="Location" {...fp("location")} />
        <Field label="Price" hint="shown on the card and the page — e.g. ৳ ৪,৫০০ / বর্গফুট" {...fp("price")} />
        <Field label="Size" hint="optional" {...fp("size")} />
        <Field label="Short description" hint="the card + page summary" rows={3} wide {...fp("description")} />
        <Field label="Long description" hint="the page hero paragraph" rows={4} wide {...fp("longDescription")} />
        <Field label="Details paragraphs" hint="one paragraph per line" rows={8} wide {...fp("details")} />
        <Field label="Highlights" hint="one per line — the bullet points" rows={4} wide {...fp("highlights")} />
        {hasPayment && (
          <>
            <Field label="Payment rows" hint="one per line as  Label | Value" rows={4} wide {...fp("paymentRows")} />
            <Field label="Payment note" rows={4} wide {...fp("paymentNote")} />
          </>
        )}
        {hasPlots && (
          <>
            <Field label="Price per decimal" {...fp("plotsPerDecimal")} />
            <Field label="Price per katha" {...fp("plotsPerKatha")} />
            <Field label="Conversion" hint="e.g. ১ কাঠা = ১.৫ শতাংশ" {...fp("plotsConversion")} />
            <Field label="Plots note" rows={2} {...fp("plotsNote")} />
            <Field label="Plot categories" hint="one per line as  Katha | Decimal | Price" rows={4} wide {...fp("plotsCategories")} />
          </>
        )}
        {hasShare && <Field label="Share-map note" rows={2} wide {...fp("shareNote")} />}
        {locale === "bn" && (
          <>
            <div className="sm:col-span-2 mt-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-fg-muted"><Globe className="h-3.5 w-3.5" /> Both languages</div>
            <Field label="Floor plan link" hint="https://…" {...fp("floorPlanUrl")} />
            <Field label="YouTube video ids" hint="comma-separated" {...fp("videoIds")} />
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-xs text-fg-muted">{dirtyCount ? `${dirtyCount} field${dirtyCount > 1 ? "s" : ""} differ from the built-in text.` : "Everything matches the built-in text."}</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={reset} disabled={resetting || pending || !saved[locale]} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold text-fg-muted hover:border-brand-red/40 hover:text-brand-red disabled:opacity-40">
            {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Back to built-in
          </button>
          <button type="button" onClick={save} disabled={pending || resetting} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark disabled:opacity-60">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save &amp; publish
          </button>
        </div>
      </div>
    </div>
  );
}
