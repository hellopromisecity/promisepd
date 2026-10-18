import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser, isManager } from "@/lib/auth";
import { PageHeader, Card } from "@/components/admin/ui";
import { PROJECTS } from "@/lib/site";
import { PROJECT_EN } from "@/lib/site.en";
import { loadProjectPageText, builtInBn, builtInEn, overlayText } from "@/lib/project-content";
import WebsiteProjectForm from "../WebsiteProjectForm";

export const metadata: Metadata = { title: "Website — project page", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function WebsiteProjectPage(props: PageProps<"/dashboard/website/[slug]">) {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) redirect("/account");
  const { slug } = await props.params;
  const project = PROJECTS.find((p) => p.slug === slug);
  if (!project) notFound();

  const text = (await loadProjectPageText()).get(slug);
  const builtIn = { bn: builtInBn(project), en: builtInEn(slug) };
  const effective = { bn: overlayText(builtIn.bn, text?.bn), en: overlayText(builtIn.en, text?.en) };
  const title = PROJECT_EN[slug]?.name ?? project.name;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/website" className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg-muted transition-colors hover:text-brand-blue">
        <ArrowLeft className="h-4 w-4" /> Website pages
      </Link>
      <PageHeader
        title={`${title} — website text`}
        subtitle="What visitors read on this project's page and card, in Bangla and English. Save publishes straight to promisepd.com; “Back to built-in” returns to the text written in the code."
      />
      <Card>
        <WebsiteProjectForm
          slug={slug}
          title={title}
          publicUrls={{ bn: `/projects/${slug}`, en: `/en/projects/${slug}` }}
          hasPayment={!!project.payment}
          hasPlots={!!project.plots}
          hasShare={!!project.shareMap}
          builtIn={builtIn}
          effective={effective}
          saved={{ bn: !!text?.bn && Object.keys(text.bn).length > 0, en: !!text?.en && Object.keys(text.en).length > 0 }}
          updatedAt={text?.updated_at}
          updatedBy={text?.updated_by}
        />
      </Card>
      <p className="text-xs text-fg-faint">Availability (sold / open shares, buildings) is edited under Projectify → the project → Public site availability. Photos, the unit map and the navbar labels stay in the code.</p>
    </div>
  );
}
