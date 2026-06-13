/** Server-side image pipeline — the MUST RULE.
 *
 *  Every user-uploaded image on this site goes through here before
 *  being persisted (Supabase Storage, /public, anywhere).  Output is
 *  ALWAYS modern WebP, properly resized, properly compressed.
 *
 *  Why this is a hard rule:
 *    - WebP is ~25–35 % smaller than equivalent-quality JPEG and ~50 %
 *      smaller than PNG.  Browser support is universal.
 *    - Real-estate photos straight off a phone are 4–12 MB each;
 *      shipping that to mobile visitors over 4G is unforgivable.
 *    - Keeps the database / blob storage bill in check as the team
 *      uploads hundreds of project photos over time.
 *
 *  Server-only — uses `sharp` (native, Node).  Importing this file
 *  into a Client Component will fail the build, which is the
 *  intended guardrail.
 */

import "server-only";
import sharp from "sharp";

export type ImageOptimizeOptions = {
  /** Hard cap on the longer edge in pixels.  Default 1920 — enough
   *  for hero / cover images, way bigger than any thumbnail. */
  maxWidth?: number;
  maxHeight?: number;
  /** WebP quality 1–100.  Default 78 — visually lossless at typical
   *  viewing distance and roughly half the size of quality 90. */
  quality?: number;
  /** Background colour used when flattening a transparent PNG into a
   *  WebP that will be served as a hero photo.  Default white. */
  flattenBackground?: string;
};

export type OptimizedImage = {
  /** Optimized WebP bytes — ready to write to disk / upload. */
  buffer: Buffer;
  /** Final dimensions after resize. */
  width: number;
  height: number;
  /** Output byte count — useful for "saved 4.2 MB" messaging. */
  size: number;
  /** Always "image/webp" — included for convenience when constructing
   *  FormData / Blob responses. */
  mimeType: "image/webp";
};

/** Convert any common image format (JPG, PNG, GIF, AVIF, HEIC*) into
 *  a resized + compressed WebP buffer.
 *
 *  * HEIC requires libheif support in sharp — present on Vercel's
 *    runtime, may need extra setup if self-hosting on bare Linux.
 *
 *  Auto-rotates based on EXIF (so portraits don't end up sideways)
 *  and strips all metadata (privacy + a few KB saved).
 *
 *  @example
 *    const input = Buffer.from(await file.arrayBuffer());
 *    const { buffer } = await toOptimizedWebp(input);
 *    await supabase.storage.from("uploads").upload(`team/${id}.webp`, buffer, {
 *      contentType: "image/webp",
 *    });
 */
export async function toOptimizedWebp(
  input: Buffer | ArrayBuffer | Uint8Array,
  opts: ImageOptimizeOptions = {},
): Promise<OptimizedImage> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 78,
    flattenBackground = "#ffffff",
  } = opts;

  // Buffer.from has overloaded signatures for each input shape; rather
  // than fight the type-checker with a single union arg, dispatch on
  // the runtime type so each branch lines up with its overload.
  let inputBuffer: Buffer;
  if (input instanceof Buffer) {
    inputBuffer = input;
  } else if (input instanceof Uint8Array) {
    inputBuffer = Buffer.from(input);
  } else {
    inputBuffer = Buffer.from(new Uint8Array(input));
  }

  const pipeline = sharp(inputBuffer, { failOn: "none" })
    .rotate() // honour EXIF orientation
    .flatten({ background: flattenBackground }) // drop alpha → solid bg
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside", // keep aspect ratio, never upscale
      withoutEnlargement: true,
    })
    .webp({
      quality,
      effort: 5, // 0 (fast, big) – 6 (slow, smallest).  5 is the sweet spot.
      smartSubsample: true,
    });

  const buffer = await pipeline.toBuffer();
  const meta = await sharp(buffer).metadata();

  return {
    buffer,
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    size: buffer.length,
    mimeType: "image/webp",
  };
}

/** Helper for callers that already have a Web File / Blob (e.g. from
 *  a form input).  Returns the same optimised payload + a stable
 *  filename ending in `.webp`. */
export async function optimizeUploadedFile(
  file: File,
  opts: ImageOptimizeOptions = {},
): Promise<OptimizedImage & { filename: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const optimised = await toOptimizedWebp(arrayBuffer, opts);
  const stem = file.name.replace(/\.[^.]+$/, "") || "upload";
  return { ...optimised, filename: `${slugify(stem)}.webp` };
}

/** Filename-safe slug — lowercase, alphanumerics + hyphens only.
 *  Keeps Bangla characters out of stored paths (some object storage
 *  backends choke on non-ASCII keys). */
function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\x20-\x7E]/g, "") // strip non-ASCII (including Bangla)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "upload"
  );
}
