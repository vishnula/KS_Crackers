"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { priceOrder, type OrderTotals } from "@/lib/pricing";
import {
  getServerSnapshot,
  getSnapshot,
  parse,
  subscribe,
  write,
  type Qtys,
} from "@/lib/cartStore";
import raw from "@/data/products.json";

// Imported here rather than passed down from the server layout. As a prop it was
// serialised into the RSC payload of every single page - the Contact page shipped
// 41 KB for three phone numbers. As a client import it lands in one cached JS
// chunk instead. Only the numbers are needed; totals never render product names.
const PRICES: Record<string, { mrp: number; price: number }> = Object.fromEntries(
  (raw as { code: number; mrp: number; price: number }[]).map((p) => [
    String(p.code),
    { mrp: p.mrp, price: p.price },
  ]),
);

type CartValue = {
  qtys: Qtys;
  setQty: (code: number, qty: number) => void;
  clear: () => void;
  totals: OrderTotals;
};

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Server and first client render both see an empty cart, so the pre-rendered
  // HTML stays static and cacheable; React swaps in the stored cart after hydration.
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const qtys = useMemo(() => parse(snapshot), [snapshot]);

  const value = useMemo<CartValue>(() => {
    const lines = Object.entries(qtys)
      .filter(([code, qty]) => qty > 0 && PRICES[code])
      .map(([code, qty]) => ({ code, ...PRICES[code], qty }));

    return {
      qtys,
      totals: priceOrder(lines),
      setQty: (code, qty) => {
        const next = { ...qtys };
        if (qty > 0) next[code] = Math.min(qty, 999);
        else delete next[code];
        write(next);
      },
      clear: () => write({}),
    };
  }, [qtys]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
