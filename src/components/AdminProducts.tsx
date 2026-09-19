"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import type { AdminProduct } from "@/lib/productStore";
import { formatINRPlain } from "@/lib/format";
import { downloadPricelist, parsePricelist } from "@/lib/adminSheet";
import { resizeImage } from "@/lib/imageResize";

function ProductRow({ product, onSaved }: { product: AdminProduct; onSaved: () => void }) {
  const [price, setPrice] = useState(String(product.price));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const photoInput = useRef<HTMLInputElement>(null);

  const dirty = Number(price) !== product.price;

  async function onPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError("");
    try {
      const { blob } = await resizeImage(file);
      const body = new FormData();
      body.append("code", String(product.code));
      body.append("file", new File([blob], `${product.code}.jpg`, { type: "image/jpeg" }));

      const res = await fetch("/api/admin/products/image", { method: "POST", body });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setError(json.error ?? "Upload failed");
      } else {
        onSaved();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
    setBusy(false);
    if (photoInput.current) photoInput.current.value = "";
  }

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: product.code, ...body }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setError(json.error ?? "Save failed");
      } else {
        onSaved();
      }
    } catch {
      setError("Network problem");
    }
    setBusy(false);
  }

  return (
    <li className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-line/60 px-3 py-3">
      <button
        type="button"
        disabled={busy}
        onClick={() => photoInput.current?.click()}
        title={product.imageUrl ? "Replace photo" : "Add photo"}
        className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-line bg-surface-2 text-[10px] text-muted disabled:opacity-40"
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          "+ photo"
        )}
      </button>
      <input
        ref={photoInput}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPhoto}
        className="hidden"
      />

      <div className="min-w-0">
        <p className="truncate text-[14px] font-medium text-text">
          <span className="tnum text-muted">#{product.code}</span> {product.name}
        </p>
        <p className="mt-0.5 text-[12px] text-muted">
          {product.category} &middot; 1 {product.unit} &middot; MRP Rs{" "}
          {formatINRPlain(product.mrp)}
        </p>
        {error && <p className="mt-1 text-[12px] text-ember">{error}</p>}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={price}
          inputMode="decimal"
          aria-label={`Price for ${product.name}`}
          onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))}
          className={`tnum h-10 w-24 rounded-lg border bg-surface px-2 text-right text-[14px] outline-none ${
            dirty ? "border-gold text-gold-soft" : "border-line text-text"
          }`}
        />
        <button
          type="button"
          disabled={busy || !dirty}
          onClick={() => patch({ price: Number(price) })}
          className="h-10 rounded-lg bg-gold px-3 text-[13px] font-bold text-[#1a1200] disabled:opacity-30"
        >
          Save
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => patch({ inStock: !product.inStock })}
          className={`h-10 w-24 rounded-lg border px-2 text-[12px] font-semibold disabled:opacity-40 ${
            product.inStock
              ? "border-good/50 bg-good/10 text-good"
              : "border-ember/50 bg-ember/10 text-ember"
          }`}
        >
          {product.inStock ? "In stock" : "Sold out"}
        </button>
      </div>
    </li>
  );
}

export function AdminProducts({ products }: { products: AdminProduct[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        String(p.code) === q,
    );
  }, [products, query]);

  async function onExport() {
    setMessage(null);
    try {
      downloadPricelist(products);
    } catch {
      setMessage({ ok: false, text: "Could not build the spreadsheet" });
    }
  }

  async function onImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setMessage(null);

    try {
      // Parsed here; the server re-validates every row before writing.
      const rows = await parsePricelist(file);
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const json = (await res.json()) as {
        error?: string;
        errors?: string[];
        imported?: number;
      };
      if (!res.ok) {
        setMessage({
          ok: false,
          text: [json.error, ...(json.errors ?? [])].filter(Boolean).join(" | "),
        });
      } else {
        setMessage({ ok: true, text: `Updated ${json.imported} products` });
        router.refresh();
      }
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : "Upload failed" });
    }
    setImporting(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onExport}
          className="h-11 rounded-xl border border-line px-4 text-[14px] font-semibold text-text"
        >
          Download CSV
        </button>
        <button
          type="button"
          disabled={importing}
          onClick={() => fileInput.current?.click()}
          className="h-11 rounded-xl bg-gold px-4 text-[14px] font-bold text-[#1a1200] disabled:opacity-50"
        >
          {importing ? "Importing..." : "Upload CSV"}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".csv,text/csv"
          onChange={onImport}
          className="hidden"
        />
      </div>

      <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
        Download the sheet, change prices in Excel, save as CSV and upload it back. The whole file is
        checked first &mdash; if any row is wrong, nothing is imported.
      </p>

      {message && (
        <p
          className={`mt-3 rounded-xl border p-3 text-[13px] ${
            message.ok
              ? "border-good/40 bg-good/10 text-good"
              : "border-ember/40 bg-ember/10 text-ember"
          }`}
        >
          {message.text}
        </p>
      )}

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, category or item number"
        className="mt-5 h-12 w-full rounded-xl border border-line bg-surface px-4 text-[15px] text-text outline-none placeholder:text-muted focus:border-gold"
      />

      <ul className="mt-3 overflow-hidden rounded-2xl border border-line bg-surface">
        {shown.map((p) => (
          <ProductRow key={p.code} product={p} onSaved={() => router.refresh()} />
        ))}
      </ul>

      {shown.length === 0 && (
        <p className="mt-4 text-center text-[14px] text-muted">No products match.</p>
      )}
    </>
  );
}


