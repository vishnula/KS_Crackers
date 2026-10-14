import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { shop, pageTitle } from "@/lib/shop";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: pageTitle(),
  description: `${shop.brandName} (${shop.legalName}), ${shop.city}. Diwali crackers price list 2026 with wholesale rates. Minimum order applies, orders confirmed over phone.`,
  keywords: [
    "sivakasi crackers",
    "crackers online",
    "diwali crackers price list 2026",
    "wholesale crackers sivakasi",
    shop.brandName,
    shop.legalName,
  ],
  // Off by default so the workers.dev demo is never indexed: it carries the
  // client's real phone numbers and prices, and an indexed throwaway domain
  // competes with the real one later. Set NEXT_PUBLIC_ALLOW_INDEXING=true
  // only once the live domain is in front of it.
  robots:
    process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true"
      ? { index: true, follow: true }
      : { index: false, follow: false },
};

// Only html/body live here. Customer chrome is in (site)/layout.tsx and the
// admin panel has its own, so the two never share a header or a cart bar.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Browser extensions inject attributes onto <html> before React loads; this
    // suppresses that false-positive hydration warning and nothing else.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
