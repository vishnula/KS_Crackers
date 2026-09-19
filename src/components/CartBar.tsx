"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatINRPlain } from "@/lib/format";
import { useCart } from "./CartProvider";

// The single biggest conversion gap against the competitors: they make you scroll
// to the bottom of a 796 KB page to find out what your order costs.
export function CartBar() {
  const { totals, clear } = useCart();
  const pathname = usePathname();

  // The checkout page shows its own summary; a second one would just be noise.
  if (totals.itemCount === 0 || pathname === "/checkout") return null;

  const { itemCount, savings, packingChargePct, total, shortfall } = totals;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/30 bg-surface/98 backdrop-blur">
      <div className="mx-auto max-w-3xl px-3 pb-2 pt-2 sm:px-4">
        {shortfall > 0 && (
          <p className="mb-2 rounded-lg bg-ember/15 px-2.5 py-1.5 text-[12px] leading-snug text-ember">
            Add Rs {formatINRPlain(shortfall)} more to reach the Rs{" "}
            {formatINRPlain(totals.minOrderValue)} minimum
          </p>
        )}

        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="tnum text-[22px] font-bold leading-none text-gold-soft">
              Rs {formatINRPlain(total)}
            </p>
            <p className="tnum mt-1 truncate text-[11.5px] leading-none text-muted">
              {itemCount} item{itemCount === 1 ? "" : "s"} &middot; incl {packingChargePct}%
              packing
              {savings > 0 && (
                <span className="text-good"> &middot; save Rs {formatINRPlain(savings)}</span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={clear}
            aria-label="Clear cart"
            className="h-11 shrink-0 rounded-lg border border-line px-2.5 text-[12px] text-muted"
          >
            Clear
          </button>
          {shortfall > 0 ? (
            <span
              aria-disabled="true"
              className="flex h-11 shrink-0 items-center rounded-xl bg-gold px-4 text-[14px] font-bold text-[#1a1200] opacity-40"
            >
              Place Order
            </span>
          ) : (
            <Link
              href="/checkout"
              className="flex h-11 shrink-0 items-center rounded-xl bg-gold px-4 text-[14px] font-bold text-[#1a1200]"
            >
              Place Order
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
