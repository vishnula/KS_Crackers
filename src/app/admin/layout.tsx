import type { Metadata } from "next";
import Link from "next/link";
import { shop } from "@/lib/shop";

// Installable so the owner can keep it on his home screen and receive order
// alerts like any other app.
export const metadata: Metadata = {
  title: `Admin - ${shop.brandName}`,
  manifest: "/manifest.webmanifest",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "KS Admin", statusBarStyle: "black-translucent" },
};

// Admin has no customer chrome: no cart bar, no WhatsApp button, no site nav.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/admin">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              {shop.legalName}
            </p>
            <p className="text-lg font-black leading-tight text-gold">Admin</p>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/admin"
              className="rounded-lg px-3 py-2 text-[14px] text-muted hover:text-text"
            >
              Orders
            </Link>
            <Link
              href="/admin/products"
              className="rounded-lg px-3 py-2 text-[14px] text-muted hover:text-text"
            >
              Prices
            </Link>
            <Link
              href="/"
              className="rounded-lg px-3 py-2 text-[14px] text-muted hover:text-text"
            >
              Site
            </Link>
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
