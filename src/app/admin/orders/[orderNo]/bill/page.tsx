import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { requireAdmin } from "@/lib/adminSession";
import { getOrderStore } from "@/lib/orderStore";
import { shop } from "@/lib/shop";
import { formatINRPlain } from "@/lib/format";
import { buildUpiIntent } from "@/lib/upi";
import { PACKING_CHARGE_PCT } from "@/lib/pricing";
import { BillActions } from "@/components/BillActions";

export const dynamic = "force-dynamic";

export default async function BillPage({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}) {
  await requireAdmin();

  const { orderNo } = await params;
  const store = await getOrderStore();
  const order = await store.getByOrderNo(orderNo);
  if (!order) notFound();

  const packing = Math.round((order.total - order.subtotal) * 100) / 100;

  const vpa = process.env.NEXT_PUBLIC_UPI_VPA ?? "";
  const payeeName = process.env.NEXT_PUBLIC_UPI_PAYEE_NAME ?? shop.legalName;
  const upiLink = vpa
    ? buildUpiIntent({ vpa, payeeName, amount: order.total, orderNo: order.orderNo })
    : null;
  const qrSvg = upiLink
    ? await QRCode.toString(upiLink, { type: "svg", margin: 0, width: 150 })
    : null;

  const paid = order.paymentStatus === "paid";

  // Plain text so it pastes cleanly into WhatsApp on any phone.
  const whatsappBill = [
    `*${shop.brandName}* (${shop.legalName})`,
    `Bill for order ${order.orderNo}`,
    "",
    ...order.items.map((i) => `${i.code}. ${i.name} x${i.qty} = Rs ${formatINRPlain(i.lineTotal)}`),
    "",
    `Subtotal: Rs ${formatINRPlain(order.subtotal)}`,
    `Packing (${PACKING_CHARGE_PCT}%): Rs ${formatINRPlain(packing)}`,
    `*Total: Rs ${order.total.toFixed(2)}*`,
    "",
    paid
      ? "Payment received. Thank you!"
      : `Please pay the exact amount including paise to UPI: ${vpa || "(ask us)"}`,
    "",
    `Questions? Call ${shop.phones[0]}`,
  ].join("\n");

  return (
    <main className="bill mx-auto max-w-3xl px-4 py-6">
      <Link href={`/admin/orders/${order.orderNo}`} className="no-print text-[13px] text-muted">
        &larr; Back to order
      </Link>

      <div className="no-print h-3" />
      <BillActions mobile={order.whatsapp || order.mobile} message={whatsappBill} />

      {/* Deliberately light: this sheet gets printed and shared, not browsed. */}
      <article className="bill-sheet rounded-2xl bg-white p-6 text-[#111] sm:p-8">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-[#111] pb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#555]">
              {shop.legalName}
            </p>
            <h1 className="text-2xl font-black">{shop.brandName}</h1>
            <p className="mt-1 whitespace-pre-line text-[12.5px] leading-relaxed text-[#444]">
              {shop.address || `${shop.city}, ${shop.state}`}
              <br />
              Phone: {shop.phones.join(", ")}
              {shop.gstin && (
                <>
                  <br />
                  GSTIN: {shop.gstin}
                </>
              )}
              {shop.licenceNo && (
                <>
                  <br />
                  Licence: {shop.licenceNo}
                </>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[13px] font-bold uppercase tracking-wider">Bill</p>
            <p className="tnum text-[15px] font-bold">{order.orderNo}</p>
            <p className="tnum text-[12.5px] text-[#555]">
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
            <p
              className={`mt-1 inline-block rounded px-2 py-0.5 text-[11px] font-bold uppercase ${
                paid ? "bg-[#d3f9d8] text-[#0b7a3b]" : "bg-[#ffe3e3] text-[#c92a2a]"
              }`}
            >
              {paid ? "Paid" : "Payment pending"}
            </p>
          </div>
        </header>

        <section className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#555]">Bill to</p>
          <p className="mt-1 whitespace-pre-line text-[13.5px] leading-relaxed">
            <strong>{order.customerName}</strong>
            {"\n"}
            {order.address}
            {"\n"}
            {order.city}, {order.state} - {order.pincode}
            {"\n"}
            {order.mobile}
          </p>
        </section>

        {/* Five columns on a 375px phone would overflow; scroll on screen, full
            width on paper where the page is wide enough. */}
        <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[460px] border-collapse text-[13px]">
          <thead>
            <tr className="border-y border-[#ccc] text-left">
              <th className="py-1.5 pr-2 font-semibold">#</th>
              <th className="py-1.5 pr-2 font-semibold">Item</th>
              <th className="py-1.5 pr-2 text-right font-semibold">Qty</th>
              <th className="py-1.5 pr-2 text-right font-semibold">Rate</th>
              <th className="py-1.5 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-[#eee]">
                <td className="tnum py-1.5 pr-2 text-[#666]">{item.code}</td>
                <td className="py-1.5 pr-2">{item.name}</td>
                <td className="tnum py-1.5 pr-2 text-right">
                  {item.qty} {item.unit}
                </td>
                <td className="tnum py-1.5 pr-2 text-right">{formatINRPlain(item.price)}</td>
                <td className="tnum py-1.5 text-right">{formatINRPlain(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
          {qrSvg && !paid && (
            <div className="shrink-0">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#555]">
                Scan to pay
              </p>
              <div
                className="w-[150px]"
                // Generated server-side by the qrcode package from our own data.
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <p className="tnum mt-1.5 text-[11.5px] text-[#444]">{vpa}</p>
              <p className="text-[11.5px] text-[#444]">{payeeName}</p>
            </div>
          )}

          <dl className="ml-auto min-w-[210px] text-[13.5px]">
            <div className="flex justify-between py-1">
              <dt>Subtotal</dt>
              <dd className="tnum">Rs {formatINRPlain(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt>Packing charges ({PACKING_CHARGE_PCT}%)</dt>
              <dd className="tnum">Rs {formatINRPlain(packing)}</dd>
            </div>
            <div className="mt-1 flex justify-between border-t-2 border-[#111] py-1.5 text-[16px] font-black">
              <dt>Total</dt>
              <dd className="tnum">Rs {order.total.toFixed(2)}</dd>
            </div>
            {order.utr && (
              <p className="tnum mt-1 text-[11.5px] text-[#555]">Payment ref: {order.utr}</p>
            )}
          </dl>
        </div>

        <p className="mt-5 border-t border-[#ddd] pt-3 text-[11.5px] leading-relaxed text-[#555]">
          Please pay the exact amount including paise &mdash; the last two digits identify
          this order. Goods once sold are not taken back. Handle fireworks as per the
          safety instructions on the pack.
        </p>
      </article>
    </main>
  );
}
