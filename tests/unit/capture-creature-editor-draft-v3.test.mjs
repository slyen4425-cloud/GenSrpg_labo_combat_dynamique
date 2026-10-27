import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeCaptureCreatureEditorDraftV3
} from "../../src/contracts/capture-creature-editor-draft-v3.js";
import {
  exportCaptureEditorDraftsToCombatExportV3
} from "../../src/adapters/input/capture/capture-editor-exporter-v3.js";
import {
  adaptCaptureCombatExportStackV1
} from "../../src/adapters/input/capture/capture-export-adapter-stack-v1.js";

function presentation(id, scale = 1.35) {
  return {
    id: `creature:${id}`,
    version: 2,
    subjectType: "creature",
    subjectId: id,
    profileId: "quadruped",
    displayScale: scale,
    visual: {
      front: {
        assetId: "capture:creature-front"
      }
    },
    sockets: [],
    audio: {}
  };
}

function creature(id, skillIds = [], scale = 1.35) {
  return {
    schema: "capture-creature-editor-draft-v3",
    id,
    displayName: id,
    description: id,
    level: 10,
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
      captureRate: 40,
      spawnChance: 20,
      spawnTags: [],
      evolution: null
    },
    combat: {
      maxHp: 40,
      initialHp: 40,
      maxEnergy: 10,
      initialEnergy: 0,
      energyChargeAmount: 1,
      energyChargeIntervalMs: 2000,
      movementEnergyPerStep: 2,
      chargeTimeModifierPct: 0
    },
    skillIds,
    presentation: presentation(id, scale)
  };
}

function skill(id) {
  return {
    schema: "capture-skill-editor-draft-v1",
    id,
    description: id,
    requiredLevel: 1,
    usageScopes: ["capture", "combat"],
    definition: {
      id,
      name: id,
      category: "offensive",
      form: "contact",
      element: null,
      approachMode: "ground",
      energyCost: 1,
      preparationMs: 300,
      travelMs: 300,
      recoveryMs: 300,
      cooldownMs: 500,
      allowedDistances: ["short"],
      targetRelations: ["enemy"],
      effect: {
        damage: 2
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

function setup() {
  return {
    schema: "capture-battle-setup-editor-draft-v1",
    id: "scale-preview",
    localActorId: "player",
    teams: [
      {
        id: "players",
        slots: [
          {
            actorId: "player",
            creatureId: "crea-local",
            displayName: "Local",
            controllerId: "human-local",
            roster: null
          }
        ]
      },
      {
        id: "enemies",
        slots: [
          {
            actorId: "opponent",
            creatureId: "crea-enemy",
            displayName: "Enemy",
            controllerId: "ai-enemy",
            roster: null
          }
        ]
      }
    ]
  };
}

test("CaptureCreatureEditorDraftV3 composes V2 presentation scale with existing creature semantics", () => {
  const value =
    normalizeCaptureCreatureEditorDraftV3(
      creature("crea-local", ["hit"], 1.45)
    );

  assert.equal(
    value.schema,
    "capture-creature-editor-draft-v3"
  );
  assert.equal(value.combat.maxHp, 40);
  assert.equal(
    value.presentation.version,
    2
  );
  assert.equal(
    value.presentation.displayScale,
    1.45
  );
});

test("CaptureCreatureEditorDraftV3 normalized output is idempotent", () => {
  const first =
    normalizeCaptureCreatureEditorDraftV3(
      creature("crea-local")
    );
  const second =
    normalizeCaptureCreatureEditorDraftV3(first);

  assert.deepEqual(second, first);
});

test("Capture Editor Exporter V3 preserves displayScale in portable presentation", () => {
  const exported =
    exportCaptureEditorDraftsToCombatExportV3({
      battleSetup: setup(),
      creatureDrafts: [
        creature("crea-local", ["hit"], 1.6),
        creature("crea-enemy", ["hit"], 0.8)
      ],
      skillDrafts: [skill("hit")],
      loadouts: [
        loadout("crea-local", "hit"),
        loadout("crea-enemy", "hit")
      ],
      metadata: {
        producer: "scale-v3-test"
      }
    });

  assert.equal(
    exported.presentation.creatures[
      "creature:crea-local"
    ].version,
    2
  );
  assert.equal(
    exported.presentation.creatures[
      "creature:crea-local"
    ].displayScale,
    1.6
  );
  assert.equal(
    exported.presentation.creatures[
      "creature:crea-enemy"
    ].displayScale,
    0.8
  );

  const local = exported.creatures.find(
    (item) => item.id === "crea-local"
  );
  assert.equal(
    "displayScale" in local.combat,
    false
  );
});

test("Capture Editor Exporter V3 remains consumable by authoritative Capture adapter stack", () => {
  const exported =
    exportCaptureEditorDraftsToCombatExportV3({
      battleSetup: setup(),
      creatureDrafts: [
        creature("crea-local", ["hit"]),
        creature("crea-enemy", ["hit"])
      ],
      skillDrafts: [skill("hit")],
      loadouts: [
        loadout("crea-local", "hit"),
        loadout("crea-enemy", "hit")
      ]
    });

  const adapted =
    adaptCaptureCombatExportStackV1(exported);

  assert.equal(adapted.fighters.length, 2);
  assert.deepEqual(
    adapted.skillIdsByActor.player,
    ["hit"]
  );
});

test("Exporter V3 delegates to Exporter V2 instead of copying its business rules", async () => {
  const source = await readFile(
    new URL(
      "../../src/adapters/input/capture/capture-editor-exporter-v3.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.equal(
    source.includes(
      "exportCaptureEditorDraftsToCombatExportV2"
    ),
    true
  );

  for (const forbidden of [
    "is2v2",
    "document.",
    "window.",
    "localStorage",
    "combat-runtime",
    "captureFix"
  ]) {
    assert.equal(
      source.includes(forbidden),
      false,
      `V3 exporter must not contain ${forbidden}`
    );
  }
});
