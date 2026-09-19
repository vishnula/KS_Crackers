import type { Metadata } from "next";
import { getCatalogue, getProducts } from "@/lib/catalogue";
import { pageTitle } from "@/lib/shop";
import { MIN_ORDER_VALUE, PACKING_CHARGE_PCT } from "@/lib/pricing";
import { formatINRPlain } from "@/lib/format";
import { Pricelist } from "@/components/Pricelist";

// Pre-rendered: browsing never invokes the Worker, which is what keeps hosting
// on the Cloudflare free tier. See PLAN.md section 9.5.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: pageTitle("Price List 2026"),
  description:
    "Full Diwali 2026 crackers price list with net rates, category wise. Add quantities and place your order online.",
};

export default function PricelistPage() {
  const categories = getCatalogue();
  const products = getProducts();

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
