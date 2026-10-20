import Link from "next/link";
import { slugify } from "@/lib/catalogue";
import { listLiveProducts, groupByCategory } from "@/lib/productStore";
import { shop } from "@/lib/shop";
import { MIN_ORDER_VALUE, PACKING_CHARGE_PCT } from "@/lib/pricing";
import { formatINRPlain, discountPct } from "@/lib/format";
import { Countdown } from "@/components/Countdown";
import { Fireworks } from "@/components/Fireworks";
import { CrackerIcon } from "@/components/CrackerIcon";
import { categoryStyle } from "@/lib/categoryStyle";

// Reads the live catalogue, same as the price list: the gift box section must
// not advertise items the owner has marked sold out.
export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await listLiveProducts();
  const categories = groupByCategory(products).map((c) => ({
    name: c.name,
    slug: slugify(c.name),
    products: c.products,
  }));
  const giftBoxCategory = categories.find((c) => c.name.includes("GIFT BOX"));
  // Only highlight what can actually be bought.
  const giftBoxes = giftBoxCategory?.products.filter((p) => p.inStock) ?? [];
  const topDiscount = Math.max(...products.map((p) => discountPct(p.mrp, p.price)));

  return (
    <main>
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-[#1a1140] via-surface-2 to-bg">
        <Fireworks />
        <div className="relative mx-auto max-w-5xl px-4 py-10 sm:py-14">
          <p className="inline-block rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[12px] font-semibold text-gold-soft">
            Diwali 2026 &middot; {topDiscount}% off on price list rates
          </p>

          <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-text sm:text-5xl">
            Sivakasi crackers,
            <br />
            <span className="text-gold">direct from the shop.</span>
          </h1>

          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
            {shop.brandName} of {shop.legalName} supplies the full 2026 range at
            wholesale rates &mdash; {products.length} items from one sound crackers to
            gift boxes. Build your list online, we confirm it on a call.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/pricelist"
              className="rounded-xl bg-gold px-6 py-3.5 text-[15px] font-bold text-[#1a1200]"
            >
              View Price List
            </Link>
            <a
              href={`tel:+91${shop.phones[0]}`}
              className="tnum rounded-xl border border-line bg-surface px-5 py-3.5 text-[15px] font-semibold text-text"
            >
              Call {shop.phones[0]}
            </a>
          </div>

          <div className="mt-8">
            <Countdown />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { k: `${products.length}`, v: "items in the 2026 list" },
            { k: `Rs ${formatINRPlain(MIN_ORDER_VALUE)}`, v: "minimum order value" },
            { k: `${PACKING_CHARGE_PCT}%`, v: "packing charges" },
          ].map((s) => (
            <div key={s.v} className="rounded-2xl border border-line bg-surface p-5">
              <p className="text-2xl font-black text-gold">{s.k}</p>
              <p className="mt-1 text-[13px] text-muted">{s.v}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-xl font-bold text-text">Shop by category</h2>
          <Link href="/pricelist" className="text-[13px] font-semibold text-gold">
            See all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => {
            const style = categoryStyle(c.name);
            return (
              <Link
                key={c.slug}
                href={`/pricelist#${c.slug}`}
                className="group rounded-2xl border border-line bg-surface p-4 transition-all hover:-translate-y-0.5"
                style={{ borderTop: `3px solid ${style.accent}` }}
              >
                <span
                  className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: style.soft, color: style.accent }}
                >
                  <CrackerIcon icon={style.icon} className="h-6 w-6" />
                </span>
                <p className="text-[14px] font-semibold leading-snug text-text">
                  {c.name}
                </p>
                <p className="mt-1 text-[12px] text-muted">{c.products.length} items</p>
              </Link>
            );
          })}
        </div>
      </section>

      {giftBoxes.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 pb-10">
          <h2 className="mb-1 text-xl font-bold text-text">Gift boxes</h2>
          <p className="mb-4 text-[13px] text-muted">
            Ready-made assortments &mdash; the easiest way to order.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {giftBoxes.map((p) => (
              <Link
                key={p.code}
                href="/pricelist#special-gift-box"
                className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-gold/50"
              >
                <div>
                  <p className="text-[15px] font-semibold text-text">{p.name}</p>
                  <p className="tnum mt-0.5 text-[12px] text-muted">
                    <span className="line-through opacity-60">
                      Rs {formatINRPlain(p.mrp)}
                    </span>{" "}
                    &middot; 1 {p.unit}
                  </p>
                </div>
                <p className="tnum shrink-0 text-lg font-bold text-gold">
                  Rs {formatINRPlain(p.price)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-5xl px-4 pb-12">
        <h2 className="mb-4 text-xl font-bold text-text">How ordering works</h2>
        <ol className="grid gap-3 sm:grid-cols-4">
          {[
            ["1", "Build your list", "Add quantities against any item in the price list."],
            ["2", "Place the order", "Give your name, mobile and delivery address."],
            ["3", "We confirm", "We call you to confirm stock, packing and transport."],
            ["4", "Pay and dispatch", "Pay by UPI or bank transfer; goods go by transport."],
          ].map(([n, title, body]) => (
            <li key={n} className="rounded-2xl border border-line bg-surface p-4">
              <p className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/15 text-[13px] font-bold text-gold">
                {n}
              </p>
              <p className="mt-2 text-[14px] font-semibold text-text">{title}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
