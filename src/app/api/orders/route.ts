import { NextResponse } from "next/server";
import { getProductsByCode } from "@/lib/catalogue";
import { priceOrder } from "@/lib/pricing";
import { orderNo as buildOrderNo, withUniquePaise } from "@/lib/format";
import { getOrderStore } from "@/lib/orderStore";
import { notifyOwner } from "@/lib/notify";

type Payload = {
  customerName?: string;
  mobile?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  transportPref?: string;
  notes?: string;
  lines?: { code?: number; qty?: number }[];
};

function validate(body: Payload): string[] {
  const errors: string[] = [];
  if (!body.customerName?.trim()) errors.push("Name is required");
  if (!/^[6-9]\d{9}$/.test((body.mobile ?? "").replace(/\D/g, "")))
    errors.push("Enter a valid 10 digit mobile number");
  if (!body.address?.trim()) errors.push("Address is required");
  if (!body.city?.trim()) errors.push("City is required");
  if (!body.state?.trim()) errors.push("State is required");
  if (!/^\d{6}$/.test((body.pincode ?? "").replace(/\D/g, "")))
    errors.push("Enter a valid 6 digit pincode");
  if (body.email && !/^\S+@\S+\.\S+$/.test(body.email)) errors.push("Email is not valid");
  if (!body.lines?.length) errors.push("Your cart is empty");
  return errors;
}

export async function POST(request: Request) {
  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ errors: ["Malformed request"] }, { status: 400 });
  }

  const errors = validate(body);
  if (errors.length) return NextResponse.json({ errors }, { status: 400 });

  // Re-price from the catalogue, never from what the browser posted. Otherwise
  // anyone can edit the DOM and order Rs 50,000 of crackers for Rs 1.
  const catalogue = getProductsByCode();
  const lines = [];
  for (const line of body.lines ?? []) {
    const product = catalogue.get(Number(line.code));
    const qty = Math.floor(Number(line.qty));
    if (!product || !Number.isFinite(qty) || qty <= 0 || qty > 999) continue;
    lines.push({
      code: String(product.code),
      name: product.name,
      unit: product.unit,
      mrp: product.mrp,
      price: product.price,
      qty,
    });
  }

  if (lines.length === 0)
    return NextResponse.json({ errors: ["No valid items in your cart"] }, { status: 400 });

  const totals = priceOrder(lines);

  // The minimum is re-checked here; the client-side gate is a convenience only.
  if (!totals.meetsMinimum) {
    return NextResponse.json(
      { errors: [`Minimum order value is Rs ${totals.minOrderValue}`] },
      { status: 400 },
    );
  }

  // Allocate the order number only once the order is known good, so rejected
  // attempts do not burn sequence numbers and leave gaps in the owner's list.
  const store = await getOrderStore();
  const year = new Date().getFullYear();
  const seq = await store.nextSequence(year);
  const orderNo = buildOrderNo(year, seq);

  const order = await store.create(
    {
      customerName: body.customerName!.trim(),
      mobile: (body.mobile ?? "").replace(/\D/g, ""),
      whatsapp: body.whatsapp?.replace(/\D/g, "") || null,
      email: body.email?.trim() || null,
      address: body.address!.trim(),
      city: body.city!.trim(),
      state: body.state!.trim(),
      pincode: (body.pincode ?? "").replace(/\D/g, ""),
      transportPref: body.transportPref?.trim() || null,
      notes: body.notes?.trim() || null,
      subtotal: totals.subtotal,
      discount: totals.savings,
      total: withUniquePaise(Math.round(totals.subtotal + totals.packingCharge), seq),
      status: "new",
      paymentMethod: null,
      paymentStatus: "unpaid",
      utr: null,
      paymentProofUrl: null,
      // TODO: OTP-verify the mobile before saving. Competitors do this because
      // fake orders are the main cash loss in this business - PLAN.md 3.1b.
      mobileVerified: false,
      orderIp: request.headers.get("cf-connecting-ip") ?? null,
      items: totals.lines.map((l) => ({
        productId: l.code,
        code: l.code,
        name: l.name,
        unit: l.unit as OrderUnit,
        price: l.price,
        qty: l.qty,
        lineTotal: l.lineTotal,
      })),
    },
    orderNo,
    seq,
  );

  // Best-effort and deliberately awaited-with-catch: the order is already safely
  // stored, so a dead mail provider must not turn a good order into an error.
  await notifyOwner(order).catch(() => []);

  return NextResponse.json({ orderNo: order.orderNo, total: order.total }, { status: 201 });
}

type OrderUnit = import("@/lib/types").Unit;

