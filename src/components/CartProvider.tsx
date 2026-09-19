"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import type { CatalogueProduct } from "@/lib/catalogue";
import { priceOrder, type OrderTotals } from "@/lib/pricing";
import {
  getServerSnapshot,
  getSnapshot,
  parse,
  subscribe,
  write,
  type Qtys,
} from "@/lib/cartStore";

type CartValue = {
  qtys: Qtys;
  setQty: (code: number, qty: number) => void;
  clear: () => void;
  totals: OrderTotals;
};

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({
  products,
  children,
}: {
  products: CatalogueProduct[];
  children: React.ReactNode;
}) {
  // Server and first client render both see an empty cart, so the pre-rendered
  // HTML stays static and cacheable; React swaps in the stored cart after hydration.
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const qtys = useMemo(() => parse(snapshot), [snapshot]);

  const value = useMemo<CartValue>(() => {
    const lines = products
      .filter((p) => (qtys[p.code] ?? 0) > 0)
      .map((p) => ({
        code: String(p.code),
        name: p.name,
        unit: p.unit,
        mrp: p.mrp,
        price: p.price,
        qty: qtys[p.code],
      }));

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
  }, [products, qtys]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
