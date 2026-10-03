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

async function showcaseFireStorm() {
  const transfer = JSON.parse(
    await readFile(
      new URL(
        "../../data/capture/showcase/cap_fire_atk_6.capture-skill-transfer-v1.json",
        import.meta.url
      ),
      "utf8"
    )
  );

  const source =
    transfer.draft.definition;

  return normalizeSkillDefinition({
    ...source,
    energyCost: 0,
    preparationMs: 0,
    travelMs: 0,
    recoveryMs: 0,
    cooldownMs: 0,
    maxUsesPerCombat: null,
    activationRequirements: {
      mode: "all",
      conditions: []
    }
  });
}

async function claw() {
  return normalizeSkillDefinition(
    JSON.parse(
      await readFile(
        new URL(
          "../../data/combat/skills/claw.skill.json",
          import.meta.url
        ),
        "utf8"
      )
    )
  );
}

function harness({
  session,
  startClock = 0
}) {
  let clock = startClock;
  let scheduled = null;

  const runtime = createCombatRuntime({
    session,
    tickMs: 50,
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

  function tickAt(nextClock) {
    assert.ok(nextClock >= clock);
    clock = nextClock;
    assert.equal(
      typeof scheduled,
      "function",
      "Runtime must own the existing combat tick"
    );
    const callback = scheduled;
    scheduled = null;
    callback();
  }

  return {
    runtime,
    tickAt,
    get clock() {
      return clock;
    }
  };
}

function createSession() {
  return createCombatSession({
    distance: "medium",
    battleFormat: format1v1(),
    fighters: [
      fighter("local"),
      fighter("enemy")
    ]
  });
}

function activateZone(
  session,
  skill,
  times
) {
  for (
    let index = 0;
    index < times;
    index += 1
  ) {
    const result = session.useSkill({
      actorId: "local",
      targetId: "enemy",
      skill
    });
    assert.equal(result.ok, true);
  }
}

test("Tempête de flammes level 1 damages only when a ground attacker enters the short radius", async () => {
  const session = createSession();
  const zoneSkill =
    await showcaseFireStorm();
  const attack = await claw();

  activateZone(
    session,
    zoneSkill,
    1
  );
  assert.equal(
    session.snapshot()
      .persistentZones[0].radius,
    "short"
  );

  const h = harness({ session });

  h.tickAt(1000);
  assert.equal(
    session.snapshot().fighters.enemy.hp,
    100,
    "short zone must not damage an idle enemy in its camp"
  );

  const started =
    h.runtime.startSkill({
      actorId: "enemy",
      targetId: "local",
      skill: attack
    });
  assert.equal(started.ok, true);

  const shortEntryAt =
    1000 +
    attack.preparationMs +
    Math.ceil(
      attack.travelMs * 2 / 3
    );

  h.tickAt(shortEntryAt - 1);
  assert.equal(
    session.snapshot().fighters.enemy.hp,
    100
  );

  h.tickAt(shortEntryAt);
  assert.equal(
    session.snapshot().fighters.enemy.hp,
    95,
    "level 1 must damage when the melee attacker crosses into the short zone"
  );

  h.runtime.dispose();
});

test("Tempête de flammes level 2 stays out of the enemy camp but is entered earlier during approach", async () => {
  const session = createSession();
  const zoneSkill =
    await showcaseFireStorm();
  const attack = await claw();

  activateZone(
    session,
    zoneSkill,
    2
  );
  assert.equal(
    session.snapshot()
      .persistentZones[0].radius,
    "medium"
  );

  const h = harness({ session });

  h.tickAt(1000);
  assert.equal(
    session.snapshot().fighters.enemy.hp,
    100,
    "medium zone must not damage the idle enemy camp"
  );

  const started =
    h.runtime.startSkill({
      actorId: "enemy",
      targetId: "local",
      skill: attack
    });
  assert.equal(started.ok, true);

  const mediumEntryAt =
    1000 +
    attack.preparationMs +
    Math.ceil(
      attack.travelMs / 3
    );
  const shortEntryAt =
    1000 +
    attack.preparationMs +
    Math.ceil(
      attack.travelMs * 2 / 3
    );

  h.tickAt(mediumEntryAt - 1);
  assert.equal(
    session.snapshot().fighters.enemy.hp,
    100
  );

  h.tickAt(mediumEntryAt);
  assert.equal(
    session.snapshot().fighters.enemy.hp,
    95,
    "level 2 must damage before the level-1 short boundary"
  );
  assert.ok(
    mediumEntryAt < shortEntryAt
  );

  h.runtime.dispose();
});

test("Tempête de flammes level 3 damages the enemy camp without an attack", async () => {
  const session = createSession();
  const zoneSkill =
    await showcaseFireStorm();

  activateZone(
    session,
    zoneSkill,
    3
  );
  assert.equal(
    session.snapshot()
      .persistentZones[0].radius,
    "long"
  );

  const h = harness({ session });

  h.tickAt(999);
  assert.equal(
    session.snapshot().fighters.enemy.hp,
    100
  );

  h.tickAt(1000);
  assert.equal(
    session.snapshot().fighters.enemy.hp,
    95,
    "level 3 long zone must cover the enemy camp even with no active attack"
  );

  h.runtime.dispose();
});

test("zone gameplay remains owned by Persistent Zone Runtime, never DOM geometry", async () => {
  const [runtimeSource, zoneSource] =
    await Promise.all([
      readFile(
        new URL(
          "../../src/core/combat/combat-runtime.js",
          import.meta.url
        ),
        "utf8"
      ),
      readFile(
        new URL(
          "../../src/core/combat/persistent-zone-runtime-v1.js",
          import.meta.url
        ),
        "utf8"
      )
    ]);

  assert.match(
    runtimeSource,
    /zoneSpatialContext/
  );
  assert.doesNotMatch(
    runtimeSource,
    /applyCombatDamageV1|computeCombatDamageV1/
  );
  assert.match(
    zoneSource,
    /applyCombatDamageV1/
  );
  assert.doesNotMatch(
    zoneSource,
    /getBoundingClientRect|querySelector|document\./
  );
});
