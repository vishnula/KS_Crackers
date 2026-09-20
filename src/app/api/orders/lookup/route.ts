import { NextResponse } from "next/server";
import { getOrderStore } from "@/lib/orderStore";

// Lets a customer find his own order again after losing the confirmation link.
// Knowing the order number is not enough - numbers run in sequence - so the
// mobile number on the order must match too.

export async function POST(request: Request) {
  let body: { orderNo?: string; mobile?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }

  const orderNo = (body.orderNo ?? "").trim().toUpperCase();
  const mobile = (body.mobile ?? "").replace(/\D/g, "");

  if (!orderNo || mobile.length !== 10)
    return NextResponse.json(
      { error: "Enter your order number and the 10 digit mobile number you ordered with" },
      { status: 400 },
    );

  const store = await getOrderStore();
  const order = await store.getByOrderNo(orderNo);

  // Same response whether the order is missing or the mobile is wrong, so this
  // cannot be used to discover which order numbers exist.
  if (!order || order.mobile !== mobile)
    return NextResponse.json(
      { error: "No order found with that number and mobile" },
      { status: 404 },
    );

  return NextResponse.json({
    orderNo: order.orderNo,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: order.total,
    itemCount: order.items.length,
    createdAt: order.createdAt,
    link: `/order/${order.orderNo}?t=${order.publicToken}`,
  });
}
