import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";

async function json(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function fakeClock() {
  let time = 0;
  let nextId = 1;
  const queue = [];

  return {
    now: () => time,
    setTime(value) {
      time = value;
    },
    setTimer(callback, delayMs) {
      const item = { id: nextId++, callback, delayMs };
      queue.push(item);
      return item.id;
    },
    clearTimer(id) {
      const index = queue.findIndex((item) => item.id === id);
      if (index >= 0) {
        queue.splice(index, 1);
      }
    },
    fireNext() {
      const item = queue.shift();
      item?.callback();
      return item;
    }
  };
}

const maraileron = await json("data/combat/fighters/maraileron.combat.json");
const braisombre = await json("data/combat/fighters/braisombre.combat.json");
const claw = normalizeSkillDefinition(
  await json("data/combat/skills/claw.skill.json")
);
const aerial = normalizeSkillDefinition(
  await json("data/combat/skills/aerial-dive.skill.json")
);

function harness() {
  const session = createCombatSession({
    distance: "short",
    fighters: [
      { ...maraileron, id: "player", initialEnergy: 10, initialHp: 100 },
      { ...braisombre, id: "opponent", initialEnergy: 10, initialHp: 100 }
    ]
  });
  const clock = fakeClock();
  const resolutions = [];
  const runtime = createCombatRuntime({
    session,
    now: clock.now,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    onResolved(value) {
      resolutions.push(value);
    }
  });
  runtime.start();
  return { session, clock, runtime, resolutions };
}

test("incoming claw misses when target is near the end of configured aerial travel", () => {
  const { session, clock, runtime, resolutions } = harness();

  const attack = runtime.startSkill({
    actorId: "opponent",
    targetId: "player",
    skill: claw
  });
  assert.equal(attack.ok, true);

  clock.setTime(1000);
  const escape = runtime.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill: aerial
  });
  assert.equal(escape.ok, true);

  clock.setTime(2700);
  clock.fireNext();

  assert.equal(resolutions.length, 1);
  assert.equal(resolutions[0].actorId, "opponent");
  assert.equal(resolutions[0].skillId, "claw");
  assert.equal(resolutions[0].outcome, "evaded");
  assert.equal(resolutions[0].evasionApplied, "aerial-dive");
  assert.equal(session.snapshot().fighters.player.hp, 100);
  assert.equal(runtime.hasActiveActionFor("player"), true);

  clock.setTime(2750);
  clock.fireNext();

  assert.equal(resolutions.length, 2);
  assert.equal(resolutions[1].actorId, "player");
  assert.equal(resolutions[1].skillId, "aerial-dive");
  assert.equal(resolutions[1].outcome, "hit");

  runtime.dispose();
});

test("incoming claw still hits while aerial skill is only preparing", () => {
  const { session, clock, runtime, resolutions } = harness();

  runtime.startSkill({
    actorId: "opponent",
    targetId: "player",
    skill: claw
  });

  clock.setTime(2000);
  runtime.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill: aerial
  });

  clock.setTime(2700);
  clock.fireNext();

  assert.equal(resolutions[0].outcome, "hit");
  assert.equal(resolutions[0].evasionApplied, null);
  assert.equal(session.snapshot().fighters.player.hp, 82);

  runtime.dispose();
});

test("incoming claw hits normally after the target mobility action has already resolved", () => {
  const { session, clock, runtime, resolutions } = harness();

  runtime.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill: aerial
  });

  runtime.startSkill({
    actorId: "opponent",
    targetId: "player",
    skill: claw
  });

  clock.setTime(1750);
  clock.fireNext();
  assert.equal(resolutions.length, 1);
  assert.equal(resolutions[0].skillId, "aerial-dive");

  clock.setTime(2700);
  clock.fireNext();

  assert.equal(resolutions.length, 2);
  assert.equal(resolutions[1].skillId, "claw");
  assert.equal(resolutions[1].outcome, "hit");
  assert.equal(session.snapshot().fighters.player.hp, 82);

  runtime.dispose();
});
