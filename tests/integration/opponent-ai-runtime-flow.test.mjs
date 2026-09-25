import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";
import { createOpponentDecisionController } from "../../src/core/combat/opponent-decision-controller.js";
import { createRosterSession } from "../../src/core/combat/roster-session.js";

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

const [
  maraileron,
  braisombre,
  fireballRaw,
  clawRaw,
  aerialRaw,
  teleportRaw,
  dodgeRaw,
  mirrorRaw,
  immunityRaw,
  counterRaw,
  policy,
  rosterData
] = await Promise.all([
  json("data/combat/fighters/maraileron.combat.json"),
  json("data/combat/fighters/braisombre.combat.json"),
  json("data/combat/skills/fireball.skill.json"),
  json("data/combat/skills/claw.skill.json"),
  json("data/combat/skills/aerial-dive.skill.json"),
  json("data/combat/skills/teleport-strike.skill.json"),
  json("data/combat/skills/dodge.skill.json"),
  json("data/combat/skills/mirror-shield.skill.json"),
  json("data/combat/skills/fire-immunity.skill.json"),
  json("data/combat/skills/contact-counter.skill.json"),
  json("data/combat/ai/opponent-aggressive.policy.json"),
  json("data/combat/rosters/demo-2v2.roster.json")
]);

const fireball = normalizeSkillDefinition(fireballRaw);
const claw = normalizeSkillDefinition(clawRaw);
const skills = [
  fireball,
  claw,
  normalizeSkillDefinition(aerialRaw),
  normalizeSkillDefinition(teleportRaw)
];
const reactions = [
  normalizeSkillDefinition(dodgeRaw),
  normalizeSkillDefinition(mirrorRaw),
  normalizeSkillDefinition(immunityRaw),
  normalizeSkillDefinition(counterRaw)
];

test("true V9 flow: player attack -> AI reaction -> AI movement -> AI attack -> player damage", () => {
  const session = createCombatSession({
    distance: "medium",
    fighters: [
      { ...maraileron, id: "player", initialEnergy: 10 },
      { ...braisombre, id: "opponent", initialEnergy: 10 }
    ]
  });

  const ai = createOpponentDecisionController({
    actorId: "opponent",
    targetId: "player",
    skills,
    reactions,
    policy
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

  const playerStart = runtime.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill: fireball
  });
  assert.equal(playerStart.ok, true);

  const reactionDecision = ai.chooseReaction({
    action: runtime.activeAction,
    previewReaction(reactionSkill) {
      return runtime.previewReaction(reactionSkill);
    }
  });
  assert.equal(reactionDecision.kind, "reaction");
  assert.equal(reactionDecision.skill.id, "mirror-shield");

  const reacted = runtime.react(reactionDecision.skill);
  assert.equal(reacted.ok, true);
  assert.equal(reacted.outcome, "reflected");

  clock.setTime(playerStart.action.impactAtMs);
  clock.fireNext();

  assert.equal(resolutions.length, 1);
  assert.equal(resolutions[0].actorId, "player");
  assert.equal(resolutions[0].targetId, "opponent");
  assert.equal(resolutions[0].outcome, "reflected");
  assert.equal(session.snapshot().fighters.player.hp, 70);

  const firstAiDecision = ai.chooseAction({
    currentDistance: session.snapshot().distance,
    previewSkill(skill) {
      return session.previewSkill({
        actorId: "opponent",
        targetId: "player",
        skill
      });
    },
    previewMovement(toDistance) {
      return session.previewMovement("opponent", toDistance);
    },
    movementActionsUsed: 0
  });

  assert.equal(firstAiDecision.kind, "move");
  assert.equal(firstAiDecision.toDistance, "short");

  const moved = session.move(
    "opponent",
    firstAiDecision.toDistance
  );
  assert.equal(moved.ok, true);
  assert.equal(session.snapshot().distance, "short");

  const secondAiDecision = ai.chooseAction({
    currentDistance: session.snapshot().distance,
    previewSkill(skill) {
      return session.previewSkill({
        actorId: "opponent",
        targetId: "player",
        skill
      });
    },
    previewMovement(toDistance) {
      return session.previewMovement("opponent", toDistance);
    },
    movementActionsUsed: 1
  });

  assert.equal(secondAiDecision.kind, "skill");
  assert.equal(secondAiDecision.skill.id, "claw");

  const opponentStart = runtime.startSkill({
    actorId: "opponent",
    targetId: "player",
    skill: secondAiDecision.skill
  });
  assert.equal(opponentStart.ok, true);
  ai.confirm(secondAiDecision);

  clock.setTime(
    playerStart.action.impactAtMs +
      opponentStart.action.impactAtMs
  );
  clock.fireNext();

  assert.equal(resolutions.length, 2);
  assert.equal(resolutions[1].actorId, "opponent");
  assert.equal(resolutions[1].targetId, "player");
  assert.equal(resolutions[1].outcome, "hit");
  assert.equal(session.snapshot().fighters.player.hp, 52);
  assert.equal(ai.skillCursor, 1);

  runtime.dispose();
});


test("opponent runtime KO of player is replaced by player Roster Session", () => {
  const session = createCombatSession({
    distance: "short",
    fighters: [
      {
        ...maraileron,
        id: "player",
        initialEnergy: 10,
        initialHp: 18
      },
      {
        ...braisombre,
        id: "opponent",
        initialEnergy: 10,
        initialHp: 100
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
    actorId: "opponent",
    targetId: "player",
    skill: claw
  });

  assert.equal(started.ok, true);

  clock.setTime(started.action.impactAtMs);
  clock.fireNext();

  assert.equal(resolutions.length, 1);
  assert.equal(resolutions[0].actorId, "opponent");
  assert.equal(resolutions[0].targetId, "player");
  assert.equal(resolutions[0].outcome, "hit");

  const hit = resolutions[0].events.find(
    (event) => event.type === "hit"
  );
  assert.equal(hit.actorId, "player");
  assert.equal(hit.hpAfter, 0);
  assert.equal(session.snapshot().fighters.player.hp, 0);

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
});
