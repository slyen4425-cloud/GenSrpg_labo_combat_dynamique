import test from "node:test";
import assert from "node:assert/strict";

import {
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
    resistances: [],
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
      chargeTimeModifierPct: 0
    },
    skillIds: ["fireball"],
    presentation: {
      id: "creature:braiseau",
      version: 1,
      subjectType: "creature",
      subjectId: "crea-braiseau",
      profileId: "biped",
      visual: {
        front: {
          assetId: "capture:creature-braiseau-front"
        }
      },
      sockets: [],
      audio: {}
    }
  };
}

test("CaptureCreatureEditorDraftV2 normalized output is valid input to the same normalizer", () => {
  const first = normalizeCaptureCreatureEditorDraftV2(validInput());
  const second = normalizeCaptureCreatureEditorDraftV2(first);

  assert.deepEqual(second, first);
});

test("CaptureCreatureEditorDraftV2 keeps presentation as the single source of presentation identity", () => {
  const value = normalizeCaptureCreatureEditorDraftV2(validInput());

  assert.equal("presentationId" in value, false);
  assert.equal(value.presentation.id, "creature:braiseau");
});
