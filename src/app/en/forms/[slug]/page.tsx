import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import FormDetail from "@/components/FormDetail";
import { FORMS, getForm } from "@/lib/forms";
import { breadcrumbSchema } from "@/lib/schema";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";
import { FORMS_EN } from "@/lib/pages.en";

const SITE_URL = getSiteUrl();

export const dynamicParams = false;

export function generateStaticParams() {
  return FORMS.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata(
  props: PageProps<"/en/forms/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const form = getForm(slug);
  if (!form) return { title: "Form not found" };
  const en = FORMS_EN.names[slug];
  const name = en?.name ?? form.nameBn;
  const description = en?.description ?? form.description;
  const title = `${name} — PromisePD`;
  const image = absoluteUrl("/og-image.jpg");
  return {
    title,
    description,
    alternates: {
      canonical: `/en/forms/${slug}`,
      languages: { "bn-BD": `/forms/${slug}`, en: `/en/forms/${slug}` },
    },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/en/forms/${slug}`,
      title,
      description,
      siteName: "PromisePD",
      locale: "en",
      images: [{ url: image, secureUrl: image, type: "image/jpeg", width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [{ url: image, alt: title }] },
  };
}

export default async function EnFormPage(props: PageProps<"/en/forms/[slug]">) {
  const { slug } = await props.params;
  const form = getForm(slug);
  if (!form) notFound();

  const en = FORMS_EN.names[slug];
  const name = en?.name ?? form.nameBn;

  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: `${SITE_URL}/en` },
    { name: "Forms", url: `${SITE_URL}/en/forms` },
    { name, url: `${SITE_URL}/en/forms/${slug}` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <FormDetail form={form} />
    </>
  );
}
