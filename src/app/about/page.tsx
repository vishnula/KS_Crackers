import type { Metadata } from "next";
import Link from "next/link";
import { shop, pageTitle } from "@/lib/shop";
import { getCatalogue, getProducts } from "@/lib/catalogue";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: pageTitle("About Us"),
  description: `About ${shop.brandName}, a ${shop.city} crackers shop run by ${shop.legalName}.`,
};

export default function AboutPage() {
  const products = getProducts();
  const categories = getCatalogue();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-black tracking-tight text-text sm:text-3xl">
        About {shop.brandName}
      </h1>

      {/* TODO: replace with the client's own story once he sends it. */}
      <p className="mt-4 text-[15px] leading-relaxed text-muted">
        {shop.brandName} is the retail arm of{" "}
        <strong className="text-text">{shop.legalName}</strong>, based in {shop.city},{" "}
        {shop.state} &mdash; the town where most of India&rsquo;s fireworks are made. We
        supply families, shops and bulk buyers across the country at price list rates,
        with no middleman in between.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          [`${products.length}`, "items in the 2026 range"],
          [`${categories.length}`, "categories"],
          [shop.city, "made and shipped from"],
        ].map(([k, v]) => (
          <div key={v} className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-xl font-black text-gold">{k}</p>
            <p className="mt-1 text-[13px] text-muted">{v}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-bold text-text">Why buy from us</h2>
      <ul className="mt-3 space-y-3">
        {[
          ["Price list rates, direct", "You pay the net rate printed in our list, with no retail markup added on top."],
          ["The full range in one place", `All ${products.length} items across ${categories.length} categories, from Lakshmi crackers to repeating shots and gift boxes.`],
          ["Every order confirmed on a call", "We check stock, packing and transport with you before anything is dispatched, so there are no surprises."],
          ["Packed for transport", "Goods are packed for parcel service and sent with a docket number you can track."],
        ].map(([title, body]) => (
          <li key={title} className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-[15px] font-semibold text-text">{title}</p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{body}</p>
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-2xl border border-gold/30 bg-gold/5 p-5">
        <p className="text-[15px] font-semibold text-text">Ready to order?</p>
        <p className="mt-1 text-[13.5px] text-muted">
          Build your list from the 2026 price list and we will call you to confirm.
        </p>
        <Link
          href="/pricelist"
          className="mt-4 inline-block rounded-xl bg-gold px-5 py-3 text-[14px] font-bold text-[#1a1200]"
        >
          View Price List
        </Link>
      </div>
    </main>
  );
}
