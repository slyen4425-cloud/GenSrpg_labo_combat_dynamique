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

function harness({
  opponentEnergy = 10,
  aiPolicy = policy,
  distance = "medium"
} = {}) {
  const session = createCombatSession({
    distance,
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
    policy: aiPolicy,
    skillsById: offensive,
    reactionsById: reactions
  });
  return { session, roster, runtime, ai };
}

test("quick mode uses an affordable quick skill at the current distance", () => {
  const { runtime, ai } = harness({
    opponentEnergy: 2,
    distance: "medium"
  });

  const decision = ai.takeTurn();

  assert.equal(decision.status, "skill_started");
  assert.equal(decision.mode, "quick");
  assert.equal(decision.skillId, "aerial-dive");
  assert.equal(runtime.activeAction.actorId, "opponent");
  assert.equal(runtime.activeAction.targetId, "player");
  assert.equal(ai.snapshot().currentMode, "strong");
});

test("strong mode saves energy instead of falling back to a weaker skill", () => {
  const strongFirstPolicy = normalizeOpponentAiPolicy({
    ...policy,
    energyStrategy: {
      ...policy.energyStrategy,
      decisionModes: ["strong"]
    }
  });

  const { session, runtime, ai } = harness({
    opponentEnergy: 2,
    aiPolicy: strongFirstPolicy,
    distance: "medium"
  });

  const decision = ai.takeTurn();

  assert.deepEqual(
    {
      status: decision.status,
      mode: decision.mode,
      skillId: decision.skillId,
      currentEnergy: decision.currentEnergy,
      requiredEnergy: decision.requiredEnergy
    },
    {
      status: "saving",
      mode: "strong",
      skillId: "fireball",
      currentEnergy: 2,
      requiredEnergy: 3
    }
  );
  assert.equal(runtime.hasActiveAction, false);
  assert.equal(session.snapshot().fighters.opponent.energy, 2);
  assert.equal(ai.snapshot().currentMode, "strong");
});

test("strong mode attacks as soon as the configured strong skill is affordable", () => {
  const strongFirstPolicy = normalizeOpponentAiPolicy({
    ...policy,
    energyStrategy: {
      ...policy.energyStrategy,
      decisionModes: ["strong"]
    }
  });

  const { runtime, ai } = harness({
    opponentEnergy: 3,
    aiPolicy: strongFirstPolicy,
    distance: "medium"
  });

  const decision = ai.takeTurn();

  assert.equal(decision.status, "skill_started");
  assert.equal(decision.skillId, "fireball");
  assert.equal(decision.mode, "strong");
  assert.equal(runtime.activeAction.skill.id, "fireball");
});

test("AI never spends movement energy unless movement plus target skill are funded", () => {
  const movementPolicy = normalizeOpponentAiPolicy({
    id: "movement-budget",
    actorId: "opponent",
    targetId: "player",
    reactionRules: [],
    turnPlan: [],
    energyStrategy: {
      decisionModes: ["quick"],
      quickSkillIds: ["claw"],
      strongSkillIds: ["fireball"]
    }
  });

  const poor = harness({
    opponentEnergy: 4,
    aiPolicy: movementPolicy,
    distance: "medium"
  });
  const saving = poor.ai.takeTurn();

  assert.equal(saving.status, "saving");
  assert.equal(saving.skillId, "claw");
  assert.equal(saving.movementCost, 3);
  assert.equal(saving.requiredEnergy, 5);
  assert.equal(poor.session.snapshot().distance, "medium");
  assert.equal(poor.session.snapshot().fighters.opponent.energy, 4);

  const funded = harness({
    opponentEnergy: 5,
    aiPolicy: movementPolicy,
    distance: "medium"
  });
  const moved = funded.ai.takeTurn();

  assert.equal(moved.status, "moved");
  assert.equal(moved.plannedSkillId, "claw");
  assert.equal(funded.session.snapshot().distance, "short");
  assert.equal(
    funded.session.snapshot().fighters.opponent.energy,
    2
  );
  assert.equal(funded.ai.snapshot().currentMode, "quick");

  const attacked = funded.ai.takeTurn();
  assert.equal(attacked.status, "skill_started");
  assert.equal(attacked.skillId, "claw");
  assert.equal(funded.ai.snapshot().currentMode, "quick");
});

test("normal V9 policy never auto-reacts to a player fireball", () => {
  const { runtime, ai } = harness();

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

test("reaction engine remains available for a dedicated future policy", () => {
  const reactionPolicy = normalizeOpponentAiPolicy({
    id: "reaction-engine-test",
    actorId: "opponent",
    targetId: "player",
    reactionRules: [
      {
        skillId: "fire-immunity",
        when: { element: "fire" }
      }
    ],
    turnPlan: policy.turnPlan
  });

  const { session, runtime, ai } = harness({
    aiPolicy: reactionPolicy
  });
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

test("reaction engine never forces an unaffordable configured reaction", () => {
  const reactionPolicy = normalizeOpponentAiPolicy({
    id: "reaction-energy-test",
    actorId: "opponent",
    targetId: "player",
    reactionRules: [
      {
        skillId: "fire-immunity",
        when: { element: "fire" }
      }
    ],
    turnPlan: policy.turnPlan
  });
  const { runtime, ai } = harness({
    opponentEnergy: 0,
    aiPolicy: reactionPolicy
  });

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
