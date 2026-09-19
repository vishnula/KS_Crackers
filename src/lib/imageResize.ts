"use client";

// Photos come straight off a phone camera at 3-6 MB each. Resizing in the
// browser before upload keeps the price list light on village 4G and avoids
// doing image work inside the Worker, which cannot resize anyway.

const MAX_EDGE = 900;
const QUALITY = 0.82;

export type ResizedImage = { blob: Blob; width: number; height: number };

export async function resizeImage(file: File): Promise<ResizedImage> {
  if (!file.type.startsWith("image/")) throw new Error("That file is not an image");

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not process that image");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY),
  );
  if (!blob) throw new Error("Could not compress that image");

  return { blob, width, height };
}
