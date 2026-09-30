import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Capture stat registry accepts standard and custom stats without hardcoded ids", async () => {
  const {
    normalizeCaptureStatRegistryV1
  } = await import(
    "../../src/contracts/capture-stat-registry-v1.js"
  );

  const registry = normalizeCaptureStatRegistryV1({
    schema: "capture-stat-registry-v1",
    stats: [
      {
        id: "physical",
        label: "Puissance physique",
        damageChannel: "physical",
        resistanceChannel: "physical"
      },
      {
        id: "frost",
        label: "Givre",
        damageChannel: "frost",
        resistanceChannel: "frost"
      }
    ]
  });

  assert.equal(registry.stats.length, 2);
  assert.equal(registry.stats[1].id, "frost");
  assert.equal(registry.stats[1].damageChannel, "frost");
  assert.equal(registry.stats[1].resistanceChannel, "frost");
});

test("Monster Capture standard registry owns configurable channel mappings", async () => {
  const {
    normalizeCaptureStatRegistryV1
  } = await import(
    "../../src/contracts/capture-stat-registry-v1.js"
  );

  const raw = JSON.parse(
    await readFile(
      new URL(
        "../../data/capture/monster-capture-stat-registry.v1.json",
        import.meta.url
      ),
      "utf8"
    )
  );
  const registry = normalizeCaptureStatRegistryV1(raw);
  const byId = new Map(
    registry.stats.map((entry) => [entry.id, entry])
  );

  for (const id of [
    "health",
    "speed",
    "physical",
    "fire",
    "water",
    "earth",
    "air",
    "electric",
    "light",
    "shadow",
    "poison"
  ]) {
    assert.ok(byId.has(id), id + " must exist in the standard registry");
  }

  assert.equal(byId.get("physical").damageChannel, "physical");
  assert.equal(byId.get("physical").resistanceChannel, "physical");
  assert.equal(byId.get("fire").damageChannel, "fire");
  assert.equal(byId.get("fire").resistanceChannel, "fire");
});

test("Creature stat values are validated against the selected registry", async () => {
  const {
    normalizeCaptureStatRegistryV1
  } = await import(
    "../../src/contracts/capture-stat-registry-v1.js"
  );
  const {
    normalizeCaptureCreatureStatValuesV1
  } = await import(
    "../../src/contracts/capture-creature-stat-values-v1.js"
  );

  const registry = normalizeCaptureStatRegistryV1({
    schema: "capture-stat-registry-v1",
    stats: [
      {
        id: "speed",
        label: "Vitesse",
        damageChannel: null,
        resistanceChannel: null
      },
      {
        id: "custom-focus",
        label: "Concentration",
        damageChannel: null,
        resistanceChannel: null
      }
    ]
  });

  const values = normalizeCaptureCreatureStatValuesV1(
    {
      schema: "capture-creature-stat-values-v1",
      creatureId: "crea_test",
      values: {
        speed: 12,
        "custom-focus": 7
      }
    },
    registry
  );

  assert.deepEqual(values.values, {
    speed: 12,
    "custom-focus": 7
  });

  assert.throws(
    () =>
      normalizeCaptureCreatureStatValuesV1(
        {
          schema: "capture-creature-stat-values-v1",
          creatureId: "crea_test",
          values: {
            unknown: 3
          }
        },
        registry
      ),
    /unknown stat/i
  );
});

test("Progression rules own slot unlock schedule independently from skill requiredLevel", async () => {
  const {
    normalizeCaptureProgressionRulesV1,
    captureActiveSkillSlotsForLevelV1
  } = await import(
    "../../src/contracts/capture-progression-rules-v1.js"
  );

  const rules = normalizeCaptureProgressionRulesV1({
    schema: "capture-progression-rules-v1",
    maxActiveSkills: 4,
    slotUnlockSchedule: [
      { level: 1, slots: 2 },
      { level: 10, slots: 3 },
      { level: 20, slots: 4 }
    ]
  });

  assert.equal(captureActiveSkillSlotsForLevelV1(rules, 1), 2);
  assert.equal(captureActiveSkillSlotsForLevelV1(rules, 9), 2);
  assert.equal(captureActiveSkillSlotsForLevelV1(rules, 10), 3);
  assert.equal(captureActiveSkillSlotsForLevelV1(rules, 99), 4);
});

test("Legacy Monster Capture stats project deterministically into the new stat values contract", async () => {
  const {
    importMonsterCaptureStatValuesV1
  } = await import(
    "../../src/adapters/input/capture/monster-capture-stat-values-v1.js"
  );
  const {
    normalizeCaptureStatRegistryV1
  } = await import(
    "../../src/contracts/capture-stat-registry-v1.js"
  );

  const rawRegistry = JSON.parse(
    await readFile(
      new URL(
        "../../data/capture/monster-capture-stat-registry.v1.json",
        import.meta.url
      ),
      "utf8"
    )
  );
  const registry = normalizeCaptureStatRegistryV1(rawRegistry);

  const result = importMonsterCaptureStatValuesV1(
    {
      id: "crea_fixture",
      stats: {
        speed: 14,
        power: 11,
        fire: 6
      }
    },
    registry
  );

  assert.equal(result.creatureId, "crea_fixture");
  assert.equal(result.values.speed, 14);
  assert.equal(result.values.physical, 11);
  assert.equal(result.values.fire, 6);
  assert.equal(result.values.water, 0);
});


test("stat registry rejects duplicate ids and owns health through one canonical stat", async () => {
  const {
    normalizeCaptureStatRegistryV1
  } = await import(
    "../../src/contracts/capture-stat-registry-v1.js"
  );

  assert.throws(
    () =>
      normalizeCaptureStatRegistryV1({
        schema: "capture-stat-registry-v1",
        stats: [
          {
            id: "fire",
            label: "Feu",
            damageChannel: "fire",
            resistanceChannel: "fire"
          },
          {
            id: "fire",
            label: "Feu bis",
            damageChannel: "fire",
            resistanceChannel: "fire"
          }
        ]
      }),
    /duplicate ids/i
  );

  const raw = JSON.parse(
    await readFile(
      new URL(
        "../../data/capture/monster-capture-stat-registry.v1.json",
        import.meta.url
      ),
      "utf8"
    )
  );
  const registry = normalizeCaptureStatRegistryV1(raw);
  const health = registry.stats.find(
    (entry) => entry.id === "health"
  );
  assert.ok(health);
  assert.equal(health.maxHpPerPoint, 1);
  assert.equal(
    registry.stats.some((entry) => entry.id === "hp"),
    false,
    "health must use one canonical stat id instead of a duplicate hp alias"
  );
  assert.equal(
    registry.stats.find((entry) => entry.id === "physical").damagePctPerPoint,
    1
  );
  assert.equal(
    registry.stats.find((entry) => entry.id === "physical").resistancePctPerPoint,
    1
  );
});

test("stat influence coefficients remain data-configurable", async () => {
  const {
    normalizeCaptureStatRegistryV1
  } = await import(
    "../../src/contracts/capture-stat-registry-v1.js"
  );

  const registry = normalizeCaptureStatRegistryV1({
    schema: "capture-stat-registry-v1",
    stats: [
      {
        id: "frost",
        label: "Givre",
        damageChannel: "frost",
        resistanceChannel: "frost",
        damagePctPerPoint: 1.5,
        resistancePctPerPoint: 0.75
      }
    ]
  });

  assert.equal(registry.stats[0].damagePctPerPoint, 1.5);
  assert.equal(registry.stats[0].resistancePctPerPoint, 0.75);
});

test("progression rules reject ambiguous or decreasing slot schedules", async () => {
  const {
    normalizeCaptureProgressionRulesV1
  } = await import(
    "../../src/contracts/capture-progression-rules-v1.js"
  );

  assert.throws(
    () =>
      normalizeCaptureProgressionRulesV1({
        schema: "capture-progression-rules-v1",
        maxActiveSkills: 4,
        slotUnlockSchedule: [
          { level: 2, slots: 2 }
        ]
      }),
    /start at level 1/i
  );

  assert.throws(
    () =>
      normalizeCaptureProgressionRulesV1({
        schema: "capture-progression-rules-v1",
        maxActiveSkills: 4,
        slotUnlockSchedule: [
          { level: 1, slots: 3 },
          { level: 10, slots: 2 }
        ]
      }),
    /must not decrease/i
  );

  assert.throws(
    () =>
      normalizeCaptureProgressionRulesV1({
        schema: "capture-progression-rules-v1",
        maxActiveSkills: 4,
        slotUnlockSchedule: [
          { level: 1, slots: 5 }
        ]
      }),
    /cannot exceed maxActiveSkills/i
  );
});

test("default Monster Capture progression policy is data-owned and configurable", async () => {
  const {
    normalizeCaptureProgressionRulesV1,
    captureActiveSkillSlotsForLevelV1
  } = await import(
    "../../src/contracts/capture-progression-rules-v1.js"
  );

  const raw = JSON.parse(
    await readFile(
      new URL(
        "../../data/capture/monster-capture-progression-rules.v1.json",
        import.meta.url
      ),
      "utf8"
    )
  );
  const rules = normalizeCaptureProgressionRulesV1(raw);

  assert.equal(rules.maxActiveSkills, 4);
  assert.equal(captureActiveSkillSlotsForLevelV1(rules, 1), 2);
  assert.equal(captureActiveSkillSlotsForLevelV1(rules, 10), 3);
  assert.equal(captureActiveSkillSlotsForLevelV1(rules, 20), 4);
});
