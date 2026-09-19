import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { shop, pageTitle } from "@/lib/shop";
import { CartProvider } from "@/components/CartProvider";
import { CartBar } from "@/components/CartBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppFab } from "@/components/WhatsAppFab";
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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Browser extensions inject attributes onto <html> before React loads; this
    // suppresses that false-positive hydration warning and nothing else.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Cart lives above the router so it survives navigation between pages. */}
        <CartProvider>
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
          <WhatsAppFab />
          <CartBar />
        </CartProvider>
      </body>
    </html>
  );
}

