/** Slug helper shared between the client form (live auto-suggest) and
 *  the server actions (final normalisation before the DB write).
 *
 *  Kept out of the "use server" actions file on purpose: every export
 *  of a "use server" module must be an async Server Function, and this
 *  is a plain synchronous utility used on both sides. */

/** lowercase, spaces→-, strip non-url chars, collapse repeats.
 *
 *  Unicode-aware: keeps any *letter* or *number* in any script — so a
 *  pure-Bangla title like "বার্ষিক ভ্রমণ গাইডলাইন – ২০২৬" yields
 *  "বার্ষিক-ভ্রমণ-গাইডলাইন-২০২৬" instead of an empty string.  Only
 *  punctuation / symbols (–, —, ?, :, emoji …) get stripped.  Modern
 *  browsers + Next.js dynamic routes handle these percent-encoded
 *  Unicode slugs fine, and Bangla-first content stays readable. */
export function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
