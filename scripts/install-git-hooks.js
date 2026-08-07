#!/usr/bin/env node
/**
 * install-git-hooks.js
 *
 * Points git at the committed hook templates in `.githooks/` via
 * `core.hooksPath`, so every contributor gets the same local hooks and edits
 * to the templates apply immediately (no stale copies to re-install).
 *
 * Wired into `npm run install:hooks` and the `prepare` script — running
 * `npm install` / `npm ci` installs the hooks automatically.
 *
 * This is intentionally non-fatal: a local hook is never worth breaking
 * someone's install over, so any failure prints a warning and exits 0.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const HOOKS_REL = path.relative(ROOT, path.join(ROOT, ".githooks")) || ".githooks";

function install() {
  if (!fs.existsSync(path.join(ROOT, ".git"))) {
    console.log("install-git-hooks: not a git repo, skipping.");
    return;
  }
  if (!fs.existsSync(path.join(ROOT, ".githooks"))) {
    console.log("install-git-hooks: no .githooks directory, nothing to install.");
    return;
  }
  // core.hooksPath expects a path relative to the repo root (or absolute).
  execSync(`git config core.hooksPath "${HOOKS_REL}"`, { cwd: ROOT, stdio: "ignore" });
  console.log(`install-git-hooks: git hooks enabled from .githooks/ (core.hooksPath).`);
}

try {
  install();
} catch (err) {
  console.warn(`install-git-hooks: could not configure git hooks (${err.message}) — continuing.`);
}
