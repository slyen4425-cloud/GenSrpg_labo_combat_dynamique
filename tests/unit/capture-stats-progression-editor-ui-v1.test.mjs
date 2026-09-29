import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const uiModuleUrl =
  "../../src/ui/capture-editor-human-v2.js";

test("Human Editor builds creature stat values through the validated registry owner", async () => {
  const ui = await import(uiModuleUrl);
  assert.equal(
    typeof ui.buildHumanCreatureStatValuesV1,
    "function"
  );

  const registry = {
    schema: "capture-stat-registry-v1",
    stats: [
      {
        id: "speed",
        label: "Vitesse",
        damageChannel: null,
        resistanceChannel: null
      },
      {
        id: "physical",
        label: "Puissance physique",
        damageChannel: "physical",
        resistanceChannel: "physical"
      },
      {
        id: "custom-focus",
        label: "Concentration",
        damageChannel: null,
        resistanceChannel: null
      }
    ]
  };

  const values =
    ui.buildHumanCreatureStatValuesV1({
      creatureId: "crea_test",
      values: {
        speed: 12,
        physical: 9,
        "custom-focus": 4
      },
      registry
    });

  assert.deepEqual(values.values, {
    speed: 12,
    physical: 9,
    "custom-focus": 4
  });
});

test("Human Editor can append a custom stat without hardcoding its id", async () => {
  const ui = await import(uiModuleUrl);
  assert.equal(
    typeof ui.addHumanCustomStatDefinitionV1,
    "function"
  );

  const result =
    ui.addHumanCustomStatDefinitionV1({
      registry: {
        schema: "capture-stat-registry-v1",
        stats: [
          {
            id: "speed",
            label: "Vitesse",
            damageChannel: null,
            resistanceChannel: null
          }
        ]
      },
      definition: {
        id: "frost",
        label: "Givre",
        damageChannel: "frost",
        resistanceChannel: "frost",
        damagePerPoint: 1.25,
        resistancePerPoint: 0.5
      }
    });

  assert.equal(result.stats.length, 2);
  assert.equal(result.stats[1].id, "frost");
  assert.equal(result.stats[1].damagePerPoint, 1.25);
  assert.equal(result.stats[1].resistancePerPoint, 0.5);
});

test("Human Editor composes the existing evolution contract explicitly by target id", async () => {
  const ui = await import(uiModuleUrl);
  assert.equal(
    typeof ui.buildHumanEvolutionV1,
    "function"
  );

  assert.equal(
    ui.buildHumanEvolutionV1({
      enabled: false,
      targetId: "crea_b",
      level: 20
    }),
    null
  );

  assert.deepEqual(
    ui.buildHumanEvolutionV1({
      enabled: true,
      targetId: "crea_b",
      level: 20
    }),
    {
      condition: "level",
      level: 20,
      targetId: "crea_b"
    }
  );
});

test("explicitly disabling evolution is not overwritten by an older hidden draft value", async () => {
  const {
    preserveUnrepresentedCreatureFieldsV1
  } = await import(uiModuleUrl);

  const result =
    preserveUnrepresentedCreatureFieldsV1({
      fields: {
        elements: [],
        resistances: [],
        capture: {
          spawnTags: [],
          evolution: null
        },
        combat: {}
      },
      evolutionRepresented: true,
      previousDraft: {
        elements: [],
        resistances: [],
        skillIds: [],
        capture: {
          spawnTags: [],
          evolution: {
            condition: "level",
            level: 10,
            targetId: "crea_old"
          }
        },
        combat: {},
        presentation: null
      }
    });

  assert.equal(result.capture.evolution, null);
});

test("Human Editor consumes progression rules to expose unlocked slots without replacing skill requiredLevel", async () => {
  const ui = await import(uiModuleUrl);
  assert.equal(
    typeof ui.humanLoadoutAvailabilityV1,
    "function"
  );

  const rules = {
    schema: "capture-progression-rules-v1",
    maxActiveSkills: 4,
    slotUnlockSchedule: [
      { level: 1, slots: 2 },
      { level: 10, slots: 3 },
      { level: 20, slots: 4 }
    ]
  };

  assert.deepEqual(
    ui.humanLoadoutAvailabilityV1({
      progressionRules: rules,
      creatureLevel: 9
    }),
    [true, true, false, false]
  );
  assert.deepEqual(
    ui.humanLoadoutAvailabilityV1({
      progressionRules: rules,
      creatureLevel: 20
    }),
    [true, true, true, true]
  );
});

test("Human Editor validates both slot unlock policy and per-skill requiredLevel", async () => {
  const ui = await import(uiModuleUrl);
  assert.equal(
    typeof ui.validateHumanLoadoutProgressionV1,
    "function"
  );

  const rules = {
    schema: "capture-progression-rules-v1",
    maxActiveSkills: 4,
    slotUnlockSchedule: [
      { level: 1, slots: 2 },
      { level: 10, slots: 3 },
      { level: 20, slots: 4 }
    ]
  };

  const baseLoadout = {
    schema: "capture-active-skill-loadout-v1",
    creatureId: "crea_test",
    slots: [
      { id: "slot-1", skillId: "skill-high" },
      { id: "slot-2", skillId: null },
      { id: "slot-3", skillId: null },
      { id: "slot-4", skillId: null }
    ]
  };

  assert.throws(
    () =>
      ui.validateHumanLoadoutProgressionV1({
        loadout: baseLoadout,
        progressionRules: rules,
        creatureLevel: 5,
        skillDrafts: [
          {
            id: "skill-high",
            requiredLevel: 10,
            definition: {
              name: "Technique avancée"
            }
          }
        ]
      }),
    /nécessite le niveau 10/i
  );

  assert.throws(
    () =>
      ui.validateHumanLoadoutProgressionV1({
        loadout: {
          ...baseLoadout,
          slots: [
            { id: "slot-1", skillId: null },
            { id: "slot-2", skillId: null },
            { id: "slot-3", skillId: "skill-low" },
            { id: "slot-4", skillId: null }
          ]
        },
        progressionRules: rules,
        creatureLevel: 5,
        skillDrafts: [
          {
            id: "skill-low",
            requiredLevel: 1,
            definition: {
              name: "Technique simple"
            }
          }
        ]
      }),
    /slot 3.*pas encore débloqué/i
  );
});

test("Capture editor HTML exposes data-driven stat, progression and evolution surfaces", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  for (const marker of [
    "data-stat-values-host",
    "data-stat-registry-host",
    "data-stat-custom-add",
    "data-evolution-enabled",
    "data-evolution-target",
    "data-evolution-level",
    "data-progression-max-active",
    "data-progression-schedule-host"
  ]) {
    assert.equal(
      html.includes(marker),
      true,
      marker + " must exist in the Human Editor"
    );
  }

  assert.equal(
    html.includes("data-stat-force"),
    false,
    "legacy rigid stat inputs must not remain the visible stat editor"
  );
});
