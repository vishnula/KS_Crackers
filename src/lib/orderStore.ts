import type { Order, OrderItem } from "./types";

// Storage sits behind this interface so the app never talks to a database
// directly. Cloudflare D1 is the intended production backing (same account as
// the Worker, native binding, no connection pooling) - see PLAN.md section 9.2.
// Swapping to Postgres later means writing one more implementation, nothing else.

export type NewOrder = Omit<Order, "id" | "orderNo" | "createdAt"> & {
  items: Omit<OrderItem, "id" | "orderId">[];
};

export type StoredOrder = Order & { items: OrderItem[] };

export interface OrderStore {
  nextSequence(year: number): Promise<number>;
  create(order: NewOrder, orderNo: string, seq: number): Promise<StoredOrder>;
  getByOrderNo(orderNo: string): Promise<StoredOrder | null>;
  list(limit?: number): Promise<StoredOrder[]>;
}

/**
 * Development store. Lives in module memory, so it is lost on restart and is NOT
 * shared between Worker isolates in production.
 *
 * MUST be replaced with the D1 implementation before launch - orders placed
 * against this store are not durable.
 */
// Pinned to globalThis because Next gives route handlers and server components
// separate module instances in dev - without this, an order created by the API
// is invisible to the confirmation page that renders straight after it.
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
}

const store: OrderStore = new MemoryOrderStore();

export function getOrderStore(): OrderStore {
  return store;
}
