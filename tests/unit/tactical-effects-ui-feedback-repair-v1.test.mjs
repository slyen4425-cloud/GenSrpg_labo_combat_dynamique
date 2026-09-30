import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  buildHumanSkillDraftV1
} from "../../src/ui/capture-editor-human-v2.js";

function baseFields() {
  return {
    id: "feedback-repair-test",
    name: "Feedback repair test",
    description: "",
    requiredLevel: 1,
    usageScopes: ["capture", "combat"],
    category: "offensive",
    form: "area",
    element: "fire",
    approachMode: "none",
    energyCost: 2,
    preparationMs: 500,
    travelMs: 0,
    recoveryMs: 200,
    cooldownMs: 2000,
    allowedDistances: ["short"],
    targetRelations: ["ally"],
    damage: 99,
    heal: 88,
    stunMs: 777,
    interruptsPreparation: false,
    activationRequirements: {
      mode: "all",
      conditions: [
        {
          type: "combat_elapsed_ms",
          threshold: 30000
        }
      ]
    },
    effects: [
      {
        kind: "damage",
        targetScope: "all_enemies",
        amount: 8,
        channel: "fire"
      },
      {
        kind: "heal",
        targetScope: "self",
        amount: 3
      }
    ],
    reaction: {
      blockForms: [],
      reflectForms: [],
      immuneElements: [],
      counterForms: [],
      evadeForms: [],
      evadeApproaches: []
    },
    projectileClash: {
      mode: "none",
      group: null,
      interactsWith: []
    },
    effectTags: [],
    presentation: {}
  };
}

test("Human Editor tactical effects are the only editable damage/heal/target authority", () => {
  const draft = buildHumanSkillDraftV1(baseFields());

  assert.equal(draft.definition.effect.damage, 0);
  assert.equal(draft.definition.effect.heal, 0);
  assert.equal(draft.definition.effect.stunMs, 0);

  assert.deepEqual(
    draft.definition.allowedDistances,
    ["short", "medium", "long"],
    "Capture editor no longer authors obsolete distance bands"
  );

  assert.deepEqual(
    draft.definition.targetRelations,
    ["enemy", "self"],
    "targetRelations is a derived compatibility projection of SkillEffectV1 scopes"
  );

  assert.deepEqual(
    draft.definition.activationRequirements,
    {
      mode: "all",
      conditions: [
        {
          type: "combat_elapsed_ms",
          threshold: 30000
        }
      ]
    },
    "ultimate activation remains independent from tactical effects"
  );
});

test("Capture editor removes legacy duplicate gameplay controls", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  for (const forbidden of [
    "data-skill-damage",
    "data-skill-heal",
    "data-skill-stun",
    "data-skill-target",
    "data-skill-distance"
  ]) {
    assert.equal(
      html.includes(forbidden),
      false,
      forbidden + " must not remain as a second editable authority"
    );
  }

  assert.match(
    html,
    /Déclarer comme capacité Ultime \/ conditionnelle/i
  );
  assert.equal(
    html.includes("data-skill-activation-enabled"),
    true
  );
  assert.equal(
    html.includes("data-skill-effects-host"),
    true
  );
});

test("Human Editor source no longer reads removed legacy gameplay controls", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  for (const selector of [
    "[data-skill-damage]",
    "[data-skill-heal]",
    "[data-skill-stun]",
    "[data-skill-target]",
    "[data-skill-distance]"
  ]) {
    assert.equal(
      source.includes(selector),
      false,
      selector + " must not be read or written by the Human Editor"
    );
  }
});

test("portable historical templates project into the same tactical effect authority", async () => {
  const {
    capturePortableLegacyTacticalEffectsV1
  } = await import(
    "../../src/ui/capture-editor-skill-catalog-v1.js"
  );

  assert.deepEqual(
    capturePortableLegacyTacticalEffectsV1(
      "lib_quake"
    ),
    [
      {
        kind: "damage",
        targetScope: "all_enemies",
        amount: 4,
        channel: "earth"
      }
    ]
  );

  assert.deepEqual(
    capturePortableLegacyTacticalEffectsV1(
      "lib_lifesteal_strike"
    ),
    [
      {
        kind: "damage",
        targetScope: "target",
        amount: 4,
        channel: "shadow"
      },
      {
        kind: "heal",
        targetScope: "self",
        amount: 2
      }
    ]
  );
});

