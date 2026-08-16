/**
 * Generates the ToneCraft brand images referenced by public/site.webmanifest,
 * src/app/layout.tsx metadata and the Open Graph/Twitter share cards:
 *   - public/icons/icon-192.png          (192x192, manifest)
 *   - public/icons/icon-512.png          (512x512, manifest)
 *   - public/apple-touch-icon.png        (180x180, iOS home screen)
 *   - public/og.png                      (1200x630, Open Graph / Twitter card)
 *
 * Pure Node — no dependencies. Renders a brand-gradient square (#7C74F5 → #4C44C9)
 * with a white "T" monogram, supersampled 2x for anti-aliasing. The OG banner
 * reuses the same gradient + monogram and adds a 5x7 pixel-font wordmark and
 * tagline.
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

// ── Brand colors ────────────────────────────────────────────────────────────
const TOP = [0x7c, 0x74, 0xf5]; // #7C74F5
const BOTTOM = [0x4c, 0x44, 0xc9]; // #4C44C9
const WHITE = [0xff, 0xff, 0xff];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Fill an RGBA buffer (S×S, 2x supersampled) with the brand vertical gradient
 * plus a subtle radial vignette — the shared background of icon and OG banner.
 */
function fillBrandBackground(rgba, S, uScale = 1, vScale = 1) {
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const u = x / (S - 1) / uScale;
      const v = y / (S - 1) / vScale;
      const r = lerp(TOP[0], BOTTOM[0], v);
      const g = lerp(TOP[1], BOTTOM[1], v);
      const b = lerp(TOP[2], BOTTOM[2], v);
      const dx = u - 0.5;
      const dy = v - 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy) / 0.7071;
      const vignette = 1 - 0.18 * Math.pow(dist, 2.2);
      const idx = (y * S + x) * 4;
      rgba[idx] = Math.min(255, Math.round(r * vignette));
      rgba[idx + 1] = Math.min(255, Math.round(g * vignette));
      rgba[idx + 2] = Math.min(255, Math.round(b * vignette));
      rgba[idx + 3] = 255;
    }
  }
}

function setPixel(rgba, S, x, y, [r, g, b, a]) {
  if (x < 0 || y < 0 || x >= S || y >= S) return;
  const idx = (y * S + x) * 4;
  rgba[idx] = r;
  rgba[idx + 1] = g;
  rgba[idx + 2] = b;
  rgba[idx + 3] = a;
}

/** Draw the white "T" monogram into a square region of an RGBA buffer. */
function drawMonogram(rgba, S, region) {
  const { x0, y0, size } = region;
  const bar = { x0: 0.3, x1: 0.7, y0: 0.22, y1: 0.36 };
  const stem = { x0: 0.44, x1: 0.56, y0: 0.22, y1: 0.78 };
  for (let y = y0; y < y0 + size; y++) {
    for (let x = x0; x < x0 + size; x++) {
      const u = (x - x0) / (size - 1);
      const v = (y - y0) / (size - 1);
      const inBar = u >= bar.x0 && u <= bar.x1 && v >= bar.y0 && v <= bar.y1;
      const inStem = u >= stem.x0 && u <= stem.x1 && v >= stem.y0 && v <= stem.y1;
      if (inBar || inStem) {
        setPixel(rgba, S, x, y, [WHITE[0], WHITE[1], WHITE[2], 255]);
      }
    }
  }
}

// ── 5x7 pixel font (classic bitmaps, MSB-first, 5 bits per row) ─────────────
// Used only for the OG banner wordmark + tagline — keeps the generator
// dependency-free while staying legible at share-card sizes.
const FONT5x7 = {
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  B: [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e],
  D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f],
  F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0f],
  H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11],
  N: [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d],
  R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e],
  T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x1b, 0x11],
  X: [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04],
  Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
  a: [0x00, 0x00, 0x0e, 0x01, 0x0f, 0x11, 0x0f],
  b: [0x10, 0x10, 0x16, 0x19, 0x11, 0x11, 0x1e],
  c: [0x00, 0x00, 0x0e, 0x11, 0x10, 0x11, 0x0e],
  d: [0x01, 0x01, 0x0d, 0x13, 0x11, 0x11, 0x0f],
  e: [0x00, 0x00, 0x0e, 0x11, 0x1f, 0x10, 0x0e],
  f: [0x06, 0x09, 0x08, 0x1c, 0x08, 0x08, 0x08],
  g: [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x02, 0x1c],
  h: [0x10, 0x10, 0x16, 0x19, 0x11, 0x11, 0x11],
  i: [0x04, 0x00, 0x0c, 0x04, 0x04, 0x04, 0x0e],
  j: [0x02, 0x00, 0x06, 0x02, 0x02, 0x12, 0x0c],
  k: [0x10, 0x10, 0x12, 0x14, 0x18, 0x14, 0x12],
  l: [0x0c, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  m: [0x00, 0x00, 0x1a, 0x15, 0x15, 0x15, 0x15],
  n: [0x00, 0x00, 0x16, 0x19, 0x11, 0x11, 0x11],
  o: [0x00, 0x00, 0x0e, 0x11, 0x11, 0x11, 0x0e],
  p: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  q: [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x01, 0x01],
  r: [0x00, 0x00, 0x16, 0x19, 0x10, 0x10, 0x10],
  s: [0x00, 0x00, 0x0f, 0x10, 0x0e, 0x01, 0x1e],
  t: [0x08, 0x08, 0x1c, 0x08, 0x08, 0x09, 0x06],
  u: [0x00, 0x00, 0x11, 0x11, 0x11, 0x13, 0x0d],
  v: [0x00, 0x00, 0x11, 0x11, 0x11, 0x0a, 0x04],
  w: [0x00, 0x00, 0x11, 0x11, 0x15, 0x15, 0x0a],
  x: [0x00, 0x00, 0x11, 0x0a, 0x04, 0x0a, 0x11],
  y: [0x00, 0x00, 0x11, 0x11, 0x0f, 0x01, 0x1e],
  z: [0x00, 0x00, 0x1f, 0x02, 0x04, 0x08, 0x1f],
  " ": [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
  ".": [0x00, 0x00, 0x00, 0x00, 0x00, 0x06, 0x06],
  ",": [0x00, 0x00, 0x00, 0x00, 0x06, 0x04, 0x08],
  "-": [0x00, 0x00, 0x00, 0x1f, 0x00, 0x00, 0x00],
  "!": [0x04, 0x04, 0x04, 0x04, 0x00, 0x04, 0x04],
};

const CHAR_W = 5;
const CHAR_H = 7;
const CHAR_ADVANCE = 6;

function textWidth(text, scale) {
  return text.length * CHAR_ADVANCE * scale;
}

/**
 * Draw `text` with top-left at (x, y) into an RGBA buffer. `scale` is the
 * pixel size of one font cell. `alpha` 0–255.
 */
function drawText(rgba, S, text, x, y, scale, color, alpha) {
  for (let ci = 0; ci < text.length; ci++) {
    const glyph = FONT5x7[text[ci]];
    if (!glyph) continue;
    const ox = x + ci * CHAR_ADVANCE * scale;
    for (let r = 0; r < CHAR_H; r++) {
      const row = glyph[r];
      for (let c = 0; c < CHAR_W; c++) {
        if ((row >> (4 - c)) & 1) {
          for (let py = 0; py < scale; py++) {
            for (let px = 0; px < scale; px++) {
              setPixel(rgba, S, ox + c * scale + px, y + r * scale + py, [color[0], color[1], color[2], alpha]);
            }
          }
        }
      }
    }
  }
}

/** Box-downsample an S×S supersampled buffer to size×size. */
function downsample(rgba, S, size, ss) {
  const out = Buffer.alloc(size * size * 4);
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
  return out;
}

// ── Icon renderer (2x supersampled) ────────────────────────────────────────
function renderIcon(size) {
  const ss = 2; // supersample factor
  const S = size * ss;
  const rgba = Buffer.alloc(S * S * 4);
  fillBrandBackground(rgba, S, 1, 1);
  drawMonogram(rgba, S, { x0: 0, y0: 0, size: S });
  return encodePNG(size, size, downsample(rgba, S, size, ss));
}

// ── Open Graph banner (1200x630, 2x supersampled) ─────────────────────────
function renderOG() {
  const W = 1200;
  const H = 630;
  const ss = 2;
  const SW = W * ss;
  const SH = H * ss;
  const rgba = Buffer.alloc(SW * SH * 4);

  // Vertical gradient spanning the full canvas (v: 0 at top → 1 at bottom).
  for (let y = 0; y < SH; y++) {
    for (let x = 0; x < SW; x++) {
      const u = x / (SW - 1);
      const v = y / (SH - 1);
      const r = lerp(TOP[0], BOTTOM[0], v);
      const g = lerp(TOP[1], BOTTOM[1], v);
      const b = lerp(TOP[2], BOTTOM[2], v);
      const dx = u - 0.5;
      const dy = v - 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy) / 0.7071;
      const vignette = 1 - 0.16 * Math.pow(dist, 2.2);
      const idx = (y * SW + x) * 4;
      rgba[idx] = Math.min(255, Math.round(r * vignette));
      rgba[idx + 1] = Math.min(255, Math.round(g * vignette));
      rgba[idx + 2] = Math.min(255, Math.round(b * vignette));
      rgba[idx + 3] = 255;
    }
  }

  const cx = SW / 2; // center in supersampled space

  // White "T" monogram on the left, vertically centered.
  const tSize = 220 * ss;
  const tX = 60 * ss;
  const tY = Math.round((SH - tSize) / 2);
  drawMonogram(rgba, SW, { x0: tX, y0: tY, size: tSize });

  // Wordmark "ToneCraft" to the right of the monogram, vertically centered
  // (glyph cell is 7 rows tall; center the cell on the canvas middle).
  const wordScale = 15 * ss;
  const wordText = "ToneCraft";
  const wordW = textWidth(wordText, wordScale);
  const wordX = Math.round(cx + 70 * ss - wordW / 2);
  const wordY = Math.round((SH - CHAR_H * wordScale) / 2);
  drawText(rgba, SW, wordText, wordX, wordY, wordScale, WHITE, 255);

  // Thin divider under the wordmark.
  const dividerY = Math.round(wordY + CHAR_H * wordScale + 56 * ss);
  const dividerX0 = Math.round(cx + 70 * ss - wordW / 2 - 24 * ss);
  const dividerX1 = Math.round(cx + 70 * ss + wordW / 2 + 24 * ss);
  for (let x = dividerX0; x <= dividerX1; x++) {
    for (let py = 0; py < 2 * ss; py++) {
      setPixel(rgba, SW, x, dividerY + py, [WHITE[0], WHITE[1], WHITE[2], 200]);
    }
  }

  // Tagline under the divider.
  const tagScale = 5 * ss;
  const tagText = "Write once. Speak perfectly, everywhere.";
  const tagW = textWidth(tagText, tagScale);
  const tagX = Math.round((SW - tagW) / 2);
  const tagY = Math.round(dividerY + 34 * ss);
  drawText(rgba, SW, tagText, tagX, tagY, tagScale, WHITE, 215);

  return encodePNG(W, H, downsample(rgba, SW, W, ss));
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

const ogFile = path.join(__dirname, "..", "public", "og.png");
fs.writeFileSync(ogFile, renderOG());
console.log(`✓ ${path.relative(process.cwd(), ogFile)} (1200x630, ${fs.statSync(ogFile).size} bytes)`);
