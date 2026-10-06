import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeSkillDefinition
} from "../../src/contracts/skill-definition.js";
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
    maxEnergy: 20,
    initialEnergy: 20,
    energyChargeAmount: 0,
    energyChargeIntervalMs: 2000,
    movementEnergyPerStep: 0,
    chargeTimeModifierPct: 0
  };
}

function skill({
  id,
  form = "projectile",
  approachMode = "none",
  travelMs = 1000,
  damage = 10,
  hitPresenceStates,
  evasionIncomingForms = []
}) {
  const input = {
    id,
    name: id,
    category: "offensive",
    form,
    element: null,
    approachMode,
    energyCost: 0,
    preparationMs: 0,
    travelMs,
    recoveryMs: 0,
    cooldownMs: 0,
    allowedDistances: [
      "short",
      "medium",
      "long"
    ],
    targetRelations: ["enemy"],
    effect: {
      damage,
      heal: 0,
      interruptsPreparation: false,
      stunMs: 0,
      tags: []
    },
    evasion: {
      window:
        evasionIncomingForms.length > 0
          ? "travel"
          : null,
      incomingForms:
        evasionIncomingForms
    }
  };

  if (hitPresenceStates !== undefined) {
    input.hitPresenceStates =
      hitPresenceStates;
  }

  return normalizeSkillDefinition(input);
}

function fakeClock() {
  let time = 0;
  const queue = [];
  let nextId = 1;

  return {
    now() {
      return time;
    },
    setTime(value) {
      time = value;
    },
    setTimer(callback) {
      const id = nextId++;
      queue.push({ id, callback });
      return id;
    },
    clearTimer(id) {
      const index =
        queue.findIndex(
          (item) => item.id === id
        );
      if (index >= 0) {
        queue.splice(index, 1);
      }
    },
    fireNext() {
      const item = queue.shift();
      assert.ok(item, "Runtime tick must be scheduled");
      item.callback();
    }
  };
}

function harness() {
  const session = createCombatSession({
    distance: "medium",
    fighters: [
      fighter("player"),
      fighter("opponent")
    ]
  });
  const clock = fakeClock();
  const resolutions = [];
  const runtime = createCombatRuntime({
    session,
    now: clock.now,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    onResolved(resolution) {
      resolutions.push(resolution);
    }
  });
  runtime.start();
  return {
    session,
    clock,
    runtime,
    resolutions
  };
}

test("SkillDefinition preserves explicit hitPresenceStates and rejects unsupported states", () => {
  const antiAir = skill({
    id: "anti-air",
    hitPresenceStates: [
      "surface",
      "airborne"
    ]
  });

  assert.deepEqual(
    antiAir.hitPresenceStates,
    ["surface", "airborne"]
  );

  assert.throws(
    () =>
      skill({
        id: "invalid-presence",
        hitPresenceStates: [
          "surface",
          "orbit"
        ]
      }),
    /Unsupported hitPresenceStates value/
  );
});

test("explicit surface-only attack misses a target travelling airborne even without legacy form evasion", () => {
  const {
    session,
    clock,
    runtime,
    resolutions
  } = harness();

  const aerial = skill({
    id: "aerial-move",
    form: "contact",
    approachMode: "aerial",
    travelMs: 2000,
    damage: 0
  });
  const groundOnly = skill({
    id: "ground-only",
    form: "projectile",
    travelMs: 1000,
    hitPresenceStates: ["surface"]
  });

  assert.equal(
    runtime.startSkill({
      actorId: "player",
      targetId: "opponent",
      skill: aerial
    }).ok,
    true
  );
  assert.equal(
    runtime.startSkill({
      actorId: "opponent",
      targetId: "player",
      skill: groundOnly
    }).ok,
    true
  );

  clock.setTime(1000);
  clock.fireNext();

  const incoming =
    resolutions.find(
      (item) =>
        item.skillId === "ground-only"
    );
  assert.ok(incoming);
  assert.equal(incoming.outcome, "evaded");
  assert.equal(
    session.snapshot().fighters.player.hp,
    100
  );

  runtime.dispose();
});

test("explicit anti-air coverage hits an airborne target and overrides legacy mobility-form evasion", () => {
  const {
    session,
    clock,
    runtime,
    resolutions
  } = harness();

  const aerial = skill({
    id: "aerial-evasive-move",
    form: "contact",
    approachMode: "aerial",
    travelMs: 2000,
    damage: 0,
    evasionIncomingForms: [
      "projectile"
    ]
  });
  const antiAir = skill({
    id: "anti-air-projectile",
    form: "projectile",
    travelMs: 1000,
    hitPresenceStates: [
      "surface",
      "airborne"
    ]
  });

  runtime.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill: aerial
  });
  runtime.startSkill({
    actorId: "opponent",
    targetId: "player",
    skill: antiAir
  });

  clock.setTime(1000);
  clock.fireNext();

  const incoming =
    resolutions.find(
      (item) =>
        item.skillId ===
          "anti-air-projectile"
    );
  assert.ok(incoming);
  assert.equal(incoming.outcome, "hit");
  assert.equal(
    session.snapshot().fighters.player.hp,
    90
  );

  runtime.dispose();
});

test("legacy attack without hitPresenceStates keeps existing mobility evasion semantics", () => {
  const {
    session,
    clock,
    runtime,
    resolutions
  } = harness();

  const aerial = skill({
    id: "legacy-aerial-evasion",
    form: "contact",
    approachMode: "aerial",
    travelMs: 2000,
    damage: 0,
    evasionIncomingForms: [
      "projectile"
    ]
  });
  const legacyProjectile = skill({
    id: "legacy-projectile",
    form: "projectile",
    travelMs: 1000
  });

  runtime.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill: aerial
  });
  runtime.startSkill({
    actorId: "opponent",
    targetId: "player",
    skill: legacyProjectile
  });

  clock.setTime(1000);
  clock.fireNext();

  const incoming =
    resolutions.find(
      (item) =>
        item.skillId ===
          "legacy-projectile"
    );
  assert.ok(incoming);
  assert.equal(incoming.outcome, "evaded");
  assert.equal(
    session.snapshot().fighters.player.hp,
    100
  );

  runtime.dispose();
});
