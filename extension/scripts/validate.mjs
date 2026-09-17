#!/usr/bin/env node
/**
 * ToneCraft extension validator — gates store packaging.
 *
 * Usage:
 *   node extension/scripts/validate.mjs [chrome|firefox|edge|safari|all]
 *
 * Checks per target:
 *  - manifest.json parses and has all required MV3 keys
 *  - version format + store metadata lengths
 *  - every referenced file exists (background, content, popup, panel, options, icons)
 *  - permission allowlist (no <all_urls>, no tabs/debugger/proxy/history/bookmarks/…)
 *  - content-script matches stay within http/https (documented broad matching)
 *  - no dev URLs (localhost) in the packaged output
 *  - secret scan over packaged JS (api keys, private keys, tokens)
 *
 * Exits non-zero on the first failure class (all findings printed).
 */
import { readFileSync, statSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const [, , targetArg = "all"] = process.argv;
const TARGETS = ["chrome", "firefox", "edge", "safari"];
const targets = targetArg === "all" ? TARGETS : [targetArg];

const ALLOWED_PERMISSIONS = new Set(["storage", "contextMenus", "cookies", "sidePanel"]);
const FORBIDDEN_MATCHES = ["<all_urls>"];
const SECRET_PATTERNS = [
  /sk-(live|test)-[A-Za-z0-9]{8,}/,
  /sk_live_[A-Za-z0-9]+/,
  /xox[bap]-[A-Za-z0-9-]+/,
  /AKIA[0-9A-Z]{16}/,
  /gh[pousr]_[A-Za-z0-9]{20,}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /AIza[0-9A-Za-z_-]{20,}/,
  /DODO_PAYMENTS_API_KEY\s*=\s*["'][^"']+["']/,
];

let failures = 0;
function fail(target, message) {
  failures += 1;
  console.error(`[${target}] FAIL: ${message}`);
}
function ok(target, message) {
  console.log(`[${target}] ok: ${message}`);
}

function allFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) allFiles(full, out);
    else out.push(full);
  }
  return out;
}

for (const target of targets) {
  const dir = join(ROOT, "dist", `extension-${target}`);
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  } catch {
    fail(target, "manifest.json missing or unparsable");
    continue;
  }

  if (manifest.manifest_version !== 3) fail(target, "manifest_version must be 3");
  for (const key of ["name", "version", "description", "icons", "action", "permissions", "content_scripts", "background"]) {
    if (manifest[key] === undefined) fail(target, `missing manifest key: ${key}`);
  }
  if (!/^\d+(\.\d+){0,3}$/.test(manifest.version ?? "")) fail(target, "bad version format");
  if ((manifest.name ?? "").length > 45) fail(target, "name over 45 chars");
  if ((manifest.description ?? "").length > 132) fail(target, "description over 132 chars");

  for (const perm of manifest.permissions ?? []) {
    if (!ALLOWED_PERMISSIONS.has(perm)) fail(target, `unexpected permission: ${perm}`);
  }
  for (const pattern of (manifest.content_scripts ?? []).flatMap((cs) => cs.matches ?? [])) {
    if (FORBIDDEN_MATCHES.includes(pattern)) fail(target, `forbidden match pattern: ${pattern}`);
    if (!/^https?:\/\/\*\/\*$/.test(pattern)) fail(target, `unexpected content match: ${pattern}`);
  }

  const referenced = [
    ...(target === "firefox" || target === "safari"
      ? (manifest.background?.scripts ?? [])
      : [manifest.background?.service_worker]),
    ...((manifest.content_scripts ?? []).flatMap((cs) => cs.js ?? [])),
    manifest.action?.default_popup,
    manifest.options_page,
    manifest.side_panel?.default_path,
    manifest.sidebar_action?.default_panel,
    ...Object.values(manifest.icons ?? {}),
    ...Object.values(manifest.action?.default_icon ?? {}),
  ].filter(Boolean);
  for (const ref of new Set(referenced)) {
    if (!statSync(join(dir, ref), { throwIfNoEntry: false })) fail(target, `referenced file missing: ${ref}`);
  }

  const jsFiles = allFiles(dir).filter((f) => f.endsWith(".js"));
  let scannedBytes = 0;
  for (const file of jsFiles) {
    const content = readFileSync(file, "utf8");
    scannedBytes += content.length;
    if (/https?:\/\/(localhost|127\.0\.0\.1)/.test(content)) {
      fail(target, `dev URL in ${file}`);
    }
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(content)) fail(target, `possible secret (${pattern}) in ${file}`);
    }
  }
  ok(target, `manifest valid, ${referenced.length} refs resolve, ${jsFiles.length} JS files scanned (${scannedBytes} bytes)`);
}

if (failures > 0) {
  console.error(`${failures} validation failure(s).`);
  process.exit(1);
}
console.log("extension validation passed.");
