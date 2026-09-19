import raw from "@/data/products.json";
import type { Unit } from "./types";

export type CatalogueProduct = {
  code: number;
  category: string;
  name: string;
  unit: Unit;
  price: number;
  mrp: number;
};

export type CatalogueCategory = {
  name: string;
  slug: string;
  products: CatalogueProduct[];
};

const products = raw as CatalogueProduct[];

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Category order follows first appearance in the client's printed pricelist.
export function getCatalogue(): CatalogueCategory[] {
  const byCategory = new Map<string, CatalogueProduct[]>();
  for (const p of products) {
    const list = byCategory.get(p.category);
    if (list) list.push(p);
    else byCategory.set(p.category, [p]);
  }
  return [...byCategory.entries()].map(([name, list]) => ({
    name,
    slug: slugify(name),
    products: list,
  }));
}

export function getProducts(): CatalogueProduct[] {
  return products;
}

export function getProductsByCode(): Map<number, CatalogueProduct> {
  return new Map(products.map((p) => [p.code, p]));
}
