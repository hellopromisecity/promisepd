import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROJECTS } from "@/lib/site";
import { loadProjectPageText, applyBn } from "@/lib/project-content";
import ProjectDetail from "@/components/ProjectDetail";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();

/** Only the pre-rendered project slugs resolve — anything else 404s. */
export const dynamicParams = false;
/** ISR safety net: a dashboard save revalidates this page at once; failing
 *  that, the page refreshes its text within a minute. */
export const revalidate = 60;

export async function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

/** The built-in project with the dashboard's saved text (Dashboard → Website)
 *  applied — regenerated whenever a manager saves. */
async function projectFor(slug: string) {
  const base = PROJECTS.find((p) => p.slug === slug);
  if (!base) return null;
  const text = (await loadProjectPageText()).get(slug);
  return applyBn(base, text?.bn);
}

export async function generateMetadata(
  props: PageProps<"/projects/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const project = await projectFor(slug);
  if (!project) return { title: "প্রকল্প পাওয়া যায়নি" };
  const url = `${SITE_URL}/projects/${project.slug}`;
  const title = `${project.name} — প্রমিস সিটি প্রকল্প`;
  const image = absoluteUrl(project.cover);
  return {
    title,
    description: project.description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      type: "website",
      url,
      title,
      description: project.description,
      siteName: "PromisePD",
      locale: "bn_BD",
      images: [{ url: image, secureUrl: image, alt: project.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: project.description,
      images: [{ url: image, alt: project.name }],
    },
  };
}

export default async function ProjectPage(props: PageProps<"/projects/[slug]">) {
  const { slug } = await props.params;
  const project = await projectFor(slug);
  if (!project) notFound();

  const breadcrumb = breadcrumbSchema([
    { name: "হোম", url: SITE_URL },
    { name: "প্রকল্প", url: `${SITE_URL}/#projects` },
    { name: project.name, url: `${SITE_URL}/projects/${project.slug}` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <ProjectDetail project={project} locale="bn" />
    </>
  );
}
