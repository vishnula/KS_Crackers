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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
