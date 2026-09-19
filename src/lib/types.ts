// Domain types. Mirrors the DB schema in PLAN.md §6.

export type Unit = "Box" | "Pcs" | "Pkt" | "Pair";

export type Category = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  active: boolean;
};

export type Product = {
  id: string;
  code: string; // printed on the pricelist, customers order by this
  name: string;
  categoryId: string;
  unit: Unit;
  mrp: number; // struck-through price
  price: number; // actual selling price
  imageUrl: string | null;
  videoUrl: string | null;
  inStock: boolean;
  sortOrder: number;
  active: boolean;
};

export type CartLine = {
  code: string;
  qty: number;
};

export type OrderStatus =
  | "new"
  | "confirmed"
  | "packed"
  | "dispatched"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "unpaid" | "advance_paid" | "paid" | "refunded";

export type PaymentMethod = "upi" | "bank_transfer" | "cod_transport" | "gateway";

// Snapshot of the product at order time — prices change mid-season, old orders must not re-price.
export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  code: string;
  name: string;
  unit: Unit;
  price: number;
  qty: number;
  lineTotal: number;
};

export type Order = {
  id: string;
  orderNo: string; // KS-2026-0417, used as the UPI/WhatsApp reference
  customerName: string;
  mobile: string;
  whatsapp: string | null;
  email: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  transportPref: string | null;
  notes: string | null;
  subtotal: number;
  discount: number;
  total: number; // carries the unique paise, see lib/format.ts
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus;
  utr: string | null;
  paymentProofUrl: string | null;
  mobileVerified: boolean;
  orderIp: string | null;
  createdAt: string;
};

export type Settings = {
  minOrderValue: number;
  discountPct: number;
  upiVpa: string;
  upiPayeeName: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNo: string;
  bankIfsc: string;
  phones: string[];
  whatsapp: string;
  bannerText: string;
};
