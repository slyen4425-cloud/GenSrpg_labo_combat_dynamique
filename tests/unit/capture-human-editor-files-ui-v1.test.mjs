import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  buildCaptureEditorDatabaseV1,
  applyCaptureTransferPlanToEditorStateV1
} from "../../src/ui/capture-editor-file-transfer-v1.js";

function registry() {
  return {
    schema: "capture-stat-registry-v1",
    stats: [
      {
        id: "physical",
        label: "Force",
        damageChannel: "physical",
        resistanceChannel: null,
        damagePctPerPoint: 1,
        resistancePctPerPoint: 0,
        chargeTimeReductionPctPerPoint: 0
      }
    ]
  };
}

function progression() {
  return {
    schema: "capture-progression-rules-v1",
    maxActiveSkills: 4,
    slotUnlockSchedule: [
      { level: 1, slots: 4 }
    ]
  };
}

function skill(id = "cap-air") {
  return {
    schema: "capture-skill-editor-draft-v1",
    id,
    description: "Capacité test",
    requiredLevel: 1,
    usageScopes: ["capture", "combat"],
    definition: {
      id,
      name: "Souffle",
      category: "offensive",
      form: "projectile",
      element: "air",
      approachMode: "none",
      energyCost: 1,
      preparationMs: 100,
      travelMs: 200,
      recoveryMs: 100,
      cooldownMs: 500,
      allowedDistances: ["short", "medium", "long"],
      targetRelations: ["enemy"],
      projectileClash: { power: 1 },
      effect: {
        damage: 0,
        heal: 0,
        stunMs: 0,
        interruptsPreparation: false,
        tags: []
      },
      effects: [
        {
          kind: "damage",
          targetScope: "target",
          amount: 4,
          channel: "air"
        }
      ]
    },
    presentation: null
  };
}

function creatureRecord(id = "crea_ailevent") {
  return {
    draft: {
      schema: "capture-creature-editor-draft-v3",
      id,
      displayName: "Ailevent",
      description: "Oisillon des courants.",
      level: 5,
      sourceStats: {
        force: 9,
        agility: 17,
        intelligence: 9,
        spirit: 9,
        endurance: 8,
        initiative: 20
      },
      elements: ["air"],
      resistances: [],
      capture: {
        capturable: true,
        captureRate: 62,
        spawnChance: 18,
        spawnTags: ["air"],
        evolution: null
      },
      combat: {
        maxHp: 16,
        initialHp: 16,
        maxEnergy: 10,
        initialEnergy: 0,
        energyChargeAmount: 1,
        energyChargeIntervalMs: 2000,
        movementEnergyPerStep: 1,
        chargeTimeModifierPct: 0
      },
      skillIds: ["cap-air"],
      presentation: null
    },
    statValues: {
      schema: "capture-creature-stat-values-v1",
      creatureId: id,
      values: {
        physical: 9
      }
    },
    loadout: {
      schema: "capture-active-skill-loadout-v1",
      creatureId: id,
      slots: [
        { id: "slot-1", skillId: "cap-air" },
        { id: "slot-2", skillId: null },
        { id: "slot-3", skillId: null },
        { id: "slot-4", skillId: null }
      ]
    }
  };
}

test("editor session composes one CaptureDatabaseV1 from its canonical Maps", () => {
  const configuredSkills = new Map([
    ["cap-air", skill()]
  ]);
  const configuredCreatures = new Map([
    ["crea_ailevent", creatureRecord()]
  ]);

  const database = buildCaptureEditorDatabaseV1({
    statRegistry: registry(),
    progressionRules: progression(),
    configuredCreatures,
    configuredSkills,
    metadata: {
      producer: "human-editor"
    }
  });

  assert.equal(database.schema, "capture-database-v1");
  assert.equal(database.creatures.length, 1);
  assert.equal(database.skills.length, 1);
  assert.equal(database.creatures[0].draft.id, "crea_ailevent");
  assert.equal(database.skills[0].id, "cap-air");

  for (const forbidden of [
    "battle",
    "teams",
    "actors",
    "rosters",
    "statEffects",
    "statEffectRulesById"
  ]) {
    assert.equal(forbidden in database, false);
  }
});

test("entity insert replace and noop plans apply only to the existing session Maps", () => {
  const configuredSkills = new Map([
    ["cap-air", skill()]
  ]);
  const configuredCreatures = new Map([
    ["crea_ailevent", creatureRecord()]
  ]);

  const inserted = skill("cap-water");
  applyCaptureTransferPlanToEditorStateV1({
    plan: {
      action: "insert-skill",
      kind: "skill",
      id: "cap-water",
      value: inserted
    },
    configuredCreatures,
    configuredSkills,
    statRegistry: registry(),
    progressionRules: progression()
  });
  assert.equal(
    configuredSkills.get("cap-water"),
    inserted
  );

  const replaced = {
    ...skill(),
    description: "Remplacée"
  };
  applyCaptureTransferPlanToEditorStateV1({
    plan: {
      action: "replace-skill",
      kind: "skill",
      id: "cap-air",
      value: replaced
    },
    configuredCreatures,
    configuredSkills,
    statRegistry: registry(),
    progressionRules: progression()
  });
  assert.equal(
    configuredSkills.get("cap-air"),
    replaced
  );

  const beforeSize = configuredSkills.size;
  applyCaptureTransferPlanToEditorStateV1({
    plan: {
      action: "noop",
      kind: "skill",
      id: "cap-air",
      value: replaced
    },
    configuredCreatures,
    configuredSkills,
    statRegistry: registry(),
    progressionRules: progression()
  });
  assert.equal(configuredSkills.size, beforeSize);
});

test("replace-database replaces both Maps and returns the new global owners", () => {
  const configuredSkills = new Map([
    ["old-skill", skill("old-skill")]
  ]);
  const configuredCreatures = new Map();

  const replacement = buildCaptureEditorDatabaseV1({
    statRegistry: registry(),
    progressionRules: progression(),
    configuredCreatures: new Map([
      ["crea_ailevent", creatureRecord()]
    ]),
    configuredSkills: new Map([
      ["cap-air", skill()]
    ])
  });

  const result = applyCaptureTransferPlanToEditorStateV1({
    plan: {
      action: "replace-database",
      kind: "database",
      id: null,
      value: replacement
    },
    configuredCreatures,
    configuredSkills,
    statRegistry: null,
    progressionRules: null
  });

  assert.deepEqual(
    [...configuredSkills.keys()],
    ["cap-air"]
  );
  assert.deepEqual(
    [...configuredCreatures.keys()],
    ["crea_ailevent"]
  );
  assert.deepEqual(
    result.statRegistry,
    replacement.statRegistry
  );
  assert.deepEqual(
    result.progressionRules,
    replacement.progressionRules
  );
});

test("Human Editor page exposes the five explicit file controls", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  for (const marker of [
    "data-export-current-creature",
    "data-export-current-skill",
    "data-export-database",
    "data-import-capture-json",
    "data-import-replace-existing"
  ]) {
    assert.equal(
      html.includes(marker),
      true,
      marker + " must be present"
    );
  }
});

test("Human Editor wires the authoritative transfer adapters and no browser storage", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  for (const owner of [
    "exportCaptureCreatureTransferJsonV1",
    "exportCaptureSkillTransferJsonV1",
    "importCaptureTransferJsonV1",
    "planCaptureTransferImportV1",
    "exportCaptureDatabaseJsonV1",
    "buildCaptureEditorDatabaseV1",
    "applyCaptureTransferPlanToEditorStateV1"
  ]) {
    assert.equal(
      source.includes(owner),
      true,
      owner + " must be wired"
    );
  }

  for (const forbidden of [
    "localStorage",
    "sessionStorage",
    "indexedDB"
  ]) {
    assert.equal(
      source.includes(forbidden),
      false,
      forbidden + " must not become persistence"
    );
  }
});

test("browser file IO stays in Human Editor and outside pure session helper", async () => {
  const helper = await readFile(
    new URL(
      "../../src/ui/capture-editor-file-transfer-v1.js",
      import.meta.url
    ),
    "utf8"
  );

  for (const forbidden of [
    "document.",
    "window.",
    "Blob(",
    "URL.createObjectURL",
    ".text()",
    "FileReader"
  ]) {
    assert.equal(
      helper.includes(forbidden),
      false,
      forbidden + " must stay outside pure helper"
    );
  }
});
