import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { createCombatState } from "../../src/core/combat/combat-state.js";
import {
  captureCreatureToFighterConfig
} from "../../src/adapters/input/capture/creature-to-fighter-config.js";

function creature(overrides = {}) {
  return {
    id: "maraileron",
    displayName: "Maraileron",
    combat: {
      maxHp: 120,
      initialHp: 95,
      maxEnergy: 12,
      initialEnergy: 3,
      energyChargeAmount: 2,
      energyChargeIntervalMs: 1800,
      movementEnergyPerStep: 1,
      chargeTimeModifierPct: -10,
      sourceStats: {
        agility: 99,
        defense: 42
      },
      legacyFlag: true,
      ...(overrides.combat ?? {})
    },
    skillIds: ["water-wave"],
    presentationId: "creature:maraileron",
    metadata: {
      level: 17,
      xp: 999
    },
    ...overrides,
    combat: {
      maxHp: 120,
      initialHp: 95,
      maxEnergy: 12,
      initialEnergy: 3,
      energyChargeAmount: 2,
      energyChargeIntervalMs: 1800,
      movementEnergyPerStep: 1,
      chargeTimeModifierPct: -10,
      sourceStats: {
        agility: 99,
        defense: 42
      },
      legacyFlag: true,
      ...(overrides.combat ?? {})
    }
  };
}

test("Capture creature adapter maps only explicit FighterConfig fields", () => {
  const input = creature();
  const fighter = captureCreatureToFighterConfig(input);

  assert.deepEqual(fighter, {
    id: "maraileron",
    maxHp: 120,
    initialHp: 95,
    maxEnergy: 12,
    initialEnergy: 3,
    energyChargeAmount: 2,
    energyChargeIntervalMs: 1800,
    movementEnergyPerStep: 1,
    chargeTimeModifierPct: -10
  });
  assert.equal(Object.isFrozen(fighter), true);
});

test("Capture creature adapter does not mutate source data", () => {
  const input = creature();
  const before = structuredClone(input);

  captureCreatureToFighterConfig(input);

  assert.deepEqual(input, before);
});

test("Capture creature adapter requires every configuration field explicitly", () => {
  const fields = [
    "maxHp",
    "initialHp",
    "maxEnergy",
    "initialEnergy",
    "energyChargeAmount",
    "energyChargeIntervalMs",
    "movementEnergyPerStep",
    "chargeTimeModifierPct"
  ];

  for (const field of fields) {
    const input = creature();
    delete input.combat[field];

    assert.throws(
      () => captureCreatureToFighterConfig(input),
      new RegExp(field, "i"),
      field
    );
  }
});

test("Capture creature adapter rejects negative or non-finite combat values", () => {
  for (const [field, value] of [
    ["maxHp", -1],
    ["initialHp", -1],
    ["maxEnergy", -1],
    ["initialEnergy", -1],
    ["energyChargeAmount", -1],
    ["energyChargeIntervalMs", -1],
    ["movementEnergyPerStep", -1],
    ["chargeTimeModifierPct", Number.NaN],
    ["chargeTimeModifierPct", Number.POSITIVE_INFINITY]
  ]) {
    assert.throws(
      () => captureCreatureToFighterConfig(
        creature({ combat: { [field]: value } })
      ),
      /finite|non-negative/i,
      field
    );
  }
});

test("Capture creature adapter enforces HP and energy bounds", () => {
  assert.throws(
    () => captureCreatureToFighterConfig(
      creature({ combat: { initialHp: 121 } })
    ),
    /initialHp.*maxHp/i
  );

  assert.throws(
    () => captureCreatureToFighterConfig(
      creature({ combat: { initialEnergy: 13 } })
    ),
    /initialEnergy.*maxEnergy/i
  );
});

test("Capture creature adapter does not propagate RPG stats, metadata or foreign combat fields", () => {
  const fighter = captureCreatureToFighterConfig(creature());

  assert.equal("sourceStats" in fighter, false);
  assert.equal("legacyFlag" in fighter, false);
  assert.equal("metadata" in fighter, false);
  assert.equal("level" in fighter, false);
  assert.equal("skillIds" in fighter, false);
  assert.equal("presentationId" in fighter, false);
});

test("Capture creature adapter output is accepted by the real Combat State", () => {
  const player = captureCreatureToFighterConfig(creature());
  const opponent = captureCreatureToFighterConfig(
    creature({
      id: "braisombre",
      combat: {
        maxHp: 140,
        initialHp: 140,
        maxEnergy: 10,
        initialEnergy: 0,
        energyChargeAmount: 1,
        energyChargeIntervalMs: 2000,
        movementEnergyPerStep: 3,
        chargeTimeModifierPct: 5
      }
    })
  );

  const state = createCombatState({
    fighters: [player, opponent]
  });

  assert.equal(state.fighters.maraileron.hp, 95);
  assert.equal(state.fighters.maraileron.energy, 3);
  assert.equal(state.fighters.braisombre.maxHp, 140);
  assert.equal(state.fighters.braisombre.movementEnergyPerStep, 3);
});

test("Capture creature adapter has no GenSrpG, DOM, storage or network authority", async () => {
  const source = await readFile(
    "src/adapters/input/capture/creature-to-fighter-config.js",
    "utf8"
  );

  assert.doesNotMatch(
    source,
    /Zombicide-40k|github\.com|window\.|document\.|localStorage|sessionStorage|indexedDB|MutationObserver|fetch\(|XMLHttpRequest/
  );
});
