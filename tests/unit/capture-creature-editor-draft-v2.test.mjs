import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  CAPTURE_CREATURE_EDITOR_DRAFT_V2_SCHEMA,
  normalizeCaptureCreatureEditorDraftV2
} from "../../src/contracts/capture-creature-editor-draft-v2.js";

function validInput() {
  return {
    schema: "capture-creature-editor-draft-v2",
    id: "crea-braiseau",
    displayName: "Braiseau",
    description: "Créature de feu.",
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
      { kind: "element:fire", value: 35 }
    ],
    capture: {
      capturable: true,
      captureRate: 45,
      spawnChance: 20,
      spawnTags: ["fire"],
      evolution: null
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
    presentation: {
      id: "creature:braiseau",
      version: 1,
      subjectType: "creature",
      subjectId: "crea-braiseau",
      profileId: "biped",
      visual: {
        front: {
          assetId: "capture:creature-braiseau-front"
        },
        back: {
          assetId: "capture:creature-braiseau-back"
        },
        icon: {
          assetId: "capture:creature-braiseau-icon"
        }
      },
      sockets: [
        {
          id: "mouth",
          label: "Bouche",
          front: { x: 0.5, y: 0.2 },
          back: { x: 0.5, y: 0.2 }
        }
      ],
      audio: {
        attack: {
          assetId: "core:audio-creature-attack-01"
        },
        hit: {
          assetId: "core:audio-creature-hit-01"
        },
        ko: {
          assetId: "core:audio-creature-ko-01"
        }
      }
    }
  };
}

test("CaptureCreatureEditorDraftV2 composes creature gameplay/editor data with presentation", () => {
  const value = normalizeCaptureCreatureEditorDraftV2(validInput());

  assert.equal(
    CAPTURE_CREATURE_EDITOR_DRAFT_V2_SCHEMA,
    "capture-creature-editor-draft-v2"
  );
  assert.equal(value.id, "crea-braiseau");
  assert.equal(value.combat.maxHp, 42);
  assert.equal(value.presentation.subjectId, "crea-braiseau");
  assert.equal(
    value.presentation.visual.front.assetId,
    "capture:creature-braiseau-front"
  );
  assert.equal(value.presentationId, "creature:braiseau");
  assert.equal(Object.isFrozen(value), true);
  assert.equal(Object.isFrozen(value.combat), true);
  assert.equal(Object.isFrozen(value.presentation), true);
});

test("CaptureCreatureEditorDraftV2 delegates legacy/editor semantics to V1", () => {
  const input = validInput();
  input.capture.captureRate = 101;

  assert.throws(
    () => normalizeCaptureCreatureEditorDraftV2(input),
    /captureRate/i
  );
});

test("CaptureCreatureEditorDraftV2 delegates presentation semantics to CreaturePresentationBindingV1", () => {
  const input = validInput();
  input.presentation.visual.front.assetId = "./braiseau.png";

  assert.throws(
    () => normalizeCaptureCreatureEditorDraftV2(input),
    /assetId/i
  );
});

test("CaptureCreatureEditorDraftV2 requires presentation subjectId to match creature id", () => {
  const input = validInput();
  input.presentation.subjectId = "crea-other";

  assert.throws(
    () => normalizeCaptureCreatureEditorDraftV2(input),
    /presentation\.subjectId.*match/i
  );
});

test("CaptureCreatureEditorDraftV2 derives presentationId and rejects a second presentationId source", () => {
  const input = validInput();
  input.presentationId = "creature:other";

  assert.throws(
    () => normalizeCaptureCreatureEditorDraftV2(input),
    /unknown field/i
  );

  const value = normalizeCaptureCreatureEditorDraftV2(validInput());
  assert.equal(value.presentationId, value.presentation.id);
});

test("CaptureCreatureEditorDraftV2 allows a creature without presentation binding", () => {
  const input = validInput();
  input.presentation = null;

  const value = normalizeCaptureCreatureEditorDraftV2(input);

  assert.equal(value.presentation, null);
  assert.equal(value.presentationId, null);
});

test("CaptureCreatureEditorDraftV2 rejects unknown semantic fields", () => {
  const input = validInput();
  input.frontImage = "capture:bad-duplicate-owner";

  assert.throws(
    () => normalizeCaptureCreatureEditorDraftV2(input),
    /unknown field/i
  );
});

test("CaptureCreatureEditorDraftV2 stays independent from renderer, UI, storage and GenSrpG", async () => {
  const source = await readFile(
    new URL(
      "../../src/contracts/capture-creature-editor-draft-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  for (const forbidden of [
    "document.",
    "window.",
    "localStorage",
    "sessionStorage",
    "indexedDB",
    "fetch(",
    "XMLHttpRequest",
    "Zombicide-40k",
    "captureFix",
    "renderer/",
    "combat-runtime"
  ]) {
    assert.equal(
      source.includes(forbidden),
      false,
      `contract source must not contain ${forbidden}`
    );
  }
});
