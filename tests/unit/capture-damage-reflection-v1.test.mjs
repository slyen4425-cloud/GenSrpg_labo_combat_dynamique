import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeStatusEffectV1 } from "../../src/contracts/status-effect-v1.js";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatState } from "../../src/core/combat/combat-state.js";
import { applyStatusEffectV1 } from "../../src/core/combat/status-effect-runtime-v1.js";
import { applyCombatDamageV1 } from "../../src/core/combat/combat-damage-application-v1.js";
import { buildHumanTacticalSkillEffectsV1 } from "../../src/ui/capture-editor-human-v2.js";

function fighter(id, hp = 100) {
  return { id, maxHp: 100, initialHp: hp, maxEnergy: 10, initialEnergy: 10 };
}
function reflection(percent = 40, durationMs = 5000, id = "mirror") {
  return {
    id, kind: "damage_reflection", polarity: "beneficial", durationMs,
    stacking: "refresh", percent, tags: ["reflect"]
  };
}
function addStatus(state, targetActorId, status = reflection()) {
  return applyStatusEffectV1({
    state, targetActorId, sourceActorId: targetActorId,
    sourceSkillId: "mirror-skill", status: normalizeStatusEffectV1(status),
    atMs: state.elapsedMs
  });
}
function getState() {
  return createCombatState({ fighters: [fighter("attacker"), fighter("defender")] });
}
function damage(state, amount = 20, sourceActorId = "attacker", targetActorId = "defender") {
  return applyCombatDamageV1({state, sourceActorId, targetActorId, damage: amount, atMs: state.elapsedMs});
}
function skill(id, effects, damageBase = 0) {
  return normalizeSkillDefinition({
    id, name: id, category: "buff_debuff", form: "self", element: null,
    approachMode: "none", energyCost: 0, preparationMs: 0, travelMs: 0,
    recoveryMs: 0, cooldownMs: 0,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["enemy","self","ally"],
    effect: { damage: damageBase, heal: 0, tags: [] },
    effects
  });
}
test("native reflection status contract validates 0-100 percent, protects other statuses", () => {
  const value = reflection(40);
  assert.deepEqual(normalizeStatusEffectV1(value), {...value, durationModel:"time_ms", maxStacks:1});
  for(const percent of [-1,101,Infinity,NaN]) {
    assert.throws(()=>normalizeStatusEffectV1(reflection(percent)), /percent/);
  }
  assert.throws(()=>normalizeStatusEffectV1({...reflection(), unknownField:3}), /unknown field/);
  assert.equal(normalizeStatusEffectV1({
    id:"guard",kind:"stat_modifier",polarity:"beneficial",
    durationMs:1000,stacking:"refresh",statId:"defense",deltaPoints:3
  }).kind,"stat_modifier");
});
test("real Combat Damage Application reflects percent of HP actually lost and attributes damage", () => {
  const state = addStatus(getState(), "defender");
  const applied = damage(state, 20);
  assert.equal(applied.appliedDamage,20);
  assert.equal(applied.state.fighters.defender.hp,80);
  assert.equal(applied.state.fighters.attacker.hp,92);
  assert.equal(applied.reflection?.appliedDamage,8);
  assert.equal(applied.state.fighters.defender.damageDealtTotal,8);
  assert.equal(applied.state.fighters.attacker.damageDealtTotal,20);
});
test("immunity and absorption never reflect, and reflection may be shielded", () => {
  let state=addStatus(getState(),"defender");
  state=addStatus(state,"defender",{
    id:"shield",kind:"shield",polarity:"beneficial",
    durationMs:5000,stacking:"refresh",amount:25
  });
  const absorb=damage(state,20);
  assert.equal(absorb.state.fighters.defender.hp,100);
  assert.equal(absorb.state.fighters.attacker.hp,100);
  assert.equal(absorb.reflection,null);
  const large=damage(absorb.state,10);
  assert.equal(large.appliedDamage,5);
  assert.equal(large.state.fighters.attacker.hp,98);
  let immune=addStatus(getState(),"defender");
  immune=addStatus(immune,"defender",{
    id:"immune",kind:"immunity",polarity:"beneficial",
    durationMs:5000,stacking:"refresh",domains:["damage"]
  });
  const hit=damage(immune,20);
  assert.equal(hit.appliedDamage,0);
  assert.equal(hit.reflection,null);
  let shielded=addStatus(getState(),"defender");
  shielded=addStatus(shielded,"attacker",{
    id:"shield-attacker",kind:"shield",polarity:"beneficial",
    durationMs:5000,stacking:"refresh",amount:10
  });
  const reflected=damage(shielded,20);
  assert.equal(reflected.state.fighters.attacker.hp,100);
  assert.equal(reflected.reflection?.appliedDamage,0);
});
test("reciprocal mirrors never ping-pong, self damage does not trigger reflection, KO is credited once", () => {
  let state=addStatus(getState(),"defender",reflection(100));
  state=addStatus(state,"attacker",reflection(100,5000,"attacker-mirror"));
  const hit=damage(state,20);
  assert.equal(hit.state.fighters.defender.hp,80);
  assert.equal(hit.state.fighters.attacker.hp,80);
  assert.equal(hit.reflection?.appliedDamage,20);
  assert.equal(damage(state,20,"defender","defender").state.fighters.attacker.hp,100);
  let lethal=createCombatState({fighters:[fighter("attacker",10),fighter("defender")]});
  lethal=addStatus(lethal,"defender",reflection(100));
  const killed=damage(lethal,20);
  assert.equal(killed.state.fighters.attacker.hp,0);
  assert.equal(killed.state.fighters.defender.knockoutsTotal,1);
  assert.equal(damage(killed.state,1).state.fighters.defender.knockoutsTotal,1);
});
test("expired mirror and 0 percent are inactive, independent of the UI clock", () => {
  let state=addStatus(getState(),"defender",reflection(0));
  assert.equal(damage(state,20).state.fighters.attacker.hp,100);
  const session=createCombatSession({fighters:[fighter("attacker"),fighter("defender")]});
  const cast=session.useSkill({actorId:"defender",targetId:"defender",skill:skill("mirror-cast",[
    {kind:"apply_status",targetScope:"self",status:reflection(25,1000)}
  ])});
  assert.equal(cast.ok,true);
  session.advanceMs(1000);
  const hit=session.useSkill({actorId:"attacker",targetId:"defender",skill:skill("attack",[],20)});
  assert.equal(hit.ok,true);
  assert.equal(session.snapshot().fighters.attacker.hp,100);
  assert.equal(session.snapshot().fighters.defender.hp,80);
});
test("Human Editor transmits reflection percent through the status normalization and exposes its option", async () => {
  const [effect]=buildHumanTacticalSkillEffectsV1([{
    kind:"apply_status", targetScope:"self",
    status:{id:"mirror",kind:"damage_reflection",polarity:"beneficial",
      durationSeconds:12,stacking:"refresh",percent:35}
  }]);
  assert.equal(effect.status.kind,"damage_reflection");
  assert.equal(effect.status.percent,35);
  assert.equal(effect.status.durationMs,12000);
  const editor=await readFile(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
  assert.match(editor,/skillStatusReflectionPercent/);
  assert.match(editor,/data-skill-status-reflection-percent/);
  assert.match(editor,/damage_reflection: "Renvoi de dégâts"/);
});
