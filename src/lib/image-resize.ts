/**
 * Downscale + re-encode an image in the browser before upload. Phone photos are
 * often 3–8 MB; shrinking to a sane max dimension and re-encoding to WebP cuts
 * that to a few hundred KB, so the R2 PUT (and later serving) is far faster.
 *
 * Best-effort: on any failure (unsupported codec, no canvas) the original file is
 * returned unchanged. Never upscales.
 */
export async function downscaleImage(file: File, maxDim = 1920, quality = 0.85): Promise<File> {
  if (typeof document === "undefined" || !file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    // Keep the original if encoding failed or didn't actually help.
    if (!blob || (scale === 1 && blob.size >= file.size)) return file;

    const name = `${file.name.replace(/\.[^.]+$/, "")}.webp`;
    return new File([blob], name, { type: "image/webp" });
  } catch {
    return file;
  }
}
