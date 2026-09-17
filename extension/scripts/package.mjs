#!/usr/bin/env node
/**
 * ToneCraft extension packager — dist/* → store-ready ZIPs.
 *
 * Usage:
 *   node extension/scripts/package.mjs [chrome|firefox|edge|safari|all]
 *
 * Writes:
 *   release/chrome/tonecraft-extension-chrome-vX.Y.Z.zip
 *   release/firefox/tonecraft-extension-firefox-vX.Y.Z.zip
 *   ...
 *
 * The ZIP root contains the extension files directly (no outer directory).
 * Zero dependencies: STORE-method (uncompressed) ZIP writer — valid archives
 * that every store dashboard accepts; extension code ships minified already.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32 } from "node:zlib";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const EXT = join(ROOT, "extension");

const [, , targetArg = "all"] = process.argv;
const TARGETS = ["chrome", "firefox", "edge", "safari"];
const targets = targetArg === "all" ? TARGETS : [targetArg];
for (const t of targets) {
  if (!TARGETS.includes(t)) {
    console.error(`Unknown target "${t}".`);
    process.exit(1);
  }
}

const { version } = JSON.parse(readFileSync(join(EXT, "manifest.base.json"), "utf8"));

function collect(dir, out = []) {
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) collect(full, out);
    else out.push(full);
  }
  return out;
}

/** Minimal STORE zip: local headers + central directory, UTF-8 names. */
function writeZip(files, zipPath) {
  const chunks = [];
  const central = [];
  let offset = 0;
  const enc = new TextEncoder();
  for (const { name, data } of files) {
    const nameBuf = Buffer.from(enc.encode(name));
    const crc = Number(crc32(data)) >>> 0;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 8); // UTF-8
    local.writeUInt16LE(0, 10); // STORE
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    chunks.push(local, nameBuf, data);
    central.push({ nameBuf, crc, size: data.length, offset });
    offset += local.length + nameBuf.length + data.length;
  }
  const centralStart = offset;
  let centralSize = 0;
  for (const e of central) {
    const head = Buffer.alloc(46);
    head.writeUInt32LE(0x02014b50, 0);
    head.writeUInt16LE(20, 6);
    head.writeUInt16LE(0x0800, 8);
    head.writeUInt16LE(0, 10);
    head.writeUInt32LE(e.crc, 14);
    head.writeUInt32LE(e.size, 18);
    head.writeUInt32LE(e.size, 22);
    head.writeUInt16LE(e.nameBuf.length, 28);
    head.writeUInt32LE(e.offset, 42);
    chunks.push(head, e.nameBuf);
    centralSize += head.length + e.nameBuf.length;
  }
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(central.length, 8);
  end.writeUInt16LE(central.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(centralStart, 16);
  chunks.push(end);
  mkdirSync(dirname(zipPath), { recursive: true });
  writeFileSync(zipPath, Buffer.concat(chunks));
}

for (const target of targets) {
  const dir = join(ROOT, "dist", `extension-${target}`);
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) {
    console.error(`Missing build output ${dir} — run build.mjs ${target} first.`);
    process.exit(1);
  }
  const files = collect(dir).map((full) => ({
    name: relative(dir, full).split(sep).join("/"),
    data: readFileSync(full),
  }));
  if (!files.some((f) => f.name === "manifest.json")) {
    console.error(`No manifest.json in ${dir}.`);
    process.exit(1);
  }
  const zipName = `tonecraft-extension-${target}-v${version}.zip`;
  const zipPath = join(ROOT, "release", target, zipName);
  rmSync(zipPath, { force: true });
  writeZip(files, zipPath);
  console.log(`wrote ${zipPath} (${files.length} files)`);
}
