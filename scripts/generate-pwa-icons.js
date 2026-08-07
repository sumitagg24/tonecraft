/**
 * Generates the ToneCraft PWA icons referenced by public/site.webmanifest and
 * src/app/layout.tsx metadata:
 *   - public/icons/icon-192.png          (192x192, manifest)
 *   - public/icons/icon-512.png          (512x512, manifest)
 *   - public/apple-touch-icon.png        (180x180, iOS home screen)
 *
 * Pure Node — no dependencies. Renders a brand-gradient square (#7C74F5 → #4C44C9)
 * with a white "T" monogram, supersampled 2x for anti-aliasing.
 *
 * Usage: node scripts/generate-pwa-icons.js
 */
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

// ── PNG encoding helpers ────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // compression 0, filter 0, interlace 0

  // Each scanline is prefixed with filter byte 0 (None).
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// ── Icon renderer (2x supersampled) ────────────────────────────────────────
const TOP = [0x7c, 0x74, 0xf5]; // #7C74F5
const BOTTOM = [0x4c, 0x44, 0xc9]; // #4C44C9
const WHITE = [0xff, 0xff, 0xff];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function renderIcon(size) {
  const ss = 2; // supersample factor
  const S = size * ss;
  const rgba = Buffer.alloc(S * S * 4);

  // "T" monogram geometry in [0,1] coordinates.
  const bar = { x0: 0.3, x1: 0.7, y0: 0.22, y1: 0.36 };
  const stem = { x0: 0.44, x1: 0.56, y0: 0.22, y1: 0.78 };

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const u = x / (S - 1);
      const v = y / (S - 1);

      // Vertical brand gradient.
      const r = lerp(TOP[0], BOTTOM[0], v);
      const g = lerp(TOP[1], BOTTOM[1], v);
      const b = lerp(TOP[2], BOTTOM[2], v);

      // Subtle radial vignette (darker at corners).
      const dx = u - 0.5;
      const dy = v - 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy) / 0.7071; // 0 center → 1 corner
      const vignette = 1 - 0.18 * Math.pow(dist, 2.2);

      const inBar = u >= bar.x0 && u <= bar.x1 && v >= bar.y0 && v <= bar.y1;
      const inStem = u >= stem.x0 && u <= stem.x1 && v >= stem.y0 && v <= stem.y1;
      const isGlyph = inBar || inStem;

      const idx = (y * S + x) * 4;
      if (isGlyph) {
        rgba[idx] = WHITE[0];
        rgba[idx + 1] = WHITE[1];
        rgba[idx + 2] = WHITE[2];
        rgba[idx + 3] = 255;
      } else {
        rgba[idx] = Math.min(255, Math.round(r * vignette));
        rgba[idx + 1] = Math.min(255, Math.round(g * vignette));
        rgba[idx + 2] = Math.min(255, Math.round(b * vignette));
        rgba[idx + 3] = 255;
      }
    }
  }

  // Downsample S×S → size×size with box averaging.
  const out = Buffer.alloc(size * size * 4);
  const scale = ss;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let aSum = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const idx = ((y * ss + sy) * S + (x * ss + sx)) * 4;
          rSum += rgba[idx];
          gSum += rgba[idx + 1];
          bSum += rgba[idx + 2];
          aSum += rgba[idx + 3];
        }
      }
      const n = ss * ss;
      const oi = (y * size + x) * 4;
      out[oi] = Math.round(rSum / n);
      out[oi + 1] = Math.round(gSum / n);
      out[oi + 2] = Math.round(bSum / n);
      out[oi + 3] = Math.round(aSum / n);
    }
  }
  return encodePNG(size, size, out);
}

// ── Write outputs ──────────────────────────────────────────────────────────
const outDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

const targets = [
  { file: path.join(outDir, "icon-192.png"), size: 192 },
  { file: path.join(outDir, "icon-512.png"), size: 512 },
  { file: path.join(__dirname, "..", "public", "apple-touch-icon.png"), size: 180 },
];

for (const { file, size } of targets) {
  fs.writeFileSync(file, renderIcon(size));
  console.log(`✓ ${path.relative(process.cwd(), file)} (${size}x${size}, ${fs.statSync(file).size} bytes)`);
}
