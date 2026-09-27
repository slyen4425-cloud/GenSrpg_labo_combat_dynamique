import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { normalizeBattleFormatDefinition } from "../../src/contracts/battle-format-definition.js";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";
import { createBattleActorAiController } from "../../src/core/combat/battle-actor-ai-controller.js";
import {
  isSkillTargetAllowed,
  targetRelation
} from "../../src/core/combat/targeting.js";

async function json(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const rawFormat = await json(
  "data/combat/battle-formats/demo-coop-2v2.format.json"
);
const format = normalizeBattleFormatDefinition(rawFormat);

test("coop 2v2 battle format declares two active actors per team and one local controller", () => {
  assert.equal(format.id, "coop-2v2-lab-v1");
  assert.equal(format.localActorId, "player");
  assert.deepEqual(format.teams.players, ["player", "ally"]);
  assert.deepEqual(format.teams.enemies, ["opponent", "opponent-b"]);
  assert.equal(format.actors.length, 4);
  assert.equal(format.actor("player").controllerId, "human-local");
  assert.equal(format.actor("ally").controllerId, "ai-ally");
});

test("target relation distinguishes self ally and enemy", () => {
  assert.equal(
    targetRelation({ format, actorId: "player", targetId: "player" }),
    "self"
  );
  assert.equal(
    targetRelation({ format, actorId: "player", targetId: "ally" }),
    "ally"
  );
  assert.equal(
    targetRelation({ format, actorId: "player", targetId: "opponent-b" }),
    "enemy"
  );
});

test("offensive skills default to enemy-only targeting while support relations are explicit", () => {
  const offensive = normalizeSkillDefinition({
    id: "test-hit",
    name: "Test hit",
    category: "offensive",
    form: "contact",
    energyCost: 1,
    preparationMs: 0,
    travelMs: 0,
    recoveryMs: 0,
    effect: { damage: 1 }
  });
  assert.deepEqual(offensive.targetRelations, ["enemy"]);
  assert.equal(
    isSkillTargetAllowed({
      format,
      actorId: "player",
      targetId: "opponent",
      skill: offensive
    }).ok,
    true
  );
  assert.equal(
    isSkillTargetAllowed({
      format,
      actorId: "player",
      targetId: "ally",
      skill: offensive
    }).ok,
    false
  );

  const support = normalizeSkillDefinition({
    id: "test-support",
    name: "Test support",
    category: "buff_debuff",
    form: "aura",
    targetRelations: ["ally", "self"],
    energyCost: 1,
    preparationMs: 0,
    travelMs: 0,
    recoveryMs: 0,
    effect: { damage: 0 }
  });
  assert.equal(
    isSkillTargetAllowed({
      format,
      actorId: "player",
      targetId: "ally",
      skill: support
    }).ok,
    true
  );
});

test("generic actor AI can drive an ally against one of two enemy actors", async () => {
  const fighter = {
    maxHp: 100,
    initialHp: 100,
    maxEnergy: 10,
    initialEnergy: 10,
    energyChargeAmount: 1,
    energyChargeIntervalMs: 2000,
    movementEnergyPerStep: 0,
    chargeTimeModifierPct: 0
  };
  const skill = normalizeSkillDefinition({
    id: "ai-hit",
    name: "AI hit",
    category: "offensive",
    form: "contact",
    targetRelations: ["enemy"],
    allowedDistances: ["short", "medium", "long"],
    energyCost: 1,
    preparationMs: 0,
    travelMs: 100,
    recoveryMs: 0,
    effect: { damage: 10 }
  });

  const session = createCombatSession({
    fighters: [
      { ...fighter, id: "player" },
      { ...fighter, id: "ally" },
      { ...fighter, id: "opponent" },
      { ...fighter, id: "opponent-b" }
    ]
  });
  const runtime = createCombatRuntime({
    session,
    now: () => 0,
    setTimer: () => 1,
    clearTimer: () => {}
  });
  const ai = createBattleActorAiController({
    session,
    runtime,
    actorId: "ally",
    targetIds: ["opponent", "opponent-b"],
    skillIds: ["ai-hit"],
    skillsById: { "ai-hit": skill }
  });

  const decision = ai.takeTurn();
  assert.equal(decision.status, "skill_started");
  assert.equal(decision.actorId, "ally");
  assert.equal(decision.targetId, "opponent");
  assert.equal(runtime.activeActionFor("ally").targetId, "opponent");

  runtime.dispose();
});

test("coop AI commits to its next planned technique and saves instead of falling back to a cheaper move", () => {
  const fighter = {
    maxHp: 100,
    initialHp: 100,
    maxEnergy: 10,
    initialEnergy: 2,
    energyChargeAmount: 1,
    energyChargeIntervalMs: 2000,
    movementEnergyPerStep: 0,
    chargeTimeModifierPct: 0
  };

  const strong = normalizeSkillDefinition({
    id: "strong-hit",
    name: "Strong hit",
    category: "offensive",
    form: "projectile",
    targetRelations: ["enemy"],
    allowedDistances: ["short", "medium", "long"],
    energyCost: 3,
    preparationMs: 0,
    travelMs: 100,
    recoveryMs: 0,
    effect: { damage: 20 }
  });
  const quick = normalizeSkillDefinition({
    id: "quick-hit",
    name: "Quick hit",
    category: "offensive",
    form: "contact",
    targetRelations: ["enemy"],
    allowedDistances: ["short", "medium", "long"],
    energyCost: 2,
    preparationMs: 0,
    travelMs: 100,
    recoveryMs: 0,
    effect: { damage: 10 }
  });

  const session = createCombatSession({
    fighters: [
      { ...fighter, id: "ally" },
      { ...fighter, id: "opponent" }
    ]
  });
  const runtime = createCombatRuntime({
    session,
    now: () => 0,
    setTimer: () => 1,
    clearTimer: () => {}
  });
  const ai = createBattleActorAiController({
    session,
    runtime,
    actorId: "ally",
    targetIds: ["opponent"],
    skillIds: ["strong-hit", "quick-hit"],
    skillsById: {
      "strong-hit": strong,
      "quick-hit": quick
    }
  });

  const saving = ai.takeTurn();
  assert.equal(saving.status, "saving");
  assert.equal(saving.skillId, "strong-hit");
  assert.equal(saving.requiredEnergy, 3);
  assert.equal(runtime.activeActionFor("ally"), null);

  session.advanceMs(2000);
  const strongDecision = ai.takeTurn();
  assert.equal(strongDecision.status, "skill_started");
  assert.equal(strongDecision.skillId, "strong-hit");
  assert.equal(ai.snapshot().nextSkillId, "quick-hit");

  runtime.cancelActive("ally");
  session.advanceMs(4000);
  const quickDecision = ai.takeTurn();
  assert.equal(quickDecision.status, "skill_started");
  assert.equal(quickDecision.skillId, "quick-hit");

  runtime.dispose();
});


test("coop 2v2 page keeps one local ability bar and four selectable actors", async () => {
  const html = await readFile("examples/dom-demo/coop-2v2.html", "utf8");
  const source = await readFile("src/ui/combat-2v2-test-ui.js", "utf8");
  const visualSource = await readFile("src/ui/demo-app.js", "utf8");
  const presenter = await readFile(
    "src/adapters/renderer/combat-resolution-presenter.js",
    "utf8"
  );

  assert.equal(
    (html.match(/data-demo-slot=/g) ?? []).length,
    4
  );
  assert.equal(
    (html.match(/data-combat-skills/g) ?? []).length,
    1
  );
  assert.match(html, /data-demo-slot="ally"/);
  assert.match(html, /data-demo-slot="opponent-b"/);
  assert.match(html, /data-target-actor="ally"/);
  assert.match(html, /data-target-actor="opponent-b"/);
  assert.match(source, /format\.localActorId/);
  assert.match(source, /isSkillTargetAllowed/);
  assert.match(source, /createBattleActorAiController/);
  assert.match(source, /actorId: "ally"/);
  assert.match(source, /actorId: "opponent-b"/);
  assert.match(visualSource, /querySelectorAll\("\[data-demo-slot\]"\)/);
  assert.match(visualSource, /targetFor\(slot, targetSlot\)/);
  assert.match(presenter, /targetSlot,\s*onPhase/);
});

test("coop 2v2 CSS gives four distinct actor positions and lightweight squad cards", async () => {
  const css = await readFile("examples/dom-demo/demo.css", "utf8");

  assert.match(
    css,
    /\.arena--coop-2v2 \.fighter--player\s*\{[\s\S]*?left:\s*26%/
  );
  assert.match(
    css,
    /\.arena--coop-2v2 \.fighter--ally\s*\{[\s\S]*?left:\s*58%/
  );
  assert.match(
    css,
    /\.arena--coop-2v2 \.fighter--opponent\s*\{[\s\S]*?top:\s*31%[\s\S]*?left:\s*74%[\s\S]*?width:\s*min\(31%, 18rem\)/
  );
  assert.match(
    css,
    /\.arena--coop-2v2 \.fighter--opponent-b\s*\{[\s\S]*?left:\s*42%[\s\S]*?width:\s*min\(30%, 17\.5rem\)/
  );
  assert.match(css, /\.squad-card--player/);
  assert.match(css, /\.squad-card--ally/);
  assert.match(css, /\.squad-card--opponent-b/);
  assert.match(css, /\.coop-controls/);
  assert.match(css, /data-target-selected="true"/);
});
