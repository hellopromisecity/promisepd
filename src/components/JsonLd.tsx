/** Inline JSON-LD <script> for structured data (Schema.org).
 *  Renders in the SSR output so crawlers see it before any JS runs. */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // The payload is a fixed, statically-known object — safe to inline.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
