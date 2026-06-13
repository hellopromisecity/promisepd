/** Schema.org structured data builders.
 *  Output is plain JSON-LD objects, serialized inside <script type="application/ld+json">.
 *  Validate with https://search.google.com/test/rich-results */

import { SITE, DIVISIONS } from "./site";
import { getSiteUrl } from "./site-url";

const SITE_URL = getSiteUrl();
const LOGO_URL = `${SITE_URL}/logo.png`;

const sameAs = [
  SITE.socials.facebook,
  SITE.socials.youtube,
  SITE.socials.telegram,
].filter((u) => u && !u.endsWith("#"));

/** Promise Group as the publishing Organization. */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}#organization`,
    name: SITE.name,
    alternateName: [SITE.shortName, SITE.nameBn],
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: LOGO_URL,
      width: 500,
      height: 500,
    },
    foundingDate: `${SITE.founded}-01-01`,
    sameAs,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SITE.phone,
      email: SITE.email,
      contactType: "customer service",
      areaServed: "BD",
      availableLanguage: ["Bengali", "English"],
    },
  };
}

/** WebSite — enables Google sitelinks search box if SearchAction is added. */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}#website`,
    url: SITE_URL,
    name: SITE.shortName,
    description: SITE.description,
    publisher: { "@id": `${SITE_URL}#organization` },
    inLanguage: "bn-BD",
  };
}

/** LocalBusiness — physical office address + hours. Boosts local SEO. */
export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${SITE_URL}#localbusiness`,
    name: SITE.name,
    image: LOGO_URL,
    url: SITE_URL,
    telephone: SITE.phone,
    email: SITE.email,
    priceRange: "৳৳",
    address: {
      "@type": "PostalAddress",
      streetAddress: "123/1/2 Kazi Tower, South Jatrabari",
      addressLocality: "Dhaka",
      postalCode: "1204",
      addressCountry: "BD",
    },
    // Tue–Sun, 9 AM – 6 PM (Monday is the weekly off).
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "09:00",
        closes: "18:00",
      },
    ],
    sameAs,
  };
}

/** BreadcrumbList for inner pages (Home → Divisions → [Division]). */
export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/** Service schema for each business division. */
export function divisionServiceSchema(slug: string) {
  const d = DIVISIONS.find((x) => x.slug === slug);
  if (!d) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: d.nameEn,
    alternateName: d.nameBn,
    description: d.longDescription,
    url: `${SITE_URL}/${d.slug}`,
    provider: { "@id": `${SITE_URL}#organization` },
    areaServed: { "@type": "Country", name: "Bangladesh" },
  };
}
