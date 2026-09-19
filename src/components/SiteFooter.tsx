import Link from "next/link";
import { shop } from "@/lib/shop";
import { MIN_ORDER_VALUE, PACKING_CHARGE_PCT } from "@/lib/pricing";
import { formatINRPlain } from "@/lib/format";

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            {shop.legalName}
          </p>
          <p className="text-xl font-black text-gold">{shop.brandName}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            {shop.address || `${shop.city}, ${shop.state}`}
          </p>
          {shop.gstin && (
            <p className="mt-2 text-[12px] text-muted">GSTIN: {shop.gstin}</p>
          )}
          {shop.licenceNo && (
            <p className="text-[12px] text-muted">Licence: {shop.licenceNo}</p>
          )}
        </div>

        <div>
          <p className="mb-2 text-[13px] font-semibold text-text">Pages</p>
          <ul className="space-y-1.5 text-[13px] text-muted">
            <li><Link href="/pricelist" className="hover:text-gold">Price List 2026</Link></li>
            <li><Link href="/safety" className="hover:text-gold">Safety Tips</Link></li>
            <li><Link href="/about" className="hover:text-gold">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-gold">Contact</Link></li>
          </ul>
        </div>

        <div>
          <p className="mb-2 text-[13px] font-semibold text-text">Order information</p>
          <ul className="space-y-1.5 text-[13px] text-muted">
            <li>Minimum order Rs {formatINRPlain(MIN_ORDER_VALUE)}</li>
            <li>{PACKING_CHARGE_PCT}% packing charges applicable</li>
            <li>Orders confirmed over phone before dispatch</li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            {shop.phones.map((p) => (
              <a
                key={p}
                href={`tel:+91${p}`}
                className="tnum rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-[13px] text-text"
              >
                {p}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-line px-4 py-5">
        <p className="mx-auto max-w-5xl text-[11.5px] leading-relaxed text-muted">
          This website is a price list and order enquiry service. Orders placed here are
          confirmed by phone and completed offline; no payment is collected on this site.
          Fireworks are sold in accordance with applicable licences and regulations.
          &copy; {new Date().getFullYear()} {shop.legalName}.
        </p>
      </div>
    </footer>
  );
}
