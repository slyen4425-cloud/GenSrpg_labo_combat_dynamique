import test from "node:test";
import assert from "node:assert/strict";

import {
  buildHumanSkillDraftV1,
  hydrateInitialSkillEffectsFromNativeV1
} from "../../src/ui/capture-editor-human-v2.js";
import {
  createCombatSession
} from "../../src/core/combat/combat-session.js";

function fighter(id) {
  return {
    id,
    maxHp: 100,
    initialHp: 100,
    maxEnergy: 20,
    initialEnergy: 20,
    energyChargeAmount: 1,
    energyChargeIntervalMs: 2000,
    movementEnergyPerStep: 1,
    chargeTimeModifierPct: 0
  };
}

function initialFireballFields() {
  return {
    id: "fireball",
    name: "Boule de feu",
    description: "Projectile de feu.",
    requiredLevel: 1,
    usageScopes: ["capture", "combat"],
    category: "offensive",
    form: "projectile",
    element: "fire",
    approachMode: "none",
    energyCost: 3,
    preparationMs: 900,
    travelMs: 650,
    recoveryMs: 450,
    cooldownMs: 2800,
    activationRequirements: {
      mode: "all",
      conditions: []
    },
    effects: [],
    reaction: {
      blockForms: [],
      reflectForms: [],
      immuneElements: [],
      counterForms: [],
      evadeForms: [],
      evadeApproaches: []
    },
    projectileClash: { power: 1 },
    presentation: {
      iconAssetId: "core:icon-skill-fireball-01",
      socketId: null,
      castAssetId: null,
      travelAssetId: null,
      impactAssetId: null,
      castScale: 1,
      travelScale: 1,
      impactScale: 1,
      castLayerPlayer: "front",
      castLayerOpponent: "front",
      travelLayerPlayer: "front",
      travelLayerOpponent: "front",
      castAudioAssetId: null,
      impactAudioAssetId: null
    },
    effectTags: []
  };
}

const nativeFireball = Object.freeze({
  schema: "capture-skill-editor-draft-v1",
  id: "fireball",
  description: "Capacité native du laboratoire.",
  requiredLevel: 1,
  usageScopes: ["capture", "combat"],
  definition: Object.freeze({
    id: "fireball",
    name: "Boule de feu",
    category: "offensive",
    form: "projectile",
    element: "fire",
    approachMode: "none",
    energyCost: 3,
    preparationMs: 2000,
    travelMs: 700,
    recoveryMs: 700,
    cooldownMs: 0,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["enemy"],
    effect: Object.freeze({
      damage: 30,
      heal: 0,
      interruptsPreparation: false,
      stunMs: 0,
      tags: Object.freeze(["burn-capable"])
    }),
    effects: Object.freeze([])
  }),
  presentation: null
});

test("initial editor skill hydrates representable native damage instead of shadowing it with an empty effects list", () => {
  const fields = hydrateInitialSkillEffectsFromNativeV1(
    initialFireballFields(),
    nativeFireball
  );

  assert.deepEqual(fields.effects, [
    {
      kind: "damage",
      targetScope: "target",
      amount: 30,
      channel: "fire"
    }
  ]);

  const draft = buildHumanSkillDraftV1(fields);
  assert.equal(draft.definition.effect.damage, 0);
  assert.equal(draft.definition.effects.length, 1);
  assert.equal(draft.definition.effects[0].kind, "damage");
  assert.equal(draft.definition.effects[0].amount, 30);
  assert.equal(draft.definition.cooldownMs, 2800);
});

test("hydrated initial fireball reduces target HP through the real combat session", () => {
  const fields = hydrateInitialSkillEffectsFromNativeV1(
    initialFireballFields(),
    nativeFireball
  );
  const skill = buildHumanSkillDraftV1(fields).definition;
  const session = createCombatSession({
    distance: "medium",
    fighters: [fighter("player"), fighter("opponent")]
  });

  const result = session.useSkill({
    actorId: "player",
    targetId: "opponent",
    skill
  });

  assert.equal(result.ok, true);
  assert.equal(session.snapshot().fighters.opponent.hp, 70);
});
