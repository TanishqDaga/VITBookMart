/**
 * Phone cameras produce 12–48 MP photos of 2–5 MB, while a listing image is shown
 * at a few hundred pixels wide. Uploading the full file over a campus or mobile
 * connection is the slowest, flakiest part of posting a listing, so photos are
 * downscaled and re-encoded as JPEG before they are sent.
 *
 * Every failure path returns the original file untouched — the backend still
 * validates type and size, so a skipped resize can never make things worse.
 */

const MAX_EDGE_PX = 1600;
const JPEG_QUALITY = 0.82;
/** Files this small are already cheap to upload. */
const SKIP_BELOW_BYTES = 400 * 1024;

export async function shrinkImageForUpload(file: File): Promise<File> {
  if (file.size <= SKIP_BELOW_BYTES) return file;

  try {
    // Modern browsers apply EXIF orientation to both naturalWidth/Height and
    // drawImage, so rotated phone photos come out upright.
    const image = await loadImage(file);
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.round(image.naturalWidth * scale);
    const height = Math.round(image.naturalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return file;

    // JPEG has no alpha channel: paint transparent PNG/WEBP areas white, not black.
    context.fillStyle = "#fff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;

    const name = `${file.name.replace(/\.[^.]+$/, "") || "photo"}.jpg`;
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode image"));
    };
    image.src = url;
  });
}
