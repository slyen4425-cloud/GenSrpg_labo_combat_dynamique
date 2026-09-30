import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeSkillDefinition
} from "../../src/contracts/skill-definition.js";
import {
  createCombatState,
  skillCooldownRemainingMs,
  withSkillCooldown,
  advanceCombatTime
} from "../../src/core/combat/combat-state.js";
import {
  createCombatSession
} from "../../src/core/combat/combat-session.js";
import {
  createCombatRuntime
} from "../../src/core/combat/combat-runtime.js";
import {
  createRosterSession
} from "../../src/core/combat/roster-session.js";
import {
  skillCooldownLabelV1
} from "../../src/ui/combat-2v2-test-ui.js";

function fighter(id) {
  return {
    id,
    maxHp: 100,
    initialHp: 100,
    maxEnergy: 20,
    initialEnergy: 20,
    energyChargeAmount: 1,
    energyChargeIntervalMs: 2000,
    movementEnergyPerStep: 1,
    chargeTimeModifierPct: 0
  };
}

function attack(id, cooldownMs = 5000) {
  return normalizeSkillDefinition({
    id,
    name: id,
    category: "offensive",
    form: "contact",
    element: null,
    approachMode: "ground",
    energyCost: 3,
    preparationMs: 500,
    travelMs: 500,
    recoveryMs: 300,
    cooldownMs,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["enemy"],
    effect: {
      damage: 5
    }
  });
}

function counter(cooldownMs = 4000) {
  return normalizeSkillDefinition({
    id: "counter",
    name: "Counter",
    category: "counter",
    form: "self",
    element: null,
    approachMode: "none",
    energyCost: 1,
    preparationMs: 100,
    travelMs: 0,
    recoveryMs: 0,
    cooldownMs,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["self"],
    reaction: {
      counterForms: ["contact"]
    },
    effect: {}
  });
}


test("combat preview cooldown label is derived only from authoritative previewSkill result", () => {
  assert.equal(
    skillCooldownLabelV1({
      ok: false,
      outcome: "cooldown",
      remainingCooldownMs: 2300
    }),
    "Recharge 2.3 s"
  );

  assert.equal(
    skillCooldownLabelV1({
      ok: false,
      outcome: "insufficient_energy"
    }),
    ""
  );

  assert.equal(
    skillCooldownLabelV1({
      ok: true
    }),
    ""
  );
});

test("SkillDefinition normalizes explicit cooldownMs and defaults to zero", () => {
  const withCooldown = attack("fireball", 3500);
  assert.equal(withCooldown.cooldownMs, 3500);

  const withoutCooldown = normalizeSkillDefinition({
    id: "legacy",
    name: "Legacy",
    category: "offensive",
    form: "contact",
    approachMode: "ground",
    energyCost: 1,
    preparationMs: 100,
    travelMs: 100,
    recoveryMs: 100,
    allowedDistances: ["short"],
    targetRelations: ["enemy"],
    effect: { damage: 1 }
  });

  assert.equal(withoutCooldown.cooldownMs, 0);

  assert.throws(
    () => normalizeSkillDefinition({
      ...withoutCooldown,
      cooldownMs: -1
    }),
    /cooldownMs/i
  );
});

test("Combat State owns immutable per-fighter cooldown deadlines", () => {
  let state = createCombatState({
    fighters: [fighter("player"), fighter("opponent")]
  });

  assert.deepEqual(state.fighters.player.skillCooldowns, {});
  assert.equal(
    Object.isFrozen(state.fighters.player.skillCooldowns),
    true
  );

  state = withSkillCooldown(
    state,
    "player",
    "fireball",
    5000
  );

  assert.equal(
    state.fighters.player.skillCooldowns.fireball,
    5000
  );
  assert.equal(
    skillCooldownRemainingMs(
      state,
      "player",
      "fireball"
    ),
    5000
  );
});

test("accepted skill start records cooldown on the same authoritative elapsed clock", () => {
  const skill = attack("fireball", 5000);
  const session = createCombatSession({
    distance: "short",
    fighters: [fighter("player"), fighter("opponent")]
  });

  session.advanceMs(1200);

  const started = session.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill
  });

  assert.equal(started.ok, true);
  assert.equal(
    session.snapshot().fighters.player.skillCooldowns.fireball,
    6200
  );
  assert.equal(
    skillCooldownRemainingMs(
      session.snapshot(),
      "player",
      "fireball"
    ),
    5000
  );
  assert.equal(
    session.snapshot().fighters.player.energy,
    17
  );
});

test("skill on cooldown is rejected without spending energy", () => {
  const skill = attack("fireball", 5000);
  const session = createCombatSession({
    distance: "short",
    fighters: [fighter("player"), fighter("opponent")]
  });

  const first = session.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill
  });
  assert.equal(first.ok, true);

  const energyBefore = session.snapshot().fighters.player.energy;

  const second = session.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill
  });

  assert.equal(second.ok, false);
  assert.equal(second.outcome, "cooldown");
  assert.equal(second.skillId, "fireball");
  assert.equal(second.remainingCooldownMs, 5000);
  assert.equal(
    session.snapshot().fighters.player.energy,
    energyBefore
  );
});

test("cooldown is skill-specific and does not block another skill", () => {
  const firstSkill = attack("fireball", 5000);
  const secondSkill = attack("claw", 5000);
  const session = createCombatSession({
    distance: "short",
    fighters: [fighter("player"), fighter("opponent")]
  });

  assert.equal(
    session.startSkill({
      actorId: "player",
      targetId: "opponent",
      skill: firstSkill
    }).ok,
    true
  );

  const second = session.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill: secondSkill
  });

  assert.equal(second.ok, true);
  assert.equal(
    skillCooldownRemainingMs(
      session.snapshot(),
      "player",
      "claw"
    ),
    5000
  );
});

test("advanceCombatTime expires cooldowns without a second clock", () => {
  let state = createCombatState({
    fighters: [fighter("player"), fighter("opponent")]
  });

  state = withSkillCooldown(
    state,
    "player",
    "fireball",
    5000
  );

  state = advanceCombatTime(state, 4999);
  assert.equal(
    skillCooldownRemainingMs(state, "player", "fireball"),
    1
  );
  assert.equal(
    state.fighters.player.skillCooldowns.fireball,
    5000
  );

  state = advanceCombatTime(state, 1);
  assert.equal(
    skillCooldownRemainingMs(state, "player", "fireball"),
    0
  );
  assert.equal(
    "fireball" in state.fighters.player.skillCooldowns,
    false
  );
});

test("cooldown zero preserves historical immediate availability", () => {
  const skill = attack("legacy-zero", 0);
  const session = createCombatSession({
    distance: "short",
    fighters: [fighter("player"), fighter("opponent")]
  });

  assert.equal(
    session.startSkill({
      actorId: "player",
      targetId: "opponent",
      skill
    }).ok,
    true
  );

  assert.equal(
    skillCooldownRemainingMs(
      session.snapshot(),
      "player",
      skill.id
    ),
    0
  );

  assert.equal(
    session.startSkill({
      actorId: "player",
      targetId: "opponent",
      skill
    }).ok,
    true
  );
});

test("interrupted active action keeps the cooldown committed at start", () => {
  const skill = attack("fireball", 5000);
  const session = createCombatSession({
    distance: "short",
    fighters: [fighter("player"), fighter("opponent")]
  });
  const runtime = createCombatRuntime({
    session,
    now: () => 0,
    setTimer: () => 1,
    clearTimer: () => {}
  });

  const started = runtime.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill
  });

  assert.equal(started.ok, true);
  assert.equal(runtime.cancelActive("player"), true);
  assert.equal(
    skillCooldownRemainingMs(
      session.snapshot(),
      "player",
      "fireball"
    ),
    5000
  );

  runtime.dispose();
});

test("accepted reaction uses the same cooldown rule", () => {
  const incomingA = attack("incoming-a", 0);
  const incomingB = attack("incoming-b", 0);
  const reactionSkill = counter(4000);

  const session = createCombatSession({
    distance: "short",
    fighters: [fighter("player"), fighter("opponent")]
  });

  const actionA = session.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill: incomingA
  }).action;

  const firstReaction = session.reactToSkill({
    action: actionA,
    reactionSkill,
    elapsedMs: 0
  });

  assert.equal(firstReaction.ok, true);
  assert.equal(
    skillCooldownRemainingMs(
      session.snapshot(),
      "opponent",
      "counter"
    ),
    4000
  );

  const actionB = session.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill: incomingB
  }).action;

  const secondReaction = session.reactToSkill({
    action: actionB,
    reactionSkill,
    elapsedMs: 0
  });

  assert.equal(secondReaction.ok, false);
  assert.equal(secondReaction.outcome, "cooldown");
  assert.equal(secondReaction.remainingCooldownMs, 4000);
});

test("session reset clears cooldown state through the original fighter configuration", () => {
  const skill = attack("fireball", 5000);
  const session = createCombatSession({
    distance: "short",
    fighters: [fighter("player"), fighter("opponent")]
  });

  session.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill
  });

  assert.equal(
    skillCooldownRemainingMs(
      session.snapshot(),
      "player",
      "fireball"
    ),
    5000
  );

  session.reset();

  assert.equal(
    skillCooldownRemainingMs(
      session.snapshot(),
      "player",
      "fireball"
    ),
    0
  );
});

test("Roster Session preserves cooldowns across recall and summon", () => {
  const skill = attack("fireball", 5000);
  const playerConfig = {
    ...fighter("crea-player"),
    id: "crea-player"
  };
  const reserveConfig = {
    ...fighter("crea-reserve"),
    id: "crea-reserve"
  };
  const opponentConfig = {
    ...fighter("opponent"),
    id: "opponent"
  };

  const session = createCombatSession({
    distance: "short",
    fighters: [
      { ...playerConfig, id: "player" },
      opponentConfig
    ]
  });

  const roster = createRosterSession({
    combatSession: session,
    roster: {
      teams: {
        player: {
          slotId: "player",
          activeMemberId: "member-player",
          members: [
            {
              id: "member-player",
              creatureId: "crea-player",
              displayName: "Player",
              fighterConfigId: "crea-player"
            },
            {
              id: "member-reserve",
              creatureId: "crea-reserve",
              displayName: "Reserve",
              fighterConfigId: "crea-reserve"
            }
          ]
        }
      }
    },
    fighterConfigs: {
      "crea-player": playerConfig,
      "crea-reserve": reserveConfig
    }
  });

  session.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill
  });

  assert.equal(roster.recall("player").ok, true);
  assert.equal(
    roster.summon("player", "member-player").ok,
    true
  );

  assert.equal(
    skillCooldownRemainingMs(
      session.snapshot(),
      "player",
      "fireball"
    ),
    5000
  );
});

test("Combat Runtime does not become a second cooldown owner", async () => {
  const source = await readFile(
    new URL(
      "../../src/core/combat/combat-runtime.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.equal(/cooldown/i.test(source), false);
});


test("Combat Runtime notifies availability when a cooldown expires with stable energy and HP", () => {
  const skill = normalizeSkillDefinition({
    id: "availability-refresh",
    name: "Availability Refresh",
    category: "offensive",
    form: "contact",
    element: null,
    approachMode: "ground",
    energyCost: 0,
    preparationMs: 0,
    travelMs: 0,
    recoveryMs: 0,
    cooldownMs: 5000,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["enemy"],
    effect: { damage: 0 }
  });

  const session = createCombatSession({
    distance: "short",
    fighters: [fighter("player"), fighter("opponent")]
  });

  let clockMs = 0;
  let scheduledTick = null;
  const states = [];

  const runtime = createCombatRuntime({
    session,
    tickMs: 50,
    now: () => clockMs,
    setTimer(callback) {
      scheduledTick = callback;
      return 1;
    },
    clearTimer() {},
    onState(state) {
      states.push(state);
    }
  });

  runtime.start();

  const started = runtime.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill
  });
  assert.equal(started.ok, true);
  assert.equal(
    session.previewSkill({
      actorId: "player",
      targetId: "opponent",
      skill
    }).outcome,
    "cooldown"
  );

  const notificationsBeforeExpiry = states.length;
  clockMs = 5000;
  scheduledTick();

  assert.equal(
    session.previewSkill({
      actorId: "player",
      targetId: "opponent",
      skill
    }).ok,
    true,
    "authoritative Combat State has made the skill available again"
  );
  assert.ok(
    states.length > notificationsBeforeExpiry,
    "Runtime must notify consumers when availability changes even if HP/energy stay constant"
  );

  runtime.dispose();
});
