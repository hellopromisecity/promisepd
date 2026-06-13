"use server";

/** Image-upload Server Action — the single entry point any future
 *  admin / editor UI should call when accepting a user-supplied image.
 *
 *  Pipeline (MUST RULE — see AGENTS.md):
 *    1. Receive raw bytes from the browser.
 *    2. Run through `toOptimizedWebp` → resized + compressed WebP.
 *    3. Upload the optimized bytes to Supabase Storage.
 *    4. Return the public URL (or an error message).
 *
 *  Bucket assumptions:
 *    - A public bucket named "uploads" exists in your Supabase project.
 *    - Anyone with the URL can read; only the service role can write.
 *
 *  Forward-looking: no UI calls this yet, but it's wired up so when
 *  the admin panel lands the upload pipeline is one line away. */

import { createAdminClient } from "@/lib/supabase/admin";
import { optimizeUploadedFile, type ImageOptimizeOptions } from "@/lib/image";

export type UploadImageResult =
  | { ok: true; url: string; path: string; width: number; height: number; size: number }
  | { ok: false; error: string };

/** Accepts a FormData payload with an `image` File field, optionally
 *  a `folder` string for namespacing within the bucket.
 *
 *  @example (client)
 *    const fd = new FormData();
 *    fd.append("image", file);
 *    fd.append("folder", "team");
 *    const res = await uploadImage(fd);
 */
export async function uploadImage(
  formData: FormData,
  opts: ImageOptimizeOptions = {},
): Promise<UploadImageResult> {
  const file = formData.get("image");
  if (!(file instanceof File)) {
    return { ok: false, error: "No image attached to the upload." };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Only image files are accepted." };
  }
  if (file.size === 0) {
    return { ok: false, error: "Uploaded file is empty." };
  }
  if (file.size > 25 * 1024 * 1024) {
    return {
      ok: false,
      error: "Image is larger than 25 MB — please send a smaller file.",
    };
  }

  const folderRaw = formData.get("folder");
  const folder =
    typeof folderRaw === "string"
      ? folderRaw.replace(/[^a-z0-9-]/gi, "").toLowerCase().slice(0, 40)
      : "general";

  // 1 + 2: MUST RULE — convert to optimised WebP.  Never persist the
  // raw bytes.
  let optimised;
  try {
    optimised = await optimizeUploadedFile(file, opts);
  } catch (err) {
    console.error("[upload-image] optimization failed", err);
    return { ok: false, error: "Could not process this image." };
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return {
      ok: false,
      error: "Storage is not configured yet — set SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  // Path: `<folder>/<timestamp>-<filename>` keeps things sorted
  // chronologically and avoids name collisions.
  const path = `${folder}/${Date.now()}-${optimised.filename}`;

  const { error: uploadErr } = await supabase.storage
    .from("uploads")
    .upload(path, optimised.buffer, {
      contentType: "image/webp",
      cacheControl: "31536000", // 1 year — output is content-addressed by timestamp
      upsert: false,
    });

  if (uploadErr) {
    console.error("[upload-image] supabase upload failed", uploadErr);
    return { ok: false, error: "Could not upload to storage." };
  }

  const { data } = supabase.storage.from("uploads").getPublicUrl(path);

  return {
    ok: true,
    url: data.publicUrl,
    path,
    width: optimised.width,
    height: optimised.height,
    size: optimised.size,
  };
}
