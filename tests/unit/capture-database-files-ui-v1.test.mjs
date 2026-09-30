import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  captureDatabaseFromEditorStateV1,
  applyCaptureImportPlanToEditorStateV1
} from "../../src/adapters/input/capture/capture-editor-database-state-v1.js";

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

function skill(id="skill-a") {
  return {
    schema:"capture-skill-editor-draft-v1",
    id,
    description:id,
    requiredLevel:1,
    usageScopes:["capture","combat"],
    definition:{
      id,
      name:id,
      category:"offensive",
      form:"contact",
      element:null,
      approachMode:"ground",
      energyCost:1,
      preparationMs:100,
      travelMs:100,
      recoveryMs:100,
      cooldownMs:0,
      allowedDistances:["short"],
      targetRelations:["enemy"],
      projectileClash:{power:0},
      effect:{
        damage:1,
        heal:0,
        stunMs:0,
        interruptsPreparation:false,
        tags:[]
      },
      effects:[]
    },
    presentation:null
  };
}

function record(id="crea-a") {
  return {
    draft:{
      schema:"capture-creature-editor-draft-v3",
      id,
      displayName:id,
      description:id,
      level:1,
      sourceStats:{
        force:1,
        agility:1,
        intelligence:1,
        spirit:1,
        endurance:1,
        initiative:1
      },
      elements:[],
      resistances:[],
      capture:{
        capturable:true,
        captureRate:50,
        spawnChance:10,
        spawnTags:[],
        evolution:null
      },
      combat:{
        maxHp:10,
        initialHp:10,
        maxEnergy:10,
        initialEnergy:0,
        energyChargeAmount:1,
        energyChargeIntervalMs:2000,
        movementEnergyPerStep:1,
        chargeTimeModifierPct:0
      },
      skillIds:["skill-a"],
      presentation:null
    },
    statValues:{
      schema:"capture-creature-stat-values-v1",
      creatureId:id,
      values:{physical:1}
    },
    loadout:{
      schema:"capture-active-skill-loadout-v1",
      creatureId:id,
      slots:[
        {id:"slot-1",skillId:"skill-a"},
        {id:"slot-2",skillId:null},
        {id:"slot-3",skillId:null},
        {id:"slot-4",skillId:null}
      ]
    }
  };
}

test("editor session adapter builds CaptureDatabaseV1 from the canonical Maps", () => {
  const configuredCreatures=
    new Map([["crea-a",record()]]);
  const configuredSkills=
    new Map([["skill-a",skill()]]);

  const database=
    captureDatabaseFromEditorStateV1({
      configuredCreatures,
      configuredSkills,
      statRegistry:registry(),
      progressionRules:progression(),
      metadata:{
        producer:"capture-human-v2"
      }
    });

  assert.equal(
    database.schema,
    "capture-database-v1"
  );
  assert.equal(database.creatures.length,1);
  assert.equal(database.skills.length,1);
  assert.equal(
    database.metadata.producer,
    "capture-human-v2"
  );
});

test("editor session import application returns new Maps and never mutates the supplied Maps", () => {
  const originalCreatures=
    new Map([["crea-a",record()]]);
  const originalSkills=
    new Map([["skill-a",skill()]]);
  const replacement=skill();
  replacement.definition.name="Remplacée";

  const state={
    configuredCreatures:originalCreatures,
    configuredSkills:originalSkills,
    statRegistry:registry(),
    progressionRules:progression()
  };

  const next=
    applyCaptureImportPlanToEditorStateV1({
      state,
      plan:{
        action:"replace-skill",
        kind:"skill",
        id:"skill-a",
        value:replacement
      }
    });

  assert.notEqual(
    next.configuredSkills,
    originalSkills
  );
  assert.equal(
    originalSkills.get("skill-a").definition.name,
    "skill-a"
  );
  assert.equal(
    next.configuredSkills.get("skill-a").definition.name,
    "Remplacée"
  );
});

test("replace-database swaps the canonical Maps and global owners together", () => {
  const replacementDb=
    captureDatabaseFromEditorStateV1({
      configuredCreatures:
        new Map([["crea-a",record()]]),
      configuredSkills:
        new Map([["skill-a",skill()]]),
      statRegistry:registry(),
      progressionRules:progression(),
      metadata:{producer:"replacement"}
    });

  const next=
    applyCaptureImportPlanToEditorStateV1({
      state:{
        configuredCreatures:new Map(),
        configuredSkills:new Map(),
        statRegistry:registry(),
        progressionRules:progression()
      },
      plan:{
        action:"replace-database",
        kind:"database",
        id:null,
        value:replacementDb
      }
    });

  assert.equal(
    next.configuredCreatures.size,
    1
  );
  assert.equal(
    next.configuredSkills.size,
    1
  );
  assert.deepEqual(
    next.statRegistry,
    replacementDb.statRegistry
  );
  assert.deepEqual(
    next.progressionRules,
    replacementDb.progressionRules
  );
});

test("Human Editor exposes creature skill database export plus JSON import and explicit replace", async () => {
  const html=await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  for(const marker of [
    "data-export-current-creature",
    "data-export-current-skill",
    "data-export-database",
    "data-import-json-button",
    "data-import-json-file",
    "data-import-replace"
  ]){
    assert.equal(
      html.includes(marker),
      true,
      marker+" must exist"
    );
  }

  assert.match(
    html,
    /Exporter cette créature/
  );
  assert.match(
    html,
    /Exporter cette capacité/
  );
  assert.match(
    html,
    /Exporter toute la base/
  );
});

test("Human Editor file flow composes Database and Entity Transfer owners instead of CombatExport", async () => {
  const source=await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  for(const required of [
    "exportCaptureCreatureTransferJsonV1",
    "exportCaptureSkillTransferJsonV1",
    "exportCaptureDatabaseJsonV1",
    "importCaptureTransferJsonV1",
    "planCaptureTransferImportV1",
    "captureDatabaseFromEditorStateV1",
    "applyCaptureImportPlanToEditorStateV1"
  ]){
    assert.equal(
      source.includes(required),
      true,
      required+" must be composed by UI"
    );
  }

  assert.equal(
    source.includes(
      "localStorage"
    ),
    false
  );
  assert.equal(
    source.includes(
      "sessionStorage"
    ),
    false
  );
});

test("Editor no longer tells the user that 110 duplicate historical creatures are loaded", async () => {
  const source=await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.equal(
    source.includes(
      "110 créatures Monster Capture chargées"
    ),
    false
  );
  assert.match(
    source,
    /102 créatures Monster Capture/
  );
});

test("session adapter stays independent from DOM files storage network and Runtime", async () => {
  const source=await readFile(
    new URL(
      "../../src/adapters/input/capture/capture-editor-database-state-v1.js",
      import.meta.url
    ),
    "utf8"
  );

  for(const forbidden of [
    "document.",
    "window.",
    "FileReader",
    "Blob(",
    "localStorage",
    "sessionStorage",
    "fetch(",
    "combat-runtime"
  ]){
    assert.equal(
      source.includes(forbidden),
      false,
      "session Database adapter must not depend on "+forbidden
    );
  }
});
