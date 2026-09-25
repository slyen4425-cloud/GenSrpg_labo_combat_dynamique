import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { normalizeOpponentAiPolicy } from "../../src/contracts/opponent-ai-policy.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";
import { createRosterSession } from "../../src/core/combat/roster-session.js";
import { createOpponentDecisionController } from "../../src/core/combat/opponent-decision-controller.js";
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

const maraileron = await json("data/combat/fighters/maraileron.combat.json");
const braisombre = await json("data/combat/fighters/braisombre.combat.json");
const rosterData = await json("data/combat/rosters/demo-2v2.roster.json");
const policy = normalizeOpponentAiPolicy(
  await json("data/combat/ai/linear-opponent.policy.json")
);

async function skill(id) {
  return normalizeSkillDefinition(
    await json(`data/combat/skills/${id}.skill.json`)
  );
}

const offensive = Object.fromEntries(
  (
    await Promise.all([
      skill("fireball"),
      skill("claw"),
      skill("aerial-dive"),
      skill("teleport-strike")
    ])
  ).map((item) => [item.id, item])
);

const reactions = Object.fromEntries(
  (
    await Promise.all([
      skill("dodge"),
      skill("mirror-shield"),
      skill("fire-immunity"),
      skill("contact-counter")
    ])
  ).map((item) => [item.id, item])
);

function rosterFor(session) {
  return createRosterSession({
    combatSession: session,
    roster: rosterData,
    fighterConfigs: { maraileron, braisombre }
  });
}

test("V9 true path reacts, moves one band, then damages player at AI impact", () => {
  const session = createCombatSession({
    distance: "medium",
    fighters: [
      { ...maraileron, id: "player", initialEnergy: 10, initialHp: 100 },
      { ...braisombre, id: "opponent", initialEnergy: 10, initialHp: 100 }
    ]
  });
  const roster = rosterFor(session);
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
  const ai = createOpponentDecisionController({
    session,
    runtime,
    roster,
    policy,
    skillsById: offensive,
    reactionsById: reactions
  });

  runtime.start();

  const playerStart = runtime.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill: offensive.fireball
  });
  assert.equal(playerStart.ok, true);

  const reaction = ai.maybeReactToActiveAction();
  assert.equal(reaction.status, "reacted");
  assert.equal(reaction.skillId, "fire-immunity");

  clock.setTime(playerStart.action.impactAtMs);
  clock.fireNext();

  assert.equal(resolutions.length, 1);
  assert.equal(resolutions[0].actorId, "player");
  assert.equal(resolutions[0].targetId, "opponent");
  assert.equal(resolutions[0].outcome, "immune");
  assert.equal(session.snapshot().fighters.opponent.hp, 100);

  const move = ai.takeTurn();
  assert.equal(move.status, "moved");
  assert.equal(move.result.state.distance, "short");
  assert.equal(runtime.hasActiveAction, false);

  const attack = ai.takeTurn();
  assert.equal(attack.status, "skill_started");
  assert.equal(attack.skillId, "claw");
  assert.equal(runtime.activeAction.actorId, "opponent");

  const hpBefore = session.snapshot().fighters.player.hp;
  clock.setTime(
    playerStart.action.impactAtMs +
      attack.result.action.impactAtMs
  );
  clock.fireNext();

  assert.equal(resolutions.length, 2);
  assert.equal(resolutions[1].actorId, "opponent");
  assert.equal(resolutions[1].targetId, "player");
  assert.equal(resolutions[1].outcome, "hit");
  assert.equal(
    session.snapshot().fighters.player.hp,
    hpBefore - offensive.claw.effect.damage
  );

  runtime.dispose();
});

test("V9 opponent attack can KO and replace the player through Presenter and Roster Session", async () => {
  const session = createCombatSession({
    distance: "short",
    fighters: [
      { ...maraileron, id: "player", initialEnergy: 10, initialHp: 18 },
      { ...braisombre, id: "opponent", initialEnergy: 10, initialHp: 100 }
    ]
  });
  const roster = rosterFor(session);
  const clock = fakeClock();
  let resolution = null;
  const runtime = createCombatRuntime({
    session,
    now: clock.now,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    onResolved(value) {
      resolution = value;
    }
  });
  const ai = createOpponentDecisionController({
    session,
    runtime,
    roster,
    policy,
    skillsById: offensive,
    reactionsById: reactions
  });

  const visualCalls = [];
  const presenter = createCombatResolutionPresenter({
    visuals: {
      playEventFor(slot, type) {
        visualCalls.push([slot, type]);
        return Promise.resolve({ status: "finished" });
      },
      cancelFor() {}
    }
  });

  runtime.start();
  const attack = ai.takeTurn();
  assert.equal(attack.status, "skill_started");
  assert.equal(attack.skillId, "claw");

  clock.setTime(attack.result.action.impactAtMs);
  clock.fireNext();

  assert.equal(resolution.actorId, "opponent");
  assert.equal(resolution.targetId, "player");
  assert.equal(session.snapshot().fighters.player.hp, 0);

  const presentation = presenter.presentOutcome({
    resolution,
    actorSlot: resolution.actorId,
    targetSlot: resolution.targetId
  });

  assert.equal(presentation.ko, true);
  assert.equal(presentation.koActorId, "player");
  await presentation.finished;

  assert.deepEqual(visualCalls, [
    ["player", "hit"],
    ["player", "ko"]
  ]);

  const replacement = roster.replaceKnockedOut("player");
  assert.equal(replacement.ok, true);
  assert.equal(replacement.outcome, "ko_replaced");
  assert.equal(replacement.creatureId, "braisombre");
  assert.equal(
    roster.snapshot().player.activeMemberId,
    "player-drakon"
  );
  assert.equal(
    session.snapshot().fighters.player.hp,
    braisombre.initialHp
  );

  runtime.dispose();
  presenter.dispose();
});
