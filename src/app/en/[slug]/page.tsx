import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DIVISIONS } from "@/lib/site";
import { DIVISION_EN } from "@/lib/site.en";
import DivisionDetail from "@/components/DivisionDetail";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();
const OG_IMAGE = absoluteUrl("/og-image.jpg");

export const dynamicParams = false;

export async function generateStaticParams() {
  return DIVISIONS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata(
  props: PageProps<"/en/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const division = DIVISIONS.find((d) => d.slug === slug);
  if (!division) return { title: "Division not found" };
  const dx = DIVISION_EN[slug];
  const title = `${dx?.name ?? division.nameBn} — ${dx?.tagline ?? division.tagline}`;
  const description = dx?.description ?? division.description;
  return {
    title,
    description,
    alternates: {
      canonical: `/en/${slug}`,
      languages: { "bn-BD": `/${slug}`, en: `/en/${slug}` },
    },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/en/${slug}`,
      title,
      description,
      siteName: "PromisePD",
      locale: "en",
      images: [{ url: OG_IMAGE, secureUrl: OG_IMAGE, type: "image/jpeg", width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [{ url: OG_IMAGE, alt: title }] },
  };
}

export default async function EnDivisionPage(props: PageProps<"/en/[slug]">) {
  const { slug } = await props.params;
  const division = DIVISIONS.find((d) => d.slug === slug);
  if (!division) notFound();
  const dx = DIVISION_EN[slug];

  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: `${SITE_URL}/en` },
    { name: "Divisions", url: `${SITE_URL}/en/#divisions` },
    { name: dx?.name ?? division.nameBn, url: `${SITE_URL}/en/${slug}` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <DivisionDetail division={division} locale="en" />
    </>
  );
}
