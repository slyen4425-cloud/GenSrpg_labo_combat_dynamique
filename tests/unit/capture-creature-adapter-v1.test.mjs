import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  adaptCaptureCreatureToFighterConfig
} from "../../src/adapters/input/capture/capture-creature-to-fighter-config.js";
import {
  createCombatState
} from "../../src/core/combat/combat-state.js";

function creature() {
  return {
    id: "maraileron",
    displayName: "Maraileron",
    combat: {
      maxHp: 100,
      initialHp: 90,
      maxEnergy: 10,
      initialEnergy: 3,
      energyChargeAmount: 2,
      energyChargeIntervalMs: 1500,
      movementEnergyPerStep: 1,
      chargeTimeModifierPct: -10
    },
    skillIds: ["water-wave"],
    presentationId: "creature:maraileron",
    metadata: {
      sourceStats: {
        speed: 999,
        agility: 999,
        defense: 999
      },
      level: 50
    }
  };
}

test("Capture creature adapter translates only explicit combat fields", () => {
  assert.deepEqual(
    adaptCaptureCreatureToFighterConfig(creature()),
    {
      id: "maraileron",
      maxHp: 100,
      initialHp: 90,
      maxEnergy: 10,
      initialEnergy: 3,
      energyChargeAmount: 2,
      energyChargeIntervalMs: 1500,
      movementEnergyPerStep: 1,
      chargeTimeModifierPct: -10
    }
  );
});

test("Capture creature adapter supports a slot-specific fighter id without mutation", () => {
  const input = creature();
  const output = adaptCaptureCreatureToFighterConfig(input, {
    fighterId: "player"
  });

  assert.equal(output.id, "player");
  assert.equal(input.id, "maraileron");
  assert.equal(input.combat.maxHp, 100);
});

test("Capture creature adapter leaves optional target defaults to Combat State", () => {
  const input = creature();
  input.combat = {
    maxHp: 80,
    maxEnergy: 7
  };

  const output = adaptCaptureCreatureToFighterConfig(input);

  assert.deepEqual(output, {
    id: "maraileron",
    maxHp: 80,
    maxEnergy: 7
  });
  assert.equal("initialHp" in output, false);
  assert.equal("energyChargeAmount" in output, false);
});

test("Capture creature adapter requires explicit finite maxHp and maxEnergy", () => {
  const missingHp = creature();
  delete missingHp.combat.maxHp;
  assert.throws(
    () => adaptCaptureCreatureToFighterConfig(missingHp),
    /maxHp/i
  );

  const missingEnergy = creature();
  delete missingEnergy.combat.maxEnergy;
  assert.throws(
    () => adaptCaptureCreatureToFighterConfig(missingEnergy),
    /maxEnergy/i
  );

  const nanHp = creature();
  nanHp.combat.maxHp = Number.NaN;
  assert.throws(
    () => adaptCaptureCreatureToFighterConfig(nanHp),
    /maxHp/i
  );
});

test("Capture creature adapter follows target non-negative numeric constraints", () => {
  for (const field of [
    "maxHp",
    "initialHp",
    "maxEnergy",
    "initialEnergy",
    "energyChargeAmount",
    "energyChargeIntervalMs",
    "movementEnergyPerStep"
  ]) {
    const input = creature();
    input.combat[field] = -1;
    assert.throws(
      () => adaptCaptureCreatureToFighterConfig(input),
      new RegExp(field, "i")
    );
  }
});

test("Capture creature adapter validates initial values against maxima", () => {
  const hp = creature();
  hp.combat.initialHp = 101;
  assert.throws(
    () => adaptCaptureCreatureToFighterConfig(hp),
    /initialHp/i
  );

  const energy = creature();
  energy.combat.initialEnergy = 11;
  assert.throws(
    () => adaptCaptureCreatureToFighterConfig(energy),
    /initialEnergy/i
  );
});

test("Capture creature adapter accepts signed finite chargeTimeModifierPct", () => {
  const faster = creature();
  faster.combat.chargeTimeModifierPct = -25;
  assert.equal(
    adaptCaptureCreatureToFighterConfig(faster).chargeTimeModifierPct,
    -25
  );

  const slower = creature();
  slower.combat.chargeTimeModifierPct = 40;
  assert.equal(
    adaptCaptureCreatureToFighterConfig(slower).chargeTimeModifierPct,
    40
  );

  const invalid = creature();
  invalid.combat.chargeTimeModifierPct = Infinity;
  assert.throws(
    () => adaptCaptureCreatureToFighterConfig(invalid),
    /chargeTimeModifierPct/i
  );
});

test("Capture source stats and progression never become implicit FighterConfig gameplay", () => {
  const input = creature();
  input.metadata.sourceStats = {
    speed: 1,
    agility: 2,
    defense: 3,
    force: 999
  };
  input.metadata.level = 99;

  const output = adaptCaptureCreatureToFighterConfig(input);

  assert.equal("speed" in output, false);
  assert.equal("agility" in output, false);
  assert.equal("defense" in output, false);
  assert.equal("force" in output, false);
  assert.equal("level" in output, false);
});

test("adapted fighter config is accepted by the real Combat State", () => {
  const adapted = adaptCaptureCreatureToFighterConfig(creature(), {
    fighterId: "player"
  });

  const state = createCombatState({
    fighters: [
      adapted,
      {
        id: "opponent",
        maxHp: 50,
        maxEnergy: 5
      }
    ]
  });

  assert.equal(state.fighters.player.maxHp, 100);
  assert.equal(state.fighters.player.hp, 90);
  assert.equal(state.fighters.player.maxEnergy, 10);
  assert.equal(state.fighters.player.energy, 3);
  assert.equal(state.fighters.player.chargeTimeModifierPct, -10);
});

test("Capture creature adapter has no GenSrpG, DOM, storage or network authority", async () => {
  const source = await readFile(
    "src/adapters/input/capture/capture-creature-to-fighter-config.js",
    "utf8"
  );

  assert.doesNotMatch(
    source,
    /Zombicide-40k|github\.com|window\.|document\.|localStorage|sessionStorage|indexedDB|MutationObserver|fetch\(|XMLHttpRequest/
  );
});
