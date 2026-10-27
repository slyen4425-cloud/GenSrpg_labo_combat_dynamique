import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  exportCaptureEditorDraftsToCombatExportV1
} from "../../src/adapters/input/capture/capture-editor-exporter-v1.js";
import {
  adaptCaptureCombatExportStackV1
} from "../../src/adapters/input/capture/capture-export-adapter-stack-v1.js";

function creatureDraft(id, name, skillIds, maxHp) {
  return {
    schema: "capture-creature-editor-draft-v1",
    id,
    displayName: name,
    description: `${name} editor draft`,
    level: 10,
    sourceStats: {
      force: id === "braiseau" ? 999 : 12,
      agility: 11,
      intelligence: 8,
      spirit: 9,
      endurance: 14,
      initiative: 10
    },
    elements: id === "braiseau" ? ["fire"] : ["water"],
    resistances: [],
    capture: {
      capturable: true,
      captureRate: 40,
      spawnChance: 25,
      spawnTags: ["wild"],
      evolution: null
    },
    combat: {
      maxHp,
      initialHp: maxHp,
      maxEnergy: 10,
      initialEnergy: 0,
      energyChargeAmount: 1,
      energyChargeIntervalMs: 2000,
      movementEnergyPerStep: 2,
      chargeTimeModifierPct: 0
    },
    skillIds,
    presentationId: `creature:${id}`
  };
}

function skillDraft(id, name, element, presentationId = null) {
  return {
    schema: "capture-skill-editor-draft-v1",
    id,
    description: `${name} editor draft`,
    requiredLevel: 1,
    usageScopes: ["capture", "combat"],
    definition: {
      id,
      name,
      category: "offensive",
      form: id === "fireball" ? "projectile" : "contact",
      element,
      approachMode: id === "fireball" ? "none" : "ground",
      energyCost: 2,
      preparationMs: 500,
      travelMs: 600,
      recoveryMs: 300,
      allowedDistances: ["short", "medium", "long"],
      targetRelations: ["enemy"],
      effect: {
        damage: id === "fireball" ? 4 : 3
      }
    },
    presentation:
      presentationId == null
        ? null
        : {
            id: presentationId,
            version: 1,
            subjectType: "skill",
            subjectId: id,
            visual: {
              icon: {
                assetId: `capture:icon-${id}`
              }
            },
            audio: {}
          }
  };
}

function validInput() {
  return {
    battle: {
      id: "editor-export-test",
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
        creatureId: "braiseau",
        displayName: "Braiseau",
        controllerId: "human-local"
      },
      {
        actorId: "opponent",
        teamId: "enemies",
        creatureId: "aquafin",
        displayName: "Aquafin",
        controllerId: "ai-enemy"
      }
    ],
    rosters: [
      {
        slotId: "player",
        activeMemberId: "p-braiseau",
        members: [
          {
            id: "p-braiseau",
            creatureId: "braiseau",
            displayName: "Braiseau"
          }
        ]
      },
      {
        slotId: "opponent",
        activeMemberId: "o-aquafin",
        members: [
          {
            id: "o-aquafin",
            creatureId: "aquafin",
            displayName: "Aquafin"
          }
        ]
      }
    ],
    creatureDrafts: [
      creatureDraft("braiseau", "Braiseau", ["fireball"], 42),
      creatureDraft("aquafin", "Aquafin", ["claw"], 36)
    ],
    skillDrafts: [
      skillDraft("fireball", "Boule de feu", "fire", "skill:fireball"),
      skillDraft("claw", "Griffe", null)
    ],
    metadata: {
      producer: "capture-editor-test"
    }
  };
}

test("Capture editor exporter builds a normalized CaptureCombatExportV1", () => {
  const value = exportCaptureEditorDraftsToCombatExportV1(validInput());

  assert.equal(value.schema, "capture-combat-export-v1");
  assert.equal(value.creatures.length, 2);
  assert.equal(value.skills.length, 2);
  assert.equal(value.battle.localActorId, "player");
  assert.equal(Object.isFrozen(value), true);
});

test("Capture editor exporter preserves editor metadata without deriving combat", () => {
  const value = exportCaptureEditorDraftsToCombatExportV1(validInput());
  const braiseau = value.creatures.find((item) => item.id === "braiseau");

  assert.equal(braiseau.combat.maxHp, 42);
  assert.equal(braiseau.combat.maxEnergy, 10);
  assert.equal(braiseau.metadata.editor.sourceStats.force, 999);
  assert.equal(braiseau.metadata.editor.level, 10);
  assert.equal(braiseau.metadata.editor.capture.captureRate, 40);
});

test("Capture editor exporter places presentation bindings in the portable export", () => {
  const value = exportCaptureEditorDraftsToCombatExportV1(validInput());
  const fireball = value.skills.find((item) => item.id === "fireball");
  const claw = value.skills.find((item) => item.id === "claw");

  assert.equal(fireball.presentationId, "skill:fireball");
  assert.equal(claw.presentationId, null);
  assert.equal(
    value.presentation.skills["skill:fireball"].subjectId,
    "fireball"
  );
});

test("Capture editor exporter output is consumed by the authoritative adapter stack", () => {
  const exported = exportCaptureEditorDraftsToCombatExportV1(validInput());
  const native = adaptCaptureCombatExportStackV1(exported);

  const player = native.fighters.find((fighter) => fighter.id === "player");
  assert.equal(player.maxHp, 42);
  assert.equal(native.skills.fireball.form, "projectile");
  assert.deepEqual(native.skillIdsByActor.player, ["fireball"]);
  assert.equal(
    native.skillPresentations.fireball.id,
    "skill:fireball"
  );
});

test("Capture editor exporter delegates cross references to CaptureCombatExportV1", () => {
  const badActor = validInput();
  badActor.actors[0].creatureId = "missing-creature";
  assert.throws(
    () => exportCaptureEditorDraftsToCombatExportV1(badActor),
    /unknown creature/i
  );

  const badSkill = validInput();
  badSkill.creatureDrafts[0].skillIds = ["missing-skill"];
  assert.throws(
    () => exportCaptureEditorDraftsToCombatExportV1(badSkill),
    /unknown skill/i
  );
});

test("Capture editor exporter rejects duplicate draft and presentation identifiers", () => {
  const duplicateCreature = validInput();
  duplicateCreature.creatureDrafts.push(
    creatureDraft("braiseau", "Duplicate Braiseau", [], 20)
  );
  assert.throws(
    () => exportCaptureEditorDraftsToCombatExportV1(duplicateCreature),
    /duplicate creature draft id/i
  );

  const duplicateSkill = validInput();
  duplicateSkill.skillDrafts.push(
    skillDraft("fireball", "Duplicate Fireball", "fire")
  );
  assert.throws(
    () => exportCaptureEditorDraftsToCombatExportV1(duplicateSkill),
    /duplicate skill draft id/i
  );

  const duplicatePresentation = validInput();
  duplicatePresentation.skillDrafts[1] = skillDraft(
    "claw",
    "Griffe",
    null,
    "skill:fireball"
  );
  assert.throws(
    () => exportCaptureEditorDraftsToCombatExportV1(duplicatePresentation),
    /duplicate presentation binding id/i
  );
});

test("Capture editor exporter is independent from UI, storage, network and GenSrpG", async () => {
  const source = await readFile(
    new URL(
      "../../src/adapters/input/capture/capture-editor-exporter-v1.js",
      import.meta.url
    ),
    "utf8"
  );

  for (const forbidden of [
    "document.",
    "window.",
    "localStorage",
    "sessionStorage",
    "fetch(",
    "XMLHttpRequest",
    "Zombicide-40k",
    "captureFix",
    "openAbilityLibrary"
  ]) {
    assert.equal(
      source.includes(forbidden),
      false,
      `exporter source must not contain ${forbidden}`
    );
  }
});
