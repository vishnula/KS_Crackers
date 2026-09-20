// Writes placeholder PWA icons so notifications and the home-screen shortcut
// have something to show. Replace with the client's real logo when it arrives.
//   npm run icons

import { deflateSync } from "node:zlib";
import { writeFile } from "node:fs/promises";

const BG = [11, 16, 32]; // midnight, matches the site background
const FG = [245, 181, 68]; // gold

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = c ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function makePng(size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolour RGB

  // A filled circle in gold on the midnight background.
  const centre = size / 2;
  const radius = size * 0.34;
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3); // leading filter byte, then RGB
    for (let x = 0; x < size; x++) {
      const inside = (x - centre) ** 2 + (y - centre) ** 2 <= radius ** 2;
      const [r, g, b] = inside ? FG : BG;
      row[1 + x * 3] = r;
      row[2 + x * 3] = g;
      row[3 + x * 3] = b;
    }
    rows.push(row);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(Buffer.concat(rows))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512]) {
  const file = `public/icon-${size}.png`;
  await writeFile(file, makePng(size));
  console.log(`Wrote ${file}`);
}
