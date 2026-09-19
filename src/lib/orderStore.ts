import type { Order, OrderItem, OrderStatus, PaymentStatus } from "./types";

// Storage sits behind this interface so the app never talks to a database
// directly. Cloudflare D1 is the production backing - same account as the
// Worker, native binding, no connection pooling (PLAN.md section 9.2).

export type NewOrder = Omit<Order, "id" | "orderNo" | "createdAt"> & {
  items: Omit<OrderItem, "id" | "orderId">[];
};

export type StoredOrder = Order & { items: OrderItem[] };

export type StatusPatch = {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  utr?: string | null;
};

export interface OrderStore {
  nextSequence(year: number): Promise<number>;
  create(order: NewOrder, orderNo: string, seq: number): Promise<StoredOrder>;
  getByOrderNo(orderNo: string): Promise<StoredOrder | null>;
  list(limit?: number): Promise<StoredOrder[]>;
  updateStatus(orderNo: string, patch: StatusPatch): Promise<void>;
}

/**
 * Fallback store for when no D1 binding is present (a bare `next dev`, or tests).
 *
 * Pinned to globalThis because Next gives route handlers and server components
 * separate module instances in dev - without this, an order created by the API
 * is invisible to the confirmation page that renders straight after it.
 *
 * NOT durable: module memory is per-isolate on Workers. If this store is ever
 * reached in production, orders are being lost.
 */
const globalState = globalThis as typeof globalThis & {
  __ksOrders?: Map<string, StoredOrder>;
  __ksSequences?: Map<number, number>;
};

class MemoryOrderStore implements OrderStore {
  private orders = (globalState.__ksOrders ??= new Map<string, StoredOrder>());
  private sequences = (globalState.__ksSequences ??= new Map<number, number>());

  async nextSequence(year: number): Promise<number> {
    const next = (this.sequences.get(year) ?? 0) + 1;
    this.sequences.set(year, next);
    return next;
  }

  async create(order: NewOrder, orderNo: string): Promise<StoredOrder> {
    const id = crypto.randomUUID();
    const stored: StoredOrder = {
      ...order,
      id,
      orderNo,
      createdAt: new Date().toISOString(),
      items: order.items.map((item) => ({ ...item, id: crypto.randomUUID(), orderId: id })),
    };
    this.orders.set(orderNo, stored);
    return stored;
  }

  async getByOrderNo(orderNo: string): Promise<StoredOrder | null> {
    return this.orders.get(orderNo) ?? null;
  }

  async list(limit = 50): Promise<StoredOrder[]> {
    return [...this.orders.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  async updateStatus(orderNo: string, patch: StatusPatch): Promise<void> {
    const order = this.orders.get(orderNo);
    if (!order) return;
    if (patch.status) order.status = patch.status;
    if (patch.paymentStatus) order.paymentStatus = patch.paymentStatus;
    if (patch.utr !== undefined) order.utr = patch.utr;
  }
}

export async function getOrderStore(): Promise<OrderStore> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    const db = (env as { DB?: unknown }).DB;
    if (db) {
      const { D1OrderStore } = await import("./d1OrderStore");
      return new D1OrderStore(db as ConstructorParameters<typeof D1OrderStore>[0]);
    }
  } catch {
    // No Cloudflare context (plain `next dev` without bindings) - fall through.
  }
  return new MemoryOrderStore();
}

export function isDurable(store: OrderStore): boolean {
  return !(store instanceof MemoryOrderStore);
}
