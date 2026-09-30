import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  exportCaptureEditorDraftsToCombatExportV3
} from "../../src/adapters/input/capture/capture-editor-exporter-v3.js";
import {
  validateHumanLoadoutProgressionV1
} from "../../src/ui/capture-editor-human-v2.js";

const progressionRules = {
  schema: "capture-progression-rules-v1",
  maxActiveSkills: 4,
  slotUnlockSchedule: [
    { level: 1, slots: 2 },
    { level: 10, slots: 3 },
    { level: 20, slots: 4 }
  ]
};

function creature(id, level, skillIds) {
  return {
    schema: "capture-creature-editor-draft-v3",
    id,
    displayName: id,
    description: id,
    level,
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
      maxHp: 40,
      initialHp: 40,
      maxEnergy: 10,
      initialEnergy: 10,
      energyChargeAmount: 0,
      energyChargeIntervalMs: 2000,
      movementEnergyPerStep: 1,
      chargeTimeModifierPct: 0
    },
    skillIds,
    presentation: null
  };
}

function skill(id, requiredLevel = 1) {
  return {
    schema: "capture-skill-editor-draft-v1",
    id,
    description: id,
    requiredLevel,
    usageScopes: ["capture", "combat"],
    definition: {
      id,
      name: id,
      category: "offensive",
      form: "contact",
      element: null,
      approachMode: "ground",
      energyCost: 1,
      preparationMs: 100,
      travelMs: 100,
      recoveryMs: 0,
      cooldownMs: 0,
      allowedDistances: ["short", "medium", "long"],
      targetRelations: ["enemy"],
      effect: {
        damage: 1
      }
    },
    presentation: null
  };
}

function loadout(creatureId, ids) {
  return {
    schema: "capture-active-skill-loadout-v1",
    creatureId,
    slots: ids.map((skillId, index) => ({
      id: "slot-" + (index + 1),
      skillId
    }))
  };
}

function battleSetup() {
  return {
    schema: "capture-battle-setup-editor-draft-v1",
    id: "planned-loadout-test",
    localActorId: "local-1",
    teams: [
      {
        id: "local-team",
        slots: [
          {
            actorId: "local-1",
            creatureId: "crea-local",
            displayName: "Locale",
            controllerId: "human-local",
            roster: null
          }
        ]
      },
      {
        id: "enemy-team",
        slots: [
          {
            actorId: "enemy-1",
            creatureId: "crea-enemy",
            displayName: "Ennemie",
            controllerId: "ai-enemy",
            roster: null
          }
        ]
      }
    ]
  };
}

function exportAtLevel(level) {
  const localSkillIds = [
    "skill-low",
    "skill-high",
    "skill-slot-3",
    "skill-slot-4"
  ];
  const enemySkillIds = ["enemy-hit"];

  return exportCaptureEditorDraftsToCombatExportV3({
    battleSetup: battleSetup(),
    creatureDrafts: [
      creature("crea-local", level, localSkillIds),
      creature("crea-enemy", 20, enemySkillIds)
    ],
    skillDrafts: [
      skill("skill-low", 1),
      skill("skill-high", 10),
      skill("skill-slot-3", 1),
      skill("skill-slot-4", 1),
      skill("enemy-hit", 1)
    ],
    loadouts: [
      loadout("crea-local", localSkillIds),
      loadout("crea-enemy", [
        "enemy-hit",
        null,
        null,
        null
      ])
    ],
    progressionRules,
    metadata: {
      producer: "capture-planned-loadout-progression-v1-test"
    }
  });
}

test("planned loadout accepts future slots and future required levels without rejecting editor configuration", () => {
  const configured = loadout("crea-local", [
    "skill-low",
    "skill-high",
    "skill-slot-3",
    "skill-slot-4"
  ]);

  assert.doesNotThrow(() =>
    validateHumanLoadoutProgressionV1({
      loadout: configured,
      progressionRules,
      creatureLevel: 5,
      skillDrafts: [
        skill("skill-low", 1),
        skill("skill-high", 10),
        skill("skill-slot-3", 1),
        skill("skill-slot-4", 1)
      ]
    })
  );
});

test("combat export projects the configured loadout to only skills unlocked at the current level", () => {
  const atFive = exportAtLevel(5);
  assert.deepEqual(
    atFive.creatures.find((entry) => entry.id === "crea-local").skillIds,
    ["skill-low"]
  );

  const atTen = exportAtLevel(10);
  assert.deepEqual(
    atTen.creatures.find((entry) => entry.id === "crea-local").skillIds,
    ["skill-low", "skill-high", "skill-slot-3"]
  );

  const atTwenty = exportAtLevel(20);
  assert.deepEqual(
    atTwenty.creatures.find((entry) => entry.id === "crea-local").skillIds,
    [
      "skill-low",
      "skill-high",
      "skill-slot-3",
      "skill-slot-4"
    ]
  );
});

test("Human Editor does not disable planned loadout choices because of current level", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.equal(
    /option\.disabled\s*=\s*[\s\S]{0,100}requiredLevel\s*>/.test(source),
    false,
    "future-level skills must remain selectable in the planned loadout"
  );
  assert.equal(
    /select\.disabled\s*=\s*[\s\S]{0,100}!available/.test(source),
    false,
    "future slots must remain configurable even before they are active in combat"
  );
});

test("mobile editor footer stays in document flow so it cannot cover Slot 4", async () => {
  const css = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.css",
      import.meta.url
    ),
    "utf8"
  );

  const mobileStart = css.indexOf("@media (max-width: 520px)");
  assert.notEqual(mobileStart, -1);
  const mobileCss = css.slice(mobileStart);

  assert.match(
    mobileCss,
    /\.editor-footer\s*\{[^}]*position:\s*static\s*;/s
  );
});
