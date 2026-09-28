import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  effectiveSkillTimingMs,
  normalizeSkillSpeedMultiplier
} from "../../src/core/combat/combat-timing.js";
import {
  createCombatSession
} from "../../src/core/combat/combat-session.js";
import {
  normalizeSkillDefinition
} from "../../src/contracts/skill-definition.js";

async function json(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const maraileron = await json(
  "data/combat/fighters/maraileron.combat.json"
);
const braisombre = await json(
  "data/combat/fighters/braisombre.combat.json"
);
const fireball = normalizeSkillDefinition({
  ...(await json("data/combat/skills/fireball.skill.json")),
  cooldownMs: 3000
});
const projectileReaction = normalizeSkillDefinition(
  await json("data/combat/skills/mirror-shield.skill.json")
);

function fighters() {
  return [
    { ...maraileron, initialEnergy: 10 },
    { ...braisombre, initialEnergy: 10 }
  ];
}

test("skill speed multiplier keeps x1 timings and scales faster/slower deterministically", () => {
  assert.equal(normalizeSkillSpeedMultiplier(1), 1);
  assert.equal(effectiveSkillTimingMs({ baseMs: 900, speedMultiplier: 1 }), 900);
  assert.equal(effectiveSkillTimingMs({ baseMs: 900, speedMultiplier: 2 }), 450);
  assert.equal(effectiveSkillTimingMs({ baseMs: 900, speedMultiplier: 0.5 }), 1800);

  assert.throws(
    () => normalizeSkillSpeedMultiplier(0),
    /greater than 0/
  );
  assert.throws(
    () => normalizeSkillSpeedMultiplier(Number.POSITIVE_INFINITY),
    /finite/
  );
});

test("CombatSession applies global speed to skill preparation travel recovery without mutating SkillDefinition", () => {
  const original = {
    preparationMs: fireball.preparationMs,
    travelMs: fireball.travelMs,
    recoveryMs: fireball.recoveryMs,
    cooldownMs: fireball.cooldownMs
  };

  const normal = createCombatSession({
    distance: "medium",
    fighters: fighters()
  });
  const fast = createCombatSession({
    distance: "medium",
    fighters: fighters(),
    skillSpeedMultiplier: 2
  });
  const slow = createCombatSession({
    distance: "medium",
    fighters: fighters(),
    skillSpeedMultiplier: 0.5
  });

  const normalStart = normal.startSkill({
    actorId: "maraileron",
    targetId: "braisombre",
    skill: fireball
  });
  const fastStart = fast.startSkill({
    actorId: "maraileron",
    targetId: "braisombre",
    skill: fireball
  });
  const slowStart = slow.startSkill({
    actorId: "maraileron",
    targetId: "braisombre",
    skill: fireball
  });

  assert.deepEqual(
    {
      preparationMs: normalStart.action.preparationMs,
      travelMs: normalStart.action.travelMs,
      recoveryMs: normalStart.action.recoveryMs
    },
    {
      preparationMs: original.preparationMs,
      travelMs: original.travelMs,
      recoveryMs: original.recoveryMs
    }
  );

  assert.deepEqual(
    {
      preparationMs: fastStart.action.preparationMs,
      travelMs: fastStart.action.travelMs,
      recoveryMs: fastStart.action.recoveryMs,
      releaseAtMs: fastStart.action.releaseAtMs,
      impactAtMs: fastStart.action.impactAtMs
    },
    {
      preparationMs: Math.round(original.preparationMs / 2),
      travelMs: Math.round(original.travelMs / 2),
      recoveryMs: Math.round(original.recoveryMs / 2),
      releaseAtMs: Math.round(original.preparationMs / 2),
      impactAtMs:
        Math.round(original.preparationMs / 2) +
        Math.round(original.travelMs / 2)
    }
  );

  assert.deepEqual(
    {
      preparationMs: slowStart.action.preparationMs,
      travelMs: slowStart.action.travelMs,
      recoveryMs: slowStart.action.recoveryMs
    },
    {
      preparationMs: Math.round(original.preparationMs / 0.5),
      travelMs: Math.round(original.travelMs / 0.5),
      recoveryMs: Math.round(original.recoveryMs / 0.5)
    }
  );

  assert.equal(
    fast.snapshot().fighters.maraileron.skillCooldowns[fireball.id],
    original.cooldownMs
  );

  assert.deepEqual(
    {
      preparationMs: fireball.preparationMs,
      travelMs: fireball.travelMs,
      recoveryMs: fireball.recoveryMs,
      cooldownMs: fireball.cooldownMs
    },
    original
  );
});

test("global skill speed also scales reaction preparation but not combat-state energy clock", () => {
  const session = createCombatSession({
    distance: "short",
    fighters: fighters(),
    skillSpeedMultiplier: 2
  });

  const started = session.startSkill({
    actorId: "maraileron",
    targetId: "braisombre",
    skill: fireball
  });
  assert.equal(started.ok, true);

  const reaction = session.reactToSkill({
    action: started.action,
    reactionSkill: projectileReaction,
    elapsedMs: 0
  });

  assert.equal(reaction.ok, true);
  assert.equal(
    reaction.reaction.preparationMs,
    Math.round(projectileReaction.preparationMs / 2)
  );

  const before = session.snapshot().fighters.braisombre.energy;
  session.advanceMs(2000);
  const after = session.snapshot().fighters.braisombre.energy;

  assert.equal(after - before, 1);
});
