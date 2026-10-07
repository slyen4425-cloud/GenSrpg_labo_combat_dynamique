import test from "node:test";
import assert from "node:assert/strict";

import {
  CAPTURE_GAME_OPTIONS_V1_DEFAULT,
  normalizeCaptureGameOptionsV1,
  captureDodgeActiveWindowMsV1
} from "../../src/contracts/capture-game-options-v1.js";
import {
  activateRechargeableActionV1,
  rechargeableActionWindowStatusV1
} from "../../src/core/combat/rechargeable-action-v1.js";
import {
  createCombatState
} from "../../src/core/combat/combat-state.js";

function fighter(id) {
  return {
    id,
    maxHp: 100,
    initialHp: 100,
    maxEnergy: 10,
    initialEnergy: 10,
    energyChargeAmount: 0,
    energyChargeIntervalMs: 2000,
    movementEnergyPerStep: 0,
    chargeTimeModifierPct: 0
  };
}

test("Capture dodge defaults to 30 seconds recharge and a 500ms active window", () => {
  assert.equal(
    CAPTURE_GAME_OPTIONS_V1_DEFAULT.dodge.rechargeMs,
    30000
  );
  assert.equal(
    CAPTURE_GAME_OPTIONS_V1_DEFAULT.dodge.activeWindowMs,
    500
  );
});

test("legacy explicit dodge config keeps its shape while resolving the 500ms semantic default", () => {
  const legacy = {
    dodge: {
      enabled: true,
      maxCharges: 2,
      rechargeMs: 1500
    }
  };
  assert.deepEqual(
    normalizeCaptureGameOptionsV1(legacy),
    legacy
  );
  assert.equal(
    captureDodgeActiveWindowMsV1(legacy),
    500
  );
});

test("rechargeable action activation consumes one charge and derives its window from elapsedMs", () => {
  const state = createCombatState({
    fighters: [fighter("player"), fighter("opponent")]
  });

  const activated = activateRechargeableActionV1({
    state,
    actorId: "player",
    actionId: "capture-game-dodge",
    maxCharges: 2,
    rechargeMs: 30000,
    activeWindowMs: 500
  });

  assert.equal(activated.ok, true);
  assert.equal(activated.availability.charges, 1);
  assert.equal(activated.window.active, true);
  assert.equal(activated.window.remainingMs, 500);

  assert.equal(
    rechargeableActionWindowStatusV1({
      state: activated.state,
      actorId: "player",
      actionId: "capture-game-dodge",
      activeWindowMs: 500,
      atMs: 499
    }).active,
    true
  );

  const expired = rechargeableActionWindowStatusV1({
    state: activated.state,
    actorId: "player",
    actionId: "capture-game-dodge",
    activeWindowMs: 500,
    atMs: 500
  });
  assert.equal(expired.active, false);
  assert.equal(expired.remainingMs, 0);
});
