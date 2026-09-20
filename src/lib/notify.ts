import type { StoredOrder } from "./orderStore";
import { shop } from "./shop";

// Owner alerts are best-effort: the database write is the moment of truth, and a
// failed notification must never fail an order (PLAN.md 3.2b). Every path here
// swallows its errors and reports what happened instead of throwing.

export type NotifyResult = { channel: string; ok: boolean; detail?: string };

function orderSummary(order: StoredOrder): string {
  const lines = order.items
    .map((i) => `  #${i.code} ${i.name} x ${i.qty} ${i.unit} = Rs ${i.lineTotal}`)
    .join("\n");

  return [
    `New order ${order.orderNo}`,
    `Rs ${order.total.toFixed(2)} - ${order.items.length} line(s)`,
    "",
    `${order.customerName}`,
    `${order.mobile}${order.whatsapp ? ` / WhatsApp ${order.whatsapp}` : ""}`,
    `${order.address}`,
    `${order.city}, ${order.state} - ${order.pincode}`,
    order.transportPref ? `Transport: ${order.transportPref}` : "",
    order.notes ? `Notes: ${order.notes}` : "",
    "",
    lines,
    "",
    `Subtotal Rs ${order.subtotal}`,
    `Total Rs ${order.total.toFixed(2)} (last two paise identify this order)`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function sendEmail(order: StoredOrder): Promise<NotifyResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.OWNER_EMAIL;
  const from = process.env.NOTIFY_FROM_EMAIL;

  if (!apiKey || !to || !from)
    return { channel: "email", ok: false, detail: "not configured" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: `New order ${order.orderNo} - Rs ${order.total.toFixed(2)} - ${order.city}`,
        text: orderSummary(order),
      }),
    });
    if (!res.ok) return { channel: "email", ok: false, detail: `HTTP ${res.status}` };
    return { channel: "email", ok: true };
  } catch (error) {
    return { channel: "email", ok: false, detail: String(error) };
  }
}

async function sendPushAlerts(): Promise<NotifyResult> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? `mailto:${process.env.OWNER_EMAIL ?? "owner@example.com"}`;

  if (!publicKey || !privateKey)
    return { channel: "push", ok: false, detail: "not configured" };

  const { listSubscriptions, removeSubscription } = await import("./pushStore");
  const endpoints = await listSubscriptions();
  if (endpoints.length === 0)
    return { channel: "push", ok: false, detail: "no devices subscribed" };

  const { sendPush } = await import("./webpush");
  const results = await Promise.all(
    endpoints.map((endpoint) =>
      sendPush(endpoint, { publicKey, privateKey, subject }).catch(() => ({
        endpoint,
        status: 0,
        gone: false,
      })),
    ),
  );

  // A browser that dropped the subscription will never accept another push.
  await Promise.all(results.filter((r) => r.gone).map((r) => removeSubscription(r.endpoint)));

  const delivered = results.filter((r) => r.status >= 200 && r.status < 300).length;
  return {
    channel: "push",
    ok: delivered > 0,
    detail: `${delivered}/${endpoints.length} delivered`,
  };
}

export async function notifyOwner(order: StoredOrder): Promise<NotifyResult[]> {
  const results = [await sendPushAlerts(), await sendEmail(order)];

  // Nothing configured yet: at least put it in the Worker log so the order is
  // visible in `wrangler tail` while the client sets up an email domain.
  if (results.every((r) => !r.ok)) {
    console.log(`[order] ${order.orderNo} Rs ${order.total.toFixed(2)} ${order.mobile}`);
  }

  return results;
}

export function ownerWhatsAppLink(order: StoredOrder): string {
  const text = encodeURIComponent(orderSummary(order));
  return `https://wa.me/91${shop.phones[0]}?text=${text}`;
}
