import Link from "next/link";
import { requireAdmin } from "@/lib/adminSession";
import { getOrderStore, isDurable } from "@/lib/orderStore";
import { formatINRPlain } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<OrderStatus, string> = {
  new: "bg-gold/15 text-gold-soft",
  confirmed: "bg-good/15 text-good",
  packed: "bg-good/15 text-good",
  dispatched: "bg-good/15 text-good",
  delivered: "bg-surface-2 text-muted",
  cancelled: "bg-ember/15 text-ember",
};

export default async function AdminOrdersPage() {
  await requireAdmin();

  const store = await getOrderStore();
  const orders = await store.list(100);
  const durable = isDurable(store);

  const newCount = orders.filter((o) => o.status === "new").length;
  const unpaidCount = orders.filter((o) => o.paymentStatus === "unpaid").length;
  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      {!durable && (
        <p className="mb-5 rounded-xl border border-ember/50 bg-ember/10 p-3.5 text-[13.5px] leading-relaxed text-ember">
          <strong>No database connected.</strong> Orders are being held in memory and
          will be lost on restart. Create the D1 database and set its id in
          wrangler.jsonc before taking real orders.
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          [String(newCount), "new orders"],
          [String(unpaidCount), "awaiting payment"],
          [`Rs ${formatINRPlain(Math.round(revenue))}`, "order value"],
        ].map(([k, v]) => (
          <div key={v} className="rounded-2xl border border-line bg-surface p-4">
            <p className="tnum text-xl font-black text-gold">{k}</p>
            <p className="mt-1 text-[12px] text-muted">{v}</p>
          </div>
        ))}
      </div>

      <h1 className="mt-8 text-lg font-bold text-text">Orders</h1>

      {orders.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-line bg-surface p-8 text-center text-[14px] text-muted">
          No orders yet.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-line/60 overflow-hidden rounded-2xl border border-line bg-surface">
          {orders.map((order) => (
            <li key={order.orderNo}>
              <Link
                href={`/admin/orders/${order.orderNo}`}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2">
                    <span className="tnum text-[14px] font-semibold text-text">
                      {order.orderNo}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase ${STATUS_STYLE[order.status]}`}
                    >
                      {order.status}
                    </span>
                    {order.paymentStatus === "paid" && (
                      <span className="rounded bg-good/15 px-1.5 py-0.5 text-[11px] font-semibold text-good">
                        paid
                      </span>
                    )}
                  </p>
                  <p className="tnum mt-0.5 truncate text-[12.5px] text-muted">
                    {order.customerName} &middot; {order.mobile} &middot; {order.city}
                  </p>
                </div>
                <p className="tnum shrink-0 text-[15px] font-bold text-gold-soft">
                  Rs {order.total.toFixed(2)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
