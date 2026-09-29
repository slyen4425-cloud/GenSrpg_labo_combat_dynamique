import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeBattleFormatDefinition
} from "../../src/contracts/battle-format-definition.js";
import {
  normalizeCombatCommandDefinition
} from "../../src/contracts/combat-command-definition.js";
import {
  normalizeSkillDefinition
} from "../../src/contracts/skill-definition.js";
import {
  createCombatSession
} from "../../src/core/combat/combat-session.js";

function fighter(id, {
  hp = 100,
  energy = 10,
  movementEnergyPerStep = 1,
  statEffectRulesById = undefined
} = {}) {
  return {
    id,
    maxHp: 100,
    initialHp: hp,
    maxEnergy: 10,
    initialEnergy: energy,
    movementEnergyPerStep,
    ...(statEffectRulesById
      ? { statEffectRulesById }
      : {})
  };
}

function format2v2() {
  return normalizeBattleFormatDefinition({
    id: "status-2v2",
    localActorId: "a",
    teams: {
      players: ["a", "ally"],
      enemies: ["b", "c"]
    },
    actors: [
      {
        actorId: "a",
        teamId: "players",
        creatureId: "crea-a",
        displayName: "A",
        fighterConfigId: "a",
        controllerId: "human-local"
      },
      {
        actorId: "ally",
        teamId: "players",
        creatureId: "crea-ally",
        displayName: "Ally",
        fighterConfigId: "ally",
        controllerId: "ai-ally"
      },
      {
        actorId: "b",
        teamId: "enemies",
        creatureId: "crea-b",
        displayName: "B",
        fighterConfigId: "b",
        controllerId: "ai-b"
      },
      {
        actorId: "c",
        teamId: "enemies",
        creatureId: "crea-c",
        displayName: "C",
        fighterConfigId: "c",
        controllerId: "ai-c"
      }
    ]
  });
}

function skill(id, {
  category = "buff_debuff",
  form = "self",
  damage = 0,
  energyCost = 0,
  preparationMs = 0,
  targetRelations = ["enemy", "ally", "self"],
  effects = []
} = {}) {
  return normalizeSkillDefinition({
    id,
    name: id,
    category,
    form,
    element: null,
    approachMode:
      form === "contact" ? "ground" : "none",
    energyCost,
    preparationMs,
    travelMs: 0,
    recoveryMs: 0,
    cooldownMs: 1000,
    allowedDistances: ["short", "medium", "long"],
    targetRelations,
    effect: {
      damage,
      heal: 0,
      tags: []
    },
    effects
  });
}

function statusSkill(
  id,
  status,
  {
    targetScope = "target",
    energyCost = 0,
    category = "buff_debuff"
  } = {}
) {
  return skill(id, {
    category,
    energyCost,
    effects: [
      {
        kind: "apply_status",
        targetScope,
        status
      }
    ]
  });
}

function attack(id = "attack", {
  damage = 20,
  preparationMs = 0
} = {}) {
  return skill(id, {
    category: "offensive",
    form: "contact",
    damage,
    preparationMs,
    targetRelations: ["enemy"]
  });
}

function itemCommand() {
  return normalizeCombatCommandDefinition({
    id: "item",
    name: "Objet",
    kind: "item",
    energyCost: 2,
    preparationMs: 500,
    recoveryMs: 0,
    effect: {
      heal: 10,
      itemId: "potion"
    }
  });
}

test("apply_status stores one runtime status and expires on CombatState elapsedMs", () => {
  const root = {
    id: "root",
    kind: "immobilize",
    polarity: "detrimental",
    durationMs: 3000,
    stacking: "refresh",
    tags: ["control"]
  };
  const session = createCombatSession({
    fighters: [fighter("a"), fighter("b")]
  });

  const applied = session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: statusSkill("root-skill", root)
  });

  assert.equal(applied.ok, true);
  assert.equal(
    session.snapshot().fighters.b.statusEffects.length,
    1
  );
  assert.equal(
    session.snapshot().fighters.b.statusEffects[0].definition.kind,
    "immobilize"
  );
  assert.equal(
    session.snapshot().fighters.b.statusEffects[0].expiresAtMs,
    3000
  );

  session.advanceMs(2999);
  assert.equal(
    session.snapshot().fighters.b.statusEffects.length,
    1
  );

  session.advanceMs(1);
  assert.deepEqual(
    session.snapshot().fighters.b.statusEffects,
    []
  );
});

test("DoT and HoT tick deterministically on the existing combat clock", () => {
  const session = createCombatSession({
    fighters: [
      fighter("a", { hp: 50 }),
      fighter("b", { hp: 100 })
    ]
  });

  session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: statusSkill("poison", {
      id: "poison",
      kind: "damage_over_time",
      polarity: "detrimental",
      durationMs: 3000,
      stacking: "refresh",
      amount: 5,
      channel: "poison",
      tickIntervalMs: 1000,
      tags: ["poison"]
    })
  });

  session.useSkill({
    actorId: "a",
    targetId: "a",
    skill: statusSkill(
      "regen",
      {
        id: "regen",
        kind: "heal_over_time",
        polarity: "beneficial",
        durationMs: 3000,
        stacking: "refresh",
        amount: 4,
        tickIntervalMs: 1000,
        tags: ["regen"]
      },
      { targetScope: "self" }
    )
  });

  session.advanceMs(1000);
  assert.equal(session.snapshot().fighters.b.hp, 95);
  assert.equal(session.snapshot().fighters.a.hp, 54);

  session.advanceMs(2000);
  assert.equal(session.snapshot().fighters.b.hp, 85);
  assert.equal(session.snapshot().fighters.a.hp, 62);
  assert.equal(
    session.snapshot().fighters.b.statusEffects.length,
    0
  );
  assert.equal(
    session.snapshot().fighters.a.statusEffects.length,
    0
  );
});

test("shield absorbs direct damage before HP and tracks remaining capacity", () => {
  const session = createCombatSession({
    fighters: [fighter("a"), fighter("b")]
  });

  session.useSkill({
    actorId: "b",
    targetId: "b",
    skill: statusSkill(
      "barrier",
      {
        id: "barrier",
        kind: "shield",
        polarity: "beneficial",
        durationMs: 5000,
        stacking: "replace",
        amount: 15,
        tags: ["shield"]
      },
      { targetScope: "self" }
    )
  });

  const result = session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: attack("hit", { damage: 20 })
  });

  assert.equal(result.ok, true);
  assert.equal(session.snapshot().fighters.b.hp, 95);
  assert.equal(
    session.snapshot().fighters.b.statusEffects[0].shieldRemaining,
    0
  );

  const hit = result.events.find(
    (event) => event.type === "hit"
  );
  assert.equal(hit.damage, 20);
  assert.equal(hit.absorbedByShield, 15);
  assert.equal(hit.appliedDamage, 5);
});

test("shield also absorbs DoT ticks through the same damage application path", () => {
  const session = createCombatSession({
    fighters: [fighter("a"), fighter("b")]
  });

  session.useSkill({
    actorId: "b",
    targetId: "b",
    skill: statusSkill(
      "dot-shield",
      {
        id: "dot-shield",
        kind: "shield",
        polarity: "beneficial",
        durationMs: 5000,
        stacking: "replace",
        amount: 6
      },
      { targetScope: "self" }
    )
  });

  session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: statusSkill("dot", {
      id: "dot",
      kind: "damage_over_time",
      polarity: "detrimental",
      durationMs: 2000,
      stacking: "refresh",
      amount: 5,
      channel: "poison",
      tickIntervalMs: 1000
    })
  });

  session.advanceMs(1000);
  assert.equal(session.snapshot().fighters.b.hp, 100);

  session.advanceMs(1000);
  assert.equal(session.snapshot().fighters.b.hp, 96);
});

test("stat_modifier projects through fighter stat rules for damage and preparation speed", () => {
  const rules = {
    physical: {
      damageChannel: "physical",
      resistanceChannel: "physical",
      damagePctPerPoint: 5,
      resistancePctPerPoint: 0,
      chargeTimeReductionPctPerPoint: 0
    },
    speed: {
      damageChannel: null,
      resistanceChannel: null,
      damagePctPerPoint: 0,
      resistancePctPerPoint: 0,
      chargeTimeReductionPctPerPoint: 2
    }
  };

  const session = createCombatSession({
    fighters: [
      fighter("a", {
        statEffectRulesById: rules
      }),
      fighter("b")
    ]
  });

  session.useSkill({
    actorId: "a",
    targetId: "a",
    skill: statusSkill(
      "power-buff",
      {
        id: "power-buff",
        kind: "stat_modifier",
        polarity: "beneficial",
        durationMs: 5000,
        stacking: "refresh",
        statId: "physical",
        deltaPoints: 2
      },
      { targetScope: "self" }
    )
  });

  session.useSkill({
    actorId: "a",
    targetId: "a",
    skill: statusSkill(
      "speed-buff",
      {
        id: "speed-buff",
        kind: "stat_modifier",
        polarity: "beneficial",
        durationMs: 5000,
        stacking: "refresh",
        statId: "speed",
        deltaPoints: 10
      },
      { targetScope: "self" }
    )
  });

  const result = session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: attack("buffed-hit", {
      damage: 10,
      preparationMs: 1000
    })
  });

  assert.equal(result.timelineMs.preparation, 800);
  assert.equal(session.snapshot().fighters.b.hp, 89);
});

test("unknown stat_modifier id is rejected instead of inventing a formula", () => {
  const session = createCombatSession({
    fighters: [fighter("a"), fighter("b")]
  });

  const result = session.startSkill({
    actorId: "a",
    targetId: "a",
    skill: statusSkill(
      "legacy-defense",
      {
        id: "legacy-defense",
        kind: "stat_modifier",
        polarity: "beneficial",
        durationMs: 5000,
        stacking: "refresh",
        statId: "defense",
        deltaPoints: 3
      },
      { targetScope: "self", energyCost: 2 }
    )
  });

  assert.equal(result.ok, false);
  assert.equal(
    result.outcome,
    "unsupported_status_stat"
  );
  assert.equal(session.snapshot().fighters.a.energy, 10);
});

test("immobilize silence and stun block their owned actions before resource spend", () => {
  const moveSession = createCombatSession({
    distance: "short",
    fighters: [fighter("a"), fighter("b")]
  });
  moveSession.useSkill({
    actorId: "a",
    targetId: "b",
    skill: statusSkill("root", {
      id: "root",
      kind: "immobilize",
      polarity: "detrimental",
      durationMs: 3000,
      stacking: "refresh"
    })
  });
  const moved = moveSession.move("b", "medium");
  assert.equal(moved.ok, false);
  assert.equal(moved.outcome, "immobilized");
  assert.equal(moveSession.snapshot().fighters.b.energy, 10);

  const silenceSession = createCombatSession({
    fighters: [fighter("a"), fighter("b")]
  });
  silenceSession.useSkill({
    actorId: "a",
    targetId: "b",
    skill: statusSkill("silence", {
      id: "silence",
      kind: "silence",
      polarity: "detrimental",
      durationMs: 3000,
      stacking: "refresh"
    })
  });
  const silenced = silenceSession.startSkill({
    actorId: "b",
    targetId: "a",
    skill: skill("costly", {
      category: "offensive",
      form: "contact",
      damage: 10,
      energyCost: 4,
      targetRelations: ["enemy"]
    })
  });
  assert.equal(silenced.ok, false);
  assert.equal(silenced.outcome, "silenced");
  assert.equal(silenceSession.snapshot().fighters.b.energy, 10);
  assert.equal(
    Object.hasOwn(
      silenceSession.snapshot().fighters.b.skillCooldowns,
      "costly"
    ),
    false
  );

  const stunSession = createCombatSession({
    fighters: [fighter("a"), fighter("b")]
  });
  stunSession.useSkill({
    actorId: "a",
    targetId: "b",
    skill: statusSkill("stun", {
      id: "stun",
      kind: "stun",
      polarity: "detrimental",
      durationMs: 3000,
      stacking: "refresh"
    })
  });

  const command = stunSession.startCommand({
    actorId: "b",
    command: itemCommand()
  });
  assert.equal(command.ok, false);
  assert.equal(command.outcome, "stunned");
  assert.equal(stunSession.snapshot().fighters.b.energy, 10);

  const stunnedSkill = stunSession.startSkill({
    actorId: "b",
    targetId: "a",
    skill: attack("stunned-attack", {
      damage: 10
    })
  });
  assert.equal(stunnedSkill.ok, false);
  assert.equal(stunnedSkill.outcome, "stunned");
});

test("taunt forces offensive enemy-targeted skills onto the living taunt source", () => {
  const session = createCombatSession({
    battleFormat: format2v2(),
    fighters: [
      fighter("a"),
      fighter("ally"),
      fighter("b"),
      fighter("c")
    ]
  });

  session.useSkill({
    actorId: "b",
    targetId: "a",
    skill: statusSkill("taunt", {
      id: "taunt-b",
      kind: "taunt",
      polarity: "detrimental",
      durationMs: 5000,
      stacking: "replace"
    })
  });

  const started = session.startSkill({
    actorId: "a",
    targetId: "c",
    skill: attack("forced-attack")
  });

  assert.equal(started.ok, true);
  assert.equal(started.action.targetId, "b");
  assert.equal(
    started.events.some(
      (event) =>
        event.type === "target-forced" &&
        event.fromTargetId === "c" &&
        event.targetId === "b"
    ),
    true
  );
});

test("cleanse removes detrimental statuses and dispel removes beneficial statuses", () => {
  const session = createCombatSession({
    fighters: [fighter("a"), fighter("b")]
  });

  session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: statusSkill("poison", {
      id: "poison",
      kind: "damage_over_time",
      polarity: "detrimental",
      durationMs: 5000,
      stacking: "refresh",
      amount: 2,
      channel: "poison",
      tickIntervalMs: 1000,
      tags: ["poison"]
    })
  });
  session.useSkill({
    actorId: "b",
    targetId: "b",
    skill: statusSkill(
      "barrier",
      {
        id: "barrier",
        kind: "shield",
        polarity: "beneficial",
        durationMs: 5000,
        stacking: "replace",
        amount: 10,
        tags: ["shield"]
      },
      { targetScope: "self" }
    )
  });

  session.useSkill({
    actorId: "b",
    targetId: "b",
    skill: skill("cleanse", {
      effects: [
        {
          kind: "cleanse",
          targetScope: "self",
          statusTags: []
        }
      ]
    })
  });

  assert.deepEqual(
    session.snapshot().fighters.b.statusEffects.map(
      (entry) => entry.definition.id
    ),
    ["barrier"]
  );

  session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: skill("dispel", {
      effects: [
        {
          kind: "dispel",
          targetScope: "target",
          statusTags: []
        }
      ]
    })
  });

  assert.deepEqual(
    session.snapshot().fighters.b.statusEffects,
    []
  );
});

test("replace refresh and stack policies remain deterministic", () => {
  const session = createCombatSession({
    fighters: [fighter("a"), fighter("b")]
  });

  const replace = {
    id: "replace-control",
    kind: "immobilize",
    polarity: "detrimental",
    durationMs: 2000,
    stacking: "replace"
  };
  session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: statusSkill("replace-1", replace)
  });
  session.advanceMs(500);
  session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: statusSkill("replace-2", replace)
  });
  let instance =
    session.snapshot().fighters.b.statusEffects.find(
      (entry) =>
        entry.definition.id === "replace-control"
    );
  assert.equal(instance.stacks, 1);
  assert.equal(instance.appliedAtMs, 500);
  assert.equal(instance.expiresAtMs, 2500);

  const refresh = {
    id: "refresh-control",
    kind: "silence",
    polarity: "detrimental",
    durationMs: 2000,
    stacking: "refresh"
  };
  session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: statusSkill("refresh-1", refresh)
  });
  session.advanceMs(500);
  session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: statusSkill("refresh-2", refresh)
  });
  instance =
    session.snapshot().fighters.b.statusEffects.find(
      (entry) =>
        entry.definition.id === "refresh-control"
    );
  assert.equal(instance.stacks, 1);
  assert.equal(instance.expiresAtMs, 3000);

  const stack = {
    id: "stack-poison",
    kind: "damage_over_time",
    polarity: "detrimental",
    durationMs: 3000,
    stacking: "stack",
    maxStacks: 2,
    amount: 1,
    channel: "poison",
    tickIntervalMs: 1000
  };
  for (let index = 0; index < 3; index += 1) {
    session.useSkill({
      actorId: "a",
      targetId: "b",
      skill: statusSkill(
        "stack-" + index,
        stack
      )
    });
  }
  instance =
    session.snapshot().fighters.b.statusEffects.find(
      (entry) =>
        entry.definition.id === "stack-poison"
    );
  assert.equal(instance.stacks, 2);
});

test("applying stun emits the existing semantic charge-interrupt event", () => {
  const session = createCombatSession({
    fighters: [fighter("a"), fighter("b")]
  });

  const result = session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: statusSkill("status-stun", {
      id: "status-stun",
      kind: "stun",
      polarity: "detrimental",
      durationMs: 1500,
      stacking: "refresh"
    })
  });

  assert.equal(
    result.events.some(
      (event) =>
        event.type === "charge-interrupt" &&
        event.actorId === "b" &&
        event.reason === "stun"
    ),
    true
  );
});
