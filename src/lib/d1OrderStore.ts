import type { D1Database } from "@cloudflare/workers-types";
import type { Order, OrderItem, OrderStatus, PaymentStatus, Unit } from "./types";
import type { NewOrder, OrderStore, StoredOrder } from "./orderStore";

type OrderRow = {
  id: string;
  order_no: string;
  public_token: string;
  customer_name: string;
  mobile: string;
  whatsapp: string | null;
  email: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  transport_pref: string | null;
  notes: string | null;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  payment_method: string | null;
  payment_status: string;
  utr: string | null;
  payment_proof_url: string | null;
  mobile_verified: number;
  order_ip: string | null;
  created_at: string;
};

type ItemRow = {
  id: string;
  order_id: string;
  product_id: string;
  code: string;
  name: string;
  unit: string;
  price: number;
  qty: number;
  line_total: number;
};

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderNo: row.order_no,
    publicToken: row.public_token,
    customerName: row.customer_name,
    mobile: row.mobile,
    whatsapp: row.whatsapp,
    email: row.email,
    address: row.address,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    transportPref: row.transport_pref,
    notes: row.notes,
    subtotal: row.subtotal,
    discount: row.discount,
    total: row.total,
    status: row.status as OrderStatus,
    paymentMethod: row.payment_method as Order["paymentMethod"],
    paymentStatus: row.payment_status as PaymentStatus,
    utr: row.utr,
    paymentProofUrl: row.payment_proof_url,
    mobileVerified: row.mobile_verified === 1,
    orderIp: row.order_ip,
    createdAt: row.created_at,
  };
}

function toItem(row: ItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    code: row.code,
    name: row.name,
    unit: row.unit as Unit,
    price: row.price,
    qty: row.qty,
    lineTotal: row.line_total,
  };
}

export class D1OrderStore implements OrderStore {
  constructor(private db: D1Database) {}

  /**
   * Allocates the next order number for the year. D1 has no transactions across
   * statements, so the increment is done as a single atomic UPSERT that returns
   * the new value - two concurrent orders can never receive the same number.
   */
  async nextSequence(year: number): Promise<number> {
    const row = await this.db
      .prepare(
        `INSERT INTO order_sequences (year, last) VALUES (?1, 1)
         ON CONFLICT(year) DO UPDATE SET last = last + 1
         RETURNING last`,
      )
      .bind(year)
      .first<{ last: number }>();
    if (!row) throw new Error("Could not allocate an order number");
    return row.last;
  }

  async create(
    order: NewOrder,
    orderNo: string,
    seq: number,
    publicToken: string,
  ): Promise<StoredOrder> {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const year = Number(orderNo.split("-")[1]);

    const items: OrderItem[] = order.items.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
      orderId: id,
    }));

    // batch() runs these in one round trip and rolls back together on failure,
    // so an order can never be stored without its items.
    await this.db.batch([
      this.db
        .prepare(
          `INSERT INTO orders (
             id, order_no, public_token, seq, year, customer_name, mobile, whatsapp, email,
             address, city, state, pincode, transport_pref, notes,
             subtotal, discount, total, status, payment_method, payment_status,
             utr, payment_proof_url, mobile_verified, order_ip, created_at
           ) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21,?22,?23,?24,?25,?26)`,
        )
        .bind(
          id, orderNo, publicToken, seq, year, order.customerName, order.mobile,
          order.whatsapp, order.email, order.address, order.city, order.state,
          order.pincode, order.transportPref, order.notes, order.subtotal,
          order.discount, order.total, order.status, order.paymentMethod,
          order.paymentStatus, order.utr, order.paymentProofUrl,
          order.mobileVerified ? 1 : 0, order.orderIp, createdAt,
        ),
      ...items.map((item) =>
        this.db
          .prepare(
            `INSERT INTO order_items (id, order_id, product_id, code, name, unit, price, qty, line_total)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)`,
          )
          .bind(
            item.id, id, item.productId, item.code, item.name, item.unit,
            item.price, item.qty, item.lineTotal,
          ),
      ),
    ]);

    return { ...order, id, orderNo, publicToken, createdAt, items };
  }

  async getByOrderNo(orderNo: string): Promise<StoredOrder | null> {
    const row = await this.db
      .prepare(`SELECT * FROM orders WHERE order_no = ?1`)
      .bind(orderNo)
      .first<OrderRow>();
    if (!row) return null;

    const items = await this.db
      .prepare(`SELECT * FROM order_items WHERE order_id = ?1`)
      .bind(row.id)
      .all<ItemRow>();

    return { ...toOrder(row), items: items.results.map(toItem) };
  }

  async list(limit = 50): Promise<StoredOrder[]> {
    const rows = await this.db
      .prepare(`SELECT * FROM orders ORDER BY created_at DESC LIMIT ?1`)
      .bind(limit)
      .all<OrderRow>();
    if (rows.results.length === 0) return [];

    // One query for every item of the listed orders, rather than one per order.
    const ids = rows.results.map((r) => r.id);
    const placeholders = ids.map((_, i) => `?${i + 1}`).join(",");
    const items = await this.db
      .prepare(`SELECT * FROM order_items WHERE order_id IN (${placeholders})`)
      .bind(...ids)
      .all<ItemRow>();

    const byOrder = new Map<string, OrderItem[]>();
    for (const row of items.results) {
      const list = byOrder.get(row.order_id);
      if (list) list.push(toItem(row));
      else byOrder.set(row.order_id, [toItem(row)]);
    }

    return rows.results.map((r) => ({ ...toOrder(r), items: byOrder.get(r.id) ?? [] }));
  }

  async updateStatus(
    orderNo: string,
    patch: { status?: OrderStatus; paymentStatus?: PaymentStatus; utr?: string | null },
  ): Promise<void> {
    const sets: string[] = [];
    const values: (string | null)[] = [];
    if (patch.status) {
      sets.push(`status = ?${sets.length + 1}`);
      values.push(patch.status);
    }
    if (patch.paymentStatus) {
      sets.push(`payment_status = ?${sets.length + 1}`);
      values.push(patch.paymentStatus);
    }
    if (patch.utr !== undefined) {
      sets.push(`utr = ?${sets.length + 1}`);
      values.push(patch.utr);
    }
    if (sets.length === 0) return;

    await this.db
      .prepare(`UPDATE orders SET ${sets.join(", ")} WHERE order_no = ?${sets.length + 1}`)
      .bind(...values, orderNo)
      .run();
  }
}
