"use client";

import { useMemo, useState } from "react";
import type { CatalogueProduct } from "@/lib/catalogue";
import { formatINRPlain, discountPct } from "@/lib/format";
import { useCart } from "./CartProvider";

type ListedProduct = CatalogueProduct & { inStock?: boolean };
type ListedCategory = { name: string; slug: string; products: ListedProduct[] };

function QtyStepper({ code }: { code: number }) {
  const { qtys, setQty } = useCart();
  const qty = qtys[code] ?? 0;

  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => setQty(code, qty - 1)}
        disabled={qty === 0}
        className="h-11 w-11 rounded-lg border border-line bg-surface-2 text-xl leading-none text-text disabled:opacity-30"
      >
        &minus;
      </button>
      <input
        aria-label="Quantity"
        inputMode="numeric"
        value={qty === 0 ? "" : qty}
        placeholder="0"
        onChange={(e) => setQty(code, Number(e.target.value.replace(/\D/g, "")) || 0)}
        className={`tnum h-11 w-14 rounded-lg border text-center text-base outline-none ${
          qty > 0
            ? "border-gold bg-gold/10 font-semibold text-gold-soft"
            : "border-line bg-surface-2 text-muted"
        }`}
      />
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => setQty(code, qty + 1)}
        className="h-11 w-11 rounded-lg border border-gold/50 bg-gold/15 text-xl leading-none text-gold-soft"
      >
        +
      </button>
    </div>
  );
}

function Row({
  code,
  name,
  unit,
  mrp,
  price,
  inStock = true,
}: {
  code: number;
  name: string;
  unit: string;
  mrp: number;
  price: number;
  inStock?: boolean;
}) {
  const { qtys } = useCart();
  const qty = qtys[code] ?? 0;

  // Sold-out items stay listed - customers look for them by number - but cannot
  // be added, so the owner never has to phone back and remove a line.
  if (!inStock) {
    return (
      <li className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-line/60 px-3 py-3 opacity-50 sm:px-4">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium text-text">{name}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-muted">
            <span className="tnum">#{code}</span>
            <span>1 {unit}</span>
            <span className="tnum">Rs {formatINRPlain(price)}</span>
          </p>
        </div>
        <span className="rounded-lg border border-line px-3 py-2 text-[12px] font-semibold text-muted">
          Out of stock
        </span>
      </li>
    );
  }

  return (
    <li
      className={`grid grid-cols-[1fr_auto] items-center gap-3 border-b border-line/60 px-3 py-3 sm:px-4 ${
        qty > 0 ? "bg-gold/5" : ""
      }`}
    >
      <div className="min-w-0">
        <p className="truncate text-[15px] font-medium text-text">{name}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-muted">
          <span className="tnum">#{code}</span>
          <span>1 {unit}</span>
          <span className="tnum line-through opacity-60">Rs {formatINRPlain(mrp)}</span>
          <span className="tnum text-base font-semibold text-gold">
            Rs {formatINRPlain(price)}
          </span>
          <span className="rounded bg-good/15 px-1.5 py-0.5 text-[11px] font-semibold text-good">
            {discountPct(mrp, price)}% off
          </span>
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <QtyStepper code={code} />
        {qty > 0 && (
          <span className="tnum text-[13px] font-semibold text-gold-soft">
            Rs {formatINRPlain(price * qty)}
          </span>
        )}
      </div>
    </li>
  );
}

export function Pricelist({ categories }: { categories: ListedCategory[] }) {
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories
      .map((c) => ({
        ...c,
        products: c.products.filter(
          (p) => p.name.toLowerCase().includes(q) || String(p.code) === q,
        ),
      }))
      .filter((c) => c.products.length > 0);
  }, [categories, query]);

  const count = shown.reduce((n, c) => n + c.products.length, 0);

  return (
    <>
      <div className="sticky top-0 z-30 border-b border-line bg-bg/95 px-3 py-3 backdrop-blur sm:px-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search crackers or item number"
          className="h-12 w-full rounded-xl border border-line bg-surface px-4 text-base text-text outline-none placeholder:text-muted focus:border-gold"
        />
        {query && (
          <p className="mt-2 text-[13px] text-muted">
            {count} item{count === 1 ? "" : "s"} found
          </p>
        )}
      </div>

      {shown.map((cat) => (
        <section key={cat.slug} id={cat.slug}>
          <h2 className="cat-head border-y border-line bg-surface-2/95 px-3 py-2.5 text-[13px] font-bold uppercase tracking-wider text-gold backdrop-blur sm:px-4">
            {cat.name}
            <span className="ml-2 font-normal text-muted">({cat.products.length})</span>
          </h2>
          <ul>
            {cat.products.map((p) => (
              <Row key={p.code} {...p} />
            ))}
          </ul>
        </section>
      ))}

      {shown.length === 0 && (
        <p className="px-4 py-12 text-center text-muted">
          Nothing matches &ldquo;{query}&rdquo;. Try the item number instead.
        </p>
      )}
    </>
  );
}
