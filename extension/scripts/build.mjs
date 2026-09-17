#!/usr/bin/env node
/**
 * ToneCraft extension build — TypeScript → per-browser MV3 packages.
 *
 * Usage:
 *   node extension/scripts/build.mjs [chrome|firefox|edge|safari|all] [--dev]
 *
 * Reads the single source of truth (extension/manifest.base.json), bundles
 * with esbuild (zero runtime deps in the output), copies static assets, and
 * emits a valid, reviewable manifest.json per browser into:
 *   dist/extension-<target>/
 *
 * Release builds are minified with no sourcemaps. `--dev` keeps readable
 * output + sourcemaps for local debugging (never packaged for stores).
 */
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const EXT = join(ROOT, "extension");
const DIST = join(ROOT, "dist");

const [, , targetArg = "all", ...flags] = process.argv;
const DEV = flags.includes("--dev");
const TARGETS = ["chrome", "firefox", "edge", "safari"];
const targets = targetArg === "all" ? TARGETS : [targetArg];
for (const t of targets) {
  if (!TARGETS.includes(t)) {
    console.error(`Unknown target "${t}". Use one of: ${TARGETS.join(", ")}, all`);
    process.exit(1);
  }
}

const base = JSON.parse(readFileSync(join(EXT, "manifest.base.json"), "utf8"));

// Chrome version format: 1–4 dot-separated integers. Name ≤45, description ≤132.
if (!/^\d+(\.\d+){0,3}$/.test(base.version)) {
  console.error(`Invalid extension version "${base.version}" (Chrome requires dot-separated integers).`);
  process.exit(1);
}
if (base.name.length > 45) {
  console.error(`Extension name is ${base.name.length} chars (Chrome limit is 45).`);
  process.exit(1);
}
if (base.description.length > 132) {
  console.error(`Extension description is ${base.description.length} chars (Chrome limit is 132).`);
  process.exit(1);
}

const ENTRIES = {
  "background/serviceWorker.js": "src/background/serviceWorker.ts",
  "content/contentScript.js": "src/content/contentScript.ts",
  "popup/popup.js": "src/popup/popup.ts",
  "sidepanel/sidepanel.js": "src/sidepanel/sidepanel.ts",
  "options/options.js": "src/options/options.ts",
};

const STATIC = [
  ["src/popup/popup.html", "popup/popup.html"],
  ["src/popup/popup.css", "popup/popup.css"],
  ["src/sidepanel/sidepanel.html", "sidepanel/sidepanel.html"],
  ["src/sidepanel/sidepanel.css", "sidepanel/sidepanel.css"],
  ["src/options/options.html", "options/options.html"],
  ["src/options/options.css", "options/options.css"],
];

function manifestFor(target) {
  const common = {
    manifest_version: 3,
    name: base.name,
    version: base.version,
    description: base.description,
    homepage_url: base.homepage,
    icons: base.icons,
    action: {
      default_popup: "popup/popup.html",
      default_title: base.name,
      default_icon: base.icons,
    },
    options_page: "options/options.html",
    permissions: base.permissions,
    host_permissions: base.hostPermissions,
    content_scripts: [
      {
        matches: base.contentMatches,
        js: ["content/contentScript.js"],
        run_at: "document_idle",
        all_frames: false,
      },
    ],
    commands: {
      "tc-open-panel": {
        suggested_key: { default: base.commands["tc-open-panel"].suggested_key },
        description: base.commands["tc-open-panel"].description,
      },
    },
  };
  if (target === "firefox" || target === "safari") {
    return {
      ...common,
      background: { scripts: ["background/serviceWorker.js"], type: "module" },
      sidebar_action: {
        default_title: base.name,
        default_panel: "sidepanel/sidepanel.html",
        default_icon: base.icons,
      },
      ...(target === "firefox"
        ? { browser_specific_settings: { gecko: { id: "tonecraft@tonecraft.site", strict_min_version: "109.0" } } }
        : {}),
    };
  }
  return {
    ...common,
    minimum_chrome_version: "114",
    background: { service_worker: "background/serviceWorker.js", type: "module" },
    side_panel: { default_path: "sidepanel/sidepanel.html" },
  };
}

for (const target of targets) {
  const outdir = join(DIST, `extension-${target}`);
  rmSync(outdir, { recursive: true, force: true });
  mkdirSync(outdir, { recursive: true });

  for (const [out, entry] of Object.entries(ENTRIES)) {
    const isWorker = out.startsWith("background/");
    await build({
      entryPoints: [join(EXT, entry)],
      outfile: join(outdir, out),
      bundle: true,
      minify: !DEV,
      sourcemap: DEV,
      format: isWorker ? "esm" : "iife",
      platform: "browser",
      target: "es2022",
      logLevel: "warning",
      legalComments: "none",
    });
  }

  for (const [from, to] of STATIC) {
    const src = join(EXT, from);
    if (!existsSync(src)) {
      console.error(`Missing static asset: ${from}`);
      process.exit(1);
    }
    mkdirSync(dirname(join(outdir, to)), { recursive: true });
    cpSync(src, join(outdir, to));
  }

  mkdirSync(join(outdir, "icons"), { recursive: true });
  cpSync(join(EXT, "icons"), join(outdir, "icons"), { recursive: true });

  writeFileSync(join(outdir, "manifest.json"), JSON.stringify(manifestFor(target), null, 2) + "\n");
  console.log(`built dist/extension-${target} (v${base.version}${DEV ? ", dev" : ""})`);
}
