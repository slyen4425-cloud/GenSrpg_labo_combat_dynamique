import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeCaptureCreatureEditorDraftV3
} from "../../src/contracts/capture-creature-editor-draft-v3.js";
import {
  exportCaptureEditorDraftsToCombatExportV3
} from "../../src/adapters/input/capture/capture-editor-exporter-v3.js";

function creature(id, displayScale) {
  return {
    schema: "capture-creature-editor-draft-v3",
    id,
    displayName: id,
    description: "Créature de test.",
    level: 1,
    sourceStats: {
      force: 10,
      agility: 10,
      intelligence: 10,
      spirit: 10,
      endurance: 10,
      initiative: 10
    },
    elements: [],
    resistances: [],
    capture: {
      capturable: true,
      captureRate: 30,
      spawnChance: 10,
      spawnTags: [],
      evolution: null
    },
    combat: {
      maxHp: 50,
      initialHp: 50,
      maxEnergy: 10,
      initialEnergy: 0,
      energyChargeAmount: 1,
      energyChargeIntervalMs: 2000,
      movementEnergyPerStep: 2,
      chargeTimeModifierPct: 0
    },
    skillIds: ["hit"],
    presentation: {
      id: "creature:" + id,
      version: 2,
      subjectType: "creature",
      subjectId: id,
      profileId: "biped",
      displayScale,
      visual: {
        front: { assetId: "pack:capture:" + id + "-front" }
      },
      sockets: [],
      audio: {}
    }
  };
}

function skill() {
  return {
    schema: "capture-skill-editor-draft-v1",
    id: "hit",
    description: "",
    requiredLevel: 1,
    usageScopes: ["capture", "combat"],
    definition: {
      id: "hit",
      name: "Hit",
      category: "offensive",
      form: "contact",
      element: null,
      approachMode: "ground",
      energyCost: 1,
      preparationMs: 100,
      travelMs: 100,
      recoveryMs: 100,
      cooldownMs: 0,
      allowedDistances: ["short"],
      targetRelations: ["enemy"],
      effect: { damage: 2 }
    },
    presentation: null
  };
}

function loadout(creatureId) {
  return {
    schema: "capture-active-skill-loadout-v1",
    creatureId,
    slots: [
      { id: "slot-1", skillId: "hit" },
      { id: "slot-2", skillId: null },
      { id: "slot-3", skillId: null },
      { id: "slot-4", skillId: null }
    ]
  };
}

function battleSetup() {
  return {
    schema: "capture-battle-setup-editor-draft-v1",
    id: "scale-preview",
    localActorId: "local-1",
    teams: [
      {
        id: "local",
        slots: [{
          actorId: "local-1",
          creatureId: "local-creature",
          displayName: "Local",
          controllerId: "human-local",
          roster: null
        }]
      },
      {
        id: "enemy",
        slots: [{
          actorId: "enemy-1",
          creatureId: "enemy-creature",
          displayName: "Enemy",
          controllerId: "ai-enemy",
          roster: null
        }]
      }
    ]
  };
}

test("CaptureCreatureEditorDraftV3 preserves PresentationBindingV2 scale", () => {
  const value = normalizeCaptureCreatureEditorDraftV3(
    creature("local-creature", 1.6)
  );

  assert.equal(value.schema, "capture-creature-editor-draft-v3");
  assert.equal(value.presentation.version, 2);
  assert.equal(value.presentation.displayScale, 1.6);
  assert.equal(value.combat.maxHp, 50);
});

test("Capture Editor Exporter V3 preserves creature scale without changing gameplay data", () => {
  const exported = exportCaptureEditorDraftsToCombatExportV3({
    battleSetup: battleSetup(),
    creatureDrafts: [
      creature("local-creature", 1.6),
      creature("enemy-creature", 0.85)
    ],
    skillDrafts: [skill()],
    loadouts: [
      loadout("local-creature"),
      loadout("enemy-creature")
    ],
    metadata: {}
  });

  assert.equal(exported.schema, "capture-combat-export-v1");
  assert.equal(
    exported.presentation.creatures["creature:local-creature"].displayScale,
    1.6
  );
  assert.equal(
    exported.presentation.creatures["creature:enemy-creature"].displayScale,
    0.85
  );

  const local = exported.creatures.find(
    (item) => item.id === "local-creature"
  );
  assert.equal(local.combat.maxHp, 50);
  assert.equal(local.combat.maxEnergy, 10);
  assert.deepEqual(local.skillIds, ["hit"]);
});
