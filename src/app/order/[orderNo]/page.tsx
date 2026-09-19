import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getOrderStore } from "@/lib/orderStore";
import { shop } from "@/lib/shop";
import { formatINRPlain } from "@/lib/format";
import { buildUpiIntent, buildWhatsAppLink } from "@/lib/upi";

// Per-order page: one Worker invocation per order view, not per pageview.
export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}) {
  const { orderNo } = await params;
  const order = await getOrderStore().getByOrderNo(orderNo);
  if (!order) notFound();

  const vpa = process.env.NEXT_PUBLIC_UPI_VPA ?? "";
  const payeeName = process.env.NEXT_PUBLIC_UPI_PAYEE_NAME ?? shop.legalName;

  const upiLink = vpa
    ? buildUpiIntent({ vpa, payeeName, amount: order.total, orderNo: order.orderNo })
    : null;
  const qrSvg = upiLink
    ? await QRCode.toString(upiLink, { type: "svg", margin: 1, width: 220 })
    : null;

  const whatsapp = buildWhatsAppLink(
    `91${shop.phones[0]}`,
    `Hello ${shop.brandName}, I have placed order ${order.orderNo} for Rs ${order.total.toFixed(2)}.`,
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-2xl border border-good/40 bg-good/10 p-5">
        <p className="text-[13px] uppercase tracking-wider text-good">Order received</p>
        <h1 className="tnum mt-1 text-2xl font-black text-text">{order.orderNo}</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          Thank you, {order.customerName}. We will call you on{" "}
          <strong className="text-text">{order.mobile}</strong> to confirm stock, packing
          and transport. Please keep this order number for reference.
        </p>
      </div>

      <section className="mt-5 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-[15px] font-bold text-text">Your items</h2>
        <ul className="mt-3 divide-y divide-line/60">
          {order.items.map((item) => (
            <li key={item.code} className="flex items-baseline justify-between gap-3 py-2">
              <span className="text-[14px] text-text">
                <span className="tnum text-muted">#{item.code}</span> {item.name}
                <span className="tnum ml-1.5 text-muted">
                  x {item.qty} {item.unit}
                </span>
              </span>
              <span className="tnum shrink-0 text-[14px] text-text">
                Rs {formatINRPlain(item.lineTotal)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-[14px]">
          <div className="flex justify-between text-muted">
            <dt>Subtotal</dt>
            <dd className="tnum">Rs {formatINRPlain(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between text-muted">
            <dt>Packing charges</dt>
            <dd className="tnum">
              Rs {formatINRPlain(Math.round(order.total) - order.subtotal)}
            </dd>
          </div>
          <div className="flex justify-between text-[18px] font-bold text-gold-soft">
            <dt>Amount payable</dt>
            <dd className="tnum">Rs {order.total.toFixed(2)}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-5 rounded-2xl border border-gold/30 bg-gold/5 p-5">
        <h2 className="text-[15px] font-bold text-text">Payment</h2>
        <p className="mt-1 text-[13.5px] leading-relaxed text-muted">
          Pay the exact amount including paise &mdash; the last two digits identify your
          order, so we can match your payment without a screenshot.
        </p>

        {upiLink ? (
          <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {qrSvg && (
              <div
                className="shrink-0 rounded-xl bg-white p-2"
                // Generated server-side by the qrcode package from our own data.
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            )}
            <div className="min-w-0">
              <a
                href={upiLink}
                className="inline-block rounded-xl bg-gold px-5 py-3.5 text-[15px] font-bold text-[#1a1200]"
              >
                Pay Rs {order.total.toFixed(2)} by UPI
              </a>
              <p className="mt-2 text-[13px] text-muted">
                UPI ID: <span className="text-text">{vpa}</span>
              </p>
              <p className="text-[13px] text-muted">
                Reference: <span className="tnum text-text">{order.orderNo}</span>
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-3 rounded-xl border border-line bg-surface p-3 text-[13px] text-muted">
            UPI details are not configured yet. Set{" "}
            <code className="text-text">NEXT_PUBLIC_UPI_VPA</code> in the environment to
            show the QR code and payment button here.
          </p>
        )}

        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-[13.5px] font-semibold text-good"
        >
          Send us the payment details on WhatsApp &rarr;
        </a>
      </section>

      <section className="mt-5 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-[15px] font-bold text-text">Delivery to</h2>
        <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-muted">
          {order.customerName}
          {"\n"}
          {order.address}
          {"\n"}
          {order.city}, {order.state} - {order.pincode}
          {"\n"}
          {order.mobile}
        </p>
      </section>

      <Link href="/pricelist" className="mt-6 inline-block text-[14px] text-gold">
        &larr; Back to the price list
      </Link>
    </main>
  );
}
