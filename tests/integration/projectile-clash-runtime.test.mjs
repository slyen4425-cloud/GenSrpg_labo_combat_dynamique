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

test("two configured fireballs meet in flight and both resolve with zero damage", async () => {
  const rawFireball = JSON.parse(
    await readFile(
      "data/combat/skills/fireball.skill.json",
      "utf8"
    )
  );
  const fireball = normalizeSkillDefinition(rawFireball);

  assert.deepEqual(fireball.projectileClash, {
    mode: "mutual_cancel",
    group: "fire-orb"
  });

  const fighter = (id) => ({
    id,
    maxHp: 100,
    initialHp: 100,
    maxEnergy: 10,
    initialEnergy: 10,
    energyChargeAmount: 0,
    energyChargeIntervalMs: 2000,
    movementEnergyPerStep: 1,
    chargeTimeModifierPct: 0
  });

  const session = createCombatSession({
    distance: "medium",
    fighters: [
      fighter("player"),
      fighter("opponent")
    ]
  });

  let clock = 0;
  let scheduled = null;
  let timerSequence = 0;
  const releases = [];
  const resolutions = [];

  const runtime = createCombatRuntime({
    session,
    tickMs: 50,
    now: () => clock,
    setTimer(callback) {
      scheduled = callback;
      timerSequence += 1;
      return timerSequence;
    },
    clearTimer() {
      scheduled = null;
    },
    onRelease(payload) {
      releases.push(payload);
    },
    onResolved(resolution) {
      resolutions.push(resolution);
    }
  });

  function advanceTo(nextClock) {
    assert.ok(nextClock >= clock);
    clock = nextClock;
    const callback = scheduled;
    scheduled = null;
    assert.equal(typeof callback, "function");
    callback();
  }

  runtime.start();

  assert.equal(
    runtime.startSkill({
      actorId: "player",
      targetId: "opponent",
      skill: fireball
    }).ok,
    true
  );
  assert.equal(
    runtime.startSkill({
      actorId: "opponent",
      targetId: "player",
      skill: fireball
    }).ok,
    true
  );

  advanceTo(2000);

  assert.equal(releases.length, 2);
  assert.equal(runtime.activeActions.length, 2);
  assert.equal(session.snapshot().fighters.player.hp, 100);
  assert.equal(session.snapshot().fighters.opponent.hp, 100);

  advanceTo(2350);

  assert.equal(runtime.activeActions.length, 0);
  assert.equal(resolutions.length, 2);
  assert.deepEqual(
    resolutions.map((item) => item.outcome).sort(),
    ["clashed", "clashed"]
  );
  assert.equal(
    resolutions.every(
      (item) =>
        item.events.some(
          (event) => event.type === "projectile-clash"
        ) &&
        !item.events.some((event) => event.type === "hit")
    ),
    true
  );
  assert.equal(session.snapshot().fighters.player.hp, 100);
  assert.equal(session.snapshot().fighters.opponent.hp, 100);

  advanceTo(3000);

  assert.equal(resolutions.length, 2);
  assert.equal(session.snapshot().fighters.player.hp, 100);
  assert.equal(session.snapshot().fighters.opponent.hp, 100);

  runtime.dispose();
});
