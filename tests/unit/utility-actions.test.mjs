import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { normalizeTimedActionDefinition } from "../../src/contracts/timed-action-definition.js";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { createCombatState } from "../../src/core/combat/combat-state.js";
import {
  resolveUtilityActionCompletion,
  resolveUtilityActionStart
} from "../../src/core/combat/utility-action-resolver.js";
import { resolveReaction } from "../../src/core/combat/action-resolver.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";

async function json(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const maraileron = await json("data/combat/fighters/maraileron.combat.json");
const braisombre = await json("data/combat/fighters/braisombre.combat.json");
const reserve = await json("data/combat/fighters/braisombre-ally.combat.json");

const potion = normalizeTimedActionDefinition(
  await json("data/combat/actions/potion.action.json")
);
const recall = normalizeTimedActionDefinition(
  await json("data/combat/actions/recall.action.json")
);
const summon = normalizeTimedActionDefinition(
  await json("data/combat/actions/summon.action.json")
);
const stun = normalizeSkillDefinition(
  await json("data/combat/skills/stun-interrupt.skill.json")
);
const fireball = normalizeSkillDefinition(
  await json("data/combat/skills/fireball.skill.json")
);

function fundedState({ hp = 50, presence = "active" } = {}) {
  return createCombatState({
    distance: "medium",
    fighters: [
      {
        ...maraileron,
        initialEnergy: 10,
        initialHp: hp,
        presence
      },
      {
        ...braisombre,
        initialEnergy: 10
      },
      reserve
    ]
  });
}

test("timed utility contract keeps kind energy and charge configurable", () => {
  assert.equal(potion.kind, "item");
  assert.equal(potion.energyCost, 2);
  assert.equal(potion.preparationMs, 1000);
  assert.equal(potion.effect.heal, 25);

  assert.equal(recall.kind, "recall");
  assert.equal(summon.kind, "summon");
  assert.equal(summon.effect.summonFighterId, "braisombre-ally");
});

test("item spends energy on start but heals only on completion", () => {
  const initial = fundedState({ hp: 50 });
  const started = resolveUtilityActionStart({
    state: initial,
    actorId: "maraileron",
    definition: potion
  });

  assert.equal(started.ok, true);
  assert.equal(started.state.fighters.maraileron.energy, 8);
  assert.equal(started.state.fighters.maraileron.hp, 50);

  const completed = resolveUtilityActionCompletion({
    state: started.state,
    action: started.action
  });

  assert.equal(completed.outcome, "item");
  assert.equal(completed.state.fighters.maraileron.hp, 75);
});

test("recall and summon apply presence only after completion", () => {
  const initial = fundedState();

  const recallStart = resolveUtilityActionStart({
    state: initial,
    actorId: "maraileron",
    definition: recall
  });
  assert.equal(recallStart.state.fighters.maraileron.presence, "active");

  const recalled = resolveUtilityActionCompletion({
    state: recallStart.state,
    action: recallStart.action
  });
  assert.equal(recalled.state.fighters.maraileron.presence, "recalled");
  assert.equal(recalled.state.fighters["braisombre-ally"].presence, "reserve");

  const summonStart = resolveUtilityActionStart({
    state: recalled.state,
    actorId: "maraileron",
    definition: summon
  });
  assert.equal(summonStart.ok, true);
  assert.equal(summonStart.state.fighters["braisombre-ally"].presence, "reserve");

  const summoned = resolveUtilityActionCompletion({
    state: summonStart.state,
    action: summonStart.action
  });
  assert.equal(summoned.state.fighters["braisombre-ally"].presence, "active");
  assert.equal(summoned.state.fighters.maraileron.presence, "recalled");
});

test("summon is rejected until active fighter has been recalled", () => {
  const result = resolveUtilityActionStart({
    state: fundedState(),
    actorId: "maraileron",
    definition: summon
  });

  assert.equal(result.ok, false);
  assert.equal(result.outcome, "recall_required");
});

test("stun reaction interrupts a utility charge and prevents its final effect", () => {
  const initial = fundedState({ hp: 50 });
  const started = resolveUtilityActionStart({
    state: initial,
    actorId: "maraileron",
    definition: potion
  });

  const reaction = resolveReaction({
    state: started.state,
    action: started.action,
    reactionSkill: stun,
    elapsedMs: 0,
    reactionActorId: "braisombre"
  });

  assert.equal(reaction.ok, true);
  assert.equal(reaction.outcome, "interrupted");
  assert.equal(reaction.reaction.readyAtMs, 350);

  const interrupted = resolveUtilityActionCompletion({
    state: reaction.state,
    action: started.action,
    reaction: reaction.reaction
  });

  assert.equal(interrupted.outcome, "interrupted");
  assert.equal(interrupted.state.fighters.maraileron.hp, 42);
  assert.equal(interrupted.state.fighters.maraileron.energy, 8);
  assert.equal(
    interrupted.events.some((event) => event.type === "item-used"),
    false
  );
  assert.equal(
    interrupted.events.some((event) => event.type === "utility-cancelled"),
    true
  );
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
      if (index >= 0) queue.splice(index, 1);
    },
    fireNext() {
      const item = queue.shift();
      item?.callback();
    },
    get queue() {
      return queue;
    }
  };
}

test("runtime uses the same active action owner for utility and skills", () => {
  const session = createCombatSession({
    distance: "medium",
    fighters: [
      { ...maraileron, initialEnergy: 10, initialHp: 50 },
      { ...braisombre, initialEnergy: 10 },
      reserve
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

  const started = runtime.startUtilityAction({
    actorId: "maraileron",
    definition: potion
  });
  assert.equal(started.ok, true);
  assert.equal(runtime.activeActionKind, "item");

  const second = runtime.startUtilityAction({
    actorId: "maraileron",
    definition: recall
  });
  assert.equal(second.ok, false);
  assert.equal(second.outcome, "action_in_progress");

  runtime.dispose();
});

test("runtime stun cancels utility before completion and keeps energy spent", () => {
  const session = createCombatSession({
    distance: "medium",
    fighters: [
      { ...maraileron, initialEnergy: 10, initialHp: 50 },
      { ...braisombre, initialEnergy: 10 },
      reserve
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
  const started = runtime.startUtilityAction({
    actorId: "maraileron",
    definition: potion
  });
  assert.equal(started.ok, true);

  const reacted = runtime.react(stun, "braisombre");
  assert.equal(reacted.ok, true);
  assert.equal(reacted.reaction.readyAtMs, 350);

  clock.setTime(350);
  clock.fireNext();

  assert.equal(resolutions.length, 1);
  assert.equal(resolutions[0].outcome, "interrupted");
  assert.equal(session.snapshot().fighters.maraileron.hp, 42);
  assert.equal(session.snapshot().fighters.maraileron.energy, 8);
  assert.equal(runtime.hasActiveAction, false);

  runtime.dispose();
});


test("stun can interrupt a skill while it is still charging", () => {
  const session = createCombatSession({
    distance: "medium",
    fighters: [
      { ...maraileron, initialEnergy: 10, initialHp: 100 },
      { ...braisombre, initialEnergy: 10, initialHp: 100 },
      reserve
    ]
  });

  const started = session.startSkill({
    actorId: "maraileron",
    targetId: "braisombre",
    skill: fireball
  });

  assert.equal(started.ok, true);
  assert.equal(started.action.releaseAtMs, 2000);

  const reaction = session.reactToSkill({
    action: started.action,
    reactionSkill: stun,
    elapsedMs: 0,
    reactionActorId: "braisombre"
  });

  assert.equal(reaction.ok, true);
  assert.equal(reaction.outcome, "interrupted");
  assert.equal(reaction.reaction.readyAtMs, 350);

  const resolution = session.completeSkill({
    action: started.action,
    reaction: reaction.reaction
  });

  assert.equal(resolution.outcome, "interrupted");
  assert.equal(
    resolution.events.some((event) => event.type === "skill-release"),
    false
  );
  assert.equal(
    resolution.events.some((event) => event.type === "skill-cancelled"),
    true
  );
  assert.equal(session.snapshot().fighters.maraileron.hp, 92);
  assert.equal(session.snapshot().fighters.braisombre.hp, 100);
});

test("stun that becomes ready after skill release cannot interrupt charge", () => {
  const lateStun = normalizeSkillDefinition({
    id: "late-stun",
    name: "Stun lent",
    category: "counter",
    form: "contact",
    energyCost: 2,
    preparationMs: 2200,
    travelMs: 0,
    recoveryMs: 400,
    allowedDistances: ["short", "medium", "long"],
    reaction: {
      interruptForms: ["projectile"]
    },
    effect: {
      damage: 8,
      tags: ["stun"]
    }
  });

  const initial = fundedState({ hp: 100 });
  const session = createCombatSession({
    distance: "medium",
    fighters: Object.values(initial.fighters)
  });

  const started = session.startSkill({
    actorId: "maraileron",
    targetId: "braisombre",
    skill: fireball
  });

  const reaction = session.previewReaction({
    action: started.action,
    reactionSkill: lateStun,
    elapsedMs: 0,
    reactionActorId: "braisombre"
  });

  assert.equal(reaction.ok, false);
  assert.equal(reaction.outcome, "too_late");
});
