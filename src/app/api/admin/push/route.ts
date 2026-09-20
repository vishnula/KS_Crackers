import { NextResponse } from "next/server";
import { isSignedIn } from "@/lib/adminSession";
import { addSubscription, removeSubscription } from "@/lib/pushStore";

function isPushEndpoint(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!(await isSignedIn()))
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { endpoint } = (await request.json()) as { endpoint?: unknown };
  if (!isPushEndpoint(endpoint))
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });

  const saved = await addSubscription(endpoint);
  if (!saved)
    return NextResponse.json({ error: "No database connected" }, { status: 503 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!(await isSignedIn()))
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { endpoint } = (await request.json()) as { endpoint?: unknown };
  if (!isPushEndpoint(endpoint))
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });

  await removeSubscription(endpoint);
  return NextResponse.json({ ok: true });
}
