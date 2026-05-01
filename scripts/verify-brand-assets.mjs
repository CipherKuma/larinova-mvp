#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const root = process.cwd();

const canonical = {
  darkIcon: "ops/brand/logos/dark-mode-icon-only.png",
  darkText: "ops/brand/logos/dark-mode-icon-text.png",
  lightIcon: "ops/brand/logos/light-mode-icon-only.png",
  lightText: "ops/brand/logos/light-mode-icon-text.png",
};

const exactCopies = {
  darkIcon: [
    "app/public/shared/dark-mode-icon-only.png",
    "app/public/shared/larinova-icon-dark.png",
    "landing/public/dark-mode-icon-only.png",
    "landing/public/larinova-icon-dark.png",
  ],
  darkText: [
    "app/public/shared/dark-mode-icon-text.png",
    "app/public/shared/larinova-logo-dark.png",
    "app/public/shared/larinova-logo-dark@2x.png",
    "landing/public/dark-mode-icon-text.png",
    "landing/public/larinova-logo-dark.png",
    "landing/public/larinova-logo-dark@2x.png",
    "ops/logo-gen/larinova-logo-dark.png",
    "ops/logo-gen/larinova-logo-dark@2x.png",
    "ops/sales/sundar-pitch/assets/dark-mode-icon-text.png",
    "ops/sales/sundar-pitch/assets/larinova-wordmark.png",
  ],
  lightIcon: [
    "app/public/shared/light-mode-icon-only.png",
    "app/public/shared/larinova-icon.png",
    "landing/public/light-mode-icon-only.png",
    "landing/public/larinova-icon.png",
    "ops/logo-gen/larinova-icon.png",
    "ops/sales/sundar-pitch/assets/light-mode-icon-only.png",
    "ops/sales/sundar-pitch/assets/larinova-icon.png",
    "ops/media/demo-video/public/assets/larinova-icon.png",
  ],
  lightText: [
    "app/public/shared/light-mode-icon-text.png",
    "app/public/shared/larinova-logo-light.png",
    "app/public/shared/larinova-logo-light@2x.png",
    "landing/public/light-mode-icon-text.png",
    "landing/public/larinova-logo-light.png",
    "landing/public/larinova-logo-light@2x.png",
    "ops/logo-gen/larinova-logo-light.png",
    "ops/logo-gen/larinova-logo-light@2x.png",
    "ops/media/demo-video/public/assets/larinova-logo-light@2x.png",
  ],
};

const generatedBrandFiles = [
  "app/app/icon.png",
  "landing/src/app/icon.png",
  "landing/src/app/apple-icon.png",
  "app/public/icons/apple-touch-icon-180.png",
  "app/public/icons/icon-192.png",
  "app/public/icons/icon-512.png",
  "app/public/icons/icon-maskable-512.png",
  "patient-portal/app/favicon.ico",
];

const forbiddenPaths = [
  "app/app/icon.svg",
  "landing/src/app/icon.svg",
  "landing/src/app/apple-icon.tsx",
  "ops/logo-gen/dark-ring-icon.html",
  "ops/logo-gen/dark.html",
  "ops/logo-gen/light.html",
  "ops/logo-gen/hf-dark-landscape.png",
  "ops/logo-gen/hf-dark-landscape-v2.png",
  "ops/logo-gen/hf-dark-landscape-v3.png",
  "ops/logo-gen/hf-light-landscape.png",
  "ops/logo-gen/larinova-icon-dark-ring.png",
];

const sourceExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".jsx",
  ".json",
  ".mjs",
  ".ts",
  ".tsx",
]);

const ignoredDirs = new Set([
  ".git",
  ".next",
  "node_modules",
  "test-results",
  "playwright-report",
]);

const forbiddenSourcePatterns = [
  /larinova-icon\.png/,
  /larinova-icon-dark\.png/,
  /larinova-logo-(?:dark|light)(?:@2x)?\.png/,
  /logo-gen\//,
  /hf-dark-landscape/,
  /hf-light-landscape/,
  /dark-ring-icon/,
  /larinova-icon-dark-ring/,
  /src\/app\/icon\.svg/,
  /app\/icon\.svg/,
  /apple-icon\.tsx/,
  /assets\/larinova-icon\.png/,
  /assets\/larinova-wordmark\.png/,
];

function fail(message) {
  failures.push(message);
}

function fullPath(relativePath) {
  return join(root, relativePath);
}

function sha256(relativePath) {
  return createHash("sha256").update(readFileSync(fullPath(relativePath))).digest("hex");
}

function listSourceFiles(dir, output = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) {
      listSourceFiles(absolute, output);
      continue;
    }
    if (entry.isFile() && sourceExtensions.has(extname(entry.name))) {
      output.push(absolute);
    }
  }
  return output;
}

function relative(absolutePath) {
  return absolutePath.slice(root.length + 1);
}

const failures = [];

for (const [name, relativePath] of Object.entries(canonical)) {
  if (!existsSync(fullPath(relativePath))) {
    fail(`Missing canonical ${name}: ${relativePath}`);
  }
}

for (const relativePath of forbiddenPaths) {
  if (existsSync(fullPath(relativePath))) {
    fail(`Forbidden old brand asset still exists: ${relativePath}`);
  }
}

for (const relativePath of generatedBrandFiles) {
  if (!existsSync(fullPath(relativePath))) {
    fail(`Missing generated brand file: ${relativePath}`);
  }
}

for (const [kind, paths] of Object.entries(exactCopies)) {
  if (!existsSync(fullPath(canonical[kind]))) continue;
  const expected = sha256(canonical[kind]);
  for (const relativePath of paths) {
    if (!existsSync(fullPath(relativePath))) {
      fail(`Missing ${kind} copy: ${relativePath}`);
      continue;
    }
    if (statSync(fullPath(relativePath)).size === 0) {
      fail(`Empty ${kind} copy: ${relativePath}`);
      continue;
    }
    const actual = sha256(relativePath);
    if (actual !== expected) {
      fail(`${relativePath} is not synced from ${canonical[kind]}`);
    }
  }
}

for (const absolute of listSourceFiles(root)) {
  const relativePath = relative(absolute);
  if (relativePath === "scripts/verify-brand-assets.mjs") continue;
  const text = readFileSync(absolute, "utf8");
  for (const pattern of forbiddenSourcePatterns) {
    if (pattern.test(text)) {
      fail(`Forbidden brand reference ${pattern} in ${relativePath}`);
    }
  }
}

if (failures.length > 0) {
  console.error("Brand asset verification failed:");
  for (const item of failures) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Brand asset verification passed.");
