import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/adminSession";
import { getOrderStore } from "@/lib/orderStore";
import { formatINRPlain } from "@/lib/format";
import { buildWhatsAppLink } from "@/lib/upi";
import { AdminOrderActions } from "@/components/AdminOrderActions";

export const dynamic = "force-dynamic";

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}) {
  await requireAdmin();

  const { orderNo } = await params;
  const store = await getOrderStore();
  const order = await store.getByOrderNo(orderNo);
  if (!order) notFound();

  const customerWhatsApp = buildWhatsAppLink(
    `91${order.whatsapp || order.mobile}`,
    `Hello ${order.customerName}, regarding your order ${order.orderNo} for Rs ${order.total.toFixed(2)}.`,
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Link href="/admin" className="text-[13px] text-muted hover:text-text">
        &larr; All orders
      </Link>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="tnum text-2xl font-black text-text">{order.orderNo}</h1>
        <p className="tnum text-2xl font-black text-gold">Rs {order.total.toFixed(2)}</p>
      </div>
      <p className="mt-1 text-[12.5px] text-muted">
        {new Date(order.createdAt).toLocaleString("en-IN")} &middot; {order.status} &middot;{" "}
        {order.paymentStatus.replace("_", " ")}
        {!order.mobileVerified && (
          <span className="ml-2 rounded bg-ember/15 px-1.5 py-0.5 text-[11px] font-semibold text-ember">
            mobile not verified
          </span>
        )}
      </p>

      <section className="mt-5 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-[15px] font-bold text-text">Customer</h2>
        <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-muted">
          {order.customerName}
          {"\n"}
          {order.address}
          {"\n"}
          {order.city}, {order.state} - {order.pincode}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={`tel:+91${order.mobile}`}
            className="tnum rounded-lg border border-line bg-surface-2 px-3 py-2 text-[13px] text-text"
          >
            Call {order.mobile}
          </a>
          <a
            href={customerWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-good/40 bg-good/10 px-3 py-2 text-[13px] font-semibold text-good"
          >
            WhatsApp
          </a>
        </div>
        {order.transportPref && (
          <p className="mt-3 text-[13px] text-muted">Transport: {order.transportPref}</p>
        )}
        {order.notes && (
          <p className="mt-1 text-[13px] text-muted">Notes: {order.notes}</p>
        )}
      </section>

      <section className="mt-5 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-[15px] font-bold text-text">
          Packing list ({order.items.length} lines)
        </h2>
        <ul className="mt-3 divide-y divide-line/60">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-baseline justify-between gap-3 py-2">
              <span className="text-[14px] text-text">
                <span className="tnum text-muted">#{item.code}</span> {item.name}
              </span>
              <span className="tnum shrink-0 text-[14px] text-text">
                {item.qty} {item.unit} &middot; Rs {formatINRPlain(item.lineTotal)}
              </span>
            </li>
          ))}
        </ul>
        <p className="tnum mt-3 border-t border-line pt-3 text-right text-[14px] text-muted">
          Subtotal Rs {formatINRPlain(order.subtotal)} &middot; payable{" "}
          <strong className="text-gold-soft">Rs {order.total.toFixed(2)}</strong>
        </p>
      </section>

      <section className="mt-5 rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-4 text-[15px] font-bold text-text">Update</h2>
        <AdminOrderActions
          orderNo={order.orderNo}
          status={order.status}
          paymentStatus={order.paymentStatus}
          utr={order.utr}
        />
      </section>
    </main>
  );
}
