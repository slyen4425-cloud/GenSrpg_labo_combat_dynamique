import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeSkillDefinition
} from "../../src/contracts/skill-definition.js";
import {
  buildCaptureDodgeReactionSkillV1
} from "../../src/contracts/capture-game-options-v1.js";
import {
  createCombatSession
} from "../../src/core/combat/combat-session.js";
import {
  createCombatRuntime
} from "../../src/core/combat/combat-runtime.js";

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

function attack({
  id = "incoming",
  dodgeable = true
} = {}) {
  return normalizeSkillDefinition({
    id,
    name: id,
    category: "offensive",
    form: "projectile",
    element: null,
    approachMode: "none",
    energyCost: 0,
    preparationMs: 1000,
    travelMs: 1000,
    recoveryMs: 0,
    cooldownMs: 0,
    dodgeable,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["enemy"],
    effect: {
      damage: 20,
      heal: 0,
      interruptsPreparation: false,
      stunMs: 0,
      tags: []
    }
  });
}

function clock() {
  let time = 0;
  const queue = [];
  let id = 0;
  return {
    now: () => time,
    setTime(value) {
      time = value;
    },
    setTimer(callback) {
      const timerId = ++id;
      queue.push({ timerId, callback });
      return timerId;
    },
    clearTimer(timerId) {
      const index = queue.findIndex(
        (item) => item.timerId === timerId
      );
      if (index >= 0) queue.splice(index, 1);
    }
  };
}

function harness() {
  const gameOptions = {
    dodge: {
      enabled: true,
      maxCharges: 1,
      rechargeMs: 2000
    }
  };
  const dodge =
    buildCaptureDodgeReactionSkillV1(
      gameOptions
    );
  const session = createCombatSession({
    fighters: [
      fighter("player"),
      fighter("opponent")
    ],
    distance: "medium"
  });
  const fakeClock = clock();
  const runtime = createCombatRuntime({
    session,
    now: fakeClock.now,
    setTimer: fakeClock.setTimer,
    clearTimer: fakeClock.clearTimer
  });
  runtime.start();
  return {
    gameOptions,
    dodge,
    session,
    runtime,
    fakeClock
  };
}

test("accepted game dodge consumes exactly one rechargeable charge", () => {
  const {
    gameOptions,
    dodge,
    runtime
  } = harness();

  assert.equal(
    runtime.startSkill({
      actorId: "opponent",
      targetId: "player",
      skill: attack()
    }).ok,
    true
  );

  const preview =
    runtime.previewRechargeableReaction(
      dodge,
      {
        againstActorId: "opponent",
        recharge: {
          actionId: dodge.id,
          maxCharges:
            gameOptions.dodge.maxCharges,
          rechargeMs:
            gameOptions.dodge.rechargeMs
        }
      }
    );
  assert.equal(preview.ok, true);
  assert.equal(preview.availability.charges, 1);

  const reacted =
    runtime.reactWithRechargeableAction(
      dodge,
      {
        againstActorId: "opponent",
        recharge: {
          actionId: dodge.id,
          maxCharges:
            gameOptions.dodge.maxCharges,
          rechargeMs:
            gameOptions.dodge.rechargeMs
        }
      }
    );
  assert.equal(reacted.ok, true);
  assert.equal(reacted.outcome, "evaded");
  assert.equal(reacted.availability.charges, 0);

  const noSecond =
    runtime.previewRechargeableReaction(
      dodge,
      {
        againstActorId: "opponent",
        recharge: {
          actionId: dodge.id,
          maxCharges: 1,
          rechargeMs: 2000
        }
      }
    );
  assert.equal(noSecond.ok, false);
  assert.equal(
    noSecond.outcome,
    "reaction_already_selected"
  );

  runtime.dispose();
});

test("non-dodgeable incoming attack does not consume a global dodge charge", () => {
  const {
    dodge,
    runtime,
    gameOptions
  } = harness();

  runtime.startSkill({
    actorId: "opponent",
    targetId: "player",
    skill: attack({
      id: "undodgeable",
      dodgeable: false
    })
  });

  const result =
    runtime.reactWithRechargeableAction(
      dodge,
      {
        againstActorId: "opponent",
        recharge: {
          actionId: dodge.id,
          maxCharges:
            gameOptions.dodge.maxCharges,
          rechargeMs:
            gameOptions.dodge.rechargeMs
        }
      }
    );

  assert.equal(result.ok, false);
  assert.equal(result.outcome, "not_dodgeable");

  const availability =
    runtime.rechargeableActionAvailability({
      actorId: "player",
      actionId: dodge.id,
      maxCharges: 1,
      rechargeMs: 2000
    });
  assert.equal(availability.charges, 1);

  runtime.dispose();
});
