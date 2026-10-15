// Single source of truth for shop identity.
//
// Two names, and they are not interchangeable:
//   legalName  - Simman Traders, the registered entity. Goes on invoices, the
//                estimate PDF, the footer and anywhere GST/licence details appear.
//   brandName  - KS Crackers, what customers know. Goes in the header, page titles
//                and marketing copy.
// Every customer-facing surface must show both, because the money is received by
// Simman Traders while the shop is known as KS Crackers.

export const shop = {
  legalName: "Simman Traders",
  brandName: "KS Crackers",
  // Header lockup and page titles.
  displayName: "Simman Traders - KS Crackers",
  tagline: "Sivakasi",
  city: "Sivakasi",
  state: "Tamil Nadu",

  // phones[0] is the primary: it fills the Call button, the WhatsApp link and
  // the header. Reorder these to change which number customers reach first.
  phones: [
    process.env.NEXT_PUBLIC_SHOP_PHONE_1 ?? "6374223532",
    process.env.NEXT_PUBLIC_SHOP_PHONE_2 ?? "9600033532",
    process.env.NEXT_PUBLIC_SHOP_PHONE_3 ?? "9626684526",
  ],

  // Fill from the client's answers, then surface in the footer and on invoices.
  gstin: process.env.NEXT_PUBLIC_GSTIN ?? "",
  licenceNo: process.env.NEXT_PUBLIC_LICENCE_NO ?? "",
  address: process.env.NEXT_PUBLIC_SHOP_ADDRESS ?? "",
  email: process.env.NEXT_PUBLIC_SHOP_EMAIL ?? "",
} as const;

// "KS Crackers | Simman Traders, Sivakasi - Diwali Crackers Price List 2026"
export function pageTitle(page?: string): string {
  const base = `${shop.brandName} | ${shop.legalName}, ${shop.city}`;
  return page ? `${page} - ${base}` : `${base} - Diwali Crackers Price List 2026`;
}
