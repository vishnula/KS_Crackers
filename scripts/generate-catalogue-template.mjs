// Generates the Excel the client fills in with his product list.
// Run: npm run catalogue:template  ->  docs/catalogue-template.xlsx

import ExcelJS from "exceljs";
import { mkdir } from "node:fs/promises";

const OUT_DIR = "docs";
const OUT_FILE = `${OUT_DIR}/catalogue-template.xlsx`;

const COLUMNS = [
  { header: "code", key: "code", width: 10, note: "Product number on your pricelist. Must be unique." },
  { header: "category", key: "category", width: 24, note: "e.g. Flower Pots, Sky Display, Repeating Shots" },
  { header: "product_name", key: "product_name", width: 34, note: "Exactly as you want it printed" },
  { header: "unit", key: "unit", width: 10, note: "Box / Pcs / Pkt / Pair" },
  { header: "mrp", key: "mrp", width: 12, note: "Struck-through price. Numbers only, no Rs symbol." },
  { header: "selling_price", key: "selling_price", width: 14, note: "What the customer actually pays" },
  { header: "in_stock", key: "in_stock", width: 10, note: "Y or N" },
  { header: "image_file", key: "image_file", width: 18, note: "Photo file name, e.g. 308.jpg. Leave blank if none." },
  { header: "video_url", key: "video_url", width: 30, note: "YouTube link if you have a demo video. Optional." },
];

const SAMPLE = [
  { code: "308", category: "Sky Display", product_name: "Pink Love 6' Fancy", unit: "Box", mrp: 3750, selling_price: 375, in_stock: "Y", image_file: "308.jpg", video_url: "" },
  { code: "43", category: "Flower Pots", product_name: "Big Pot", unit: "Box", mrp: 600, selling_price: 60, in_stock: "Y", image_file: "43.jpg", video_url: "" },
  { code: "85", category: "Repeating Shots", product_name: "100 Shot Multi Colour", unit: "Box", mrp: 10000, selling_price: 1000, in_stock: "N", image_file: "", video_url: "" },
];

const INSTRUCTIONS = [
  ["KS Crackers — Product Catalogue Template", ""],
  ["", ""],
  ["Fill the Products sheet. One row per product. Do not rename or reorder the columns.", ""],
  ["", ""],
  ["Column", "What to put"],
  ...COLUMNS.map((c) => [c.header, c.note]),
  ["", ""],
  ["Rules", ""],
  ["1", "Every code must be unique. If two rows share a code the import will reject the file."],
  ["2", "mrp and selling_price must be plain numbers. No Rs, no commas, no text."],
  ["3", "selling_price must be less than or equal to mrp."],
  ["4", "Keep category spelling identical across rows — the site groups by it."],
  ["5", "Category order on the site follows the order categories first appear in this sheet."],
  ["6", "Send product photos in one folder, named exactly as in image_file."],
  ["7", "Delete the 3 sample rows before sending the file back."],
];

const HEADER_FILL = "FF1E293B";
const ACCENT = "FFF59E0B";

async function main() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "KS Crackers";
  wb.created = new Date();

  const info = wb.addWorksheet("Instructions", { properties: { defaultRowHeight: 18 } });
  info.columns = [{ width: 26 }, { width: 86 }];
  INSTRUCTIONS.forEach((row) => info.addRow(row));
  info.getRow(1).font = { bold: true, size: 14, color: { argb: HEADER_FILL } };
  info.getRow(5).font = { bold: true };
  info.getCell("A5").fill = { type: "pattern", pattern: "solid", fgColor: { argb: ACCENT } };
  info.getCell("B5").fill = { type: "pattern", pattern: "solid", fgColor: { argb: ACCENT } };
  info.getColumn(2).alignment = { wrapText: true, vertical: "top" };

  const ws = wb.addWorksheet("Products", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = COLUMNS.map(({ header, key, width }) => ({ header, key, width }));

  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
  head.height = 22;
  head.alignment = { vertical: "middle" };

  SAMPLE.forEach((r) => ws.addRow(r));
  ws.getColumn("mrp").numFmt = "#,##0";
  ws.getColumn("selling_price").numFmt = "#,##0";
  ws.autoFilter = { from: "A1", to: "I1" };

  // Guard rails so the client cannot send back an unimportable file.
  for (let r = 2; r <= 2000; r++) {
    ws.getCell(`D${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"Box,Pcs,Pkt,Pair"'],
      showErrorMessage: true,
      error: "Use Box, Pcs, Pkt or Pair",
    };
    ws.getCell(`G${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"Y,N"'],
      showErrorMessage: true,
      error: "Use Y or N",
    };
  }

  await mkdir(OUT_DIR, { recursive: true });
  await wb.xlsx.writeFile(OUT_FILE);
  console.log(`Wrote ${OUT_FILE} (${COLUMNS.length} columns, ${SAMPLE.length} sample rows)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
