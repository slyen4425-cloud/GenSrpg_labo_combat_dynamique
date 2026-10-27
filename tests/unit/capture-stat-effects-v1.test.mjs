import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("stat registry uses explicit percentage units and rejects legacy ambiguous coefficient names", async () => {
  const { normalizeCaptureStatRegistryV1 } = await import(
    "../../src/contracts/capture-stat-registry-v1.js"
  );

  const registry = normalizeCaptureStatRegistryV1({
    schema: "capture-stat-registry-v1",
    stats: [
      {
        id: "physical",
        label: "Physique",
        damageChannel: "physical",
        resistanceChannel: "physical",
        damagePctPerPoint: 2,
        resistancePctPerPoint: 1
      },
      {
        id: "speed",
        label: "Vitesse",
        damageChannel: null,
        resistanceChannel: null,
        chargeTimeReductionPctPerPoint: 0.5
      }
    ]
  });

  assert.equal(registry.stats[0].damagePctPerPoint, 2);
  assert.equal(registry.stats[0].resistancePctPerPoint, 1);
  assert.equal(registry.stats[1].chargeTimeReductionPctPerPoint, 0.5);

  assert.throws(
    () =>
      normalizeCaptureStatRegistryV1({
        schema: "capture-stat-registry-v1",
        stats: [
          {
            id: "legacy",
            label: "Ancien",
            damageChannel: "physical",
            resistanceChannel: "physical",
            damagePerPoint: 1,
            resistancePerPoint: 1
          }
        ]
      }),
    /unknown field/i
  );
});

test("Monster Capture standard registry states one-point effects explicitly in percent", async () => {
  const { normalizeCaptureStatRegistryV1 } = await import(
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
  const byId = new Map(registry.stats.map((entry) => [entry.id, entry]));

  assert.equal(byId.get("physical").damagePctPerPoint, 1);
  assert.equal(byId.get("physical").resistancePctPerPoint, 1);
  assert.equal(byId.get("fire").damagePctPerPoint, 1);
  assert.equal(byId.get("fire").resistancePctPerPoint, 1);
  assert.equal(byId.get("speed").chargeTimeReductionPctPerPoint, 1);
});

test("pure stat effects projection calculates damage resistance and charge-time percentages", async () => {
  const { projectCaptureStatEffectsV1 } = await import(
    "../../src/core/combat/capture-stat-effects-v1.js"
  );

  const result = projectCaptureStatEffectsV1({
    registry: {
      schema: "capture-stat-registry-v1",
      stats: [
        {
          id: "physical",
          label: "Physique",
          damageChannel: "physical",
          resistanceChannel: "physical",
          damagePctPerPoint: 2,
          resistancePctPerPoint: 1
        },
        {
          id: "speed",
          label: "Vitesse",
          damageChannel: null,
          resistanceChannel: null,
          chargeTimeReductionPctPerPoint: 0.5
        }
      ]
    },
    statValues: {
      schema: "capture-creature-stat-values-v1",
      creatureId: "crea_test",
      values: {
        physical: 12,
        speed: 10
      }
    }
  });

  assert.deepEqual(result.damagePctByChannel, { physical: 24 });
  assert.deepEqual(result.resistancePctByChannel, { physical: 12 });
  assert.equal(result.chargeTimeReductionPct, 5);
});

test("Human Editor summary explains one-point rule and current effective result", async () => {
  const ui = await import(
    "../../src/ui/capture-editor-human-v2.js"
  );

  assert.equal(
    typeof ui.humanStatEffectSummaryV1,
    "function"
  );

  assert.equal(
    ui.humanStatEffectSummaryV1({
      definition: {
        id: "fire",
        label: "Feu",
        damageChannel: "fire",
        resistanceChannel: "fire",
        damagePctPerPoint: 2,
        resistancePctPerPoint: 1,
        chargeTimeReductionPctPerPoint: 0
      },
      value: 12
    }),
    "1 point = +2 % dégâts Feu / +1 % résistance Feu · 12 points = +24 % dégâts / +12 % résistance"
  );

  assert.equal(
    ui.humanStatEffectSummaryV1({
      definition: {
        id: "speed",
        label: "Vitesse",
        damageChannel: null,
        resistanceChannel: null,
        damagePctPerPoint: 0,
        resistancePctPerPoint: 0,
        chargeTimeReductionPctPerPoint: 1
      },
      value: 8
    }),
    "1 point = -1 % temps de charge · 8 points = -8 % temps de charge"
  );
});


test("Human Editor exposes explicit percentage labels including charge reduction", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  for (const marker of [
    "Dégâts % / point",
    "Résistance % / point",
    "Réduction temps de charge % / point",
    "data-stat-custom-charge-pct-per-point"
  ]) {
    assert.equal(
      html.includes(marker),
      true,
      marker + " must remain visible in the Human Editor"
    );
  }

  assert.equal(
    html.includes("Dégâts / point"),
    false,
    "ambiguous stat unit label must not return"
  );
});
