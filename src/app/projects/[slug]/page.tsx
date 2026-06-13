import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROJECTS } from "@/lib/site";
import ProjectDetail from "@/components/ProjectDetail";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();

/** Only the pre-rendered project slugs resolve — anything else 404s. */
export const dynamicParams = false;

export async function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  props: PageProps<"/projects/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const project = PROJECTS.find((p) => p.slug === slug);
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
  const project = PROJECTS.find((p) => p.slug === slug);
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
