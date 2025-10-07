#!/usr/bin/env node
/* Supply-chain guard: abort if known compromised versions appear */
const fs = require("fs");
const path = require("path");

// Support npm (package-lock.json) and pnpm (pnpm-lock.yaml)
const lockPaths = ["package-lock.json", "pnpm-lock.yaml"]
  .map((f) => path.join(process.cwd(), f))
  .filter((p) => fs.existsSync(p));
if (!lockPaths.length) {
  console.log("[supply-chain] No lockfile found, skipping");
  process.exit(0);
}
const text = lockPaths
  .map((p) => fs.readFileSync(p, "utf8"))
  .join("\n---LOCK_SEPARATOR---\n");
// Map of package -> forbidden versions
const banned = {
  backslash: ["0.2.1"],
  "chalk-template": ["1.1.1"],
  "supports-hyperlinks": ["4.1.1"],
  "has-ansi": ["6.0.1"],
  "simple-swizzle": ["0.2.3"],
  "color-string": ["2.1.1"],
  "error-ex": ["1.3.3"],
  "color-name": ["2.0.1"],
  "is-arrayish": ["0.3.3"],
  "slice-ansi": ["7.1.1"],
  "color-convert": ["3.1.1"],
  "wrap-ansi": ["9.0.1"],
  "ansi-regex": ["6.2.1"],
  "supports-color": ["10.2.1"],
  "strip-ansi": ["7.1.1"],
  chalk: ["5.6.1"],
  debug: ["4.4.2"],
  "ansi-styles": ["6.2.2"],
};

const hits = [];
// Structured parse for npm lockfile (reduces false positives)
const npmLockPath = lockPaths.find((p) => p.endsWith("package-lock.json"));
let parsedOk = false;
let scannedPkgs = new Set();
if (npmLockPath) {
  try {
    const json = JSON.parse(fs.readFileSync(npmLockPath, "utf8"));
    if (json.packages && typeof json.packages === "object") {
      for (const [pkgPath, meta] of Object.entries(json.packages)) {
        if (
          !pkgPath.includes("node_modules") ||
          !meta ||
          typeof meta !== "object"
        )
          continue;
        const parts = pkgPath.split("/");
        // Extract the last package name in the path after node_modules chains
        let name = null;
        for (let i = 0; i < parts.length; i++) {
          if (parts[i] === "node_modules") {
            const next = parts[i + 1];
            if (!next) continue;
            if (next.startsWith("@")) {
              const following = parts[i + 2];
              if (!following) continue;
              name = `${next}/${following}`;
              i++; // advance
            } else {
              name = next;
            }
          }
        }
        if (!name) continue;
        const version = meta.version;
        if (banned[name] && banned[name].includes(version)) {
          hits.push(`${name}@${version}`);
        }
        scannedPkgs.add(name);
      }
      parsedOk = true;
    } else if (json.dependencies) {
      const walk = (deps) => {
        for (const [name, info] of Object.entries(deps)) {
          if (!info) continue;
          const version = info.version;
          if (banned[name] && banned[name].includes(version)) {
            hits.push(`${name}@${version}`);
          }
          scannedPkgs.add(name);
          if (info.dependencies) walk(info.dependencies);
        }
      };
      walk(json.dependencies);
      parsedOk = true;
    }
  } catch (e) {
    console.warn(
      "[supply-chain] Failed to parse package-lock.json, falling back to regex heuristics"
    );
  }
}
// Fallback / pnpm pattern scan for any remaining packages
for (const [pkg, versions] of Object.entries(banned)) {
  for (const v of versions) {
    if (scannedPkgs.has(pkg)) continue; // already assessed
    const pnpmPattern = new RegExp(
      `/${pkg.replace(/[-/\\^$*+?.()|[\]{}]/g, (r) => "\\" + r)}@${v}(?:[:\n])`
    );
    if (pnpmPattern.test(text)) hits.push(`${pkg}@${v}`);
  }
}
if (hits.length) {
  const soft = process.env.SUPPLY_CHAIN_SOFT === "1";
  const header = soft ? "[SUPPLY-CHAIN WARNING]" : "[SUPPLY-CHAIN BLOCKED]";
  const msg = `\n${header} Forbidden versions detected:\n - ${hits.join("\n - ")}`;
  if (soft) {
    console.warn(msg + "\n(soft mode)");
  } else {
    console.error(msg + "\nAborting install.");
    process.exit(1);
  }
} else {
  console.log("[supply-chain] OK (no banned versions)");
}
