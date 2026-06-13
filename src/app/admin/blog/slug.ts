/** Slug helper shared between the client form (live auto-suggest) and
 *  the server actions (final normalisation before the DB write).
 *
 *  Kept out of the "use server" actions file on purpose: every export
 *  of a "use server" module must be an async Server Function, and this
 *  is a plain synchronous utility used on both sides. */

/** lowercase, spaces→-, strip non-url chars, collapse repeats. */
export function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
