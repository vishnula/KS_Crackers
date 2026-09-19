import Link from "next/link";
import { shop } from "@/lib/shop";

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
          <Link href="/" className="text-[13px] text-muted hover:text-text">
            View site
          </Link>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
