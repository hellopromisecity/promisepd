import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import FormDetail from "@/components/FormDetail";
import { FORMS, getForm } from "@/lib/forms";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();

export const dynamicParams = false;

export function generateStaticParams() {
  return FORMS.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata(
  props: PageProps<"/forms/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const form = getForm(slug);
  if (!form) return { title: "ফরম পাওয়া যায়নি" };
  const title = `${form.nameBn} — PromisePD`;
  const image = absoluteUrl("/og-image.jpg");
  return {
    title,
    description: form.description,
    alternates: { canonical: `/forms/${slug}` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/forms/${slug}`,
      title,
      description: form.description,
      siteName: "PromisePD",
      locale: "bn_BD",
      images: [{ url: image, secureUrl: image, type: "image/jpeg", width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description: form.description, images: [{ url: image, alt: title }] },
  };
}

export default async function FormPage(props: PageProps<"/forms/[slug]">) {
  const { slug } = await props.params;
  const form = getForm(slug);
  if (!form) notFound();

  const breadcrumb = breadcrumbSchema([
    { name: "হোম", url: SITE_URL },
    { name: "ফর্ম", url: `${SITE_URL}/forms` },
    { name: form.nameBn, url: `${SITE_URL}/forms/${slug}` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <FormDetail form={form} />
    </>
  );
}
