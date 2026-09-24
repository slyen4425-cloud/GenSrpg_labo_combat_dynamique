import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const required = [
  "README.md",
  "docs/LAB_CHARTE.md",
  "docs/LAB_ROADMAP.md",
  "docs/LAB_ARCHITECTURE.md",
  "docs/LAB_CHECKPOINT_POLICY.md",
  "src/contracts/README.md",
  "src/core/animation/README.md",
  "src/core/fx/README.md",
  "src/core/profiles/README.md",
  "src/adapters/renderer/README.md",
  "src/ui/README.md",
  "src/assets/README.md",
  "assets/test/README.md",
  "tests/unit/foundation.test.mjs"
];

const missing = required.filter((path) => !existsSync(path));
if (missing.length) {
  console.error("Missing required foundation files:", missing);
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}

const forbidden = [
  /from\s+["'][^"']*Zombicide-40k/i,
  /import\s*\([^)]*Zombicide-40k/i,
  /\.\.\/.*Zombicide-40k/i
];

for (const file of walk("src")) {
  const content = readFileSync(file, "utf8");
  for (const rule of forbidden) {
    if (rule.test(content)) {
      console.error(`Forbidden GenSrpG dependency detected in ${file}`);
      process.exit(1);
    }
  }
}

console.log("Foundation structure: OK");
