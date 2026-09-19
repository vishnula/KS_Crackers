"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { shop } from "@/lib/shop";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/pricelist", label: "Price List" },
  { href: "/safety", label: "Safety Tips" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <Link href="/" className="min-w-0 flex-1" onClick={() => setOpen(false)}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            {shop.legalName}
          </p>
          <p className="truncate text-xl font-black leading-tight tracking-tight text-gold">
            {shop.brandName}
          </p>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-[14px] ${
                pathname === item.href
                  ? "bg-gold/15 font-semibold text-gold-soft"
                  : "text-muted hover:text-text"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <a
          href={`tel:+91${shop.phones[0]}`}
          className="tnum hidden shrink-0 rounded-lg bg-gold px-3 py-2 text-[14px] font-bold text-[#1a1200] sm:block"
        >
          {shop.phones[0]}
        </a>

        <button
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="h-11 w-11 shrink-0 rounded-lg border border-line text-xl leading-none text-text md:hidden"
        >
          {open ? "×" : "≡"}
        </button>
      </div>

      {open && (
        <nav className="border-t border-line bg-surface px-4 py-2 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-3 text-[15px] ${
                pathname === item.href
                  ? "bg-gold/15 font-semibold text-gold-soft"
                  : "text-text"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
