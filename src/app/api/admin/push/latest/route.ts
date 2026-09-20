import { NextResponse } from "next/server";
import { isSignedIn } from "@/lib/adminSession";
import { getOrderStore } from "@/lib/orderStore";

// Called by the service worker when a push arrives, to find out what it was
// about. Session-guarded like every other admin endpoint.
export async function GET() {
  if (!(await isSignedIn()))
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const store = await getOrderStore();
  const [latest] = await store.list(1);
  if (!latest) return NextResponse.json({});

  return NextResponse.json({
    orderNo: latest.orderNo,
    total: latest.total.toFixed(2),
    customerName: latest.customerName,
    city: latest.city,
  });
}
