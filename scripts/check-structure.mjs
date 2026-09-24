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
  "docs/LAB_RENDERER_V1.md",
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
  "src/adapters/renderer/dom-keyframes.js",
  "src/adapters/renderer/dom-actor-renderer.js",
  "src/ui/README.md",
  "src/ui/demo-app.js",
  "src/assets/README.md",
  "src/assets/image-source-manager.js",
  "data/profiles/serpentine.profile.json",
  "data/profiles/drake.profile.json",
  "assets/test/README.md",
  "assets/test/creatures/README.md",
  "assets/test/creatures/maraileron/maraileron.meta.json",
  "assets/test/creatures/braisombre/braisombre.meta.json",
  "examples/dom-demo/index.html",
  "examples/dom-demo/demo.css",
  "examples/dom-demo/demo.js",
  "examples/dom-demo/README.md",
  "tests/unit/foundation.test.mjs",
  "tests/unit/contracts-and-planner.test.mjs",
  "tests/unit/dom-renderer.test.mjs",
  "tests/unit/image-source-manager.test.mjs",
  "tests/unit/demo-ui-boundary.test.mjs"
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

const forbiddenProjectDependencies = [
  /from\s+["'][^"']*Zombicide-40k/i,
  /import\s*\([^)]*Zombicide-40k/i,
  /\.\.\/.*Zombicide-40k/i,
  /slyen4425-cloud\/Zombicide-40k/i
];

function fail(message) {
  console.error(message);
  process.exit(1);
}

for (const file of walk("src")) {
  const fileContent = readFileSync(file, "utf8");

  for (const rule of forbiddenProjectDependencies) {
    if (rule.test(fileContent)) {
      fail(`Forbidden GenSrpG dependency detected in ${file}`);
    }
  }

  if (file.startsWith(join("src", "core"))) {
    if (/from\s+["'][^"']*\.\.\/\.\.\/(?:adapters|ui|assets)\//.test(fileContent)) {
      fail(`Core boundary violation detected in ${file}`);
    }
  }

  if (file.startsWith(join("src", "contracts"))) {
    if (/from\s+["'][^"']*\.\.\/(?:core|adapters|ui|assets)\//.test(fileContent)) {
      fail(`Contract boundary violation detected in ${file}`);
    }
  }

  if (file.startsWith(join("src", "adapters"))) {
    if (/from\s+["'][^"']*\.\.\/\.\.\/ui\//.test(fileContent)) {
      fail(`Renderer-to-UI boundary violation detected in ${file}`);
    }
  }
}

for (const file of walk("examples")) {
  const fileContent = readFileSync(file, "utf8");
  for (const rule of forbiddenProjectDependencies) {
    if (rule.test(fileContent)) {
      fail(`Forbidden GenSrpG dependency detected in example ${file}`);
    }
  }
}

console.log("Laboratory structure, boundaries and independence guards: OK");
