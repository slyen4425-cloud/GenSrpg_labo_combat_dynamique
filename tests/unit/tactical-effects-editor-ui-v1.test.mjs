import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const uiModuleUrl =
  "../../src/ui/capture-editor-human-v2.js";

function baseSkillFields() {
  return {
    id: "tactical-test",
    name: "Tactical test",
    description: "",
    requiredLevel: 1,
    usageScopes: ["capture", "combat"],
    category: "buff_debuff",
    form: "area",
    element: "poison",
    approachMode: "none",
    energyCost: 2,
    preparationMs: 500,
    travelMs: 0,
    recoveryMs: 200,
    cooldownMs: 2000,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["enemy", "ally", "self"],
    damage: 0,
    heal: 0,
    stunMs: 0,
    interruptsPreparation: false,
    activationRequirements: {
      mode: "all",
      conditions: []
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
  };
}

test("Human Editor converts tactical duration and tick seconds to contract milliseconds", async () => {
  const ui = await import(uiModuleUrl);

  assert.equal(
    typeof ui.humanTacticalSecondsToMsV1,
    "function"
  );
  assert.equal(
    typeof ui.humanTacticalMsToSecondsV1,
    "function"
  );

  assert.equal(
    ui.humanTacticalSecondsToMsV1(2.5),
    2500
  );
  assert.equal(
    ui.humanTacticalMsToSecondsV1(1250),
    1.25
  );
});

test("Human Editor builds immediate tactical effects with explicit scopes", async () => {
  const ui = await import(uiModuleUrl);

  assert.equal(
    typeof ui.buildHumanTacticalSkillEffectsV1,
    "function"
  );

  assert.deepEqual(
    ui.buildHumanTacticalSkillEffectsV1([
      {
        kind: "damage",
        targetScope: "all_enemies",
        amount: 8,
        channel: "fire"
      },
      {
        kind: "heal",
        targetScope: "all_allies",
        amount: 5
      },
      {
        kind: "energy_drain",
        targetScope: "target",
        amount: 2
      }
    ]),
    [
      {
        kind: "damage",
        targetScope: "all_enemies",
        amount: 8,
        channel: "fire"
      },
      {
        kind: "heal",
        targetScope: "all_allies",
        amount: 5
      },
      {
        kind: "energy_drain",
        targetScope: "target",
        amount: 2
      }
    ]
  );
});

test("Human Editor builds StatusEffectV1 payloads from readable seconds", async () => {
  const ui = await import(uiModuleUrl);

  const effects =
    ui.buildHumanTacticalSkillEffectsV1([
      {
        kind: "apply_status",
        targetScope: "target",
        status: {
          id: "poison",
          kind: "damage_over_time",
          polarity: "detrimental",
          durationSeconds: 6,
          stacking: "stack",
          maxStacks: 3,
          tags: ["poison"],
          amount: 2,
          channel: "poison",
          tickSeconds: 2
        }
      },
      {
        kind: "apply_status",
        targetScope: "self",
        status: {
          id: "speed-up",
          kind: "stat_modifier",
          polarity: "beneficial",
          durationSeconds: 4,
          stacking: "refresh",
          tags: ["buff"],
          statId: "speed",
          deltaPoints: 5
        }
      }
    ]);

  assert.equal(
    effects[0].status.durationMs,
    6000
  );
  assert.equal(
    effects[0].status.tickIntervalMs,
    2000
  );
  assert.equal(
    effects[1].status.durationMs,
    4000
  );
  assert.equal(
    effects[1].status.statId,
    "speed"
  );
});

test("buildHumanSkillDraftV1 carries tactical effects without changing legacy requiredLevel ownership", async () => {
  const ui = await import(uiModuleUrl);
  const fields = baseSkillFields();

  fields.effects =
    ui.buildHumanTacticalSkillEffectsV1([
      {
        kind: "apply_status",
        targetScope: "target",
        status: {
          id: "root",
          kind: "immobilize",
          polarity: "detrimental",
          durationSeconds: 3,
          stacking: "refresh",
          tags: ["control"]
        }
      }
    ]);

  const draft =
    ui.buildHumanSkillDraftV1(fields);

  assert.equal(draft.requiredLevel, 1);
  assert.equal(
    draft.definition.effects.length,
    1
  );
  assert.equal(
    draft.definition.effects[0].status.kind,
    "immobilize"
  );
  assert.equal(
    draft.definition.effects[0].status.durationMs,
    3000
  );
});

test("Human Editor exposes stat modifier choices only from the active stat registry", async () => {
  const ui = await import(uiModuleUrl);

  assert.equal(
    typeof ui.humanTacticalStatusStatIdsV1,
    "function"
  );

  const ids =
    ui.humanTacticalStatusStatIdsV1({
      schema: "capture-stat-registry-v1",
      stats: [
        {
          id: "speed",
          label: "Vitesse",
          damageChannel: null,
          resistanceChannel: null,
          damagePctPerPoint: 0,
          resistancePctPerPoint: 0,
          chargeTimeReductionPctPerPoint: 1
        },
        {
          id: "fire",
          label: "Feu",
          damageChannel: "fire",
          resistanceChannel: "fire",
          damagePctPerPoint: 1,
          resistancePctPerPoint: 1,
          chargeTimeReductionPctPerPoint: 0
        }
      ]
    });

  assert.deepEqual(ids, ["speed", "fire"]);
});

test("Capture editor HTML exposes the complete tactical effects surface and enables Buff/Debuff", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  for (const marker of [
    "data-skill-effects-host",
    "data-skill-effect-add"
  ]) {
    assert.equal(
      html.includes(marker),
      true,
      marker + " must exist"
    );
  }

  for (const label of [
    "Effets tactiques",
    "Dégâts de zone",
    "Soin",
    "Gain d’énergie",
    "Drain d’énergie",
    "Buff / Debuff",
    "Dégâts périodiques",
    "Soin périodique",
    "Bouclier",
    "Immobilisation",
    "Silence",
    "Stun",
    "Provocation",
    "Nettoyage",
    "Dissipation"
  ]) {
    assert.equal(
      html.includes(label),
      true,
      label + " must be visible"
    );
  }

  assert.doesNotMatch(
    html,
    /value="buff_debuff"\s+disabled/
  );
});

test("Human Editor remains presentation/input only for tactical effects", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  for (const forbidden of [
    "status-effect-runtime-v1.js",
    "applyStatusEffectV1",
    "advanceStatusEffectsV1",
    "computeCombatDamageV1",
    "applyCombatDamageV1"
  ]) {
    assert.equal(
      source.includes(forbidden),
      false,
      "Human Editor must not own runtime tactical logic: " +
        forbidden
    );
  }
});


test("historical template merge preserves already configured tactical effects", async () => {
  const {
    captureLegacySkillLibraryEntriesV1,
    mergeCaptureLegacyAbilityTemplateIntoEditorFieldsV1
  } = await import(
    "../../src/ui/capture-editor-skill-catalog-v1.js"
  );

  const effects = [
    {
      kind: "apply_status",
      targetScope: "target",
      status: {
        id: "root",
        kind: "immobilize",
        polarity: "detrimental",
        durationMs: 3000,
        stacking: "refresh",
        maxStacks: 1,
        tags: ["control"]
      }
    }
  ];

  const merged =
    mergeCaptureLegacyAbilityTemplateIntoEditorFieldsV1(
      {
        ...baseSkillFields(),
        effects
      },
      captureLegacySkillLibraryEntriesV1()[0].id
    );

  assert.deepEqual(
    merged.effects,
    effects
  );
});

test("tactical effects UI keeps a single-column mobile layout", async () => {
  const css = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.css",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    css,
    /@media \(max-width: 520px\)[\s\S]*?\.skill-effect-row__header,[\s\S]*?\.skill-status-config__grid,[\s\S]*?\.skill-status-config__specific[\s\S]*?grid-template-columns:\s*1fr/
  );
});


test("Human Editor builds a persistent damaging zone from readable fields", async () => {
  const ui = await import(uiModuleUrl);

  const effects =
    ui.buildHumanTacticalSkillEffectsV1([
      {
        kind: "persistent_zone",
        targetScope: "all_enemies",
        zoneId: "flames",
        radius: "short",
        durationSeconds: 10,
        tickSeconds: 1.5,
        reactivation: "reinforce",
        maxActivations: 3,
        radiusGrowthSteps: 1,
        tickDamage: 7,
        channel: "fire"
      }
    ]);

  assert.deepEqual(effects, [
    {
      kind: "persistent_zone",
      targetScope: "all_enemies",
      zoneId: "flames",
      radius: "short",
      durationMs: 10000,
      tickIntervalMs: 1500,
      reactivation: "reinforce",
      maxActivations: 3,
      radiusGrowthSteps: 1,
      tickEffect: {
        kind: "damage",
        targetScope: "all_enemies",
        amount: 7,
        channel: "fire"
      }
    }
  ]);
});

test("Human Editor source exposes all persistent-zone controls without owning its runtime", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  for (const marker of [
    "data-skill-zone-id",
    "data-skill-zone-radius",
    "data-skill-zone-duration-seconds",
    "data-skill-zone-tick-seconds",
    "data-skill-zone-reactivation",
    "data-skill-zone-max-activations",
    "data-skill-zone-radius-growth-steps",
    "data-skill-zone-tick-damage",
    "data-skill-zone-channel"
  ]) {
    assert.equal(
      source.includes(marker),
      true,
      marker + " must be owned by the Human Editor input surface"
    );
  }

  assert.equal(
    source.includes("persistent-zone-runtime-v1.js"),
    false,
    "Human Editor must not own persistent-zone runtime logic"
  );
});

test("Capture editor explains persistent evolving zones to the user", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  for (const label of [
    "Zone persistante",
    "rayon",
    "réactivation",
    "dégâts"
  ]) {
    assert.equal(
      html.toLowerCase().includes(
        label.toLowerCase()
      ),
      true,
      label + " must be explained in the Skills editor"
    );
  }
});
