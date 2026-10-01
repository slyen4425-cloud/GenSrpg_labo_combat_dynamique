import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeCaptureActiveSkillLoadoutV1
} from "../../src/contracts/capture-active-skill-loadout-v1.js";
import {
  normalizeSkillDefinition
} from "../../src/contracts/skill-definition.js";
import {
  projectCapturePlannedLoadoutsToCombatV1
} from "../../src/adapters/input/capture/capture-planned-loadout-to-combat-v1.js";
import {
  exportCaptureEditorDraftsToCombatExportV3
} from "../../src/adapters/input/capture/capture-editor-exporter-v3.js";

function skill(id, {
  loadoutSlot = "standard",
  requiredLevel = 1
} = {}) {
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
      loadoutSlot,
      energyCost: 1,
      preparationMs: 0,
      travelMs: 0,
      recoveryMs: 0,
      cooldownMs: 0,
      allowedDistances: ["short", "medium", "long"],
      targetRelations: ["enemy"],
      effect: { damage: 1 }
    },
    presentation: null
  };
}

function creature(level = 20) {
  return {
    schema: "capture-creature-editor-draft-v3",
    id: "crea-test",
    displayName: "Test",
    description: "Test",
    level,
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
      captureRate: 1,
      spawnChance: 1,
      spawnTags: [],
      evolution: null
    },
    combat: {
      maxHp: 10,
      maxEnergy: 0,
      initialEnergy: 0,
      energyChargeAmount: 0,
      energyChargeIntervalMs: 0,
      movementEnergyPerStep: 0,
      chargeTimeModifierPct: 0
    },
    skillIds: [
      "s1",
      "s2",
      "s3",
      "s4",
      "ult"
    ],
    presentation: null
  };
}

const progressionRules = {
  schema: "capture-progression-rules-v1",
  maxActiveSkills: 4,
  slotUnlockSchedule: [
    { level: 1, slots: 2 },
    { level: 10, slots: 3 },
    { level: 20, slots: 4 }
  ]
};

test("legacy four-slot loadout normalizes to four standard slots plus an empty ultimate slot", () => {
  const value = normalizeCaptureActiveSkillLoadoutV1({
    schema: "capture-active-skill-loadout-v1",
    creatureId: "crea-test",
    slots: [
      { id: "slot-1", skillId: "s1" },
      { id: "slot-2", skillId: "s2" },
      { id: "slot-3", skillId: null },
      { id: "slot-4", skillId: null }
    ]
  });

  assert.deepEqual(
    value.slots.map((slot) => slot.id),
    [
      "slot-1",
      "slot-2",
      "slot-3",
      "slot-4",
      "slot-ultimate"
    ]
  );
  assert.equal(
    value.slots[4].skillId,
    null
  );
});

test("SkillDefinition has an explicit standard or ultimate loadout slot authority", () => {
  const standard = normalizeSkillDefinition(
    skill("standard").definition
  );
  const ultimate = normalizeSkillDefinition(
    skill("ultimate", {
      loadoutSlot: "ultimate"
    }).definition
  );

  assert.equal(
    standard.loadoutSlot,
    "standard"
  );
  assert.equal(
    ultimate.loadoutSlot,
    "ultimate"
  );

  assert.throws(
    () => normalizeSkillDefinition({
      ...skill("bad").definition,
      loadoutSlot: "special"
    }),
    /loadoutSlot|ultimate|standard/i
  );
});

test("planned loadout keeps ultimate outside the four standard progression slots", () => {
  const projected =
    projectCapturePlannedLoadoutsToCombatV1({
      progressionRules,
      creatureDrafts: [creature(1)],
      skillDrafts: [
        skill("s1"),
        skill("s2"),
        skill("s3"),
        skill("s4"),
        skill("ult", {
          loadoutSlot: "ultimate"
        })
      ],
      loadouts: [{
        schema: "capture-active-skill-loadout-v1",
        creatureId: "crea-test",
        slots: [
          { id: "slot-1", skillId: "s1" },
          { id: "slot-2", skillId: "s2" },
          { id: "slot-3", skillId: "s3" },
          { id: "slot-4", skillId: "s4" },
          { id: "slot-ultimate", skillId: "ult" }
        ]
      }]
    })[0];

  assert.deepEqual(
    projected.slots.map((slot) => slot.skillId),
    [
      "s1",
      "s2",
      null,
      null,
      "ult"
    ]
  );
});

test("ultimate slot still respects the ultimate skill required level", () => {
  const projected =
    projectCapturePlannedLoadoutsToCombatV1({
      progressionRules,
      creatureDrafts: [creature(5)],
      skillDrafts: [
        skill("ult", {
          loadoutSlot: "ultimate",
          requiredLevel: 10
        })
      ],
      loadouts: [{
        schema: "capture-active-skill-loadout-v1",
        creatureId: "crea-test",
        slots: [
          { id: "slot-1", skillId: null },
          { id: "slot-2", skillId: null },
          { id: "slot-3", skillId: null },
          { id: "slot-4", skillId: null },
          { id: "slot-ultimate", skillId: "ult" }
        ]
      }]
    })[0];

  assert.equal(
    projected.slots[4].skillId,
    null
  );
});

test("planned loadout rejects standard/ultimate slot mismatches", () => {
  assert.throws(
    () => projectCapturePlannedLoadoutsToCombatV1({
      progressionRules,
      creatureDrafts: [creature(20)],
      skillDrafts: [
        skill("standard"),
        skill("ult", {
          loadoutSlot: "ultimate"
        })
      ],
      loadouts: [{
        schema: "capture-active-skill-loadout-v1",
        creatureId: "crea-test",
        slots: [
          { id: "slot-1", skillId: "ult" },
          { id: "slot-2", skillId: null },
          { id: "slot-3", skillId: null },
          { id: "slot-4", skillId: null },
          { id: "slot-ultimate", skillId: "standard" }
        ]
      }]
    }),
    /ultimate|standard|slot/i
  );
});

test("Human editor exposes one distinct ultimate slot and one explicit ultimate skill control", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.equal(
    (
      html.match(
        /data-loadout-slot-type="standard"/g
      ) ?? []
    ).length,
    4
  );
  assert.equal(
    (
      html.match(
        /data-loadout-slot-type="ultimate"/g
      ) ?? []
    ).length,
    1
  );
  assert.match(
    html,
    /data-skill-ultimate/
  );
  assert.match(
    source,
    /loadoutSlot/
  );
  assert.match(
    source,
    /CAPTURE_ULTIMATE_SKILL_SLOT_ID/
  );
});


test("Combat Export V3 carries the ultimate through the real planned-loadout projection without consuming a standard slot", () => {
  const local = {
    ...creature(1),
    id: "crea-local",
    displayName: "Locale",
    skillIds: ["s1", "s2", "s3", "s4", "ult"]
  };
  const enemy = {
    ...creature(20),
    id: "crea-enemy",
    displayName: "Ennemie",
    skillIds: ["enemy-hit"]
  };

  const exported =
    exportCaptureEditorDraftsToCombatExportV3({
      battleSetup: {
        schema:
          "capture-battle-setup-editor-draft-v1",
        id: "ultimate-slot-real-path",
        localActorId: "local-1",
        arenaId: null,
        skillSpeedMultiplier: 1,
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
      },
      creatureDrafts: [local, enemy],
      skillDrafts: [
        skill("s1"),
        skill("s2"),
        skill("s3"),
        skill("s4"),
        skill("ult", {
          loadoutSlot: "ultimate"
        }),
        skill("enemy-hit")
      ],
      loadouts: [
        {
          schema:
            "capture-active-skill-loadout-v1",
          creatureId: "crea-local",
          slots: [
            { id: "slot-1", skillId: "s1" },
            { id: "slot-2", skillId: "s2" },
            { id: "slot-3", skillId: "s3" },
            { id: "slot-4", skillId: "s4" },
            {
              id: "slot-ultimate",
              skillId: "ult"
            }
          ]
        },
        {
          schema:
            "capture-active-skill-loadout-v1",
          creatureId: "crea-enemy",
          slots: [
            {
              id: "slot-1",
              skillId: "enemy-hit"
            },
            { id: "slot-2", skillId: null },
            { id: "slot-3", skillId: null },
            { id: "slot-4", skillId: null }
          ]
        }
      ],
      progressionRules,
      metadata: {
        producer:
          "capture-ultimate-slot-v1-real-path-test"
      }
    });

  assert.deepEqual(
    exported.creatures.find(
      (entry) =>
        entry.id === "crea-local"
    ).skillIds,
    ["s1", "s2", "ult"]
  );
});
