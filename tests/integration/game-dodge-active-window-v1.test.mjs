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
  dodgeable = true,
  travelMs = 1000
} = {}) {
  return normalizeSkillDefinition({
    id,
    name: id,
    category: "offensive",
    form: "projectile",
    element: null,
    approachMode: "none",
    energyCost: 0,
    preparationMs: 0,
    travelMs,
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
        item => item.timerId === timerId
      );
      if (index >= 0) queue.splice(index, 1);
    }
  };
}

function harness() {
  const gameOptions = {
    dodge: {
      enabled: true,
      maxCharges: 2,
      rechargeMs: 30000,
      activeWindowMs: 500
    }
  };
  const dodge =
    buildCaptureDodgeReactionSkillV1(gameOptions);
  const session = createCombatSession({
    fighters: [fighter("player"), fighter("opponent")],
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
  return { gameOptions, dodge, session, runtime, fakeClock };
}

function activate({ runtime, dodge, gameOptions }) {
  return runtime.activateRechargeableReaction(
    dodge,
    {
      actorId: "player",
      recharge: {
        actionId: dodge.id,
        maxCharges: gameOptions.dodge.maxCharges,
        rechargeMs: gameOptions.dodge.rechargeMs
      },
      activeWindowMs: gameOptions.dodge.activeWindowMs
    }
  );
}

test("proactive dodge evades a dodgeable projectile whose contact lands inside the 500ms window", () => {
  const h = harness();
  const activated = activate(h);
  assert.equal(activated.ok, true);
  assert.equal(activated.availability.charges, 1);

  assert.equal(
    h.runtime.startSkill({
      actorId: "opponent",
      targetId: "player",
      skill: attack()
    }).ok,
    true
  );

  h.fakeClock.setTime(300);
  const contact = h.runtime.reportActionContact({
    actorId: "opponent",
    targetId: "player",
    skillId: "incoming"
  });

  assert.equal(contact.ok, true);
  assert.equal(contact.resolution.outcome, "evaded");
  assert.equal(h.session.snapshot().fighters.player.hp, 100);
  h.runtime.dispose();
});

test("the same proactive dodge expires exactly at 500ms", () => {
  const h = harness();
  assert.equal(activate(h).ok, true);

  h.runtime.startSkill({
    actorId: "opponent",
    targetId: "player",
    skill: attack()
  });

  h.fakeClock.setTime(500);
  const contact = h.runtime.reportActionContact({
    actorId: "opponent",
    targetId: "player",
    skillId: "incoming"
  });

  assert.equal(contact.ok, true);
  assert.equal(contact.resolution.outcome, "hit");
  assert.equal(h.session.snapshot().fighters.player.hp, 80);
  h.runtime.dispose();
});

test("an undodgeable projectile still hits during the active window", () => {
  const h = harness();
  assert.equal(activate(h).ok, true);

  h.runtime.startSkill({
    actorId: "opponent",
    targetId: "player",
    skill: attack({
      id: "undodgeable",
      dodgeable: false
    })
  });

  h.fakeClock.setTime(300);
  const contact = h.runtime.reportActionContact({
    actorId: "opponent",
    targetId: "player",
    skillId: "undodgeable"
  });

  assert.equal(contact.ok, true);
  assert.equal(contact.resolution.outcome, "hit");
  assert.equal(h.session.snapshot().fighters.player.hp, 80);
  h.runtime.dispose();
});
