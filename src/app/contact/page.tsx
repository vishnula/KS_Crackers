import type { Metadata } from "next";
import { shop, pageTitle } from "@/lib/shop";
import { buildWhatsAppLink } from "@/lib/upi";
import { MIN_ORDER_VALUE, PACKING_CHARGE_PCT } from "@/lib/pricing";
import { formatINRPlain } from "@/lib/format";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: pageTitle("Contact"),
  description: `Contact ${shop.brandName} (${shop.legalName}), ${shop.city}. Phone and WhatsApp for orders and enquiries.`,
};

export default function ContactPage() {
  const wa = buildWhatsAppLink(
    `91${shop.phones[0]}`,
    `Hello ${shop.brandName}, I have an enquiry about the 2026 price list.`,
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-black tracking-tight text-text sm:text-3xl">
        Contact us
      </h1>
      <p className="mt-2 text-[14px] text-muted">
        Call any of these numbers, or message us on WhatsApp. We reply fastest on
        WhatsApp during the Diwali season.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {shop.phones.map((p, i) => (
          <a
            key={p}
            href={`tel:+91${p}`}
            className="rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-gold/50"
          >
            <p className="text-[12px] uppercase tracking-wider text-muted">
              {i === 0 ? "Primary" : `Phone ${i + 1}`}
            </p>
            <p className="tnum mt-1 text-xl font-bold text-gold">+91 {p}</p>
          </a>
        ))}

        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-good/40 bg-good/10 p-5"
        >
          <p className="text-[12px] uppercase tracking-wider text-good">WhatsApp</p>
          <p className="tnum mt-1 text-xl font-bold text-text">+91 {shop.phones[0]}</p>
          <p className="mt-1 text-[12.5px] text-muted">Tap to start a chat</p>
        </a>
      </div>

      <section className="mt-8 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-[15px] font-bold text-text">Shop address</h2>
        <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-muted">
          {shop.address || `${shop.legalName}\n${shop.city}, ${shop.state}`}
        </p>
        {shop.email && (
          <p className="mt-3 text-[14px] text-muted">
            Email:{" "}
            <a href={`mailto:${shop.email}`} className="text-gold">
              {shop.email}
            </a>
          </p>
        )}
      </section>

      <section className="mt-5 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-[15px] font-bold text-text">Before you order</h2>
        <ul className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-muted">
          <li>
            Minimum order value is{" "}
            <strong className="text-text">Rs {formatINRPlain(MIN_ORDER_VALUE)}</strong>.
          </li>
          <li>
            <strong className="text-text">{PACKING_CHARGE_PCT}%</strong> packing charges
            are applicable on the order value.
          </li>
          <li>
            Orders are confirmed over the phone before dispatch. Payment is made by UPI
            or bank transfer after confirmation.
          </li>
          <li>Goods are sent by parcel or transport service to your address.</li>
        </ul>
      </section>
    </main>
  );
}
