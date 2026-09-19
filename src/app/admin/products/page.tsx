import Link from "next/link";
import { requireAdmin } from "@/lib/adminSession";
import { listProducts } from "@/lib/productStore";
import { AdminProducts } from "@/components/AdminProducts";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireAdmin();

  const products = await listProducts();
  const soldOut = products.filter((p) => !p.inStock).length;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Link href="/admin" className="text-[13px] text-muted hover:text-text">
        &larr; Orders
      </Link>

      <h1 className="mt-3 text-2xl font-black text-text">Prices &amp; stock</h1>
      <p className="mt-1 text-[13px] text-muted">
        {products.length} products &middot; {soldOut} marked sold out. Changes go live
        within a minute.
      </p>

      <div className="mt-5">
        <AdminProducts products={products} />
      </div>
    </main>
  );
}
