import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { normalizeCombatCommandDefinition } from "../../src/contracts/combat-command-definition.js";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { createCombatState, withFighterHp } from "../../src/core/combat/combat-state.js";
import { resolveCommandStart, resolveCommandCompletion } from "../../src/core/combat/command-resolver.js";
import { resolveSkill } from "../../src/core/combat/action-resolver.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";

async function json(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const maraileron = await json("data/combat/fighters/maraileron.combat.json");
const braisombre = await json("data/combat/fighters/braisombre.combat.json");

const item = normalizeCombatCommandDefinition(
  await json("data/combat/commands/item.command.json")
);
const recall = normalizeCombatCommandDefinition(
  await json("data/combat/commands/recall.command.json")
);
const summon = normalizeCombatCommandDefinition(
  await json("data/combat/commands/summon.command.json")
);
const fireball = normalizeSkillDefinition(
  await json("data/combat/skills/fireball.skill.json")
);
const stunBolt = normalizeSkillDefinition(
  await json("data/combat/skills/stun-bolt.skill.json")
);

function fundedState() {
  return createCombatState({
    distance: "medium",
    fighters: [
      { ...maraileron, initialEnergy: 10, initialHp: 100 },
      { ...braisombre, initialEnergy: 10, initialHp: 100 }
    ]
  });
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
    },
    get queue() {
      return queue;
    }
  };
}

test("combat commands have their own typed configurable contract", () => {
  assert.equal(item.kind, "item");
  assert.equal(item.energyCost, 1);
  assert.equal(item.preparationMs, 700);
  assert.equal(item.effect.heal, 20);

  assert.equal(recall.kind, "recall");
  assert.equal(recall.energyCost, 2);
  assert.equal(recall.preparationMs, 1400);

  assert.equal(summon.kind, "summon");
  assert.equal(summon.energyCost, 3);
  assert.equal(summon.preparationMs, 2200);
  assert.equal(summon.effect.summonCreatureId, null);
});

test("command start spends energy but command effect waits for completion", () => {
  let state = fundedState();
  state = withFighterHp(state, "maraileron", 50);

  const started = resolveCommandStart({
    state,
    actorId: "maraileron",
    command: item
  });

  assert.equal(started.ok, true);
  assert.equal(started.state.fighters.maraileron.energy, 9);
  assert.equal(started.state.fighters.maraileron.hp, 50);
  assert.equal(started.action.actionType, "command");
  assert.equal(started.action.releaseAtMs, 700);

  const completed = resolveCommandCompletion({
    state: started.state,
    action: started.action
  });

  assert.equal(completed.outcome, "completed");
  assert.equal(completed.state.fighters.maraileron.hp, 70);
  assert.equal(
    completed.events.find((event) => event.type === "command-complete").atMs,
    700
  );
});

test("recall and summon resolve semantically without inventing roster state", () => {
  for (const command of [recall, summon]) {
    const started = resolveCommandStart({
      state: fundedState(),
      actorId: "maraileron",
      command
    });
    const completed = resolveCommandCompletion({
      state: started.state,
      action: started.action
    });

    assert.equal(completed.commandKind, command.kind);
    assert.equal(
      completed.events.some(
        (event) =>
          event.type === "command-complete" &&
          event.kind === command.kind
      ),
      true
    );
  }
});

test("runtime charges a command on the same clock as skills", () => {
  const session = createCombatSession({
    distance: "medium",
    fighters: [
      { ...maraileron, initialEnergy: 10 },
      { ...braisombre, initialEnergy: 10 }
    ]
  });
  const clock = fakeClock();
  const progress = [];
  const resolutions = [];

  const runtime = createCombatRuntime({
    session,
    tickMs: 50,
    now: clock.now,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    onProgress(value) {
      progress.push(value);
    },
    onResolved(value) {
      resolutions.push(value);
    }
  });

  runtime.start();
  const started = runtime.startCommand({
    actorId: "maraileron",
    command: summon
  });

  assert.equal(started.ok, true);
  assert.equal(started.action.actionType, "command");
  assert.equal(session.snapshot().fighters.maraileron.energy, 7);
  assert.equal(runtime.hasActiveAction, true);

  clock.setTime(2199);
  clock.fireNext();

  assert.equal(resolutions.length, 0);
  assert.equal(runtime.hasActiveAction, true);
  assert.ok(
    progress.some(
      (value) =>
        value.commandId === "summon" &&
        value.phase === "preparation"
    )
  );

  clock.setTime(2200);
  clock.fireNext();

  assert.equal(resolutions.length, 1);
  assert.equal(resolutions[0].commandKind, "summon");
  assert.equal(runtime.hasActiveAction, false);

  runtime.dispose();
});

test("stun interrupt can cancel a charging command before its release", () => {
  const session = createCombatSession({
    distance: "medium",
    fighters: [
      { ...maraileron, initialEnergy: 10 },
      { ...braisombre, initialEnergy: 10 }
    ]
  });
  const clock = fakeClock();
  const interruptions = [];

  const runtime = createCombatRuntime({
    session,
    now: clock.now,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    onInterrupted(value) {
      interruptions.push(value);
    }
  });

  runtime.start();
  runtime.startCommand({
    actorId: "maraileron",
    command: summon
  });

  const stunResolution = resolveSkill({
    state: fundedState(),
    actorId: "braisombre",
    targetId: "maraileron",
    skill: stunBolt
  });

  assert.equal(
    stunResolution.events.some(
      (event) =>
        event.type === "charge-interrupt" &&
        event.actorId === "maraileron"
    ),
    true
  );

  clock.setTime(850);
  const interrupted = runtime.applyResolutionInterrupt(stunResolution);

  assert.equal(interrupted.ok, true);
  assert.equal(interrupted.outcome, "interrupted");
  assert.equal(interrupted.reason, "stun");
  assert.equal(runtime.hasActiveAction, false);
  assert.equal(interruptions.length, 1);

  runtime.dispose();
});

test("stun cannot cancel a skill after that skill has already released", () => {
  const session = createCombatSession({
    distance: "medium",
    fighters: [
      { ...maraileron, initialEnergy: 10 },
      { ...braisombre, initialEnergy: 10 }
    ]
  });
  const clock = fakeClock();

  const runtime = createCombatRuntime({
    session,
    now: clock.now,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer
  });

  runtime.start();
  runtime.startSkill({
    actorId: "maraileron",
    targetId: "braisombre",
    skill: fireball
  });

  clock.setTime(2001);
  clock.fireNext();

  const result = runtime.interruptActive({
    targetActorId: "maraileron",
    reason: "stun"
  });

  assert.equal(result.ok, false);
  assert.equal(result.outcome, "too_late");
  assert.equal(runtime.hasActiveAction, true);

  runtime.dispose();
});

test("stun skill declares interruption semantically instead of through UI", () => {
  assert.equal(stunBolt.effect.interruptsPreparation, true);
  assert.equal(stunBolt.effect.stunMs, 1200);
  assert.equal(stunBolt.form, "projectile");
});
