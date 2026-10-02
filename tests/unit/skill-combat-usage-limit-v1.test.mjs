import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeSkillDefinition
} from "../../src/contracts/skill-definition.js";
import {
  createCombatState
} from "../../src/core/combat/combat-state.js";
import {
  resolveSkillStart,
  resolveReaction
} from "../../src/core/combat/action-resolver.js";
import {
  buildHumanSkillDraftV1
} from "../../src/ui/capture-editor-human-v2.js";

function fighter(id, energy = 20) {
  return {
    id,
    maxHp: 100,
    initialHp: 100,
    maxEnergy: 20,
    initialEnergy: energy,
    energyChargeAmount: 1,
    energyChargeIntervalMs: 2000,
    movementEnergyPerStep: 1,
    chargeTimeModifierPct: 0
  };
}

function skill({
  id = "ultimate-burst",
  maxUsesPerCombat = 1,
  energyCost = 0,
  cooldownMs = 0,
  category = "offensive",
  form = "contact",
  reaction = {}
} = {}) {
  return normalizeSkillDefinition({
    id,
    name: id,
    category,
    form,
    loadoutSlot: "ultimate",
    element: null,
    approachMode: "none",
    energyCost,
    preparationMs: 0,
    travelMs: 0,
    recoveryMs: 0,
    cooldownMs,
    maxUsesPerCombat,
    allowedDistances: ["short", "medium", "long"],
    targetRelations:
      category === "counter"
        ? ["self"]
        : ["enemy"],
    reaction,
    effect: {
      damage: 0
    }
  });
}

function humanSkillFields(maxUsesPerCombat) {
  return {
    id: "ultimate-editor",
    name: "Ultime éditeur",
    description: "Test limite d'utilisation.",
    requiredLevel: 1,
    loadoutSlot: "ultimate",
    usageScopes: ["capture", "combat"],
    category: "offensive",
    form: "contact",
    element: null,
    approachMode: "none",
    energyCost: 0,
    preparationMs: 0,
    travelMs: 0,
    recoveryMs: 0,
    cooldownMs: 0,
    maxUsesPerCombat,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["enemy"],
    effects: [],
    reaction: {
      blockForms: [],
      reflectForms: [],
      immuneElements: [],
      counterForms: [],
      evadeForms: [],
      evadeApproaches: []
    },
    projectileClash: { power: 0 },
    presentation: {
      iconAssetId: null,
      castAssetId: null,
      castDisplayScale: 1,
      travelAssetId: null,
      travelDisplayScale: 1,
      castLayerPlayer: "front",
      castLayerOpponent: "front",
      travelLayerPlayer: "front",
      travelLayerOpponent: "front",
      impactAssetId: null,
      impactDisplayScale: 1,
      zoneAssetId: null,
      zoneDisplayScale: 1,
      zoneDisplayScaleX: 1,
      zoneDisplayScaleY: 1,
      zoneOffsetX: 0,
      zoneOffsetY: 0,
      socketId: null,
      castAudioAssetId: null,
      impactAudioAssetId: null
    }
  };
}

test("SkillDefinition owns an optional positive maxUsesPerCombat limit", () => {
  assert.equal(
    skill({ maxUsesPerCombat: 2 }).maxUsesPerCombat,
    2
  );

  const unlimited = skill({
    id: "unlimited",
    maxUsesPerCombat: null
  });
  assert.equal(unlimited.maxUsesPerCombat, null);

  assert.throws(
    () => skill({
      id: "invalid-zero",
      maxUsesPerCombat: 0
    }),
    /maxUsesPerCombat/i
  );
});

test("accepted starts consume the authoritative per-fighter combat usage count", () => {
  const limited = skill({ maxUsesPerCombat: 1 });
  const initial = createCombatState({
    distance: "short",
    fighters: [
      fighter("player"),
      fighter("opponent")
    ]
  });

  assert.deepEqual(
    initial.fighters.player.skillUseCounts,
    {}
  );

  const first = resolveSkillStart({
    state: initial,
    actorId: "player",
    targetId: "opponent",
    skill: limited
  });

  assert.equal(first.ok, true);
  assert.equal(
    first.state.fighters.player.skillUseCounts[limited.id],
    1
  );

  const second = resolveSkillStart({
    state: first.state,
    actorId: "player",
    targetId: "opponent",
    skill: limited
  });

  assert.equal(second.ok, false);
  assert.equal(second.outcome, "usage_limit");
  assert.equal(second.skillId, limited.id);
  assert.equal(second.maxUsesPerCombat, 1);
  assert.equal(second.usedCount, 1);
  assert.equal(
    second.state.fighters.player.energy,
    first.state.fighters.player.energy
  );
});

test("a rejected start does not consume a combat use", () => {
  const limited = skill({
    maxUsesPerCombat: 1,
    energyCost: 5
  });
  const initial = createCombatState({
    distance: "short",
    fighters: [
      fighter("player", 0),
      fighter("opponent")
    ]
  });

  const rejected = resolveSkillStart({
    state: initial,
    actorId: "player",
    targetId: "opponent",
    skill: limited
  });

  assert.equal(rejected.ok, false);
  assert.equal(
    rejected.outcome,
    "insufficient_energy"
  );
  assert.equal(
    rejected.state.fighters.player.skillUseCounts[limited.id] ?? 0,
    0
  );
});

test("reaction skills share the same per-combat usage limit", () => {
  const incoming = skill({
    id: "incoming",
    maxUsesPerCombat: null
  });
  const reactionSkill = skill({
    id: "ultimate-counter",
    category: "counter",
    form: "self",
    maxUsesPerCombat: 1,
    reaction: {
      counterForms: ["contact"]
    }
  });
  const initial = createCombatState({
    distance: "short",
    fighters: [
      fighter("player"),
      fighter("opponent")
    ]
  });
  const action = resolveSkillStart({
    state: initial,
    actorId: "player",
    targetId: "opponent",
    skill: incoming
  }).action;

  const first = resolveReaction({
    state: initial,
    action,
    reactionSkill,
    elapsedMs: 0
  });
  assert.equal(first.ok, true);
  assert.equal(
    first.state.fighters.opponent.skillUseCounts[
      reactionSkill.id
    ],
    1
  );

  const second = resolveReaction({
    state: first.state,
    action,
    reactionSkill,
    elapsedMs: 0
  });
  assert.equal(second.ok, false);
  assert.equal(second.outcome, "usage_limit");
});

test("Human Editor exports maxUsesPerCombat and exposes an unlimited-capable control", async () => {
  const limited = buildHumanSkillDraftV1(
    humanSkillFields(3)
  );
  assert.equal(
    limited.definition.maxUsesPerCombat,
    3
  );

  const unlimited = buildHumanSkillDraftV1(
    humanSkillFields(null)
  );
  assert.equal(
    unlimited.definition.maxUsesPerCombat,
    null
  );

  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );
  assert.match(html, /data-skill-max-uses-per-combat/);
  assert.match(html, /Utilisations max par combat/);
  assert.match(html, /0\s*=\s*Illimit/i);
});
