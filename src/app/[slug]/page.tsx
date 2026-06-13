import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DIVISIONS } from "@/lib/site";
import DivisionDetail from "@/components/DivisionDetail";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema, divisionServiceSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();
const OG_IMAGE = absoluteUrl("/og-image.jpg");

/** Only pre-rendered slugs resolve — any other top-level path 404s
 *  instead of being treated as a division. */
export const dynamicParams = false;

export async function generateStaticParams() {
  return DIVISIONS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata(
  props: PageProps<"/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const division = DIVISIONS.find((d) => d.slug === slug);
  if (!division) return { title: "বিভাগ পাওয়া যায়নি" };
  const url = `${SITE_URL}/${division.slug}`;
  const title = `${division.nameBn} — ${division.tagline}`;
  return {
    title,
    description: division.description,
    alternates: { canonical: `/${division.slug}` },
    openGraph: {
      type: "website",
      url,
      title,
      description: division.description,
      siteName: "PromisePD",
      locale: "bn_BD",
      images: [
        { url: OG_IMAGE, secureUrl: OG_IMAGE, type: "image/jpeg", width: 1200, height: 630, alt: title },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: division.description,
      images: [{ url: OG_IMAGE, alt: title }],
    },
  };
}

export default async function DivisionPage(props: PageProps<"/[slug]">) {
  const { slug } = await props.params;
  const division = DIVISIONS.find((d) => d.slug === slug);
  if (!division) notFound();

  const breadcrumb = breadcrumbSchema([
    { name: "হোম", url: SITE_URL },
    { name: "আমাদের বিভাগ", url: `${SITE_URL}/#divisions` },
    { name: division.nameBn, url: `${SITE_URL}/${division.slug}` },
  ]);
  const service = divisionServiceSchema(division.slug);

  return (
    <>
      <JsonLd data={breadcrumb} />
      {service && <JsonLd data={service} />}
      <DivisionDetail division={division} locale="bn" />
    </>
  );
}
