import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

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
    maxEnergy: 100,
    initialEnergy: 100,
    energyChargeAmount: 0,
    energyChargeIntervalMs: 2000,
    movementEnergyPerStep: 0,
    chargeTimeModifierPct: 0
  };
}

function format1v1() {
  return {
    actors: [
      { actorId: "local" },
      { actorId: "enemy" }
    ],
    teamOf(actorId) {
      return actorId === "local"
        ? "local"
        : actorId === "enemy"
          ? "enemy"
          : null;
    }
  };
}

async function fireStorm({
  preparationMs = 2000,
  cooldownMs = 0,
  reactivation = "reinforce"
} = {}) {
  const transfer = JSON.parse(
    await readFile(
      new URL(
        "../../data/capture/showcase/cap_fire_atk_6.capture-skill-transfer-v1.json",
        import.meta.url
      ),
      "utf8"
    )
  );
  const source = transfer.draft.definition;
  return normalizeSkillDefinition({
    ...source,
    energyCost: 0,
    preparationMs,
    travelMs: 0,
    recoveryMs: 0,
    cooldownMs,
    maxUsesPerCombat: null,
    activationRequirements: {
      mode: "all",
      conditions: []
    },
    effects: source.effects.map(
      (effect) =>
        effect.kind === "persistent_zone"
          ? {
              ...effect,
              reactivation
            }
          : effect
    )
  });
}

function harmlessAction(id) {
  return normalizeSkillDefinition({
    id,
    name: id,
    category: "offensive",
    form: "beam",
    loadoutSlot: "standard",
    element: "fire",
    approachMode: "none",
    energyCost: 0,
    preparationMs: 1500,
    travelMs: 500,
    recoveryMs: 1000,
    cooldownMs: 0,
    maxUsesPerCombat: null,
    interruptibleDuringPreparation: true,
    allowedDistances: [
      "short",
      "medium",
      "long"
    ],
    targetRelations: ["enemy"],
    activationRequirements: {
      mode: "all",
      conditions: []
    },
    evasion: {
      window: null,
      incomingForms: []
    },
    projectileClash: {
      power: 0
    },
    reaction: {
      blockForms: [],
      reflectForms: [],
      immuneElements: [],
      counterForms: [],
      evadeForms: [],
      evadeApproaches: []
    },
    effect: {
      damage: 0,
      heal: 0,
      interruptsPreparation: false,
      stunMs: 0,
      tags: []
    },
    effects: []
  });
}

function createSession(distance = "medium") {
  return createCombatSession({
    distance,
    battleFormat: format1v1(),
    fighters: [
      fighter("local"),
      fighter("enemy")
    ]
  });
}

function runtimeHarness({
  session,
  onHealthDelta = () => {},
  readZoneSpatialContext = null
}) {
  let clock = 0;
  let scheduled = null;

  const runtime = createCombatRuntime({
    session,
    tickMs: 50,
    onHealthDelta,
    readZoneSpatialContext,
    now() {
      return clock;
    },
    setTimer(callback) {
      scheduled = callback;
      return 1;
    },
    clearTimer() {
      scheduled = null;
    }
  });

  runtime.start();

  return {
    runtime,
    setClock(nextClock) {
      assert.ok(nextClock >= clock);
      clock = nextClock;
    },
    tickAt(nextClock) {
      assert.ok(nextClock >= clock);
      clock = nextClock;
      assert.equal(
        typeof scheduled,
        "function",
        "Combat Runtime must keep its clock scheduled"
      );
      const callback = scheduled;
      scheduled = null;
      callback();
    }
  };
}

test("real Runtime Tempête applies at semantic impact and first tick is exactly one interval later", async () => {
  const session = createSession("short");
  const storm = await fireStorm({
    preparationMs: 2000
  });
  const h = runtimeHarness({
    session,
    readZoneSpatialContext(state) {
      return {
        zones:
          (state.persistentZones ?? []).map(
            (zone) => ({
              zoneId: zone.id,
              sourceActorId:
                zone.sourceActorId,
              radius: zone.radius,
              bounds: {
                left: 0,
                top: 0,
                width: 100,
                height: 100
              }
            })
          ),
        actors: [
          {
            actorId: "local",
            bounds: {
              left: 20,
              top: 20,
              width: 10,
              height: 10
            }
          },
          {
            actorId: "enemy",
            bounds: {
              left: 40,
              top: 40,
              width: 10,
              height: 10
            }
          }
        ]
      };
    }
  });

  const started = h.runtime.startSkill({
    actorId: "local",
    targetId: "enemy",
    skill: storm
  });
  assert.equal(started.ok, true);

  h.tickAt(1999);
  assert.equal(
    session.snapshot().persistentZones.length,
    0
  );

  h.tickAt(2000);
  const zone =
    session.snapshot().persistentZones[0];
  assert.ok(zone);
  assert.equal(
    zone.appliedAtMs,
    2000,
    "zone clock must use the real combat impact time, not add preparation twice"
  );
  assert.equal(zone.nextTickAtMs, 3000);

  h.tickAt(2999);
  assert.equal(
    session.snapshot().fighters.enemy.hp,
    100
  );

  h.tickAt(3000);
  assert.equal(
    session.snapshot().fighters.enemy.hp,
    95,
    "first tick must occur exactly 1000 ms after visible zone activation"
  );

  h.runtime.dispose();
});

test("reinforce grows the existing zone without postponing its already scheduled tick", async () => {
  const session = createSession();
  const storm = await fireStorm({
    preparationMs: 0,
    reactivation: "reinforce"
  });

  assert.equal(
    session.useSkill({
      actorId: "local",
      targetId: "enemy",
      skill: storm
    }).ok,
    true
  );

  session.advanceMs(600);
  const before =
    session.snapshot().persistentZones[0];
  assert.equal(before.radius, "short");
  assert.equal(before.nextTickAtMs, 1000);
  assert.equal(before.expiresAtMs, 7000);

  assert.equal(
    session.useSkill({
      actorId: "local",
      targetId: "enemy",
      skill: storm
    }).ok,
    true
  );

  const reinforced =
    session.snapshot().persistentZones[0];
  assert.equal(reinforced.radius, "medium");
  assert.equal(
    reinforced.nextTickAtMs,
    1000,
    "reinforce must not reset the damage cadence"
  );
  assert.equal(
    reinforced.appliedAtMs,
    600,
    "reinforce may extend lifetime from its latest activation"
  );
  assert.equal(
    reinforced.expiresAtMs,
    7600,
    "reinforce must extend lifetime so short → medium → long remains reachable"
  );

  session.advanceMs(400);
  assert.equal(
    session.snapshot().fighters.enemy.hp,
    95,
    "the tick already due at 1000 ms must still happen"
  );
});

test("refresh remains the explicit mode that resets zone lifetime and tick origin", async () => {
  const session = createSession();
  const storm = await fireStorm({
    preparationMs: 0,
    reactivation: "refresh"
  });

  session.useSkill({
    actorId: "local",
    targetId: "enemy",
    skill: storm
  });
  session.advanceMs(600);
  session.useSkill({
    actorId: "local",
    targetId: "enemy",
    skill: storm
  });

  const refreshed =
    session.snapshot().persistentZones[0];

  assert.equal(refreshed.radius, "short");
  assert.equal(refreshed.appliedAtMs, 600);
  assert.equal(refreshed.nextTickAtMs, 1600);
  assert.equal(refreshed.expiresAtMs, 7600);
});

test("Runtime reinforcement keeps ticking during preparation and preserves the next due tick after growth", async () => {
  const session = createSession("short");
  const storm = await fireStorm({
    preparationMs: 2000,
    cooldownMs: 0,
    reactivation: "reinforce"
  });
  const feedback = [];

  const h = runtimeHarness({
    session,
    onHealthDelta(event) {
      if (
        event.kind === "damage" &&
        event.actorId === "enemy"
      ) {
        feedback.push(event.amount);
      }
    },
    readZoneSpatialContext(state) {
      return {
        zones:
          (state.persistentZones ?? []).map(
            (zone) => ({
              zoneId: zone.id,
              sourceActorId:
                zone.sourceActorId,
              radius: zone.radius,
              bounds: {
                left: 0,
                top: 0,
                width: 120,
                height: 120
              }
            })
          ),
        actors: [
          {
            actorId: "local",
            bounds: {
              left: 20,
              top: 20,
              width: 10,
              height: 10
            }
          },
          {
            actorId: "enemy",
            bounds: {
              left: 50,
              top: 50,
              width: 10,
              height: 10
            }
          }
        ]
      };
    }
  });

  assert.equal(
    h.runtime.startSkill({
      actorId: "local",
      targetId: "enemy",
      skill: storm
    }).ok,
    true
  );

  h.tickAt(2000);
  assert.equal(
    session.snapshot().persistentZones[0].radius,
    "short"
  );
  assert.equal(
    session.snapshot().persistentZones[0].nextTickAtMs,
    3000
  );

  h.setClock(2500);
  assert.equal(
    h.runtime.startSkill({
      actorId: "local",
      targetId: "enemy",
      skill: storm
    }).ok,
    true
  );

  h.tickAt(3000);
  assert.equal(
    session.snapshot().fighters.enemy.hp,
    95,
    "existing zone must tick while reinforcement is preparing"
  );

  h.tickAt(4000);
  assert.equal(
    session.snapshot().fighters.enemy.hp,
    90
  );

  h.tickAt(4500);
  const reinforced =
    session.snapshot().persistentZones[0];
  assert.equal(reinforced.radius, "medium");
  assert.equal(
    reinforced.nextTickAtMs,
    5000,
    "reinforcement completion must preserve the already-running tick phase"
  );

  h.tickAt(5000);
  assert.equal(
    session.snapshot().fighters.enemy.hp,
    85,
    "next native tick must still fire immediately after reinforcement"
  );
  assert.deepEqual(feedback, [5, 5, 5]);

  h.runtime.dispose();
});

test("ordinary actions by both fighters do not suspend long-zone HP ticks or health feedback", async () => {
  const session = createSession();
  const storm = await fireStorm({
    preparationMs: 0
  });

  for (let index = 0; index < 3; index += 1) {
    assert.equal(
      session.useSkill({
        actorId: "local",
        targetId: "enemy",
        skill: storm
      }).ok,
      true
    );
  }

  assert.equal(
    session.snapshot().persistentZones[0].radius,
    "long"
  );

  const feedback = [];
  const h = runtimeHarness({
    session,
    onHealthDelta(event) {
      if (
        event.kind === "damage" &&
        event.actorId === "enemy"
      ) {
        feedback.push(event.amount);
      }
    }
  });

  h.setClock(250);
  assert.equal(
    h.runtime.startSkill({
      actorId: "local",
      targetId: "enemy",
      skill: harmlessAction("local-busy")
    }).ok,
    true
  );
  assert.equal(
    h.runtime.startSkill({
      actorId: "enemy",
      targetId: "local",
      skill: harmlessAction("enemy-busy")
    }).ok,
    true
  );

  h.tickAt(1000);
  assert.equal(
    session.snapshot().fighters.enemy.hp,
    95
  );

  h.tickAt(2000);
  assert.equal(
    session.snapshot().fighters.enemy.hp,
    90
  );

  h.tickAt(3000);
  assert.equal(
    session.snapshot().fighters.enemy.hp,
    85
  );

  assert.deepEqual(
    feedback,
    [5, 5, 5],
    "each native zone tick must keep its feedback even while both actors act"
  );

  h.runtime.dispose();
});
