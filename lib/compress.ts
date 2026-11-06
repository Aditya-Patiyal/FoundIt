// Client-side image compression (README §9: shrink before upload to keep the
// free Supabase storage small and uploads fast). Runs in the browser only.
import { PHOTO_MAX_DIMENSION, PHOTO_TARGET_BYTES } from "./config";

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image"))),
      "image/jpeg",
      quality,
    );
  });
}

// Returns a compressed JPEG Blob no larger than ~PHOTO_TARGET_BYTES, scaled so
// its longest side is at most PHOTO_MAX_DIMENSION.
export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = Math.min(1, PHOTO_MAX_DIMENSION / longest);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.82;
  let blob = await canvasToBlob(canvas, quality);
  while (blob.size > PHOTO_TARGET_BYTES && quality > 0.4) {
    quality -= 0.12;
    blob = await canvasToBlob(canvas, quality);
  }
  return blob;
}
