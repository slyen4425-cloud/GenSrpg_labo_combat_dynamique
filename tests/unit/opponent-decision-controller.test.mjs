import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { normalizeOpponentAiPolicy } from "../../src/contracts/opponent-ai-policy.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";
import { createRosterSession } from "../../src/core/combat/roster-session.js";
import { createOpponentDecisionController } from "../../src/core/combat/opponent-decision-controller.js";

async function json(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const maraileron = await json("data/combat/fighters/maraileron.combat.json");
const braisombre = await json("data/combat/fighters/braisombre.combat.json");
const rosterData = await json("data/combat/rosters/demo-2v2.roster.json");
const policy = normalizeOpponentAiPolicy(
  await json("data/combat/ai/linear-opponent.policy.json")
);

const offensive = Object.fromEntries(
  await Promise.all(
    [
      "fireball",
      "claw",
      "aerial-dive",
      "teleport-strike"
    ].map(async (id) => {
      const skill = normalizeSkillDefinition(
        await json(`data/combat/skills/${id}.skill.json`)
      );
      return [skill.id, skill];
    })
  )
);

const reactions = Object.fromEntries(
  await Promise.all(
    [
      "dodge",
      "mirror-shield",
      "fire-immunity",
      "contact-counter"
    ].map(async (id) => {
      const skill = normalizeSkillDefinition(
        await json(`data/combat/skills/${id}.skill.json`)
      );
      return [skill.id, skill];
    })
  )
);

function harness({ opponentEnergy = 10 } = {}) {
  const session = createCombatSession({
    distance: "medium",
    fighters: [
      { ...maraileron, id: "player", initialEnergy: 10 },
      { ...braisombre, id: "opponent", initialEnergy: opponentEnergy }
    ]
  });
  const roster = createRosterSession({
    combatSession: session,
    roster: rosterData,
    fighterConfigs: { maraileron, braisombre }
  });
  const runtime = createCombatRuntime({
    session,
    now: () => 0,
    setTimer: () => 1,
    clearTimer: () => {}
  });
  const ai = createOpponentDecisionController({
    session,
    runtime,
    roster,
    policy,
    skillsById: offensive,
    reactionsById: reactions
  });
  return { session, roster, runtime, ai };
}

test("linear opponent moves one band toward the planned skill then starts it", () => {
  const { session, runtime, ai } = harness();

  const moved = ai.takeTurn();
  assert.equal(moved.status, "moved");
  assert.equal(moved.plannedSkillId, "claw");
  assert.equal(session.snapshot().distance, "short");
  assert.equal(runtime.hasActiveAction, false);
  assert.equal(ai.snapshot().planIndex, 0);

  const attacked = ai.takeTurn();
  assert.equal(attacked.status, "skill_started");
  assert.equal(attacked.skillId, "claw");
  assert.equal(runtime.activeAction.actorId, "opponent");
  assert.equal(runtime.activeAction.targetId, "player");
  assert.equal(ai.snapshot().planIndex, 1);
});

test("linear opponent reacts to a fire player skill through Runtime preview and react", () => {
  const { session, runtime, ai } = harness();
  const beforeEnergy = session.snapshot().fighters.opponent.energy;

  const started = runtime.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill: offensive.fireball
  });
  assert.equal(started.ok, true);

  const reaction = ai.maybeReactToActiveAction();

  assert.equal(reaction.status, "reacted");
  assert.equal(reaction.skillId, "fire-immunity");
  assert.equal(reaction.outcome, "immune");
  assert.equal(
    session.snapshot().fighters.opponent.energy,
    beforeEnergy - reactions["fire-immunity"].energyCost
  );
});

test("linear opponent never forces an unaffordable reaction", () => {
  const { runtime, ai } = harness({ opponentEnergy: 0 });

  const started = runtime.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill: offensive.fireball
  });
  assert.equal(started.ok, true);

  const reaction = ai.maybeReactToActiveAction();
  assert.equal(reaction.status, "waiting");
  assert.equal(reaction.reason, "no_legal_reaction");
});

test("linear opponent does not take a normal turn while Runtime is busy", () => {
  const { runtime, ai } = harness();

  runtime.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill: offensive.fireball
  });

  const decision = ai.takeTurn();
  assert.deepEqual(decision, {
    status: "busy",
    reason: "action_in_progress"
  });
});
