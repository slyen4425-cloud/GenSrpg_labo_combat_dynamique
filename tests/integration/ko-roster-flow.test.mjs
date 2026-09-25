import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";
import { createRosterSession } from "../../src/core/combat/roster-session.js";
import { createCombatResolutionPresenter } from "../../src/adapters/renderer/combat-resolution-presenter.js";

async function json(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const maraileron = await json("data/combat/fighters/maraileron.combat.json");
const braisombre = await json("data/combat/fighters/braisombre.combat.json");
const rosterData = await json("data/combat/rosters/demo-2v2.roster.json");
const fireball = normalizeSkillDefinition(
  await json("data/combat/skills/fireball.skill.json")
);

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
    }
  };
}

test("real runtime KO path emits fighter-ko then replaces opponent from roster", async () => {
  const session = createCombatSession({
    distance: "medium",
    fighters: [
      { ...maraileron, id: "player", initialEnergy: 10, initialHp: 100 },
      { ...braisombre, id: "opponent", initialEnergy: 10, initialHp: 30 }
    ]
  });

  const roster = createRosterSession({
    combatSession: session,
    roster: rosterData,
    fighterConfigs: { maraileron, braisombre }
  });

  const visualCalls = [];
  const visuals = {
    playEventFor(slot, event) {
      visualCalls.push(["play", slot, event]);
      return Promise.resolve({ status: "finished" });
    },
    playApproachFor(slot, approachMode, options) {
      visualCalls.push(["approach", slot, approachMode, options?.travelMs]);
      return Promise.resolve({ status: "finished" });
    },
    cancelFor(slot) {
      visualCalls.push(["cancel", slot]);
    }
  };

  const presenter = createCombatResolutionPresenter({ visuals });
  const clock = fakeClock();
  let resolution = null;
  let presentation = null;

  const runtime = createCombatRuntime({
    session,
    tickMs: 50,
    now: clock.now,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    onRelease({ action }) {
      presenter.presentRelease({
        action,
        actorSlot: "player",
        targetSlot: "opponent"
      });
    },
    onResolved(value) {
      resolution = value;
      presentation = presenter.presentOutcome({
        resolution: value,
        actorSlot: "player",
        targetSlot: "opponent"
      });
    }
  });

  runtime.start();
  const started = runtime.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill: fireball
  });
  assert.equal(started.ok, true);

  clock.setTime(2700);
  clock.fireNext();

  assert.equal(session.snapshot().fighters.opponent.hp, 0);
  assert.ok(
    resolution.events.some(
      (event) => event.type === "fighter-ko" && event.actorId === "opponent"
    )
  );
  assert.equal(presentation.ko, true);

  await presentation.finished;

  const replacement = roster.replaceKnockedOut("opponent");
  assert.equal(replacement.ok, true);
  assert.equal(replacement.outcome, "ko_replaced");
  assert.equal(replacement.creatureId, "maraileron");
  assert.equal(roster.snapshot().opponent.activeMemberId, "opponent-marai");
  assert.equal(session.snapshot().fighters.opponent.hp, maraileron.initialHp);

  assert.deepEqual(
    visualCalls.filter((call) => call[0] === "play").slice(-2),
    [
      ["play", "opponent", "hit"],
      ["play", "opponent", "ko"]
    ]
  );

  runtime.dispose();
  presenter.dispose();
});
