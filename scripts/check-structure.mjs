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
  "docs/LAB_COMBAT_MODEL_V1.md",
  "src/contracts/README.md",
  "src/contracts/combat-visual-event.js",
  "src/contracts/visual-actor.js",
  "src/contracts/skill-definition.js",
  "src/contracts/combat-command-definition.js",
  "src/core/animation/README.md",
  "src/core/animation/animation-plan.js",
  "src/core/combat/distance.js",
  "src/core/combat/combat-state.js",
  "src/core/combat/combat-timing.js",
  "src/core/combat/combat-runtime.js",
  "src/core/combat/combat-session.js",
  "src/core/combat/action-resolver.js",
  "src/core/combat/command-resolver.js",
  "src/core/fx/README.md",
  "src/core/fx/skill-fx-plan.js",
  "src/core/profiles/README.md",
  "src/core/profiles/profile-registry.js",
  "src/adapters/renderer/README.md",
  "src/adapters/renderer/dom-keyframes.js",
  "src/adapters/renderer/dom-actor-renderer.js",
  "src/adapters/renderer/dom-distance-presenter.js",
  "src/adapters/renderer/combat-resolution-presenter.js",
  "src/adapters/renderer/dom-skill-fx.js",
  "src/ui/README.md",
  "src/ui/demo-app.js",
  "src/ui/combat-test-ui.js",
  "src/assets/README.md",
  "src/assets/image-source-manager.js",
  "data/profiles/serpentine.profile.json",
  "data/profiles/drake.profile.json",
  "data/combat/fighters/maraileron.combat.json",
  "data/combat/fighters/braisombre.combat.json",
  "data/combat/skills/fireball.skill.json",
  "data/combat/skills/mirror-shield.skill.json",
  "data/combat/skills/fire-immunity.skill.json",
  "data/combat/skills/contact-counter.skill.json",
  "data/combat/skills/claw.skill.json",
  "data/combat/skills/aerial-dive.skill.json",
  "data/combat/skills/teleport-strike.skill.json",
  "data/combat/skills/dodge.skill.json",
  "data/combat/skills/stun-bolt.skill.json",
  "data/combat/commands/item.command.json",
  "data/combat/commands/recall.command.json",
  "data/combat/commands/summon.command.json",
  "assets/test/README.md",
  "assets/test/creatures/README.md",
  "assets/test/creatures/maraileron/maraileron.meta.json",
  "assets/test/creatures/maraileron/runtime/maraileron_player.webp",
  "assets/test/creatures/maraileron/runtime/maraileron_opponent.webp",
  "assets/test/creatures/maraileron/runtime/maraileron_icon.webp",
  "assets/test/creatures/braisombre/braisombre.meta.json",
  "assets/test/creatures/braisombre/runtime/braisombre_player.webp",
  "assets/test/creatures/braisombre/runtime/braisombre_opponent.webp",
  "assets/test/creatures/braisombre/runtime/braisombre_icon.webp",
  "examples/dom-demo/index.html",
  "examples/dom-demo/demo.css",
  "examples/dom-demo/demo.js",
  "examples/dom-demo/README.md",
  "tests/unit/foundation.test.mjs",
  "tests/unit/contracts-and-planner.test.mjs",
  "tests/unit/dom-renderer.test.mjs",
  "tests/unit/image-source-manager.test.mjs",
  "tests/unit/demo-ui-boundary.test.mjs",
  "tests/unit/combat-rules.test.mjs",
  "tests/unit/combat-timing.test.mjs",
  "tests/unit/combat-command.test.mjs",
  "tests/unit/dom-distance-presenter.test.mjs",
  "tests/unit/combat-resolution-presenter.test.mjs",
  "tests/unit/skill-fx.test.mjs",
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

  if (file.startsWith(join("src", "core", "animation"))) {
    if (/from\s+["'][^"']*(?:\.\.\/combat\/|core\/combat\/)/.test(fileContent)) {
      fail(`Animation-to-combat boundary violation detected in ${file}`);
    }
  }

  if (file.startsWith(join("src", "core", "combat"))) {
    if (/from\s+["'][^"']*(?:animation|fx|profiles|adapters|ui|assets)\//.test(fileContent)) {
      fail(`Combat rules boundary violation detected in ${file}`);
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
