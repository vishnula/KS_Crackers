"use client";

import type { AdminProduct } from "./productStore";

// CSV, not xlsx, and deliberately so. exceljs pulls unzipper -> fstream -> rimraf,
// and Next traces that whole tree into the Worker bundle even from a client-only
// dynamic import. CSV needs no dependency, opens and saves natively in Excel, and
// keeps the edge bundle small. The richer .xlsx the client fills in once is still
// generated offline by scripts/generate-catalogue-template.mjs.

export const SHEET_COLUMNS = [
  "code",
  "category",
  "product_name",
  "unit",
  "mrp",
  "selling_price",
  "in_stock",
] as const;

export type SheetRow = {
  code: number;
  category: string;
  name: string;
  unit: string;
  mrp: number;
  price: number;
  inStock: boolean;
};

function escapeCell(value: string | number): string {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Splits one CSV line, honouring quoted fields and doubled quotes. */
function splitLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          cell += '"';
          i++;
        } else inQuotes = false;
      } else cell += char;
    } else if (char === '"') inQuotes = true;
    else if (char === ",") {
      cells.push(cell);
      cell = "";
    } else cell += char;
  }
  cells.push(cell);
  return cells;
}

export function downloadPricelist(products: AdminProduct[]): void {
  const lines = [
    SHEET_COLUMNS.join(","),
    ...products.map((p) =>
      [p.code, p.category, p.name, p.unit, p.mrp, p.price, p.inStock ? "Y" : "N"]
        .map(escapeCell)
        .join(","),
    ),
  ];

  // Leading BOM so Excel reads it as UTF-8 and product names keep their 1/2 marks.
  const blob = new Blob(["﻿" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ks-pricelist-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function parsePricelist(file: File): Promise<SheetRow[]> {
  const text = (await file.text()).replace(/^﻿/, "");
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) throw new Error("That file has no product rows");

  const header = splitLine(lines[0]).map((h) => h.trim().toLowerCase());
  const index = Object.fromEntries(SHEET_COLUMNS.map((c) => [c, header.indexOf(c)]));
  const missing = SHEET_COLUMNS.filter((c) => index[c] === -1 && c !== "in_stock");
  if (missing.length)
    throw new Error(
      `Missing column(s): ${missing.join(", ")}. Use the file from Download Excel.`,
    );

  const rows: SheetRow[] = [];
  for (const line of lines.slice(1)) {
    const cells = splitLine(line);
    const at = (name: string) => (index[name] === -1 ? "" : (cells[index[name]] ?? "").trim());

    const code = Number(at("code"));
    if (!Number.isInteger(code)) continue; // blank or note row

    rows.push({
      code,
      category: at("category"),
      name: at("product_name"),
      unit: at("unit") || "Box",
      mrp: Number(at("mrp")),
      price: Number(at("selling_price")),
      inStock: index.in_stock === -1 ? true : at("in_stock").toUpperCase() !== "N",
    });
  }

  if (rows.length === 0) throw new Error("No product rows found in that file");
  return rows;
}
