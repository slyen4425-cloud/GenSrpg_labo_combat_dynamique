import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  buildCaptureCreatureDraftFromEditorFieldsV1,
  buildCaptureSkillDraftFromEditorFieldsV1,
  buildCaptureEditorExportFromFieldsV1
} from "../../src/ui/capture-editor-test-ui.js";

function creatureFields() {
  return {
    id: "crea-braiseau",
    displayName: "Braiseau",
    description: "Créature de feu.",
    level: "12",
    statForce: "18",
    statAgility: "15",
    statIntelligence: "8",
    statSpirit: "11",
    statEndurance: "16",
    statInitiative: "13",
    elementsCsv: "fire",
    resistancesJson: JSON.stringify([
      { kind: "element:fire", value: 35 }
    ]),
    capturable: true,
    captureRate: "45",
    spawnChance: "20",
    spawnTagsCsv: "fire, volcanic",
    evolutionCondition: "level",
    evolutionLevel: "24",
    evolutionTargetId: "crea-braisombre",
    maxHp: "42",
    initialHp: "42",
    maxEnergy: "10",
    initialEnergy: "0",
    energyChargeAmount: "1",
    energyChargeIntervalMs: "2000",
    movementEnergyPerStep: "2",
    chargeTimeModifierPct: "-10",
    skillIdsCsv: "fireball",
    presentationId: "creature:braiseau"
  };
}

function skillFields() {
  return {
    id: "fireball",
    description: "Projectile de feu configurable.",
    requiredLevel: "5",
    usageScopesCsv: "capture, combat",
    definitionJson: JSON.stringify({
      id: "fireball",
      name: "Boule de feu",
      category: "offensive",
      form: "projectile",
      element: "fire",
      approachMode: "none",
      energyCost: 3,
      preparationMs: 900,
      travelMs: 650,
      recoveryMs: 450,
      allowedDistances: ["medium", "long"],
      targetRelations: ["enemy"],
      projectileClash: {
        mode: "mutual_cancel",
        group: "fire-orb",
        interactsWith: ["fire-orb"]
      },
      effect: {
        damage: 4,
        tags: ["fire"]
      }
    }),
    presentationJson: JSON.stringify({
      id: "skill:fireball",
      version: 1,
      subjectType: "skill",
      subjectId: "fireball",
      visual: {
        icon: {
          assetId: "capture:icon-fireball"
        }
      }
    })
  };
}

function opponentCreatureDraft() {
  return {
    schema: "capture-creature-editor-draft-v1",
    id: "crea-maraileron",
    displayName: "Maraileron",
    description: "Fixture adverse.",
    level: 10,
    sourceStats: {
      force: 10,
      agility: 12,
      intelligence: 8,
      spirit: 9,
      endurance: 11,
      initiative: 12
    },
    elements: ["water"],
    resistances: [],
    capture: {
      capturable: true,
      captureRate: 35,
      spawnChance: 20,
      spawnTags: ["water"],
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
    skillIds: ["water-wave"],
    presentationId: "creature:maraileron"
  };
}

function opponentSkillDraft() {
  return {
    schema: "capture-skill-editor-draft-v1",
    id: "water-wave",
    description: "Fixture adverse.",
    requiredLevel: 1,
    usageScopes: ["capture", "combat"],
    definition: {
      id: "water-wave",
      name: "Vague",
      category: "offensive",
      form: "projectile",
      element: "water",
      approachMode: "none",
      energyCost: 2,
      preparationMs: 700,
      travelMs: 500,
      recoveryMs: 400,
      allowedDistances: ["medium", "long"],
      targetRelations: ["enemy"],
      effect: {
        damage: 3,
        tags: ["water"]
      }
    },
    presentation: null
  };
}

function exportContext() {
  return {
    battle: {
      id: "capture-editor-preview",
      localActorId: "player"
    },
    teams: {
      players: ["player"],
      enemies: ["opponent"]
    },
    actors: [
      {
        actorId: "player",
        teamId: "players",
        creatureId: "crea-braiseau",
        displayName: "Braiseau",
        controllerId: "human-local"
      },
      {
        actorId: "opponent",
        teamId: "enemies",
        creatureId: "crea-maraileron",
        displayName: "Maraileron",
        controllerId: "ai-enemy"
      }
    ],
    rosters: [],
    additionalCreatureDrafts: [opponentCreatureDraft()],
    additionalSkillDrafts: [opponentSkillDraft()],
    metadata: {
      producer: "capture-editor-ui-v1"
    }
  };
}

test("Capture Editor UI converts explicit creature fields through the draft contract", () => {
  const draft =
    buildCaptureCreatureDraftFromEditorFieldsV1(creatureFields());

  assert.equal(draft.id, "crea-braiseau");
  assert.equal(draft.level, 12);
  assert.equal(draft.sourceStats.force, 18);
  assert.equal(draft.combat.maxHp, 42);
  assert.equal(draft.combat.chargeTimeModifierPct, -10);
  assert.deepEqual(draft.capture.spawnTags, ["fire", "volcanic"]);
});

test("Capture Editor UI converts skill JSON through native contracts without inference", () => {
  const draft =
    buildCaptureSkillDraftFromEditorFieldsV1(skillFields());

  assert.equal(draft.id, "fireball");
  assert.equal(draft.definition.form, "projectile");
  assert.equal(
    draft.presentation.visual.icon.assetId,
    "capture:icon-fireball"
  );

  const invalid = skillFields();
  const definition = JSON.parse(invalid.definitionJson);
  delete definition.form;
  invalid.definitionJson = JSON.stringify(definition);

  assert.throws(
    () => buildCaptureSkillDraftFromEditorFieldsV1(invalid),
    /form/i
  );
});

test("Capture Editor UI produces a real CaptureCombatExportV1 through the exporter", () => {
  const exported = buildCaptureEditorExportFromFieldsV1({
    creatureFields: creatureFields(),
    skillFields: skillFields(),
    context: exportContext()
  });

  assert.equal(exported.schema, "capture-combat-export-v1");
  assert.equal(exported.creatures.length, 2);
  assert.equal(exported.skills.length, 2);
  assert.equal(exported.creatures[0].combat.maxHp, 42);
  assert.equal(
    exported.presentation.skills["skill:fireball"].subjectId,
    "fireball"
  );
});

test("Capture Editor UI source does not own combat runtime, storage or GenSrpG integration", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-test-ui.js",
      import.meta.url
    ),
    "utf8"
  );

  for (const forbidden of [
    "createCombatSession",
    "createCombatRuntime",
    "localStorage",
    "sessionStorage",
    "indexedDB",
    "captureFix",
    "Zombicide-40k",
    "MutationObserver",
    "setInterval("
  ]) {
    assert.equal(
      source.includes(forbidden),
      false,
      `Capture editor UI must not contain ${forbidden}`
    );
  }
});

test("Capture Editor preview page exposes dedicated forms and output surfaces", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor.html",
      import.meta.url
    ),
    "utf8"
  );

  for (const marker of [
    "data-capture-editor",
    "data-capture-creature-form",
    "data-capture-skill-form",
    "data-capture-editor-submit",
    "data-capture-editor-status",
    "data-capture-editor-output"
  ]) {
    assert.equal(
      html.includes(marker),
      true,
      `Capture editor page must contain ${marker}`
    );
  }

  assert.equal(
    html.includes("coop-2v2.js"),
    false,
    "Capture editor page must not boot the combat UI"
  );
});
