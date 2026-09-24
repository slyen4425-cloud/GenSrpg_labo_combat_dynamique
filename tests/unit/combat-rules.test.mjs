import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import {
  movementEnergyCost,
  distanceSteps
} from "../../src/core/combat/distance.js";
import {
  createCombatState,
  regenerateEnergy,
  withFighterEnergy
} from "../../src/core/combat/combat-state.js";
import {
  resolveMovement,
  resolveSkill
} from "../../src/core/combat/action-resolver.js";

async function json(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const maraileronConfig = await json("data/combat/fighters/maraileron.combat.json");
const braisombreConfig = await json("data/combat/fighters/braisombre.combat.json");

const fireball = normalizeSkillDefinition(
  await json("data/combat/skills/fireball.skill.json")
);
const mirrorShield = normalizeSkillDefinition(
  await json("data/combat/skills/mirror-shield.skill.json")
);
const fireImmunity = normalizeSkillDefinition(
  await json("data/combat/skills/fire-immunity.skill.json")
);
const contactCounter = normalizeSkillDefinition(
  await json("data/combat/skills/contact-counter.skill.json")
);
const claw = normalizeSkillDefinition(
  await json("data/combat/skills/claw.skill.json")
);

function state(distance = "medium") {
  return createCombatState({
    distance,
    fighters: [maraileronConfig, braisombreConfig]
  });
}

test("skill classification separates category, form and element", () => {
  assert.equal(fireball.category, "offensive");
  assert.equal(fireball.form, "projectile");
  assert.equal(fireball.element, "fire");

  assert.equal(mirrorShield.category, "defensive");
  assert.equal(mirrorShield.form, "self");
  assert.deepEqual(mirrorShield.reaction.reflectForms, ["projectile"]);
});

test("distance has exactly three ordered bands", () => {
  assert.equal(distanceSteps("short", "medium"), 1);
  assert.equal(distanceSteps("medium", "long"), 1);
  assert.equal(distanceSteps("short", "long"), 2);
});

test("movement cost is creature-specific and charged per crossed band", () => {
  assert.equal(
    movementEnergyCost({
      from: "short",
      to: "long",
      energyPerStep: maraileronConfig.movementEnergyPerStep
    }),
    2
  );

  assert.equal(
    movementEnergyCost({
      from: "short",
      to: "long",
      energyPerStep: braisombreConfig.movementEnergyPerStep
    }),
    6
  );
});

test("movement spends energy and changes the shared distance", () => {
  const initial = state("short");
  const result = resolveMovement({
    state: initial,
    actorId: "maraileron",
    toDistance: "long"
  });

  assert.equal(result.ok, true);
  assert.equal(result.outcome, "moved");
  assert.equal(result.cost, 2);
  assert.equal(result.state.distance, "long");
  assert.equal(result.state.fighters.maraileron.energy, 98);
  assert.equal(result.state.fighters.braisombre.energy, 100);
});

test("movement is rejected when the actor cannot pay the configured cost", () => {
  const depleted = withFighterEnergy(state("short"), "braisombre", 5);
  const result = resolveMovement({
    state: depleted,
    actorId: "braisombre",
    toDistance: "long"
  });

  assert.equal(result.ok, false);
  assert.equal(result.outcome, "insufficient_energy");
  assert.equal(result.cost, 6);
  assert.equal(result.state.distance, "short");
  assert.equal(result.state.fighters.braisombre.energy, 5);
});

test("fireball cannot be used at short range but works at medium range", () => {
  const rejected = resolveSkill({
    state: state("short"),
    actorId: "maraileron",
    targetId: "braisombre",
    skill: fireball
  });

  assert.equal(rejected.ok, false);
  assert.equal(rejected.outcome, "out_of_range");

  const hit = resolveSkill({
    state: state("medium"),
    actorId: "maraileron",
    targetId: "braisombre",
    skill: fireball
  });

  assert.equal(hit.ok, true);
  assert.equal(hit.outcome, "hit");
  assert.equal(hit.state.fighters.maraileron.energy, 82);
});

test("projectile reflection is independent from the fire element", () => {
  const result = resolveSkill({
    state: state("medium"),
    actorId: "maraileron",
    targetId: "braisombre",
    skill: fireball,
    reactionSkill: mirrorShield
  });

  assert.equal(result.outcome, "reflected");
  assert.equal(result.reactionApplied, "mirror-shield");
  assert.equal(result.state.fighters.maraileron.energy, 82);
  assert.equal(result.state.fighters.braisombre.energy, 84);

  const reflectedHit = result.events.find(
    (item) => item.type === "hit" && item.reflected === true
  );
  assert.equal(reflectedHit.actorId, "maraileron");
});

test("fire immunity targets the element regardless of projectile form", () => {
  const result = resolveSkill({
    state: state("medium"),
    actorId: "maraileron",
    targetId: "braisombre",
    skill: fireball,
    reactionSkill: fireImmunity
  });

  assert.equal(result.outcome, "immune");
  assert.equal(result.reactionApplied, "fire-immunity");
  assert.equal(
    result.events.some((item) => item.type === "skill-immune"),
    true
  );
});

test("contact counter only counters contact attacks", () => {
  const countered = resolveSkill({
    state: state("short"),
    actorId: "maraileron",
    targetId: "braisombre",
    skill: claw,
    reactionSkill: contactCounter
  });

  assert.equal(countered.outcome, "countered");

  const unrelated = resolveSkill({
    state: state("medium"),
    actorId: "maraileron",
    targetId: "braisombre",
    skill: fireball,
    reactionSkill: contactCounter
  });

  assert.equal(unrelated.outcome, "hit");
});

test("skill result exposes configurable preparation travel and recovery timeline", () => {
  const result = resolveSkill({
    state: state("medium"),
    actorId: "maraileron",
    targetId: "braisombre",
    skill: fireball
  });

  assert.deepEqual(result.timelineMs, {
    preparation: 700,
    travel: 550,
    recovery: 650
  });

  assert.equal(
    result.events.find((item) => item.type === "skill-release").atMs,
    700
  );
  assert.equal(
    result.events.find((item) => item.type === "skill-arrive").atMs,
    1250
  );
  assert.equal(
    result.events.find((item) => item.type === "skill-recovery-complete").atMs,
    1900
  );
});

test("energy regeneration stays configurable per fighter", () => {
  let initial = state();
  initial = withFighterEnergy(initial, "maraileron", 50);
  initial = withFighterEnergy(initial, "braisombre", 50);

  const regenerated = regenerateEnergy(initial, 2);

  assert.equal(regenerated.fighters.maraileron.energy, 66);
  assert.equal(regenerated.fighters.braisombre.energy, 62);
});
