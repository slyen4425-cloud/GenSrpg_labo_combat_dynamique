import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { normalizeSkillEffectV1 } from "../../src/contracts/skill-effect-v1.js";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatState } from "../../src/core/combat/combat-state.js";
import { computeCombatDamageV1 } from "../../src/core/combat/combat-damage-v1.js";
import { buildHumanTacticalSkillEffectsV1 } from "../../src/ui/capture-editor-human-v2.js";

function fighter(id, defense = {}) {
  return {
    id, maxHp: 200, initialHp: 200,
    maxEnergy: 10, initialEnergy: 10,
    ...defense
  };
}

const defense = {
  resistancePctByChannel: { fire: 60 },
  damageReductionPct: 20
};

function state(resistance = 60) {
  return createCombatState({
    fighters: [
      fighter("attacker"),
      fighter("target", {
        ...defense,
        resistancePctByChannel: { fire: resistance }
      })
    ]
  });
}

function skill(fields) {
  return normalizeSkillDefinition({
    id: "penetrating-strike",
    name: "Penetrating strike",
    category: "offensive",
    form: "projectile",
    element: "fire",
    approachMode: "none",
    energyCost: 0,
    preparationMs: 0,
    travelMs: 0,
    recoveryMs: 0,
    cooldownMs: 0,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["enemy"],
    effect: { damage: 0, tags: [] },
    effects: [{
      kind: "damage",
      targetScope: "target",
      amount: 100,
      channel: "fire",
      ...fields
    }]
  });
}

test("damage effect accepts optional 0/50/100 percent penetration and rejects invalid percentages", () => {
  const legacy = {kind: "damage", targetScope: "target", amount: 100, channel: "fire"};
  assert.deepEqual(normalizeSkillEffectV1(legacy), legacy);
  for (const percent of [0, 50, 100]) {
    const input = {
      ...legacy,
      ignoreResistancePct: percent,
      ignoreDamageReductionPct: percent
    };
    assert.deepEqual(normalizeSkillEffectV1(input), input);
  }
  for (const percent of [-1, 101, Infinity, NaN]) {
    assert.throws(
      () => normalizeSkillEffectV1({ ...legacy, ignoreResistancePct: percent }),
      /ignoreResistancePct/
    );
    assert.throws(
      () => normalizeSkillEffectV1({ ...legacy, ignoreDamageReductionPct: percent }),
      /ignoreDamageReductionPct/
    );
  }
  assert.throws(
    () => normalizeSkillEffectV1({kind: "heal", targetScope: "self", amount: 10, ignoreResistancePct: 50}),
    /unknown field|ignoreResistancePct/
  );
});

test("single CombatDamage owner ignores percentages only from positive resistance and global defense", () => {
  const base = {state: state(), attackerId: "attacker", targetId: "target", baseDamage: 100, channel: "fire"};
  assert.equal(computeCombatDamageV1(base).damage, 32);
  assert.equal(computeCombatDamageV1({...base,ignoreResistancePct: 50}).damage, 56);
  assert.equal(computeCombatDamageV1({...base,ignoreDamageReductionPct: 50}).damage, 36);
  assert.equal(computeCombatDamageV1({...base,ignoreResistancePct: 50,ignoreDamageReductionPct: 50}).damage, 63);
  assert.equal(computeCombatDamageV1({...base,ignoreResistancePct: 100,ignoreDamageReductionPct: 100}).damage, 100);
  assert.equal(computeCombatDamageV1({...base,state:state(-50),ignoreResistancePct: 100}).damage, 120);
});

test("real SkillDefinition -> Combat Session -> effect damage -> HP honors per-attack penetration", () => {
  for (const [fields, expectedHp] of [
    [{}, 168],
    [{ignoreResistancePct: 50}, 144],
    [{ignoreResistancePct: 100,ignoreDamageReductionPct: 100}, 100]
  ]) {
    const session = createCombatSession({fighters:[fighter("attacker"),fighter("target",defense)]});
    const result = session.useSkill({
      actorId: "attacker",
      targetId: "target",
      skill: skill(fields)
    });
    assert.equal(result.ok, true);
    assert.equal(session.snapshot().fighters.target.hp, expectedHp);
  }
});

test("Human Editor preserves penetration through tactical effects and provides damage-only fields", async () => {
  const damage = buildHumanTacticalSkillEffectsV1([{
    kind:"damage", targetScope:"target", amount:30, channel:"fire",
    ignoreResistancePct:50, ignoreDamageReductionPct:100
  }]);
  assert.equal(damage[0].ignoreResistancePct, 50);
  assert.equal(damage[0].ignoreDamageReductionPct, 100);
  const legacy = buildHumanTacticalSkillEffectsV1([{kind:"damage",targetScope:"target",amount:30,channel:"fire"}]);
  assert.equal(Object.hasOwn(legacy[0],"ignoreResistancePct"), false);

  const editorSource = await readFile("src/ui/capture-editor-human-v2.js","utf8");
  for (const marker of ["skillEffectIgnoreResistancePct","skillEffectIgnoreDamageReductionPct","[data-skill-effect-ignore-resistance-pct]","[data-skill-effect-ignore-damage-reduction-pct]"]) {
    assert.equal(editorSource.includes(marker),true,"missing editor field: "+marker);
  }
});
