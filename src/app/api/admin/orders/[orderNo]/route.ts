import { NextResponse } from "next/server";
import { isSignedIn } from "@/lib/adminSession";
import { getOrderStore } from "@/lib/orderStore";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = [
  "new", "confirmed", "packed", "dispatched", "delivered", "cancelled",
];
const PAYMENT_STATUSES: PaymentStatus[] = ["unpaid", "advance_paid", "paid", "refunded"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderNo: string }> },
) {
  if (!(await isSignedIn()))
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { orderNo } = await params;

  let body: { status?: string; paymentStatus?: string; utr?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }

  if (body.status && !STATUSES.includes(body.status as OrderStatus))
    return NextResponse.json({ error: "Unknown status" }, { status: 400 });
  if (body.paymentStatus && !PAYMENT_STATUSES.includes(body.paymentStatus as PaymentStatus))
    return NextResponse.json({ error: "Unknown payment status" }, { status: 400 });

  const store = await getOrderStore();
  if (!(await store.getByOrderNo(orderNo)))
    return NextResponse.json({ error: "Order not found" }, { status: 404 });

  await store.updateStatus(orderNo, {
    status: body.status as OrderStatus | undefined,
    paymentStatus: body.paymentStatus as PaymentStatus | undefined,
    utr: body.utr === undefined ? undefined : body.utr.trim() || null,
  });

  return NextResponse.json({ ok: true });
}
