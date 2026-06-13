import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROJECTS } from "@/lib/site";
import { PROJECT_EN } from "@/lib/site.en";
import ProjectDetail from "@/components/ProjectDetail";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();

export const dynamicParams = false;

export async function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  props: PageProps<"/en/projects/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const project = PROJECTS.find((p) => p.slug === slug);
  if (!project) return { title: "Project not found" };
  const px = PROJECT_EN[slug];
  const title = `${px?.name ?? project.name} — PromisePD project`;
  const description = px?.description ?? project.description;
  const image = absoluteUrl(project.cover);
  return {
    title,
    description,
    alternates: {
      canonical: `/en/projects/${slug}`,
      languages: { "bn-BD": `/projects/${slug}`, en: `/en/projects/${slug}` },
    },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/en/projects/${slug}`,
      title,
      description,
      siteName: "PromisePD",
      locale: "en",
      images: [{ url: image, secureUrl: image, alt: px?.name ?? project.name }],
    },
    twitter: { card: "summary_large_image", title, description, images: [{ url: image, alt: px?.name ?? project.name }] },
  };
}

export default async function EnProjectPage(props: PageProps<"/en/projects/[slug]">) {
  const { slug } = await props.params;
  const project = PROJECTS.find((p) => p.slug === slug);
  if (!project) notFound();
  const px = PROJECT_EN[slug];

  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: `${SITE_URL}/en` },
    { name: "Projects", url: `${SITE_URL}/en/#projects` },
    { name: px?.name ?? project.name, url: `${SITE_URL}/en/projects/${slug}` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <ProjectDetail project={project} locale="en" />
    </>
  );
}
