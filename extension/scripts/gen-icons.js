#!/usr/bin/env node
/**
 * Generates the extension's PNG icons (16/32/48/128) with zero dependencies.
 *
 * Renders a 4x-supersampled master: a rounded-square violet gradient with a
 * white four-point "sparkle" glyph, then box-downsamples to each size and
 * encodes raw PNG (zlib is built into Node).
 *
 * Usage: node scripts/gen-icons.js
 */
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "..", "icons");
const SIZES = [16, 32, 48, 128];
const SS = 4; // supersampling factor

// ── PNG encoding ────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA

  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, pngChunk("IHDR", ihdr), pngChunk("IDAT", idat), pngChunk("IEND", Buffer.alloc(0))]);
}

// ── Master render (supersampled, size = px * SS) ───────────────────────────
const M = 128 * SS;

function roundedRectMask(x, y, size, radius) {
  const r = Math.max(1, radius);
  const cx = Math.min(Math.max(x, r), size - r);
  const cy = Math.min(Math.max(y, r), size - r);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function isInsideGlyph(x, y, s) {
  // Four-point sparkle (✦) at the center: a tall thin diamond plus a wide
  // thin diamond overlapping — reads as a star even at 16px.
  const cx = s / 2;
  const cy = s / 2 + s * 0.03;
  const dx = Math.abs(x - cx);
  const dy = Math.abs(y - cy);
  const ARM = s * 0.285; // tip distance
  const WIDTH = s * 0.05; // arm thickness
  // vertical diamond: dx / WIDTH + dy / ARM <= 1
  // horizontal diamond: dx / ARM + dy / WIDTH <= 1
  return dx / WIDTH + dy / ARM <= 1 || dx / ARM + dy / WIDTH <= 1;
}

const master = Buffer.alloc(M * M * 4);
{
  // gradient corners (violet brand)
  const c1 = [124, 58, 237]; // #7C3AED
  const c2 = [109, 40, 217]; // #6D28D9
  const radius = M * 0.24;
  for (let y = 0; y < M; y++) {
    for (let x = 0; x < M; x++) {
      const i = (y * M + x) * 4;
      const inRect = roundedRectMask(x + 0.5, y + 0.5, M, radius);
      if (!inRect) {
        master[i + 3] = 0;
        continue;
      }
      const t = (x + y) / (2 * M);
      const white = isInsideGlyph(x + 0.5, y + 0.5, M);
      let r = c1[0] + (c2[0] - c1[0]) * t;
      let g = c1[1] + (c2[1] - c1[1]) * t;
      let b = c1[2] + (c2[2] - c1[2]) * t;
      if (white) {
        // soft white glyph with slight edge blend handled by supersampling
        r = 255; g = 255; b = 255;
      }
      master[i] = Math.round(r);
      master[i + 1] = Math.round(g);
      master[i + 2] = Math.round(b);
      master[i + 3] = 255;
    }
  }
}

// ── Downsample to target sizes ──────────────────────────────────────────────
function downsample(size) {
  const out = Buffer.alloc(size * size * 4);
  const f = M / size; // master pixels per output pixel
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      const x0 = Math.floor(x * f);
      const y0 = Math.floor(y * f);
      for (let sy = y0; sy < Math.min(M, y0 + f); sy++) {
        for (let sx = x0; sx < Math.min(M, x0 + f); sx++) {
          const i = (sy * M + sx) * 4;
          const alpha = master[i + 3] / 255;
          r += master[i] * alpha;
          g += master[i + 1] * alpha;
          b += master[i + 2] * alpha;
          a += alpha;
        }
      }
      const o = (y * size + x) * 4;
      const n = Math.max(1, a);
      out[o] = Math.round(r / n);
      out[o + 1] = Math.round(g / n);
      out[o + 2] = Math.round(b / n);
      out[o + 3] = Math.round((a / (f * f)) * 255);
    }
  }
  return out;
}

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const size of SIZES) {
  const png = encodePng(size, downsample(size));
  const file = path.join(OUT_DIR, `icon${size}.png`);
  fs.writeFileSync(file, png);
  console.log(`wrote ${file} (${png.length} bytes)`);
}
