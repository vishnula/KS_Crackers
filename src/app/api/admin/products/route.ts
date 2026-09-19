import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isSignedIn } from "@/lib/adminSession";
import { bulkUpsert, updateProduct, type ImportRow } from "@/lib/productStore";

// Spreadsheet parsing happens in the browser (see AdminProducts.tsx) and this
// endpoint takes plain JSON rows. Keeping exceljs out of the Worker avoids
// dragging a Node dependency tree into the edge bundle. The browser's parse is a
// convenience, not a trust boundary - every row is re-validated here.

// Both the price list and the home page show prices, so a change must clear both.
function revalidatePublicPages() {
  revalidatePath("/pricelist");
  revalidatePath("/");
}

function validAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1_000_000;
}

export async function PATCH(request: Request) {
  if (!(await isSignedIn()))
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: { code?: number; price?: number; mrp?: number; inStock?: boolean; active?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }

  if (!Number.isFinite(body.code))
    return NextResponse.json({ error: "Product code is required" }, { status: 400 });

  for (const field of ["price", "mrp"] as const) {
    if (body[field] !== undefined && !validAmount(body[field]))
      return NextResponse.json({ error: `${field} is out of range` }, { status: 400 });
  }
  if (body.price !== undefined && body.mrp !== undefined && body.price > body.mrp)
    return NextResponse.json({ error: "Price cannot exceed MRP" }, { status: 400 });

  const changed = await updateProduct(Number(body.code), {
    price: body.price,
    mrp: body.mrp,
    inStock: body.inStock,
    active: body.active,
  });

  if (!changed)
    return NextResponse.json(
      { error: "Nothing was updated. Is the catalogue seeded into D1?" },
      { status: 400 },
    );

  revalidatePublicPages();
  return NextResponse.json({ ok: true });
}

type IncomingRow = Partial<Record<keyof ImportRow, unknown>>;

/** Bulk price and stock update. All or nothing. */
export async function POST(request: Request) {
  if (!(await isSignedIn()))
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let incoming: IncomingRow[];
  try {
    const body = (await request.json()) as { rows?: IncomingRow[] };
    incoming = body.rows ?? [];
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }

  if (!Array.isArray(incoming) || incoming.length === 0)
    return NextResponse.json({ error: "No product rows found" }, { status: 400 });
  if (incoming.length > 5000)
    return NextResponse.json({ error: "Too many rows" }, { status: 400 });

  const rows: ImportRow[] = [];
  const errors: string[] = [];
  const seen = new Set<number>();

  incoming.forEach((row, i) => {
    const label = `Row ${i + 2}`;
    const code = Number(row.code);
    const name = String(row.name ?? "").trim();
    const mrp = Number(row.mrp);
    const price = Number(row.price);

    if (!Number.isInteger(code)) return errors.push(`${label}: code must be a whole number`);
    if (seen.has(code)) return errors.push(`${label}: duplicate code ${code}`);
    if (!name) return errors.push(`${label}: product name is empty`);
    if (!validAmount(mrp) || !validAmount(price))
      return errors.push(`${label}: mrp and selling price must be numbers`);
    if (price > mrp) return errors.push(`${label}: selling price is above mrp`);

    seen.add(code);
    rows.push({
      code,
      category: String(row.category ?? "").trim().toUpperCase(),
      name,
      unit: String(row.unit ?? "Box").trim(),
      mrp,
      price,
      inStock: row.inStock !== false,
    });
  });

  // All or nothing: a half-imported price list is worse than a rejected file.
  if (errors.length)
    return NextResponse.json(
      { error: "File rejected, nothing was changed", errors: errors.slice(0, 20) },
      { status: 400 },
    );

  const written = await bulkUpsert(rows);
  if (written === 0)
    return NextResponse.json(
      { error: "No database connected, nothing was imported" },
      { status: 503 },
    );

  revalidatePublicPages();
  return NextResponse.json({ ok: true, imported: written });
}
