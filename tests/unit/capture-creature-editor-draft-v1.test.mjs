import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  CAPTURE_CREATURE_EDITOR_DRAFT_SCHEMA,
  normalizeCaptureCreatureEditorDraftV1
} from "../../src/contracts/capture-creature-editor-draft-v1.js";

function validDraft() {
  return {
    schema: "capture-creature-editor-draft-v1",
    id: "crea-braiseau",
    displayName: "Braiseau",
    description: "Créature de feu de test.",
    level: 12,
    sourceStats: {
      force: 18,
      agility: 15,
      intelligence: 8,
      spirit: 11,
      endurance: 16,
      initiative: 13
    },
    elements: ["fire"],
    resistances: [
      { kind: "element:fire", value: 35 },
      { kind: "element:water", value: -50 }
    ],
    capture: {
      capturable: true,
      captureRate: 45,
      spawnChance: 20,
      spawnTags: ["fire"],
      evolution: {
        condition: "level",
        level: 24,
        targetId: "crea-braisombre"
      }
    },
    combat: {
      maxHp: 42,
      initialHp: 42,
      maxEnergy: 10,
      initialEnergy: 0,
      energyChargeAmount: 1,
      energyChargeIntervalMs: 2000,
      movementEnergyPerStep: 2,
      chargeTimeModifierPct: -10
    },
    skillIds: ["fireball", "claw"],
    presentationId: "creature:braiseau"
  };
}

test("CaptureCreatureEditorDraftV1 normalizes a complete portable editor draft", () => {
  const value = normalizeCaptureCreatureEditorDraftV1(validDraft());

  assert.equal(
    CAPTURE_CREATURE_EDITOR_DRAFT_SCHEMA,
    "capture-creature-editor-draft-v1"
  );
  assert.equal(value.schema, CAPTURE_CREATURE_EDITOR_DRAFT_SCHEMA);
  assert.equal(value.displayName, "Braiseau");
  assert.equal(value.sourceStats.force, 18);
  assert.equal(value.combat.maxEnergy, 10);
  assert.equal(value.capture.evolution.targetId, "crea-braisombre");
  assert.deepEqual(value.skillIds, ["fireball", "claw"]);
  assert.equal(Object.isFrozen(value), true);
  assert.equal(Object.isFrozen(value.sourceStats), true);
  assert.equal(Object.isFrozen(value.capture), true);
  assert.equal(Object.isFrozen(value.capture.evolution), true);
  assert.equal(Object.isFrozen(value.combat), true);
  assert.equal(Object.isFrozen(value.skillIds), true);
  assert.equal(Object.isFrozen(value.resistances), true);
});

test("CaptureCreatureEditorDraftV1 requires explicit combat values", () => {
  const input = validDraft();
  delete input.combat.maxEnergy;

  assert.throws(
    () => normalizeCaptureCreatureEditorDraftV1(input),
    /combat\.maxEnergy/i
  );
});

test("CaptureCreatureEditorDraftV1 never derives combat values from source stats", () => {
  const input = validDraft();
  input.sourceStats = {
    force: 999,
    agility: 999,
    intelligence: 999,
    spirit: 999,
    endurance: 999,
    initiative: 999
  };
  delete input.combat.maxHp;

  assert.throws(
    () => normalizeCaptureCreatureEditorDraftV1(input),
    /combat\.maxHp/i
  );
});

test("CaptureCreatureEditorDraftV1 validates capture percentages", () => {
  const captureRate = validDraft();
  captureRate.capture.captureRate = 101;
  assert.throws(
    () => normalizeCaptureCreatureEditorDraftV1(captureRate),
    /captureRate/i
  );

  const spawnChance = validDraft();
  spawnChance.capture.spawnChance = -1;
  assert.throws(
    () => normalizeCaptureCreatureEditorDraftV1(spawnChance),
    /spawnChance/i
  );
});

test("CaptureCreatureEditorDraftV1 rejects duplicate skill IDs and element IDs", () => {
  const skills = validDraft();
  skills.skillIds.push("fireball");
  assert.throws(
    () => normalizeCaptureCreatureEditorDraftV1(skills),
    /skillIds.*duplicate/i
  );

  const elements = validDraft();
  elements.elements.push("fire");
  assert.throws(
    () => normalizeCaptureCreatureEditorDraftV1(elements),
    /elements.*duplicate/i
  );
});

test("CaptureCreatureEditorDraftV1 validates level evolution explicitly", () => {
  const input = validDraft();
  delete input.capture.evolution.level;

  assert.throws(
    () => normalizeCaptureCreatureEditorDraftV1(input),
    /evolution\.level/i
  );

  const manual = validDraft();
  manual.capture.evolution = {
    condition: "manual",
    targetId: "crea-braisombre"
  };
  const value = normalizeCaptureCreatureEditorDraftV1(manual);
  assert.equal(value.capture.evolution.condition, "manual");
  assert.equal(value.capture.evolution.level, null);
});

test("CaptureCreatureEditorDraftV1 rejects unknown semantic fields", () => {
  const input = validDraft();
  input.combat.forceMultiplier = 2;

  assert.throws(
    () => normalizeCaptureCreatureEditorDraftV1(input),
    /unknown field/i
  );
});

test("CaptureCreatureEditorDraftV1 is independent from UI, storage, network and GenSrpG", async () => {
  const source = await readFile(
    new URL(
      "../../src/contracts/capture-creature-editor-draft-v1.js",
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
    "captureFix"
  ]) {
    assert.equal(
      source.includes(forbidden),
      false,
      `contract source must not contain ${forbidden}`
    );
  }
});

test("Capture editor exposes every historical elemental type and resistance channel", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  for (const elementId of [
    "fire",
    "water",
    "earth",
    "air",
    "electric",
    "light",
    "shadow",
    "nature",
    "ice",
    "poison",
    "steel",
    "psy",
    "spirit"
  ]) {
    assert.match(
      html,
      new RegExp('data-element value="' + elementId + '"')
    );
    assert.match(
      html,
      new RegExp('data-resistance="' + elementId + '"')
    );
  }
});

