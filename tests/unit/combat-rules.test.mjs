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
  withFighterEnergy
} from "../../src/core/combat/combat-state.js";
import {
  resolveMovement,
  resolveSkill
} from "../../src/core/combat/action-resolver.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";

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
    fighters: [
      { ...maraileronConfig, initialEnergy: 10 },
      { ...braisombreConfig, initialEnergy: 10 }
    ]
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
  assert.equal(result.state.fighters.maraileron.energy, 8);
  assert.equal(result.state.fighters.braisombre.energy, 10);
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
  assert.equal(hit.state.fighters.maraileron.energy, 7);
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
  assert.equal(result.state.fighters.maraileron.energy, 7);
  assert.equal(result.state.fighters.braisombre.energy, 8);

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
    basePreparation: 1800,
    preparation: 1800,
    travel: 700,
    recovery: 700,
    reactionReady: null
  });

  assert.equal(
    result.events.find((item) => item.type === "skill-release").atMs,
    1800
  );
  assert.equal(
    result.events.find((item) => item.type === "skill-arrive").atMs,
    2500
  );
  assert.equal(
    result.events.find((item) => item.type === "skill-recovery-complete").atMs,
    3200
  );
});

test("legacy second-based advance delegates to configurable energy ticks", () => {
  const session = createCombatSession({
    distance: "medium",
    fighters: [
      { ...maraileronConfig, initialEnergy: 10 },
      { ...braisombreConfig, initialEnergy: 10 }
    ]
  });

  session.advance(2);

  assert.equal(session.snapshot().fighters.maraileron.energy, 1);
  assert.equal(session.snapshot().fighters.braisombre.energy, 1);
});


test("combat session owns current state while previews stay side-effect free", () => {
  const session = createCombatSession({
    distance: "short",
    fighters: [
      { ...maraileronConfig, initialEnergy: 10 },
      { ...braisombreConfig, initialEnergy: 10 }
    ]
  });

  const preview = session.previewMovement("maraileron", "long");
  assert.equal(preview.cost, 2);
  assert.equal(session.snapshot().distance, "short");
  assert.equal(session.snapshot().fighters.maraileron.energy, 10);

  const moved = session.move("maraileron", "long");
  assert.equal(moved.ok, true);
  assert.equal(session.snapshot().distance, "long");
  assert.equal(session.snapshot().fighters.maraileron.energy, 8);
});

test("combat session commits skill energy and explicit regeneration", () => {
  const session = createCombatSession({
    distance: "medium",
    fighters: [
      { ...maraileronConfig, initialEnergy: 10 },
      { ...braisombreConfig, initialEnergy: 10 }
    ]
  });

  const result = session.useSkill({
    actorId: "maraileron",
    targetId: "braisombre",
    skill: fireball
  });

  assert.equal(result.outcome, "hit");
  assert.equal(session.snapshot().fighters.maraileron.energy, 7);

  session.advance(2);
  assert.equal(session.snapshot().fighters.maraileron.energy, 8);
});


test("reaction timing can interrupt before release", () => {
  const result = resolveSkill({
    state: state("short"),
    actorId: "maraileron",
    targetId: "braisombre",
    skill: claw,
    reactionSkill: contactCounter
  });

  assert.equal(result.outcome, "countered");
  assert.equal(result.timelineMs.reactionReady, 400);
  assert.equal(
    result.events.some((item) => item.type === "skill-release"),
    false
  );
  assert.equal(
    result.events.find((item) => item.type === "skill-countered").atMs,
    400
  );
  assert.equal(
    result.events.find((item) => item.type === "skill-cancelled").atMs,
    400
  );
});

test("reaction that becomes ready after impact does not apply or spend energy", () => {
  const slowCounter = normalizeSkillDefinition({
    id: "slow-counter",
    name: "Slow Counter",
    category: "counter",
    form: "self",
    energyCost: 2,
    preparationMs: 1500,
    allowedDistances: ["short", "medium", "long"],
    reaction: {
      counterForms: ["contact"]
    }
  });

  const result = resolveSkill({
    state: state("short"),
    actorId: "maraileron",
    targetId: "braisombre",
    skill: claw,
    reactionSkill: slowCounter
  });

  assert.equal(result.outcome, "hit");
  assert.equal(result.reactionApplied, null);
  assert.equal(result.state.fighters.braisombre.energy, 10);
});

test("combat session skill preview and reset do not leak UI authority", () => {
  const session = createCombatSession({
    distance: "medium",
    fighters: [maraileronConfig, braisombreConfig]
  });

  const preview = session.previewSkill({
    actorId: "maraileron",
    targetId: "braisombre",
    skill: fireball,
    reactionSkill: mirrorShield
  });

  assert.equal(preview.outcome, "reflected");
  assert.equal(session.snapshot().fighters.maraileron.energy, 10);
  assert.equal(session.snapshot().fighters.braisombre.energy, 10);

  session.useSkill({
    actorId: "maraileron",
    targetId: "braisombre",
    skill: fireball
  });
  assert.equal(session.snapshot().fighters.maraileron.energy, 7);

  session.reset();
  assert.equal(session.snapshot().distance, "medium");
  assert.equal(session.snapshot().fighters.maraileron.energy, 10);
  assert.equal(session.snapshot().fighters.braisombre.energy, 10);
});
