const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function formatINR(amount: number): string {
  return inr.format(amount);
}

export function formatINRPlain(amount: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(amount);
}

/**
 * Bank-statement auto-matching: give every order a distinct paise value so an
 * incoming UPI credit of 4250.37 maps to exactly one order without reading a
 * screenshot. Derived from the order sequence, so it is stable on re-render.
 * Collides only if two orders in the same 100 share an identical rupee total.
 */
export function withUniquePaise(total: number, orderSeq: number): number {
  return Math.floor(total) + (orderSeq % 100) / 100;
}

export function orderNo(year: number, seq: number, prefix = "KS"): string {
  return `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
}

export function savings(mrp: number, price: number, qty = 1): number {
  return Math.max(0, (mrp - price) * qty);
}

export function discountPct(mrp: number, price: number): number {
  if (mrp <= 0) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}
