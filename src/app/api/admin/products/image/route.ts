import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { R2Bucket } from "@cloudflare/workers-types";
import { isSignedIn } from "@/lib/adminSession";
import { updateProduct } from "@/lib/productStore";

// Images are written to a PUBLIC R2 bucket and served straight from Cloudflare,
// so viewing a photo never invokes the Worker. Only this upload does.
// The browser resizes before sending (see lib/imageResize.ts).

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 1_500_000;

async function getBucket(): Promise<R2Bucket | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    return ((env as { PRODUCT_IMAGES?: R2Bucket }).PRODUCT_IMAGES as R2Bucket) ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (!(await isSignedIn()))
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const base = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;
  if (!base)
    return NextResponse.json(
      { error: "NEXT_PUBLIC_IMAGE_BASE_URL is not set" },
      { status: 503 },
    );

  const form = await request.formData();
  const code = Number(form.get("code"));
  const file = form.get("file");

  if (!Number.isInteger(code))
    return NextResponse.json({ error: "Product code is required" }, { status: 400 });
  if (!(file instanceof File))
    return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
  if (!ALLOWED.includes(file.type))
    return NextResponse.json({ error: "Use a JPG, PNG or WebP image" }, { status: 400 });
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: "Image is too large" }, { status: 400 });

  const bucket = await getBucket();
  if (!bucket)
    return NextResponse.json(
      { error: "Image storage is not connected" },
      { status: 503 },
    );

  // Content-hashed key so a replaced photo never serves from a stale CDN cache.
  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = [...new Uint8Array(digest)]
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const key = `products/${code}-${hash}.jpg`;

  await bucket.put(key, bytes, {
    httpMetadata: {
      contentType: file.type,
      cacheControl: "public, max-age=31536000, immutable",
    },
  });

  const url = `${base.replace(/\/$/, "")}/${key}`;
  const saved = await updateProduct(code, { imageUrl: url });
  if (!saved)
    return NextResponse.json(
      { error: "Uploaded, but the product row was not updated" },
      { status: 500 },
    );

  revalidatePath("/pricelist");
  revalidatePath("/");
  return NextResponse.json({ ok: true, url });
}

export async function DELETE(request: Request) {
  if (!(await isSignedIn()))
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { code } = (await request.json()) as { code?: number };
  if (!Number.isInteger(code))
    return NextResponse.json({ error: "Product code is required" }, { status: 400 });

  // The object stays in R2 - it is content-hashed and costs nothing, and keeping
  // it means an accidental removal can be undone by re-uploading the same file.
  await updateProduct(Number(code), { imageUrl: null });
  revalidatePath("/pricelist");
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
