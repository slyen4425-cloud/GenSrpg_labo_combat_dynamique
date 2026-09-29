import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("StatusEffectV1 normalizes tactical persistent effect families", async () => {
  const {
    normalizeStatusEffectV1
  } = await import(
    "../../src/contracts/status-effect-v1.js"
  );

  const samples = [
    {
      id: "buff-speed",
      kind: "stat_modifier",
      polarity: "beneficial",
      durationMs: 6000,
      stacking: "refresh",
      statId: "speed",
      deltaPoints: 4
    },
    {
      id: "poison",
      kind: "damage_over_time",
      polarity: "detrimental",
      durationMs: 9000,
      stacking: "stack",
      maxStacks: 3,
      amount: 2,
      channel: "poison",
      tickIntervalMs: 3000
    },
    {
      id: "regen",
      kind: "heal_over_time",
      polarity: "beneficial",
      durationMs: 9000,
      stacking: "refresh",
      amount: 2,
      tickIntervalMs: 3000
    },
    {
      id: "barrier",
      kind: "shield",
      polarity: "beneficial",
      durationMs: 10000,
      stacking: "replace",
      amount: 20
    },
    {
      id: "root",
      kind: "immobilize",
      polarity: "detrimental",
      durationMs: 4000,
      stacking: "refresh"
    },
    {
      id: "silence",
      kind: "silence",
      polarity: "detrimental",
      durationMs: 4000,
      stacking: "refresh"
    },
    {
      id: "stun",
      kind: "stun",
      polarity: "detrimental",
      durationMs: 1500,
      stacking: "refresh"
    },
    {
      id: "taunt",
      kind: "taunt",
      polarity: "detrimental",
      durationMs: 5000,
      stacking: "refresh"
    }
  ];

  for (const sample of samples) {
    const normalized = normalizeStatusEffectV1(sample);
    assert.equal(normalized.id, sample.id);
    assert.equal(normalized.kind, sample.kind);
    assert.equal(Object.isFrozen(normalized), true);
  }
});

test("StatusEffectV1 rejects invalid payload combinations and real-time durations", async () => {
  const {
    normalizeStatusEffectV1
  } = await import(
    "../../src/contracts/status-effect-v1.js"
  );

  assert.throws(
    () =>
      normalizeStatusEffectV1({
        id: "bad-duration",
        kind: "stun",
        polarity: "detrimental",
        durationMs: 0,
        stacking: "refresh"
      }),
    /durationMs/i
  );

  assert.throws(
    () =>
      normalizeStatusEffectV1({
        id: "bad-dot",
        kind: "damage_over_time",
        polarity: "detrimental",
        durationMs: 3000,
        stacking: "refresh",
        amount: 2
      }),
    /tickIntervalMs/i
  );

  assert.throws(
    () =>
      normalizeStatusEffectV1({
        id: "bad-stat",
        kind: "stat_modifier",
        polarity: "beneficial",
        durationMs: 3000,
        stacking: "refresh",
        amount: 5
      }),
    /statId|unknown field/i
  );
});

test("SkillEffectV1 normalizes immediate tactical effect families and explicit target scopes", async () => {
  const {
    normalizeSkillEffectV1
  } = await import(
    "../../src/contracts/skill-effect-v1.js"
  );

  const damage = normalizeSkillEffectV1({
    kind: "damage",
    targetScope: "all_enemies",
    amount: 8,
    channel: "fire"
  });
  assert.deepEqual(damage, {
    kind: "damage",
    targetScope: "all_enemies",
    amount: 8,
    channel: "fire"
  });

  const heal = normalizeSkillEffectV1({
    kind: "heal",
    targetScope: "target",
    amount: 5
  });
  assert.equal(heal.kind, "heal");

  const drain = normalizeSkillEffectV1({
    kind: "energy_drain",
    targetScope: "target",
    amount: 3
  });
  assert.equal(drain.amount, 3);

  const status = normalizeSkillEffectV1({
    kind: "apply_status",
    targetScope: "target",
    status: {
      id: "root",
      kind: "immobilize",
      polarity: "detrimental",
      durationMs: 4000,
      stacking: "refresh"
    }
  });
  assert.equal(status.status.kind, "immobilize");

  const cleanse = normalizeSkillEffectV1({
    kind: "cleanse",
    targetScope: "all_allies",
    statusTags: ["poison", "control"]
  });
  assert.deepEqual(cleanse.statusTags, [
    "poison",
    "control"
  ]);
});

test("SkillEffectV1 rejects unsupported targets and incompatible payloads", async () => {
  const {
    normalizeSkillEffectV1
  } = await import(
    "../../src/contracts/skill-effect-v1.js"
  );

  assert.throws(
    () =>
      normalizeSkillEffectV1({
        kind: "damage",
        targetScope: "the_whole_world",
        amount: 5
      }),
    /targetScope/i
  );

  assert.throws(
    () =>
      normalizeSkillEffectV1({
        kind: "heal",
        targetScope: "self",
        amount: 5,
        channel: "fire"
      }),
    /unknown field|channel/i
  );

  assert.throws(
    () =>
      normalizeSkillEffectV1({
        kind: "apply_status",
        targetScope: "target",
        amount: 5
      }),
    /status/i
  );
});

test("tactical effect contracts stay pure and independent from runtime UI storage and GenSrpG", async () => {
  for (const file of [
    "../../src/contracts/skill-effect-v1.js",
    "../../src/contracts/status-effect-v1.js"
  ]) {
    const source = await readFile(
      new URL(file, import.meta.url),
      "utf8"
    );

    assert.doesNotMatch(
      source,
      /document\.|window\.|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout\(|setInterval\(|fetch\(|XMLHttpRequest|Zombicide-40k|action-resolver|combat-state|renderer\//
    );
  }
});
