import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeCaptureCreatureTransferV1
} from "../../src/contracts/capture-creature-transfer-v1.js";
import {
  normalizeCaptureSkillTransferV1
} from "../../src/contracts/capture-skill-transfer-v1.js";
import {
  exportCaptureCreatureTransferJsonV1,
  exportCaptureSkillTransferJsonV1,
  importCaptureTransferJsonV1,
  planCaptureTransferImportV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {
  normalizeCaptureDatabaseV1
} from "../../src/contracts/capture-database-v1.js";

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

function skillDraft(id="cap-air") {
  return {
    schema: "capture-skill-editor-draft-v1",
    id,
    description: "Capacité test",
    requiredLevel: 1,
    usageScopes: ["capture","combat"],
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
      allowedDistances: ["short","medium","long"],
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

function creatureDraft(id="crea_ailevent") {
  return {
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
  };
}

function creatureRecord(id="crea_ailevent") {
  return {
    draft: creatureDraft(id),
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
        {id:"slot-1",skillId:"cap-air"},
        {id:"slot-2",skillId:null},
        {id:"slot-3",skillId:null},
        {id:"slot-4",skillId:null}
      ]
    }
  };
}

function database() {
  return normalizeCaptureDatabaseV1({
    schema:"capture-database-v1",
    version:1,
    statRegistry:registry(),
    progressionRules:progression(),
    creatures:[creatureRecord()],
    skills:[skillDraft()],
    metadata:{}
  });
}

test("creature transfer wraps only one canonical creature record and no skill definitions", () => {
  const transfer =
    normalizeCaptureCreatureTransferV1(
      {
        schema:"capture-creature-transfer-v1",
        version:1,
        ...creatureRecord()
      },
      registry()
    );

  assert.equal(
    transfer.draft.id,
    "crea_ailevent"
  );
  assert.equal(
    "skills" in transfer,
    false
  );
  assert.deepEqual(
    transfer.draft.skillIds,
    ["cap-air"]
  );
});

test("skill transfer wraps one complete CaptureSkillEditorDraftV1", () => {
  const transfer =
    normalizeCaptureSkillTransferV1({
      schema:"capture-skill-transfer-v1",
      version:1,
      draft:skillDraft()
    });

  assert.equal(transfer.draft.id,"cap-air");
  assert.equal(
    transfer.draft.definition.projectileClash.power,
    1
  );
  assert.equal(
    transfer.draft.definition.effects[0].kind,
    "damage"
  );
});

test("creature and skill JSON round-trip exactly through the transfer adapter", () => {
  const creatureJson =
    exportCaptureCreatureTransferJsonV1(
      creatureRecord(),
      {statRegistry:registry()}
    );
  const creatureImported =
    importCaptureTransferJsonV1(
      creatureJson,
      {statRegistry:registry()}
    );

  assert.equal(creatureImported.kind,"creature");
  assert.deepEqual(
    creatureImported.value,
    normalizeCaptureCreatureTransferV1(
      {
        schema:"capture-creature-transfer-v1",
        version:1,
        ...creatureRecord()
      },
      registry()
    )
  );

  const skillJson =
    exportCaptureSkillTransferJsonV1(
      skillDraft()
    );
  const skillImported =
    importCaptureTransferJsonV1(
      skillJson,
      {statRegistry:registry()}
    );

  assert.equal(skillImported.kind,"skill");
  assert.deepEqual(
    skillImported.value.draft,
    normalizeCaptureSkillTransferV1({
      schema:"capture-skill-transfer-v1",
      version:1,
      draft:skillDraft()
    }).draft
  );
});

test("import auto-detects creature skill and full database schemas", () => {
  const creature =
    importCaptureTransferJsonV1(
      exportCaptureCreatureTransferJsonV1(
        creatureRecord(),
        {statRegistry:registry()}
      ),
      {statRegistry:registry()}
    );
  const skill =
    importCaptureTransferJsonV1(
      exportCaptureSkillTransferJsonV1(
        skillDraft()
      ),
      {statRegistry:registry()}
    );
  const full =
    importCaptureTransferJsonV1(
      JSON.stringify(database()),
      {statRegistry:registry()}
    );

  assert.equal(creature.kind,"creature");
  assert.equal(skill.kind,"skill");
  assert.equal(full.kind,"database");

  assert.throws(
    () =>
      importCaptureTransferJsonV1(
        JSON.stringify({
          schema:"unknown-transfer"
        }),
        {statRegistry:registry()}
      ),
    /schema|format|unsupported/i
  );
});

test("legacy creature ids are canonicalized before validation and conflict handling", () => {
  const legacy=creatureRecord("crea_galewing");
  legacy.draft.displayName="Ailevent";
  const json=JSON.stringify({
    schema:"capture-creature-transfer-v1",
    version:1,
    ...legacy
  });

  const imported=
    importCaptureTransferJsonV1(
      json,
      {statRegistry:registry()}
    );

  assert.equal(
    imported.value.draft.id,
    "crea_ailevent"
  );
  assert.equal(
    imported.value.statValues.creatureId,
    "crea_ailevent"
  );
  assert.equal(
    imported.value.loadout.creatureId,
    "crea_ailevent"
  );
});

test("import planner returns noop for identical content and reject for different conflicting content", () => {
  const current=database();
  const same=
    importCaptureTransferJsonV1(
      exportCaptureSkillTransferJsonV1(
        skillDraft()
      ),
      {statRegistry:registry()}
    );

  assert.equal(
    planCaptureTransferImportV1({
      currentDatabase:current,
      transfer:same,
      mode:"reject"
    }).action,
    "noop"
  );

  const changed=skillDraft();
  changed.definition.name="Souffle modifié";
  const different=
    importCaptureTransferJsonV1(
      exportCaptureSkillTransferJsonV1(
        changed
      ),
      {statRegistry:registry()}
    );

  assert.throws(
    () =>
      planCaptureTransferImportV1({
        currentDatabase:current,
        transfer:different,
        mode:"reject"
      }),
    /conflict|conflit|existing/i
  );
});

test("replace mode emits one explicit replacement and never field-merges", () => {
  const current=database();
  const changed=skillDraft();
  changed.definition.name="Souffle remplacé";
  const transfer=
    importCaptureTransferJsonV1(
      exportCaptureSkillTransferJsonV1(
        changed
      ),
      {statRegistry:registry()}
    );

  const plan=
    planCaptureTransferImportV1({
      currentDatabase:current,
      transfer,
      mode:"replace"
    });

  assert.equal(plan.action,"replace-skill");
  assert.equal(plan.id,"cap-air");
  assert.equal(
    plan.value.definition.name,
    "Souffle remplacé"
  );
  assert.equal(
    "patch" in plan,
    false
  );
});

test("database transfer conflicts as one database replacement, not a field merge", () => {
  const current=database();
  const changed={
    ...current,
    metadata:{versionLabel:"changed"}
  };
  const transfer=
    importCaptureTransferJsonV1(
      JSON.stringify(changed),
      {statRegistry:registry()}
    );

  assert.throws(
    () =>
      planCaptureTransferImportV1({
        currentDatabase:current,
        transfer,
        mode:"reject"
      }),
    /conflict|conflit/i
  );

  const plan=
    planCaptureTransferImportV1({
      currentDatabase:current,
      transfer,
      mode:"replace"
    });

  assert.equal(plan.action,"replace-database");
  assert.deepEqual(plan.value,transfer.value);
});

test("entity transfer source stays independent from DOM files storage network and Runtime", async () => {
  const sources=await Promise.all(
    [
      "../../src/contracts/capture-creature-transfer-v1.js",
      "../../src/contracts/capture-skill-transfer-v1.js",
      "../../src/adapters/input/capture/capture-entity-transfer-v1.js"
    ].map(relative =>
      readFile(
        new URL(relative,import.meta.url),
        "utf8"
      )
    )
  );

  for(const source of sources){
    for(const forbidden of [
      "document.",
      "window.",
      "localStorage",
      "sessionStorage",
      "FileReader",
      "Blob(",
      "fetch(",
      "combat-runtime"
    ]){
      assert.equal(
        source.includes(forbidden),
        false,
        "entity transfer must not depend on "+forbidden
      );
    }
  }
});
