import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeSkillDefinition
} from "../../src/contracts/skill-definition.js";
import {
  effectiveApproachTimingMs
} from "../../src/core/combat/combat-timing.js";
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
  form = "contact",
  approachMode = "none",
  travelMs = 1000,
  damage = 10,
  hitPresenceStates = undefined
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
      assert.ok(item);
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

test("SkillDefinition accepts burrow as a first-class approach mode", () => {
  const burrow = skill({
    id: "burrow-strike",
    approachMode: "burrow"
  });
  assert.equal(
    burrow.approachMode,
    "burrow"
  );
});

test("burrow uses the existing approach-time modifier owner", () => {
  const modified =
    effectiveApproachTimingMs({
      baseMs: 1000,
      approachMode: "burrow",
      statusEffects: [
        {
          definition: {
            kind: "approach_time_modifier",
            modifierPct: 50,
            durationModel: "time_ms"
          },
          appliedAtMs: 0,
          expiresAtMs: 5000,
          stacks: 1
        }
      ],
      atMs: 1000,
      speedMultiplier: 1
    });

  assert.equal(modified, 1500);
});

test("surface-only attack misses while target is underground during burrow travel", () => {
  const {
    session,
    clock,
    runtime,
    resolutions
  } = harness();

  const burrow = skill({
    id: "burrow-move",
    approachMode: "burrow",
    travelMs: 2000,
    damage: 0
  });
  const surfaceOnly = skill({
    id: "surface-only",
    form: "projectile",
    approachMode: "none",
    travelMs: 1000,
    hitPresenceStates: ["surface"]
  });

  runtime.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill: burrow
  });
  runtime.startSkill({
    actorId: "opponent",
    targetId: "player",
    skill: surfaceOnly
  });

  clock.setTime(1000);
  clock.fireNext();

  const incoming =
    resolutions.find(
      (item) =>
        item.skillId === "surface-only"
    );
  assert.ok(incoming);
  assert.equal(incoming.outcome, "evaded");
  assert.equal(
    incoming.targetPresence,
    "underground"
  );
  assert.equal(
    session.snapshot().fighters.player.hp,
    100
  );

  runtime.dispose();
});

test("underground-capable attack hits the same burrowing target", () => {
  const {
    session,
    clock,
    runtime,
    resolutions
  } = harness();

  const burrow = skill({
    id: "burrow-move-2",
    approachMode: "burrow",
    travelMs: 2000,
    damage: 0
  });
  const quake = skill({
    id: "quake",
    form: "area",
    approachMode: "none",
    travelMs: 1000,
    hitPresenceStates: [
      "surface",
      "underground"
    ]
  });

  runtime.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill: burrow
  });
  runtime.startSkill({
    actorId: "opponent",
    targetId: "player",
    skill: quake
  });

  clock.setTime(1000);
  clock.fireNext();

  const incoming =
    resolutions.find(
      (item) => item.skillId === "quake"
    );
  assert.ok(incoming);
  assert.equal(incoming.outcome, "hit");
  assert.equal(
    incoming.targetPresence,
    "underground"
  );
  assert.equal(
    session.snapshot().fighters.player.hp,
    90
  );

  runtime.dispose();
});

test("burrow impact cannot be pulled earlier by visible-contact reporting", () => {
  const {
    clock,
    runtime
  } = harness();

  const burrow = skill({
    id: "burrow-contact-owner",
    approachMode: "burrow",
    travelMs: 2000
  });

  assert.equal(
    runtime.startSkill({
      actorId: "player",
      targetId: "opponent",
      skill: burrow
    }).ok,
    true
  );

  clock.setTime(1000);

  const contact =
    runtime.reportActionContact({
      actorId: "player",
      targetId: "opponent",
      skillId: burrow.id
    });

  assert.equal(
    contact.outcome,
    "contact_not_authoritative"
  );
  assert.equal(
    runtime.hasActiveActionFor("player"),
    true
  );

  runtime.dispose();
});
