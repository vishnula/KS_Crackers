import { getCatalogue, getProducts } from "@/lib/catalogue";
import { shop } from "@/lib/shop";
import { MIN_ORDER_VALUE, PACKING_CHARGE_PCT } from "@/lib/pricing";
import { CartProvider } from "@/components/CartProvider";
import { Pricelist } from "@/components/Pricelist";
import { CartBar } from "@/components/CartBar";
import { formatINRPlain } from "@/lib/format";

// Fully pre-rendered: browsing never invokes the Worker, which is what keeps
// hosting on the Cloudflare free tier. See PLAN.md section 9.5.
export const dynamic = "force-static";

export default function Home() {
  const categories = getCatalogue();
  const products = getProducts();

  return (
    <CartProvider products={products}>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
            {shop.legalName}
          </p>
          <h1 className="text-2xl font-black tracking-tight text-gold sm:text-3xl">
            {shop.brandName}
          </h1>
          <p className="mt-0.5 text-[13px] text-muted">
            {shop.city}, {shop.state} &middot; Price List 2026
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {shop.phones.map((p) => (
              <a
                key={p}
                href={`tel:+91${p}`}
                className="tnum rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-[13px] text-text"
              >
                {p}
              </a>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
            <span>
              Minimum order{" "}
              <strong className="text-text">Rs {formatINRPlain(MIN_ORDER_VALUE)}</strong>
            </span>
            <span>
              Packing charges{" "}
              <strong className="text-text">{PACKING_CHARGE_PCT}%</strong>
            </span>
            <span>
              <strong className="text-good">{products.length}</strong> items
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl">
        <Pricelist categories={categories} />
      </main>

      <footer className="mx-auto max-w-3xl px-4 py-8 text-[12px] leading-relaxed text-muted">
        <p className="font-semibold text-text">{shop.displayName}</p>
        <p className="mt-1">
          {shop.city}, {shop.state}
        </p>
        <p className="mt-3">
          Prices are per {`unit`} as printed in the 2026 price list. {PACKING_CHARGE_PCT}%
          packing charges applicable. Orders are confirmed over phone before dispatch.
        </p>
      </footer>

      <CartBar />
    </CartProvider>
  );
}
