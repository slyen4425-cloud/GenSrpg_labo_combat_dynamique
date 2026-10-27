import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  buildHumanSkillDraftV1
} from "../../src/ui/capture-editor-human-v2.js";

function fields() {
  return {
    id: "fireball",
    name: "Boule de feu",
    description: "Projectile de feu.",
    requiredLevel: 1,
    usageScopes: ["capture", "combat"],
    category: "offensive",
    form: "projectile",
    element: "fire",
    approachMode: "none",
    energyCost: 3,
    preparationMs: 900,
    travelMs: 650,
    recoveryMs: 450,
    cooldownMs: 2800,
    allowedDistances: ["medium", "long"],
    targetRelations: ["enemy"],
    damage: 4,
    heal: 0,
    stunMs: 0,
    interruptsPreparation: false,
    reaction: {
      blockForms: [],
      reflectForms: [],
      immuneElements: [],
      counterForms: [],
      evadeForms: [],
      evadeApproaches: []
    },
    projectileClash: {
      mode: "mutual_cancel",
      group: "fire-orb",
      interactsWith: ["fire-orb"]
    },
    presentation: {
      iconAssetId: "core:icon-skill-fireball-01",
      castAssetId: "pack:capture:sprite-fireball-cast-01",
      castDisplayScale: 1.6,
      travelAssetId: "pack:capture:sprite-fireball-travel-01",
      travelDisplayScale: 1.9,
      impactAssetId: "pack:capture:sprite-fireball-impact-01",
      impactDisplayScale: 1.7,
      socketId: "projectile",
      castLayerPlayer: "behind",
      castLayerOpponent: "front",
      travelLayerPlayer: "behind",
      travelLayerOpponent: "front",
      castAudioAssetId: null,
      impactAudioAssetId: null
    }
  };
}

test("human skill draft preserves separate cast travel and impact display scales", () => {
  const draft = buildHumanSkillDraftV1(fields());

  assert.equal(draft.presentation.visual.cast.displayScale, 1.6);
  assert.equal(draft.presentation.visual.travel.displayScale, 1.9);
  assert.equal(draft.presentation.visual.impact.displayScale, 1.7);
});

test("human editor exposes three explicit FX scale controls", async () => {
  const html = await readFile(
    new URL("../../examples/dom-demo/capture-editor-v2.html", import.meta.url),
    "utf8"
  );

  for (const marker of [
    "data-skill-cast-scale",
    "data-skill-travel-scale",
    "data-skill-impact-scale"
  ]) {
    assert.equal(html.includes(marker), true, "missing " + marker);
  }
});
