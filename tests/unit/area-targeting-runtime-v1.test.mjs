import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeBattleFormatDefinition
} from "../../src/contracts/battle-format-definition.js";
import {
  normalizeSkillDefinition
} from "../../src/contracts/skill-definition.js";
import {
  createCombatSession
} from "../../src/core/combat/combat-session.js";

function format() {
  return normalizeBattleFormatDefinition({
    id: "area-2v2",
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

function fighter(id, {
  hp = 100,
  energy = 5,
  damagePctByChannel = undefined,
  resistancePctByChannel = undefined
} = {}) {
  return {
    id,
    maxHp: 100,
    initialHp: hp,
    maxEnergy: 10,
    initialEnergy: energy,
    ...(damagePctByChannel
      ? { damagePctByChannel }
      : {}),
    ...(resistancePctByChannel
      ? { resistancePctByChannel }
      : {})
  };
}

function tacticalSkill(id, effects) {
  return normalizeSkillDefinition({
    id,
    name: id,
    category: "offensive",
    form: "area",
    element: "fire",
    approachMode: "none",
    energyCost: 1,
    preparationMs: 0,
    travelMs: 0,
    recoveryMs: 0,
    cooldownMs: 1000,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["enemy"],
    effect: {
      damage: 0,
      heal: 0,
      tags: []
    },
    effects
  });
}

test("all_enemies damage uses BattleFormat teams and each target resistance", () => {
  const session = createCombatSession({
    battleFormat: format(),
    fighters: [
      fighter("a", {
        damagePctByChannel: { fire: 50 }
      }),
      fighter("ally"),
      fighter("b", {
        resistancePctByChannel: { fire: 50 }
      }),
      fighter("c")
    ]
  });

  const result = session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: tacticalSkill("fire-rain", [
      {
        kind: "damage",
        targetScope: "all_enemies",
        amount: 20,
        channel: "fire"
      }
    ])
  });

  assert.equal(result.ok, true);
  assert.equal(session.snapshot().fighters.a.hp, 100);
  assert.equal(session.snapshot().fighters.ally.hp, 100);
  assert.equal(session.snapshot().fighters.b.hp, 85);
  assert.equal(session.snapshot().fighters.c.hp, 70);

  const tacticalHits = result.events.filter(
    (event) =>
      event.type === "hit" &&
      event.tacticalEffect === true
  );
  assert.deepEqual(
    tacticalHits.map((event) => [
      event.actorId,
      event.damage
    ]),
    [
      ["b", 15],
      ["c", 30]
    ]
  );
});

test("all_allies heal includes the caster and excludes enemies", () => {
  const session = createCombatSession({
    battleFormat: format(),
    fighters: [
      fighter("a", { hp: 50 }),
      fighter("ally", { hp: 60 }),
      fighter("b", { hp: 70 }),
      fighter("c", { hp: 80 })
    ]
  });

  const result = session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: tacticalSkill("team-heal", [
      {
        kind: "heal",
        targetScope: "all_allies",
        amount: 20
      }
    ])
  });

  assert.equal(result.ok, true);
  assert.equal(session.snapshot().fighters.a.hp, 70);
  assert.equal(session.snapshot().fighters.ally.hp, 80);
  assert.equal(session.snapshot().fighters.b.hp, 70);
  assert.equal(session.snapshot().fighters.c.hp, 80);
});

test("all_except_self energy effect resolves every other living fighter", () => {
  const session = createCombatSession({
    battleFormat: format(),
    fighters: [
      fighter("a", { energy: 5 }),
      fighter("ally", { energy: 4 }),
      fighter("b", { energy: 3 }),
      fighter("c", { energy: 2 })
    ]
  });

  const result = session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: tacticalSkill("energy-wave", [
      {
        kind: "energy_drain",
        targetScope: "all_except_self",
        amount: 2
      }
    ])
  });

  assert.equal(result.ok, true);
  assert.equal(
    session.snapshot().fighters.a.energy,
    4,
    "caster only pays the skill cost"
  );
  assert.equal(session.snapshot().fighters.ally.energy, 2);
  assert.equal(session.snapshot().fighters.b.energy, 1);
  assert.equal(session.snapshot().fighters.c.energy, 0);
});

test("area targeting skips KO fighters for ordinary tactical effects", () => {
  const session = createCombatSession({
    battleFormat: format(),
    fighters: [
      fighter("a"),
      fighter("ally"),
      fighter("b", { hp: 100 }),
      fighter("c", { hp: 0 })
    ]
  });

  const result = session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: tacticalSkill("quake", [
      {
        kind: "damage",
        targetScope: "all_enemies",
        amount: 20,
        channel: "earth"
      }
    ])
  });

  assert.equal(session.snapshot().fighters.b.hp, 80);
  assert.equal(session.snapshot().fighters.c.hp, 0);
  assert.equal(
    result.events.some(
      (event) =>
        event.type === "hit" &&
        event.tacticalEffect === true &&
        event.actorId === "c"
    ),
    false
  );
});

test("multi-target scope without BattleFormat is rejected before spend", () => {
  const session = createCombatSession({
    fighters: [
      fighter("a", { energy: 5 }),
      fighter("b", { energy: 5 })
    ]
  });

  const skill = tacticalSkill("area-no-format", [
    {
      kind: "damage",
      targetScope: "all_enemies",
      amount: 20,
      channel: "fire"
    }
  ]);

  const result = session.startSkill({
    actorId: "a",
    targetId: "b",
    skill
  });

  assert.equal(result.ok, false);
  assert.equal(
    result.outcome,
    "unsupported_tactical_effect"
  );
  assert.equal(
    session.snapshot().fighters.a.energy,
    5
  );
});

test("2v2 UI passes normalized BattleFormat into CombatSession", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/combat-2v2-test-ui.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    source,
    /createCombatSession\(\{[\s\S]*?battleFormat:\s*format[\s\S]*?fighters/
  );
});
