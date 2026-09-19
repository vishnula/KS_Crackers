import type { D1Database } from "@cloudflare/workers-types";
import type { CatalogueProduct } from "./catalogue";
import { getProducts as getSeedProducts } from "./catalogue";
import type { Unit } from "./types";

// D1 is the source of truth for the catalogue once seeded. The JSON seed is the
// fallback so that `next build` - which has no D1 binding in CI - can still
// pre-render the price list; runtime revalidation then picks up live data.

export type ProductPatch = {
  price?: number;
  mrp?: number;
  inStock?: boolean;
  active?: boolean;
};

type ProductRow = {
  code: number;
  category: string;
  name: string;
  unit: string;
  mrp: number;
  price: number;
  in_stock: number;
  active: number;
  sort_order: number;
};

export type AdminProduct = CatalogueProduct & {
  inStock: boolean;
  active: boolean;
  sortOrder: number;
};

function toProduct(row: ProductRow): AdminProduct {
  return {
    code: row.code,
    category: row.category,
    name: row.name,
    unit: row.unit as Unit,
    mrp: row.mrp,
    price: row.price,
    inStock: row.in_stock === 1,
    active: row.active === 1,
    sortOrder: row.sort_order,
  };
}

async function getDb(): Promise<D1Database | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    return ((env as { DB?: D1Database }).DB as D1Database) ?? null;
  } catch {
    return null;
  }
}

function seedFallback(): AdminProduct[] {
  return getSeedProducts().map((p, index) => ({
    ...p,
    inStock: true,
    active: true,
    sortOrder: index,
  }));
}

export async function listProducts(): Promise<AdminProduct[]> {
  const db = await getDb();
  if (!db) return seedFallback();

  try {
    const rows = await db
      .prepare(`SELECT * FROM products ORDER BY sort_order ASC`)
      .all<ProductRow>();
    if (rows.results.length === 0) return seedFallback();
    return rows.results.map(toProduct);
  } catch {
    // Table not created yet - fall back rather than blanking the price list.
    return seedFallback();
  }
}

export async function listLiveProducts(): Promise<AdminProduct[]> {
  return (await listProducts()).filter((p) => p.active);
}

export async function updateProduct(code: number, patch: ProductPatch): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const sets: string[] = [];
  const values: (string | number)[] = [];
  const push = (column: string, value: string | number) => {
    sets.push(`${column} = ?${sets.length + 1}`);
    values.push(value);
  };

  if (patch.price !== undefined) push("price", patch.price);
  if (patch.mrp !== undefined) push("mrp", patch.mrp);
  if (patch.inStock !== undefined) push("in_stock", patch.inStock ? 1 : 0);
  if (patch.active !== undefined) push("active", patch.active ? 1 : 0);
  if (sets.length === 0) return false;

  const result = await db
    .prepare(`UPDATE products SET ${sets.join(", ")} WHERE code = ?${sets.length + 1}`)
    .bind(...values, code)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

export type ImportRow = {
  code: number;
  category: string;
  name: string;
  unit: string;
  mrp: number;
  price: number;
  inStock: boolean;
};

export async function bulkUpsert(rows: ImportRow[]): Promise<number> {
  const db = await getDb();
  if (!db || rows.length === 0) return 0;

  const statement = db.prepare(
    `INSERT INTO products (code, category, name, unit, mrp, price, in_stock, sort_order)
     VALUES (?1,?2,?3,?4,?5,?6,?7,?8)
     ON CONFLICT(code) DO UPDATE SET
       category = excluded.category, name = excluded.name, unit = excluded.unit,
       mrp = excluded.mrp, price = excluded.price, in_stock = excluded.in_stock,
       sort_order = excluded.sort_order`,
  );

  // D1 caps how much one batch can carry, so send them in chunks.
  const CHUNK = 50;
  let written = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    await db.batch(
      chunk.map((r, j) =>
        statement.bind(
          r.code, r.category, r.name, r.unit, r.mrp, r.price,
          r.inStock ? 1 : 0, i + j,
        ),
      ),
    );
    written += chunk.length;
  }
  return written;
}

export function groupByCategory(products: AdminProduct[]) {
  const byCategory = new Map<string, AdminProduct[]>();
  for (const p of products) {
    const list = byCategory.get(p.category);
    if (list) list.push(p);
    else byCategory.set(p.category, [p]);
  }
  return [...byCategory.entries()].map(([name, list]) => ({ name, products: list }));
}
