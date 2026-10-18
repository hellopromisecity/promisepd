import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Globe, ExternalLink, Pencil } from "lucide-react";
import { getCurrentUser, isManager } from "@/lib/auth";
import { PageHeader, Card } from "@/components/admin/ui";
import { PROJECTS } from "@/lib/site";
import { PROJECT_EN } from "@/lib/site.en";
import { loadProjectPageText, applyBn } from "@/lib/project-content";

export const metadata: Metadata = { title: "Website", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Dhaka" });

export default async function WebsiteIndexPage() {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) redirect("/account");
  const text = await loadProjectPageText();

  return (
    <div className="space-y-6">
      <PageHeader title="Website" subtitle="The text of the five public project pages — edit it here and it goes live on promisepd.com at once, Bangla and English separately." />
      <div className="grid gap-3 sm:grid-cols-2">
        {PROJECTS.map((p) => {
          const t = text.get(p.slug);
          const live = applyBn(p, t?.bn);
          const edited = [t?.bn && Object.keys(t.bn).length ? "বাংলা" : null, t?.en && Object.keys(t.en).length ? "English" : null].filter(Boolean);
          return (
            <Card key={p.slug} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-bold text-fg"><Globe className="h-4 w-4 text-brand-blue" /> {PROJECT_EN[p.slug]?.name ?? p.name}</p>
                <p className="mt-0.5 truncate text-xs text-fg-muted">{live.name} · {live.price} · {live.status}</p>
                <p className="mt-1 text-[11px] text-fg-faint">
                  {edited.length ? `Edited: ${edited.join(" + ")}` : "Built-in text"}{t?.updated_at ? ` · last saved ${when(t.updated_at)}${t.updated_by ? ` by ${t.updated_by}` : ""}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <a href={`/projects/${p.slug}`} target="_blank" rel="noreferrer" title="Open the public page" className="grid h-9 w-9 place-items-center rounded-lg border border-border text-fg-muted hover:border-brand-blue/40 hover:text-brand-blue"><ExternalLink className="h-4 w-4" /></a>
                <Link href={`/dashboard/website/${p.slug}`} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-blue px-3 py-2 text-sm font-semibold text-white hover:bg-brand-blue-dark"><Pencil className="h-4 w-4" /> Edit</Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
