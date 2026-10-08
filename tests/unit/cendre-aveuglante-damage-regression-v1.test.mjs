import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createCombatState} from "../../src/core/combat/combat-state.js";
import {applyStatusEffectV1} from "../../src/core/combat/status-effect-runtime-v1.js";
import {computeCombatDamageV1} from "../../src/core/combat/combat-damage-v1.js";
import {projectStatusStatEffectsV1} from "../../src/core/combat/status-effect-projection-v1.js";

const RULES = {
  speed: {
    damageChannel: null,
    resistanceChannel: null,
    damagePctPerPoint: 0,
    resistancePctPerPoint: 0,
    chargeTimeReductionPctPerPoint: 1,
    damageReductionPctPerPoint: 0
  },
  physical: {
    damageChannel: "physical",
    resistanceChannel: "physical",
    damagePctPerPoint: 1,
    resistancePctPerPoint: 1,
    chargeTimeReductionPctPerPoint: 0,
    damageReductionPctPerPoint: 0
  }
};

function fighter(id, other = {}) {
  return {
    id, maxHp: 300, initialHp: 300,
    maxEnergy: 10, initialEnergy: 10,
    statValuesById: {speed: 5, physical: 5},
    statEffectRulesById: RULES,
    ...other
  };
}

test("Cendre aveuglante real Showcase debuff increases physical incoming damage, not decrease it", async () => {
  const showcase = JSON.parse(await readFile(
    new URL("../../data/capture/showcase/cap_fire_special_1.capture-skill-transfer-v1.json", import.meta.url),
    "utf8"
  )).draft;
  assert.equal(showcase.definition.name, "Cendre aveuglante");
  assert.deepEqual(showcase.definition.effects.map(e => e.status.statId), ["speed","physical"]);
  assert.deepEqual(showcase.definition.effects.map(e => e.status.deltaPoints), [-50,-50]);
  assert.ok(showcase.definition.effects.every(e => e.status.durationMs === 20000));

  const baseline = createCombatState({
    fighters: [
      fighter("source"),
      fighter("victim", {resistancePctByChannel:{physical:20,fire:40}})
    ]
  });
  let debuffed = baseline;
  for (const effect of showcase.definition.effects) {
    debuffed = applyStatusEffectV1({
      state: debuffed,
      sourceActorId: "source",
      targetActorId: "victim",
      sourceSkillId: showcase.definition.id,
      status: effect.status
    });
  }

  const incoming = (state, channel) => computeCombatDamageV1({
    state, attackerId: "source", targetId: "victim", baseDamage:100, channel
  }).damage;
  // 20% physical resistance becomes -30% resistance after Cendre: more damage.
  assert.equal(incoming(baseline,"physical"), 80);
  assert.equal(incoming(debuffed,"physical"), 130);
  // Cendre does not lower unrelated fire/elemental resistance or global defense.
  assert.equal(incoming(baseline,"fire"), 60);
  assert.equal(incoming(debuffed,"fire"), 60);
  // The same physical stat also controls damage DEALT, thus the debuffed victim's own attacks become weaker.
  const outgoing = (state) => computeCombatDamageV1({
    state, attackerId:"victim", targetId:"source", baseDamage:100, channel:"physical"
  }).damage;
  assert.equal(outgoing(baseline), 100);
  assert.equal(outgoing(debuffed), 50);
  const projected = projectStatusStatEffectsV1({fighter:debuffed.fighters.victim,atMs:debuffed.elapsedMs});
  assert.equal(projected.resistancePctByChannel.physical, -50);
  assert.equal(projected.damagePctByChannel.physical, -50);
  assert.equal(projected.chargeTimeReductionPct, -50);
  assert.equal(projectStatusStatEffectsV1({fighter:debuffed.fighters.victim,atMs:20001}).resistancePctByChannel.physical ?? 0, 0);
});
