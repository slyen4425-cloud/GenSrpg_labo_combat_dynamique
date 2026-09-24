import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  activeChargeTimeModifierPct,
  effectivePreparationMs
} from "../../src/core/combat/combat-timing.js";
import {
  addChargeTimeEffect,
  advanceCombatTime,
  createCombatState,
  withFighterHp
} from "../../src/core/combat/combat-state.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";

async function json(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const maraileron = await json("data/combat/fighters/maraileron.combat.json");
const braisombre = await json("data/combat/fighters/braisombre.combat.json");
const claw = normalizeSkillDefinition(
  await json("data/combat/skills/claw.skill.json")
);
const fireball = normalizeSkillDefinition(
  await json("data/combat/skills/fireball.skill.json")
);
const contactCounter = normalizeSkillDefinition(
  await json("data/combat/skills/contact-counter.skill.json")
);

test("fighter energy starts at zero and gains configured discrete ticks", () => {
  let state = createCombatState({
    fighters: [maraileron, braisombre]
  });

  assert.equal(state.fighters.maraileron.energy, 0);
  assert.equal(state.fighters.braisombre.energy, 0);

  state = advanceCombatTime(state, 1999);
  assert.equal(state.fighters.maraileron.energy, 0);
  assert.equal(state.fighters.maraileron.energyChargeProgressMs, 1999);

  state = advanceCombatTime(state, 1);
  assert.equal(state.fighters.maraileron.energy, 1);
  assert.equal(state.fighters.braisombre.energy, 1);
  assert.equal(state.fighters.maraileron.energyChargeProgressMs, 0);

  state = advanceCombatTime(state, 4000);
  assert.equal(state.fighters.maraileron.energy, 3);
  assert.equal(state.fighters.braisombre.energy, 3);
});

test("charge time modifier uses +percent as slower and -percent as faster", () => {
  assert.equal(
    effectivePreparationMs({
      baseMs: 1000,
      permanentPct: 25
    }),
    1250
  );

  assert.equal(
    effectivePreparationMs({
      baseMs: 1000,
      permanentPct: -20
    }),
    800
  );
});

test("temporary charge modifier expires from combat state", () => {
  let state = createCombatState({
    fighters: [
      { ...maraileron, initialEnergy: 10 },
      { ...braisombre, initialEnergy: 10 }
    ]
  });

  state = addChargeTimeEffect(state, "maraileron", {
    id: "quick-cast",
    modifierPct: -25,
    durationMs: 5000
  });

  assert.equal(
    activeChargeTimeModifierPct({
      permanentPct: state.fighters.maraileron.chargeTimeModifierPct,
      effects: state.fighters.maraileron.chargeTimeEffects,
      atMs: state.elapsedMs
    }),
    -25
  );

  state = advanceCombatTime(state, 4999);
  assert.equal(state.fighters.maraileron.chargeTimeEffects.length, 1);

  state = advanceCombatTime(state, 1);
  assert.equal(state.fighters.maraileron.chargeTimeEffects.length, 0);
});

test("session applies temporary charge modifier to actual skill start", () => {
  const session = createCombatSession({
    distance: "short",
    fighters: [
      { ...maraileron, initialEnergy: 10 },
      { ...braisombre, initialEnergy: 10 }
    ]
  });

  session.addChargeEffect("maraileron", {
    id: "quick-cast",
    modifierPct: -20,
    durationMs: 5000
  });

  const started = session.startSkill({
    actorId: "maraileron",
    targetId: "braisombre",
    skill: claw
  });

  assert.equal(started.ok, true);
  assert.equal(started.action.preparationMs, 960);
  assert.equal(started.action.releaseAtMs, 960);
});

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
    },
    get queue() {
      return queue;
    }
  };
}

test("combat runtime automatically advances energy and disposes its timer", () => {
  const session = createCombatSession({
    fighters: [maraileron, braisombre]
  });
  const clock = fakeClock();
  const states = [];

  const runtime = createCombatRuntime({
    session,
    tickMs: 50,
    now: clock.now,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    onState(state) {
      states.push(state);
    }
  });

  runtime.start();
  assert.equal(clock.queue.length, 1);

  clock.setTime(2000);
  clock.fireNext();

  assert.equal(session.snapshot().fighters.maraileron.energy, 1);
  assert.equal(session.snapshot().fighters.braisombre.energy, 1);
  assert.ok(states.length >= 2);

  runtime.dispose();
  assert.equal(clock.queue.length, 0);
  assert.equal(runtime.isRunning, false);
});

test("live reaction can counter a charging contact skill before release", () => {
  const session = createCombatSession({
    distance: "short",
    fighters: [
      { ...maraileron, initialEnergy: 10 },
      { ...braisombre, initialEnergy: 10 }
    ]
  });
  const clock = fakeClock();
  const releases = [];
  const resolutions = [];
  const progress = [];

  const runtime = createCombatRuntime({
    session,
    tickMs: 50,
    now: clock.now,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    onProgress(value) {
      progress.push(value);
    },
    onRelease(value) {
      releases.push(value);
    },
    onResolved(value) {
      resolutions.push(value);
    }
  });

  runtime.start();
  const started = runtime.startSkill({
    actorId: "maraileron",
    targetId: "braisombre",
    skill: claw
  });

  assert.equal(started.ok, true);

  const reacted = runtime.react(contactCounter);
  assert.equal(reacted.ok, true);
  assert.equal(reacted.reaction.readyAtMs, 400);

  clock.setTime(400);
  clock.fireNext();

  assert.equal(releases.length, 0);
  assert.equal(resolutions.length, 1);
  assert.equal(resolutions[0].outcome, "countered");
  assert.equal(runtime.hasActiveAction, false);
  assert.ok(progress.some((item) => item.reaction?.skillId === "contact-counter"));

  runtime.dispose();
});


test("fighter HP is normalized and clamped by combat state", () => {
  let state = createCombatState({
    fighters: [maraileron, braisombre]
  });

  assert.equal(state.fighters.maraileron.hp, 100);
  assert.equal(state.fighters.maraileron.maxHp, 100);
  assert.equal(state.fighters.braisombre.hp, 100);
  assert.equal(state.fighters.braisombre.maxHp, 100);

  state = withFighterHp(state, "maraileron", 42);
  assert.equal(state.fighters.maraileron.hp, 42);

  state = withFighterHp(state, "maraileron", 999);
  assert.equal(state.fighters.maraileron.hp, 100);

  state = withFighterHp(state, "maraileron", -20);
  assert.equal(state.fighters.maraileron.hp, 0);
});


test("live skill completion commits resolved HP damage to session state", () => {
  const session = createCombatSession({
    distance: "medium",
    fighters: [
      { ...maraileron, initialEnergy: 10, initialHp: 100 },
      { ...braisombre, initialEnergy: 10, initialHp: 100 }
    ]
  });
  const clock = fakeClock();
  const resolutions = [];

  const runtime = createCombatRuntime({
    session,
    tickMs: 50,
    now: clock.now,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    onResolved(value) {
      resolutions.push(value);
    }
  });

  runtime.start();
  const started = runtime.startSkill({
    actorId: "maraileron",
    targetId: "braisombre",
    skill: fireball
  });
  assert.equal(started.ok, true);
  assert.equal(session.snapshot().fighters.braisombre.hp, 100);

  clock.setTime(2700);
  clock.fireNext();

  assert.equal(resolutions.length, 1);
  assert.equal(resolutions[0].outcome, "hit");
  assert.equal(resolutions[0].state.fighters.braisombre.hp, 70);
  assert.equal(session.snapshot().fighters.braisombre.hp, 70);

  runtime.dispose();
});
