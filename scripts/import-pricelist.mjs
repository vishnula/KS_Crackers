// Converts the client's printed pricelist PDF into seed data + a verification sheet.
//
//   pdftotext -table "KS CRACKERS SHOP 2026.pdf" pricelist.txt
//   node scripts/import-pricelist.mjs pricelist.txt
//
// -table is required. Plain -layout decouples rates from their rows and silently
// puts wrong prices on products.

import ExcelJS from "exceljs";
import { readFile, writeFile, mkdir } from "node:fs/promises";

// The PDF prints only NET RATE; the ACTUAL RATE column is blank and the header
// claims "90% Discount". So MRP is derived. CONFIRM WITH THE CLIENT.
const MRP_MULTIPLIER = 10;

const UNITS = { PKT: "Pkt", BOX: "Box", PCS: "Pcs", PAIR: "Pair" };

// Page furniture that repeats on every page.
const NOISE = [
  /^S\.NO\./i,
  /^RATE\b/i,
  /^KS Crackers Shop/i,
  /^PRICE LIST/i,
  /^\d+\s*%\s*Discount/i,
  /PACKING CHARGES/i,
  /^[\d\s/]+$/, // phone number lines
];

const PRODUCT_RE = /^(\d{1,3})\s+(.+?)\s+1\s+(PKT|BOX|PCS|PAIR)\s+(\d[\d,]*)\s*$/i;

// Typos in the client's own PDF that would look bad on the live site.
const CATEGORY_FIXES = { "DIWALI SPEICAL": "DIWALI SPECIAL" };

// Smart quotes and dashes from the PDF, flattened so they are safe to match on.
function normalise(line) {
  return line
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function isNoise(line) {
  return NOISE.some((re) => re.test(line));
}

// Category headers are the unnumbered, un-priced lines between product runs.
// The address lines are Tamil, so anything outside this character set is rejected.
const SAFE_HEADER = /^[A-Za-z0-9 '"().,&/\-½¼¾]+$/;

function isCategory(line) {
  if (PRODUCT_RE.test(line) || isNoise(line)) return false;
  if (/^\d/.test(line)) return false;
  if (line.replace(/[^A-Za-z]/g, "").length < 3) return false;
  if (!SAFE_HEADER.test(line)) return false;
  return line === line.toUpperCase();
}

function parse(text) {
  const products = [];
  const categories = [];
  const warnings = [];
  let current = null;

  for (const raw of text.split(/\r?\n/)) {
    const line = normalise(raw);
    if (!line || isNoise(line)) continue;

    const m = line.match(PRODUCT_RE);
    if (m) {
      const [, code, name, unit, rate] = m;
      if (!current) {
        warnings.push(`Product ${code} appeared before any category header`);
      }
      const price = Number(rate.replace(/,/g, ""));
      products.push({
        code: Number(code),
        category: current ?? "UNCATEGORISED",
        name: name.replace(/\s+/g, " ").trim(),
        unit: UNITS[unit.toUpperCase()] ?? unit,
        price,
        mrp: price * MRP_MULTIPLIER,
      });
      continue;
    }

    if (isCategory(line)) {
      current = CATEGORY_FIXES[line] ?? line;
      if (CATEGORY_FIXES[line]) warnings.push(`Fixed PDF typo: "${line}" -> "${current}"`);
      if (!categories.includes(current)) categories.push(current);
    }
  }

  // Integrity checks — a wrong price on a live pricelist is a direct cash loss.
  const seen = new Map();
  for (const p of products) {
    if (seen.has(p.code)) warnings.push(`Duplicate code ${p.code}: "${seen.get(p.code)}" vs "${p.name}"`);
    seen.set(p.code, p.name);
  }
  const codes = products.map((p) => p.code).sort((a, b) => a - b);
  for (let i = codes[0]; i <= codes[codes.length - 1]; i++) {
    if (!seen.has(i)) warnings.push(`Missing code ${i} — check the PDF, it may not have parsed`);
  }

  return { products, categories, warnings };
}

async function writeWorkbook({ products, categories, warnings }, out) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "KS Crackers";

  const ws = wb.addWorksheet("Products", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = [
    { header: "code", key: "code", width: 8 },
    { header: "category", key: "category", width: 30 },
    { header: "product_name", key: "name", width: 40 },
    { header: "unit", key: "unit", width: 8 },
    { header: "mrp", key: "mrp", width: 12 },
    { header: "selling_price", key: "price", width: 14 },
    { header: "in_stock", key: "in_stock", width: 10 },
    { header: "image_file", key: "image_file", width: 16 },
    { header: "CHECK", key: "check", width: 14 },
  ];
  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
  head.height = 22;

  products.forEach((p) => ws.addRow({ ...p, in_stock: "Y", image_file: "", check: "" }));
  ws.getColumn(5).numFmt = "#,##0"; // mrp
  ws.getColumn(6).numFmt = "#,##0"; // selling_price
  ws.autoFilter = { from: "A1", to: "I1" };

  const info = wb.addWorksheet("READ ME");
  info.columns = [{ width: 100 }];
  [
    "KS Crackers 2026 — auto-extracted from the printed PDF pricelist",
    "",
    `${products.length} products across ${categories.length} categories.`,
    "",
    "PLEASE VERIFY BEFORE THIS GOES LIVE:",
    "",
    `1. mrp is CALCULATED as selling_price x ${MRP_MULTIPLIER}, because the ACTUAL RATE column`,
    "   is blank in your PDF and the header says 90% Discount. Confirm this is right.",
    "2. selling_price is the NET RATE printed in your PDF. Spot-check 10 rows against the PDF.",
    "3. 3% packing charges are NOT in these prices — that is applied at checkout.",
    "4. Tick the CHECK column once you have verified a row.",
    "",
    warnings.length ? "WARNINGS FROM THE IMPORT:" : "No warnings — every code from 1 to the last parsed cleanly.",
    ...warnings.map((w) => `  - ${w}`),
  ].forEach((l) => info.addRow([l]));
  info.getRow(1).font = { bold: true, size: 14 };
  info.getRow(5).font = { bold: true, color: { argb: "FFB91C1C" } };

  await wb.xlsx.writeFile(out);
}

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error("usage: node scripts/import-pricelist.mjs <pdftotext -table output>");
    process.exit(1);
  }

  const text = await readFile(input, "utf8");
  const result = parse(text);

  await mkdir("src/data", { recursive: true });
  await mkdir("docs", { recursive: true });
  await writeFile("src/data/products.json", JSON.stringify(result.products, null, 2));
  await writeWorkbook(result, "docs/ks-catalogue-2026.xlsx");

  console.log(`${result.products.length} products, ${result.categories.length} categories`);
  console.log(result.categories.map((c, i) => `  ${i + 1}. ${c}`).join("\n"));
  if (result.warnings.length) {
    console.log(`\n${result.warnings.length} warning(s):`);
    result.warnings.forEach((w) => console.log(`  ! ${w}`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
