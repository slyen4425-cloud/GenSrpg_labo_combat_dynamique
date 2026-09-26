import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { normalizeCombatCommandDefinition } from "../../src/contracts/combat-command-definition.js";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import {
  resolveCommandCompletion,
  resolveCommandStart
} from "../../src/core/combat/command-resolver.js";
import { resolveSkill } from "../../src/core/combat/action-resolver.js";
import { createCombatState } from "../../src/core/combat/combat-state.js";
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
const stunBolt = normalizeSkillDefinition(
  await json("data/combat/skills/stun-bolt.skill.json")
);

function fundedState({ hp = 100 } = {}) {
  return createCombatState({
    distance: "medium",
    fighters: [
      { ...maraileron, initialEnergy: 10, initialHp: hp },
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
      if (index >= 0) queue.splice(index, 1);
    },
    fireNext() {
      const item = queue.shift();
      item?.callback();
      return item;
    }
  };
}

test("combat command contract keeps item recall and summon separate from skills", () => {
  assert.equal(item.kind, "item");
  assert.equal(recall.kind, "recall");
  assert.equal(summon.kind, "summon");

  assert.equal(item.energyCost, 1);
  assert.equal(recall.energyCost, 2);
  assert.equal(summon.energyCost, 3);

  assert.equal(item.interruptibleDuringPreparation, true);
  assert.equal(recall.interruptibleDuringPreparation, true);
  assert.equal(summon.interruptibleDuringPreparation, true);

  assert.equal(item.effect.itemId, "potion-test");
  assert.equal(summon.effect.summonCreatureId, null);
});

test("item spends energy at start but heals only when the command completes", () => {
  const initial = fundedState({ hp: 50 });
  const started = resolveCommandStart({
    state: initial,
    actorId: "maraileron",
    command: item
  });

  assert.equal(started.ok, true);
  assert.equal(started.action.actionType, "command");
  assert.equal(started.action.actionId, "item");
  assert.equal(started.action.releaseAtMs, 700);
  assert.equal(started.state.fighters.maraileron.energy, 9);
  assert.equal(started.state.fighters.maraileron.hp, 50);

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

test("recall and summon complete as semantic combat commands", () => {
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

    const event = completed.events.find(
      (entry) => entry.type === "command-complete"
    );

    assert.equal(completed.commandKind, command.kind);
    assert.equal(event.kind, command.kind);
    assert.equal(event.commandId, command.id);
  }
});

test("command start is rejected when energy cannot pay its configured cost", () => {
  const state = createCombatState({
    distance: "medium",
    fighters: [
      { ...maraileron, initialEnergy: 1 },
      { ...braisombre, initialEnergy: 10 }
    ]
  });

  const result = resolveCommandStart({
    state,
    actorId: "maraileron",
    command: summon
  });

  assert.equal(result.ok, false);
  assert.equal(result.outcome, "insufficient_energy");
  assert.equal(state.fighters.maraileron.energy, 1);
});

test("runtime charges a command and allows stun interruption before release", () => {
  const session = createCombatSession({
    distance: "medium",
    fighters: [
      { ...maraileron, initialEnergy: 10 },
      { ...braisombre, initialEnergy: 10 }
    ]
  });
  const clock = fakeClock();
  const progress = [];
  const interrupted = [];

  const runtime = createCombatRuntime({
    session,
    tickMs: 50,
    now: clock.now,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    onProgress(value) {
      progress.push(value);
    },
    onInterrupted(value) {
      interrupted.push(value);
    }
  });

  runtime.start();
  const started = runtime.startCommand({
    actorId: "maraileron",
    command: summon
  });

  assert.equal(started.ok, true);
  assert.equal(runtime.activeAction.actionType, "command");
  assert.equal(runtime.activeAction.actionId, "summon");

  clock.setTime(1100);
  clock.fireNext();

  assert.ok(
    progress.some(
      (value) =>
        value.commandId === "summon" &&
        value.chargeProgress >= 0.49 &&
        value.chargeProgress <= 0.51
    )
  );

  const result = runtime.interruptActive({
    targetActorId: "maraileron",
    reason: "stun"
  });

  assert.equal(result.ok, true);
  assert.equal(result.outcome, "interrupted");
  assert.equal(result.reason, "stun");
  assert.equal(runtime.hasActiveAction, false);
  assert.equal(interrupted.length, 1);

  runtime.dispose();
});

test("runtime refuses interruption after a command has reached release", () => {
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
    tickMs: 50,
    now: clock.now,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer
  });

  runtime.start();
  runtime.startCommand({
    actorId: "maraileron",
    command: recall
  });

  clock.setTime(1400);
  const result = runtime.interruptActive({
    targetActorId: "maraileron",
    reason: "stun"
  });

  assert.equal(result.ok, false);
  assert.equal(result.outcome, "too_late");

  runtime.dispose();
});

test("stun produces charge-interrupt only at its real impact timestamp", () => {
  const resolution = resolveSkill({
    state: fundedState(),
    actorId: "braisombre",
    targetId: "maraileron",
    skill: stunBolt
  });

  assert.equal(resolution.outcome, "hit");

  const interrupt = resolution.events.find(
    (event) => event.type === "charge-interrupt"
  );
  const release = resolution.events.find(
    (event) => event.type === "skill-release"
  );
  const impact = resolution.events.find(
    (event) => event.type === "skill-arrive"
  );

  assert.equal(release.atMs, 500);
  assert.equal(impact.atMs, 850);
  assert.equal(interrupt.atMs, 850);
  assert.equal(interrupt.reason, "stun");
  assert.equal(interrupt.stunMs, 1200);

  assert.equal(
    resolution.events.some(
      (event) =>
        event.type === "charge-interrupt" &&
        event.atMs < impact.atMs
    ),
    false
  );
});

test("semantic stun impact can interrupt a command that is still charging", () => {
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
    tickMs: 50,
    now: clock.now,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer
  });

  runtime.start();
  runtime.startCommand({
    actorId: "maraileron",
    command: recall
  });

  const stunResolution = resolveSkill({
    state: fundedState(),
    actorId: "braisombre",
    targetId: "maraileron",
    skill: stunBolt
  });

  clock.setTime(850);
  const interrupted = runtime.applyResolutionInterrupt(stunResolution);

  assert.equal(interrupted.ok, true);
  assert.equal(interrupted.outcome, "interrupted");
  assert.equal(runtime.hasActiveAction, false);

  runtime.dispose();
});
