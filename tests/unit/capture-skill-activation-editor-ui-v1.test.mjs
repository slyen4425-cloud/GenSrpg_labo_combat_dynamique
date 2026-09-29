import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const uiModuleUrl =
  "../../src/ui/capture-editor-human-v2.js";

test("Human Editor converts activation time between readable seconds and contract milliseconds", async () => {
  const ui = await import(uiModuleUrl);

  assert.equal(
    typeof ui.humanSkillActivationThresholdToContractV1,
    "function"
  );
  assert.equal(
    typeof ui.humanSkillActivationThresholdFromContractV1,
    "function"
  );

  assert.equal(
    ui.humanSkillActivationThresholdToContractV1(
      "combat_elapsed_ms",
      12.5
    ),
    12500
  );
  assert.equal(
    ui.humanSkillActivationThresholdFromContractV1(
      "combat_elapsed_ms",
      12500
    ),
    12.5
  );
  assert.equal(
    ui.humanSkillActivationThresholdToContractV1(
      "damage_taken",
      50
    ),
    50
  );
  assert.equal(
    ui.humanSkillActivationThresholdFromContractV1(
      "hp_at_or_below_pct",
      35
    ),
    35
  );
});

test("Human Editor builds all/any activation requirements without mixing requiredLevel", async () => {
  const ui = await import(uiModuleUrl);

  assert.equal(
    typeof ui.buildHumanSkillActivationRequirementsV1,
    "function"
  );

  const requirements =
    ui.buildHumanSkillActivationRequirementsV1({
      enabled: true,
      mode: "any",
      conditions: [
        {
          type: "combat_elapsed_ms",
          value: 30
        },
        {
          type: "damage_taken",
          value: 80
        }
      ]
    });

  assert.deepEqual(requirements, {
    mode: "any",
    conditions: [
      {
        type: "combat_elapsed_ms",
        threshold: 30000
      },
      {
        type: "damage_taken",
        threshold: 80
      }
    ]
  });

  assert.deepEqual(
    ui.buildHumanSkillActivationRequirementsV1({
      enabled: false,
      mode: "any",
      conditions: [
        {
          type: "damage_taken",
          value: 80
        }
      ]
    }),
    {
      mode: "all",
      conditions: []
    }
  );
});

test("Human Editor refuses enabled activation with no condition", async () => {
  const ui = await import(uiModuleUrl);

  assert.throws(
    () =>
      ui.buildHumanSkillActivationRequirementsV1({
        enabled: true,
        mode: "all",
        conditions: []
      }),
    /au moins une condition/i
  );
});

test("buildHumanSkillDraftV1 round-trips activation requirements while requiredLevel stays separate", async () => {
  const ui = await import(uiModuleUrl);

  const draft = ui.buildHumanSkillDraftV1({
    id: "ultimate-test",
    name: "Ultime test",
    description: "Capacité ultime conditionnelle.",
    requiredLevel: 20,
    usageScopes: ["capture", "combat"],
    category: "offensive",
    form: "projectile",
    element: "fire",
    approachMode: "none",
    energyCost: 5,
    preparationMs: 1000,
    travelMs: 500,
    recoveryMs: 500,
    cooldownMs: 10000,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["enemy"],
    damage: 100,
    heal: 0,
    stunMs: 0,
    interruptsPreparation: false,
    activationRequirements: {
      mode: "all",
      conditions: [
        {
          type: "combat_elapsed_ms",
          threshold: 30000
        },
        {
          type: "damage_dealt",
          threshold: 100
        }
      ]
    },
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
  });

  assert.equal(draft.requiredLevel, 20);
  assert.deepEqual(
    draft.definition.activationRequirements,
    {
      mode: "all",
      conditions: [
        {
          type: "combat_elapsed_ms",
          threshold: 30000
        },
        {
          type: "damage_dealt",
          threshold: 100
        }
      ]
    }
  );
});

test("Capture editor HTML exposes understandable ultimate activation controls", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  for (const marker of [
    "data-skill-activation-enabled",
    "data-skill-activation-config",
    "data-skill-activation-mode",
    "data-skill-activation-conditions-host",
    "data-skill-activation-add"
  ]) {
    assert.equal(
      html.includes(marker),
      true,
      marker + " must exist in the Skills editor"
    );
  }

  for (const label of [
    "Conditions d’activation",
    "Toutes les conditions",
    "Au moins une condition",
    "Temps de combat écoulé",
    "Dégâts infligés",
    "Dégâts subis",
    "PV ≤"
  ]) {
    assert.equal(
      html.includes(label),
      true,
      label + " must be understandable in the editor"
    );
  }
});


test("historical skill template merge preserves existing activation requirements", async () => {
  const {
    mergeCaptureLegacyAbilityTemplateIntoEditorFieldsV1
  } = await import(
    "../../src/ui/capture-editor-skill-catalog-v1.js"
  );

  const activationRequirements = {
    mode: "any",
    conditions: [
      {
        type: "damage_taken",
        threshold: 50
      }
    ]
  };

  const merged =
    mergeCaptureLegacyAbilityTemplateIntoEditorFieldsV1(
      {
        id: "draft",
        name: "Draft",
        description: "Draft",
        category: "offensive",
        element: null,
        requiredLevel: 1,
        damage: 0,
        heal: 0,
        activationRequirements
      },
      "basic_attack"
    );

  assert.deepEqual(
    merged.activationRequirements,
    activationRequirements
  );
});

test("Human Editor edits activation data but never evaluates runtime activation state", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  for (const forbidden of [
    "skill-activation-requirements-v1.js",
    "evaluateSkillActivationRequirementsV1",
    "damageDealtTotal",
    "damageTakenTotal"
  ]) {
    assert.equal(
      source.includes(forbidden),
      false,
      "Human Editor must not own runtime activation logic: " +
        forbidden
    );
  }
});
