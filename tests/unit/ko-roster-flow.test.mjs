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

function fakeClock() {
  let time = 0;
  const queue = [];
  let nextId = 1;

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

test("real KO path resolves damage, presents Hit/KO, then replaces opponent roster member", async () => {
  const maraileron = await json("data/combat/fighters/maraileron.combat.json");
  const braisombre = await json("data/combat/fighters/braisombre.combat.json");
  const rosterData = await json("data/combat/rosters/demo-2v2.roster.json");
  const fireball = normalizeSkillDefinition(
    await json("data/combat/skills/fireball.skill.json")
  );

  const session = createCombatSession({
    distance: "medium",
    fighters: [
      { ...maraileron, id: "player", initialEnergy: 10, initialHp: 100 },
      { ...braisombre, id: "opponent", initialEnergy: 10, initialHp: 20 }
    ]
  });

  const roster = createRosterSession({
    combatSession: session,
    roster: rosterData,
    fighterConfigs: { maraileron, braisombre }
  });

  const visualCalls = [];
  const presenter = createCombatResolutionPresenter({
    visuals: {
      playEventFor(slot, type) {
        visualCalls.push([slot, type]);
        return Promise.resolve({ status: "finished" });
      },
      playApproachFor() {
        return Promise.resolve({ status: "finished" });
      },
      cancelFor() {}
    }
  });

  const clock = fakeClock();
  let resolution = null;

  const runtime = createCombatRuntime({
    session,
    tickMs: 50,
    now: clock.now,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    onResolved(value) {
      resolution = value;
    }
  });

  runtime.start();
  runtime.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill: fireball
  });

  clock.setTime(2699);
  clock.fireNext();
  assert.equal(session.snapshot().fighters.opponent.hp, 20);
  assert.equal(resolution, null);

  clock.setTime(2700);
  clock.fireNext();

  assert.equal(session.snapshot().fighters.opponent.hp, 0);
  assert.equal(resolution.outcome, "hit");

  const presentation = presenter.presentOutcome({
    resolution,
    actorSlot: "player",
    targetSlot: "opponent"
  });

  assert.equal(presentation.ko, true);
  await presentation.finished;

  assert.deepEqual(visualCalls, [
    ["opponent", "hit"],
    ["opponent", "ko"]
  ]);

  const replacement = roster.replaceKnockedOut("opponent");
  assert.equal(replacement.outcome, "ko_replaced");
  assert.equal(replacement.defeatedMemberId, "opponent-drakon");
  assert.equal(replacement.replacementMemberId, "opponent-marai");
  assert.equal(replacement.creatureId, "maraileron");

  assert.equal(roster.snapshot().opponent.activeMemberId, "opponent-marai");
  assert.ok(session.snapshot().fighters.opponent.hp > 0);

  runtime.dispose();
  presenter.dispose();
});
