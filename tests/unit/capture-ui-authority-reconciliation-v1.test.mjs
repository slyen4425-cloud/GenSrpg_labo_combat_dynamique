import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  buildHumanSkillDraftV1
} from "../../src/ui/capture-editor-human-v2.js";

function modernFields() {
  return {
    id: "authority-reconciliation",
    name: "Authority reconciliation",
    description: "",
    requiredLevel: 1,
    usageScopes: ["capture", "combat"],
    category: "offensive",
    form: "projectile",
    element: "ice",
    approachMode: "none",
    energyCost: 2,
    preparationMs: 500,
    travelMs: 600,
    recoveryMs: 200,
    cooldownMs: 2000,
    allowedDistances: ["short"],
    targetRelations: ["ally"],
    damage: 99,
    heal: 88,
    stunMs: 777,
    interruptsPreparation: true,
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
        channel: "water"
      },
      {
        kind: "apply_status",
        targetScope: "target",
        status: {
          id: "stun-test",
          kind: "stun",
          polarity: "detrimental",
          durationMs: 1000,
          stacking: "refresh",
          maxStacks: 1,
          tags: ["control"]
        }
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

test("modern tactical effects are the sole editable damage heal stun and target authority", () => {
  const draft = buildHumanSkillDraftV1(
    modernFields()
  );

  assert.equal(draft.definition.effect.damage, 0);
  assert.equal(draft.definition.effect.heal, 0);
  assert.equal(draft.definition.effect.stunMs, 0);
  assert.equal(
    draft.definition.effect.interruptsPreparation,
    false,
    "legacy preparation interruption must not remain a second stun authority"
  );

  assert.deepEqual(
    draft.definition.allowedDistances,
    ["short", "medium", "long"]
  );
  assert.deepEqual(
    draft.definition.targetRelations,
    ["enemy"]
  );

  assert.equal(
    draft.definition.effects[1].status.kind,
    "stun"
  );
});

test("Capture editor exposes no legacy duplicate gameplay controls", async () => {
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
    "data-skill-distance",
    "data-skill-interrupts"
  ]) {
    assert.equal(
      html.includes(forbidden),
      false,
      forbidden + " must not be an editable authority"
    );
  }

  assert.match(
    html,
    /Déclarer comme capacité Ultime \/ conditionnelle/i
  );
  assert.equal(
    html.includes("data-skill-effects-host"),
    true
  );
});

test("Human Editor source does not read removed legacy gameplay selectors", async () => {
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
    "[data-skill-distance]",
    "[data-skill-interrupts]"
  ]) {
    assert.equal(
      source.includes(selector),
      false,
      selector + " must not be read or written by Human Editor"
    );
  }
});

test("canonical line still hydrates both 70 portable and 33 complex native Capture skills", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    source,
    /capturePortableNativeSkillDraftsV1\(\)/
  );
  assert.match(
    source,
    /captureComplexNativeSkillDraftsV1\(\)/
  );
});

test("Defense coefficient remains exposed while reconciling skill UI", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );
  const ui = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    html,
    /data-stat-custom-damage-reduction-pct-per-point/
  );
  assert.match(
    ui,
    /data-stat-definition-damage-reduction-rate/
  );
});
