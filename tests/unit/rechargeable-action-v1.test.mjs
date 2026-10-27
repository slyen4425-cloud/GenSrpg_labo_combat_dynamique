import test from "node:test";
import assert from "node:assert/strict";

import {
  createCombatState,
  advanceCombatTime
} from "../../src/core/combat/combat-state.js";
import {
  rechargeableActionAvailabilityV1,
  consumeRechargeableActionChargeV1
} from "../../src/core/combat/rechargeable-action-v1.js";

function state() {
  return createCombatState({
    fighters: [
      {
        id: "player",
        maxHp: 100,
        initialHp: 100,
        maxEnergy: 10,
        initialEnergy: 10
      },
      {
        id: "opponent",
        maxHp: 100,
        initialHp: 100,
        maxEnergy: 10,
        initialEnergy: 10
      }
    ]
  });
}

const config = {
  actorId: "player",
  actionId: "capture-game-dodge",
  maxCharges: 2,
  rechargeMs: 1000
};

test("rechargeable action consumes charges and restores each charge from combat elapsedMs", () => {
  let combat = state();

  assert.equal(
    rechargeableActionAvailabilityV1({
      state: combat,
      ...config
    }).charges,
    2
  );

  let first =
    consumeRechargeableActionChargeV1({
      state: combat,
      ...config
    });
  assert.equal(first.ok, true);
  combat = first.state;
  assert.equal(first.availability.charges, 1);

  combat = advanceCombatTime(combat, 500);

  let second =
    consumeRechargeableActionChargeV1({
      state: combat,
      ...config
    });
  assert.equal(second.ok, true);
  combat = second.state;
  assert.equal(second.availability.charges, 0);
  assert.equal(second.availability.nextRechargeMs, 500);

  const empty =
    consumeRechargeableActionChargeV1({
      state: combat,
      ...config
    });
  assert.equal(empty.ok, false);
  assert.equal(empty.outcome, "no_charges");

  combat = advanceCombatTime(combat, 500);
  assert.equal(
    rechargeableActionAvailabilityV1({
      state: combat,
      ...config
    }).charges,
    1
  );

  combat = advanceCombatTime(combat, 500);
  assert.equal(
    rechargeableActionAvailabilityV1({
      state: combat,
      ...config
    }).charges,
    2
  );
});

test("zero recharge restores a consumed charge immediately without timer state", () => {
  const result =
    consumeRechargeableActionChargeV1({
      state: state(),
      actorId: "player",
      actionId: "capture-game-dodge",
      maxCharges: 1,
      rechargeMs: 0
    });

  assert.equal(result.ok, true);
  assert.equal(result.availability.charges, 1);
});
