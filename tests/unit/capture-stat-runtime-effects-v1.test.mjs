import test from "node:test";
import assert from "node:assert/strict";

import {
  exportCaptureEditorDraftsToCombatExportV3
} from "../../src/adapters/input/capture/capture-editor-exporter-v3.js";
import {
  adaptCaptureCombatExportStackV1
} from "../../src/adapters/input/capture/capture-export-adapter-stack-v1.js";
import {
  createCombatSession
} from "../../src/core/combat/combat-session.js";

function creature(id, name, skillIds) {
  return {
    schema: "capture-creature-editor-draft-v3",
    id,
    displayName: name,
    description: name,
    level: 10,
    sourceStats: {
      force: 0,
      agility: 0,
      intelligence: 0,
      spirit: 0,
      endurance: 0,
      initiative: 0
    },
    elements: [],
    resistances: [],
    capture: {
      capturable: true,
      captureRate: 10,
      spawnChance: 10,
      spawnTags: [],
      evolution: null
    },
    combat: {
      maxHp: 200,
      initialHp: 200,
      maxEnergy: 10,
      initialEnergy: 10,
      energyChargeAmount: 1,
      energyChargeIntervalMs: 2000,
      movementEnergyPerStep: 1,
      chargeTimeModifierPct: 0
    },
    skillIds,
    presentation: null
  };
}

function skill() {
  return {
    schema: "capture-skill-editor-draft-v1",
    id: "fire-hit",
    description: "Feu",
    requiredLevel: 1,
    usageScopes: ["capture", "combat"],
    definition: {
      id: "fire-hit",
      name: "Impact feu",
      category: "offensive",
      form: "projectile",
      element: "fire",
      approachMode: "none",
      energyCost: 1,
      preparationMs: 1000,
      travelMs: 0,
      recoveryMs: 0,
      cooldownMs: 0,
      allowedDistances: ["short", "medium", "long"],
      targetRelations: ["enemy"],
      effect: {
        damage: 100,
        tags: ["fire"]
      }
    },
    presentation: null
  };
}

function loadout(creatureId, skillId = null) {
  return {
    schema: "capture-active-skill-loadout-v1",
    creatureId,
    slots: [
      { id: "slot-1", skillId },
      { id: "slot-2", skillId: null },
      { id: "slot-3", skillId: null },
      { id: "slot-4", skillId: null }
    ]
  };
}

function input() {
  return {
    battleSetup: {
      schema: "capture-battle-setup-editor-draft-v1",
      id: "stat-runtime-test",
      localActorId: "player",
      skillSpeedMultiplier: 2,
      teams: [
        {
          id: "players",
          slots: [{
            actorId: "player",
            creatureId: "crea-player",
            displayName: "Player",
            controllerId: "human-local",
            roster: null
          }]
        },
        {
          id: "enemies",
          slots: [{
            actorId: "opponent",
            creatureId: "crea-opponent",
            displayName: "Opponent",
            controllerId: "ai-enemy",
            roster: null
          }]
        }
      ]
    },
    creatureDrafts: [
      creature("crea-player", "Player", ["fire-hit"]),
      creature("crea-opponent", "Opponent", [])
    ],
    skillDrafts: [skill()],
    loadouts: [
      loadout("crea-player", "fire-hit"),
      loadout("crea-opponent")
    ],
    statRegistry: {
      schema: "capture-stat-registry-v1",
      stats: [
        {
          id: "fire",
          label: "Feu",
          damageChannel: "fire",
          resistanceChannel: "fire",
          damagePctPerPoint: 1,
          resistancePctPerPoint: 1,
          chargeTimeReductionPctPerPoint: 0
        },
        {
          id: "speed",
          label: "Vitesse",
          damageChannel: null,
          resistanceChannel: null,
          damagePctPerPoint: 0,
          resistancePctPerPoint: 0,
          chargeTimeReductionPctPerPoint: 1
        }
      ]
    },
    statValues: [
      {
        schema: "capture-creature-stat-values-v1",
        creatureId: "crea-player",
        values: { fire: 20, speed: 10 }
      },
      {
        schema: "capture-creature-stat-values-v1",
        creatureId: "crea-opponent",
        values: { fire: 25, speed: 0 }
      }
    ]
  };
}

test("Capture V3 export derives one runtime stat-effects snapshot from registry and creature values", () => {
  const exported =
    exportCaptureEditorDraftsToCombatExportV3(input());

  const player = exported.creatures.find(
    (entry) => entry.id === "crea-player"
  );
  const opponent = exported.creatures.find(
    (entry) => entry.id === "crea-opponent"
  );

  assert.deepEqual(
    player.combat.statEffects,
    {
      damagePctByChannel: { fire: 20 },
      resistancePctByChannel: { fire: 20 },
      chargeTimeReductionPct: 10
    }
  );
  assert.deepEqual(
    opponent.combat.statEffects,
    {
      damagePctByChannel: { fire: 25 },
      resistancePctByChannel: { fire: 25 },
      chargeTimeReductionPct: 0
    }
  );

  assert.deepEqual(
    player.combat.statEffectRulesById,
    {
      fire: {
        damageChannel: "fire",
        resistanceChannel: "fire",
        damagePctPerPoint: 1,
        resistancePctPerPoint: 1,
        chargeTimeReductionPctPerPoint: 0
      },
      speed: {
        damageChannel: null,
        resistanceChannel: null,
        damagePctPerPoint: 0,
        resistancePctPerPoint: 0,
        chargeTimeReductionPctPerPoint: 1
      }
    },
    "runtime stat rules must be derived from the same registry owner"
  );
});

test("authoritative Capture adapter carries runtime stat effects into fighter state", () => {
  const exported =
    exportCaptureEditorDraftsToCombatExportV3(input());
  const native =
    adaptCaptureCombatExportStackV1(exported);

  const player = native.fighters.find(
    (entry) => entry.id === "player"
  );
  const opponent = native.fighters.find(
    (entry) => entry.id === "opponent"
  );

  assert.deepEqual(
    player.damagePctByChannel,
    { fire: 20 }
  );
  assert.deepEqual(
    opponent.resistancePctByChannel,
    { fire: 25 }
  );
  assert.equal(
    player.chargeTimeModifierPct,
    -10,
    "speed stat must compose into the existing fighter preparation modifier owner"
  );
  assert.deepEqual(
    player.statEffectRulesById,
    {
      fire: {
        damageChannel: "fire",
        resistanceChannel: "fire",
        damagePctPerPoint: 1,
        resistancePctPerPoint: 1,
        chargeTimeReductionPctPerPoint: 0
      },
      speed: {
        damageChannel: null,
        resistanceChannel: null,
        damagePctPerPoint: 0,
        resistancePctPerPoint: 0,
        chargeTimeReductionPctPerPoint: 1
      }
    }
  );
  assert.equal(
    native.skillSpeedMultiplier,
    2,
    "global test speed remains a separate battle-level setting"
  );
});

test("real CombatSession applies channel damage/resistance and creature speed before global test speed", () => {
  const exported =
    exportCaptureEditorDraftsToCombatExportV3(input());
  const native =
    adaptCaptureCombatExportStackV1(exported);

  const session = createCombatSession({
    distance: "medium",
    fighters: native.fighters,
    skillSpeedMultiplier:
      native.skillSpeedMultiplier
  });

  const result = session.useSkill({
    actorId: "player",
    targetId: "opponent",
    skill: native.skills["fire-hit"]
  });

  assert.equal(result.ok, true);
  assert.equal(result.outcome, "hit");
  assert.equal(
    result.timelineMs.preparation,
    450,
    "1000ms -10% creature speed then global x2 = 450ms"
  );
  assert.equal(
    result.state.fighters.opponent.hp,
    110,
    "100 base +20% fire damage, then 25% fire resistance = 90 damage"
  );

  const hit = result.events.find(
    (event) => event.type === "hit"
  );
  assert.equal(hit.baseDamage, 100);
  assert.equal(hit.damageChannel, "fire");
  assert.equal(hit.damageBonusPct, 20);
  assert.equal(hit.resistancePct, 25);
  assert.equal(hit.damage, 90);
});


test("damage without an element uses the explicit physical channel", () => {
  const data = input();
  data.statRegistry.stats.push({
    id: "physical",
    label: "Physique",
    damageChannel: "physical",
    resistanceChannel: "physical",
    damagePctPerPoint: 1,
    resistancePctPerPoint: 1,
    chargeTimeReductionPctPerPoint: 0
  });
  data.statValues[0].values.physical = 10;
  data.statValues[1].values.physical = 20;
  data.skillDrafts[0].definition.element = null;
  data.skillDrafts[0].definition.effect.tags = [];

  const native =
    adaptCaptureCombatExportStackV1(
      exportCaptureEditorDraftsToCombatExportV3(
        data
      )
    );
  const session = createCombatSession({
    fighters: native.fighters,
    skillSpeedMultiplier: 1
  });

  const result = session.useSkill({
    actorId: "player",
    targetId: "opponent",
    skill: native.skills["fire-hit"]
  });

  const hit = result.events.find(
    (event) => event.type === "hit"
  );
  assert.equal(hit.damageChannel, "physical");
  assert.equal(hit.damage, 88);
});

test("channel resistance at or above 100 percent cannot create negative damage", () => {
  const data = input();
  data.statValues[1].values.fire = 150;

  const native =
    adaptCaptureCombatExportStackV1(
      exportCaptureEditorDraftsToCombatExportV3(
        data
      )
    );
  const session = createCombatSession({
    fighters: native.fighters
  });

  const result = session.useSkill({
    actorId: "player",
    targetId: "opponent",
    skill: native.skills["fire-hit"]
  });

  assert.equal(
    result.state.fighters.opponent.hp,
    200
  );
  assert.equal(
    result.events.find(
      (event) => event.type === "hit"
    ).damage,
    0
  );
});

test("Human Editor V3 builder sends its owner-backed stat values through the same export path", async () => {
  const {
    buildHumanEditorExportV3
  } = await import(
    "../../src/ui/capture-editor-human-v2.js"
  );
  const data = input();

  const exported = buildHumanEditorExportV3({
    creatureDraft: data.creatureDrafts[0],
    skillDrafts: data.skillDrafts,
    loadout: data.loadouts[0],
    battleSetup: data.battleSetup,
    opponentCreatureDraft:
      data.creatureDrafts[1],
    opponentSkillDrafts: [],
    opponentLoadout: data.loadouts[1],
    statRegistry: data.statRegistry,
    statValues: [data.statValues[0]]
  });

  const native =
    adaptCaptureCombatExportStackV1(exported);
  const player = native.fighters.find(
    (fighter) => fighter.id === "player"
  );

  assert.deepEqual(
    player.damagePctByChannel,
    { fire: 20 }
  );
  assert.equal(
    player.chargeTimeModifierPct,
    -10
  );
});
