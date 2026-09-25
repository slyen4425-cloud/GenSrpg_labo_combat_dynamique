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

const rosterData = await json("data/combat/rosters/demo-2v2.roster.json");
const maraileron = await json("data/combat/fighters/maraileron.combat.json");
const braisombre = await json("data/combat/fighters/braisombre.combat.json");
const fireball = normalizeSkillDefinition(
  await json("data/combat/skills/fireball.skill.json")
);

test("true runtime KO flow keeps skill identity, presents KO, then replaces opponent from roster", async () => {
  const session = createCombatSession({
    distance: "medium",
    fighters: [
      {
        ...maraileron,
        id: "player",
        initialEnergy: 10,
        initialHp: 100
      },
      {
        ...braisombre,
        id: "opponent",
        initialEnergy: 10,
        initialHp: 30
      }
    ]
  });

  const roster = createRosterSession({
    combatSession: session,
    roster: rosterData,
    fighterConfigs: {
      maraileron,
      braisombre
    }
  });

  const visualCalls = [];
  const visuals = {
    playEventFor(slot, type) {
      visualCalls.push([slot, type]);
      return Promise.resolve({ status: "finished" });
    },
    cancelFor() {}
  };

  const presenter = createCombatResolutionPresenter({ visuals });
  const clock = fakeClock();
  const resolutions = [];

  const runtime = createCombatRuntime({
    session,
    tickMs: 50,
    now: clock.now,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    onResolved(resolution) {
      resolutions.push(resolution);
    }
  });

  runtime.start();

  const started = runtime.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill: fireball
  });

  assert.equal(started.ok, true);
  assert.equal(session.snapshot().fighters.opponent.hp, 30);

  clock.setTime(started.action.impactAtMs);
  clock.fireNext();

  assert.equal(resolutions.length, 1);
  const resolution = resolutions[0];

  assert.equal(resolution.actionType, "skill");
  assert.equal(resolution.skillId, fireball.id);
  assert.equal(resolution.outcome, "hit");
  assert.equal(session.snapshot().fighters.opponent.hp, 0);

  const presentation = presenter.presentOutcome({
    resolution,
    actorSlot: "player",
    targetSlot: "opponent"
  });

  assert.equal(presentation.ko, true);
  assert.equal(presentation.koActorId, "opponent");

  await presentation.finished;

  assert.deepEqual(visualCalls, [
    ["opponent", "hit"],
    ["opponent", "ko"]
  ]);

  const replacement = roster.replaceKnockedOut("opponent");
  assert.equal(replacement.ok, true);
  assert.equal(replacement.outcome, "ko_replaced");
  assert.equal(replacement.creatureId, "maraileron");
  assert.equal(
    roster.snapshot().opponent.activeMemberId,
    "opponent-marai"
  );
  assert.equal(session.snapshot().fighters.opponent.hp, maraileron.initialHp);

  runtime.dispose();
  presenter.dispose();
});
