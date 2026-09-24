import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const required = [
  "README.md",
  "docs/LAB_CHARTE.md",
  "docs/LAB_ROADMAP.md",
  "docs/LAB_ARCHITECTURE.md",
  "docs/LAB_CHECKPOINT_POLICY.md",
  "docs/LAB_CURRENT_WORK.md",
  "docs/LAB_CONTRACTS_V1.md",
  "src/contracts/README.md",
  "src/contracts/combat-visual-event.js",
  "src/contracts/visual-actor.js",
  "src/core/animation/README.md",
  "src/core/animation/animation-plan.js",
  "src/core/animation/plan-animation.js",
  "src/core/fx/README.md",
  "src/core/profiles/README.md",
  "src/core/profiles/profile-registry.js",
  "src/adapters/renderer/README.md",
  "src/ui/README.md",
  "src/assets/README.md",
  "data/profiles/serpentine.profile.json",
  "data/profiles/drake.profile.json",
  "assets/test/README.md",
  "assets/test/creatures/README.md",
  "assets/test/creatures/maraileron/maraileron.meta.json",
  "assets/test/creatures/braisombre/braisombre.meta.json",
  "tests/unit/foundation.test.mjs",
  "tests/unit/contracts-and-planner.test.mjs"
];

const missing = required.filter((path) => !existsSync(path));
if (missing.length) {
  console.error("Missing required laboratory files:", missing);
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
  const fileContent = readFileSync(file, "utf8");
  for (const rule of forbidden) {
    if (rule.test(fileContent)) {
      console.error(`Forbidden GenSrpG dependency detected in ${file}`);
      process.exit(1);
    }
  }
}

console.log("Laboratory structure and independence guards: OK");
