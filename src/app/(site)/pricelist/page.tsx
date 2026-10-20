import type { Metadata } from "next";
import { pageTitle } from "@/lib/shop";
import { MIN_ORDER_VALUE, PACKING_CHARGE_PCT } from "@/lib/pricing";
import { formatINRPlain } from "@/lib/format";
import { listLiveProducts, groupByCategory } from "@/lib/productStore";
import { slugify } from "@/lib/catalogue";
import { Pricelist } from "@/components/Pricelist";

// Rendered per request, not ISR.
//
// ISR looked cheaper, but it silently served the build-time render for days: the
// build has no D1 binding, so it fell back to the JSON seed, and every stock and
// price change the owner made in /admin was invisible on the site. A price list
// that lies about what is in stock is worse than one that costs a Worker call.
//
// Cost is fine: one invocation per view against 100k/day free. Revisit only if
// traffic ever approaches that.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: pageTitle("Price List 2026"),
  description:
    "Full Diwali 2026 crackers price list with net rates, category wise. Add quantities and place your order online.",
};

export default async function PricelistPage() {
  const products = await listLiveProducts();
  const categories = groupByCategory(products).map((c) => ({
    name: c.name,
    slug: slugify(c.name),
    products: c.products,
  }));

  return (
    <main className="mx-auto w-full max-w-3xl">
      <div className="border-b border-line px-4 py-5">
        <h1 className="text-2xl font-black tracking-tight text-text">Price List 2026</h1>
        <p className="mt-1 text-[13px] text-muted">
          {products.length} items across {categories.length} categories
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
          <span>
            Minimum order{" "}
            <strong className="text-text">Rs {formatINRPlain(MIN_ORDER_VALUE)}</strong>
          </span>
          <span>
            Packing charges <strong className="text-text">{PACKING_CHARGE_PCT}%</strong>
          </span>
        </div>
      </div>

      <Pricelist categories={categories} />
    </main>
  );
}
