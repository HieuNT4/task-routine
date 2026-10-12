// Generates PWA icons (blue tile + white check mark) without external dependencies.
// Usage: node scripts/generate-icons.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const BLUE = [0x3b, 0x82, 0xf6];
const WHITE = [0xff, 0xff, 0xff];

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};
const encodePNG = (size, rgba) => {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
};

const distToSegment = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};

const insideRoundedRect = (x, y, size, r) => {
  const cx = Math.min(Math.max(x, r), size - r);
  const cy = Math.min(Math.max(y, r), size - r);
  return Math.hypot(x - cx, y - cy) <= r;
};

/**
 * @param size  output px
 * @param opts.radius  tile corner radius ratio (0 = full bleed square)
 * @param opts.scale   check mark scale (smaller for maskable safe zone)
 * @param opts.badge   white check on transparent background
 */
const render = (size, { radius = 0.22, scale = 1, badge = false } = {}) => {
  const rgba = Buffer.alloc(size * size * 4);
  const SS = 4;
  const r = radius * size;
  const s = size * scale;
  const off = (size - s) / 2;
  const pts = [
    [off + 0.28 * s, off + 0.52 * s],
    [off + 0.44 * s, off + 0.67 * s],
    [off + 0.73 * s, off + 0.36 * s],
  ];
  const stroke = 0.085 * s;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let tile = 0;
      let check = 0;
      for (let sy = 0; sy < SS; sy += 1) {
        for (let sx = 0; sx < SS; sx += 1) {
          const px = x + (sx + 0.5) / SS;
          const py = y + (sy + 0.5) / SS;
          if (radius === 0 || insideRoundedRect(px, py, size, r)) tile += 1;
          const d = Math.min(
            distToSegment(px, py, ...pts[0], ...pts[1]),
            distToSegment(px, py, ...pts[1], ...pts[2]),
          );
          if (d <= stroke) check += 1;
        }
      }
      const n = SS * SS;
      const i = (y * size + x) * 4;
      if (badge) {
        rgba.set([...WHITE, Math.round((check / n) * 255)], i);
        continue;
      }
      const c = check / n;
      const color = BLUE.map((b, k) => Math.round(b * (1 - c) + WHITE[k] * c));
      rgba.set([...color, Math.round((tile / n) * 255)], i);
    }
  }
  return encodePNG(size, rgba);
};

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-192.png", render(192));
writeFileSync("public/icons/icon-512.png", render(512));
writeFileSync("public/icons/maskable-512.png", render(512, { radius: 0, scale: 0.8 }));
writeFileSync("public/icons/apple-touch-icon.png", render(180, { radius: 0 }));
writeFileSync("public/icons/badge-96.png", render(96, { badge: true, scale: 1.2 }));
console.log("Icons written to public/icons");
