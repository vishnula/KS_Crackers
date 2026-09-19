// Single source of truth for order money. Always re-run this server-side from
// DB prices before saving — never trust a total posted by the browser.

import { withUniquePaise } from "./format";

// "3 % PACKING CHARGES APPLICABLE" — printed on the client's 2026 pricelist.
export const PACKING_CHARGE_PCT = Number(process.env.NEXT_PUBLIC_PACKING_CHARGE_PCT ?? 3);
export const MIN_ORDER_VALUE = Number(process.env.NEXT_PUBLIC_MIN_ORDER_VALUE ?? 2500);

// Only the numbers matter for pricing. Callers may pass richer lines (the order
// API passes name and unit); the generic below carries those fields through.
export type PriceableLine = {
  code: string;
  mrp: number;
  price: number;
  qty: number;
};

export type PricedLine<T extends PriceableLine = PriceableLine> = T & {
  lineTotal: number;
  lineSavings: number;
};

export type OrderTotals<T extends PriceableLine = PriceableLine> = {
  lines: PricedLine<T>[];
  itemCount: number;
  mrpTotal: number;
  subtotal: number;
  savings: number;
  packingChargePct: number;
  packingCharge: number;
  total: number;
  minOrderValue: number;
  meetsMinimum: boolean;
  shortfall: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function priceOrder<T extends PriceableLine>(
  lines: T[],
  opts: { orderSeq?: number; packingChargePct?: number; minOrderValue?: number } = {},
): OrderTotals<T> {
  const packingChargePct = opts.packingChargePct ?? PACKING_CHARGE_PCT;
  const minOrderValue = opts.minOrderValue ?? MIN_ORDER_VALUE;

  const priced = lines
    .filter((l) => l.qty > 0)
    .map((l) => ({
      ...l,
      lineTotal: round2(l.price * l.qty),
      lineSavings: round2(Math.max(0, l.mrp - l.price) * l.qty),
    }));

  const subtotal = round2(priced.reduce((s, l) => s + l.lineTotal, 0));
  const mrpTotal = round2(priced.reduce((s, l) => s + l.mrp * l.qty, 0));
  const packingCharge = round2((subtotal * packingChargePct) / 100);

  // Round to whole rupees first, then stamp the unique paise, so the paise stay
  // a reconciliation key and are never polluted by the packing-charge remainder.
  const gross = Math.round(subtotal + packingCharge);
  const total = opts.orderSeq === undefined ? gross : withUniquePaise(gross, opts.orderSeq);

  return {
    lines: priced,
    itemCount: priced.reduce((s, l) => s + l.qty, 0),
    mrpTotal,
    subtotal,
    savings: round2(mrpTotal - subtotal),
    packingChargePct,
    packingCharge,
    total,
    minOrderValue,
    meetsMinimum: subtotal >= minOrderValue,
    shortfall: Math.max(0, round2(minOrderValue - subtotal)),
  };
}
