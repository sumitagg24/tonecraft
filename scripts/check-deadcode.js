#!/usr/bin/env node
/**
 * check-deadcode.js
 *
 * Finds "dead" source files — files under the scanned directories (by default
 * `src/components`, `src/hooks`, `src/stores`, `src/lib`) that are never
 * imported anywhere in the codebase (no static import, dynamic import,
 * require, or re-export). Exit code is non-zero when any are found so CI and
 * `npm run check:deadcode` fail automatically, catching regressions like the
 * old `ChatList.tsx` that sat unused for months.
 *
 * Usage:
 *   node scripts/check-deadcode.js            # scan components, hooks, stores, lib
 *   node scripts/check-deadcode.js --dir src/hooks   # scan a single directory
 *   node scripts/check-deadcode.js --quiet    # only print a summary
 *
 * The check is intentionally *conservative* — it only flags a file when zero
 * references exist. False "used" (a string that merely looks like an import)
 * is tolerated; false "unused" is not.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");

// Directories scanned by default. Config/framework auto-loaded files
// (next.config.ts, tailwind.config.ts, src/instrumentation.ts, src/proxy.ts)
// live outside these, so they never produce false positives.
const DEFAULT_DIRS = [
  path.join("src", "components"),
  path.join("src", "hooks"),
  path.join("src", "stores"),
  path.join("src", "lib"),
];

// Next.js convention files are auto-discovered by the framework and are never
// (and should never be) imported, so they're not candidates for "dead code".
const NEXT_CONVENTION_FILES = new Set([
  "page.tsx", "page.ts", "page.jsx", "page.js",
  "layout.tsx", "layout.ts", "layout.jsx", "layout.js",
  "loading.tsx", "loading.ts", "loading.jsx", "loading.js",
  "error.tsx", "error.ts", "error.jsx", "error.js",
  "global-error.tsx", "global-error.ts", "global-error.jsx", "global-error.js",
  "not-found.tsx", "not-found.ts", "not-found.jsx", "not-found.js",
  "route.ts", "route.js",
  "template.tsx", "template.ts", "template.jsx", "template.js",
  "default.tsx", "default.ts", "default.jsx", "default.js",
  "middleware.ts", "middleware.js", "middleware.tsx", "middleware.jsx",
  "proxy.ts", "proxy.js",
  "sitemap.ts", "sitemap.js", "robots.ts", "robots.js",
  "manifest.ts", "manifest.js", "icon.tsx", "icon.ts",
  "opengraph-image.tsx", "twitter-image.tsx", "apple-icon.tsx",
]);

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const CANDIDATE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

// Strip a leading "./", "../", "@/", or "@/…" alias so the specifier can be
// resolved against the importing file's directory / the src root.
function resolveSpecifier(specifier, fromDir) {
  const cleaned = specifier.replace(/^["']|["']$/g, "").trim();
  if (!cleaned || cleaned.startsWith("node:")) return null;
  if (cleaned.startsWith(".")) {
    return path.resolve(fromDir, cleaned);
  }
  if (cleaned.startsWith("@/")) {
    return path.resolve(SRC, cleaned.slice(2));
  }
  // Bare package specifiers (react, next, lucide-react, …) can't be local files.
  return null;
}

// If the resolved path has no extension, try the common source extensions
// (and the /index.* barrel form) so `import { X } from "./Widget"` matches
// `Widget.tsx` and `import Y from "@/components/foo"` matches `foo/index.tsx`.
function expandResolvedPath(resolved) {
  const candidates = [resolved];
  for (const ext of SOURCE_EXTENSIONS) {
    candidates.push(`${resolved}${ext}`);
  }
  for (const ext of SOURCE_EXTENSIONS) {
    candidates.push(path.join(resolved, `index${ext}`));
  }
  return new Set(candidates.map((p) => path.normalize(p)));
}

function collectSourceFiles() {
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
        walk(full);
      } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
        files.push(full);
      }
    }
  };
  walk(SRC);
  return files;
}

function extractImportSpecifiers(filePath) {
  const specifiers = new Set();
  const source = fs.readFileSync(filePath, "utf8");
  // Quote chars: double, single, and backtick (template-literal dynamic
  // imports like import(`@/components/x`) are matched too).
  const patterns = [
    /(?:^|\s)import\s*\(\s*(["'`])([^"'`]+)\1\s*\)/g,
    /(?:^|\s)import\s+(?:type\s+)?(?:[^"'`]*?\sfrom\s+)?(["'`])([^"'`]+)\1/g,
    /(?:^|\s)require\s*\(\s*(["'`])([^"'`]+)\1\s*\)/g,
    /(?:^|\s)export\s+(?:\*\s+from\s+|[\w\d_$,\s{}*]+\s+from\s+)(["'`])([^"'`]+)\1/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(source)) !== null) {
      specifiers.add(m[2]);
    }
  }
  return specifiers;
}

function collectCandidates(targetDir) {
  const candidates = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith(".")) continue;
        walk(full);
      } else {
        const ext = path.extname(entry.name);
        if (!CANDIDATE_EXTENSIONS.has(ext)) continue;
        if (NEXT_CONVENTION_FILES.has(entry.name)) continue;
        if (/\.(test|spec)\./.test(entry.name)) continue;
        if (entry.name.endsWith(".d.ts")) continue;
        candidates.push(path.normalize(full));
      }
    }
  };
  walk(targetDir);
  return candidates;
}

function main() {
  const args = process.argv.slice(2);
  const quiet = args.includes("--quiet");
  const dirFlagIndex = args.indexOf("--dir");

  let targetDirs;
  if (dirFlagIndex >= 0 && args[dirFlagIndex + 1]) {
    targetDirs = [path.resolve(ROOT, args[dirFlagIndex + 1])];
  } else {
    targetDirs = DEFAULT_DIRS.map((d) => path.join(ROOT, d));
  }
  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) {
      console.error(`check-deadcode: directory not found: ${dir}`);
      process.exit(2);
    }
  }

  const allFiles = collectSourceFiles();
  const byPath = new Set(allFiles.map((f) => path.normalize(f)));

  // index files: import { x } from "@/components/foo" resolves to foo/index.tsx
  const indexFiles = new Set(
    allFiles.filter((f) => path.basename(f, path.extname(f)) === "index")
  );

  // Every resolved local path that some import points at.
  const referenced = new Set();
  for (const file of allFiles) {
    for (const spec of extractImportSpecifiers(file)) {
      const fromDir = path.dirname(file);
      const resolved = resolveSpecifier(spec, fromDir);
      if (!resolved) continue;
      for (const candidate of expandResolvedPath(resolved)) {
        const norm = path.normalize(candidate);
        if (byPath.has(norm)) referenced.add(norm);
        // If a directory import (…/foo) was used, its index.* is referenced.
        for (const indexFile of indexFiles) {
          if (norm === path.dirname(indexFile)) referenced.add(indexFile);
        }
      }
    }
  }

  // Candidates: source files under the target dirs, excluding Next convention
  // files, tests, and definition files.
  const candidates = [];
  for (const dir of targetDirs) {
    candidates.push(...collectCandidates(dir));
  }

  const dead = candidates.filter((f) => !referenced.has(f));

  if (!quiet) {
    const label = targetDirs.map((d) => path.relative(ROOT, d)).join(", ");
    console.log(`check-deadcode: scanned ${candidates.length} files under ${label}`);
    if (dead.length === 0) {
      console.log("✓ no dead source files found — every file is imported somewhere.");
    } else {
      console.log(`✗ ${dead.length} dead source file(s) — never imported anywhere:`);
      for (const f of dead) console.log(`  - ${path.relative(ROOT, f)}`);
      console.log("\nDelete them (they're unused), or wire them up before committing.");
    }
  }

  process.exit(dead.length > 0 ? 1 : 0);
}

main();
