import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createCombatState} from "../../src/core/combat/combat-state.js";
import {computeCombatDamageV1, canonicalCombatDamageChannelV1} from "../../src/core/combat/combat-damage-v1.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";

const read = path => readFile(new URL("../../" + path, import.meta.url), "utf8");
function fighter(id, extra = {}) {
  return {id,maxHp:200,initialHp:200,maxEnergy:10,initialEnergy:10,...extra};
}
function format1v1() {
  return {
    actors:[{actorId:"a"},{actorId:"b"}],
    teamOf(actorId) { return actorId === "a" ? "local" : actorId === "b" ? "enemy" : null; }
  };
}
function calculate(channel, attacker = {}, target = {}) {
  const state=createCombatState({fighters:[fighter("a",attacker),fighter("b",target)]});
  return computeCombatDamageV1({state,attackerId:"a",targetId:"b",baseDamage:100,channel});
}
function offensiveSkill(id,effects,{category="offensive",form="projectile",preparationMs=0,element="steel"}={}) {
  return normalizeSkillDefinition({
    id,name:id,category,form,element,approachMode:"none",
    energyCost:0,preparationMs,travelMs:0,recoveryMs:0,cooldownMs:0,
    allowedDistances:["short","medium","long"],targetRelations:["enemy"],
    effect:{damage:0,tags:[]},effects
  });
}

test("native elements: French labels and internal keys represent identical damage channels",()=>{
  for(const [internal,french] of [
    ["physical","physique"],["fire","feu"],["water","eau"],
    ["earth","terre"],["air","air"],["electric","électricité"],
    ["light","lumière"],["shadow","ombre"],["nature","nature"],
    ["ice","glace"],["poison","poison"],["steel","acier"],
    ["psy","psy"],["spirit","esprit"]
  ]) {
    assert.equal(canonicalCombatDamageChannelV1(french),internal);
    assert.equal(canonicalCombatDamageChannelV1(internal),internal);
    assert.equal(canonicalCombatDamageChannelV1(french.toUpperCase()),internal);
    const attacker={damagePctByChannel:{[french]:25}};
    const target={resistancePctByChannel:{[internal]:20}};
    for(const channel of [internal,french]) {
      const actual=calculate(channel,attacker,target);
      assert.equal(actual.damageBonusPct,25);
      assert.equal(actual.resistancePct,20);
      assert.equal(actual.damage,100);
      assert.equal(actual.damageChannel,channel,"exported channel identity not silently rewritten");
    }
  }
});

test("legacy steel + Acier both contribute; no lost resistance, modifier, or vulnerability",()=>{
  const attacker={damagePctByChannel:{acier:10,steel:20}};
  const defender={resistancePctByChannel:{acier:15,steel:25}};
  for(const channel of ["acier","steel","Acier"]) {
    const result=calculate(channel,attacker,defender);
    assert.equal(result.damageBonusPct,30);
    assert.equal(result.resistancePct,40);
    assert.equal(result.damage,78);
  }
  assert.equal(calculate("steel",{}, {resistancePctByChannel:{acier:-20}}).damage,120);
  assert.equal(calculate("steel",{}, {resistancePctByChannel:{acier:80}},).damage,20);
});

test("custom elements are never guessed or merged into another user's key",()=>{
  assert.equal(canonicalCombatDamageChannelV1("cristal"),"cristal");
  assert.equal(canonicalCombatDamageChannelV1("crystal"),"crystal");
  assert.equal(calculate("cristal",{damagePctByChannel:{crystal:50}}, {resistancePctByChannel:{cristal:25}}).damage,75);
  assert.equal(calculate("crystal",{damagePctByChannel:{crystal:50}}, {resistancePctByChannel:{cristal:25}}).damage,150);
  assert.equal(calculate("physical",{}, {resistancePctByChannel:{acier:80}}).damage,100);
  assert.equal(calculate("feu",{}, {resistancePctByChannel:{steel:80}}).damage,100);
});

test("real direct SkillDefinition -> CombatSession -> HP honors mixed steel/acier keys",()=>{
  for(const channel of ["steel","acier"]) {
    const skill=offensiveSkill("steel-attack-"+channel,[{
      kind:"damage",targetScope:"target",amount:100,channel
    }]);
    const session=createCombatSession({fighters:[
      fighter("a",{damagePctByChannel:{acier:25}}),
      fighter("b",{resistancePctByChannel:{steel:20}})
    ]});
    const result=session.useSkill({actorId:"a",targetId:"b",skill});
    assert.equal(result.ok,true);
    assert.equal(session.snapshot().fighters.b.hp,100);
  }
});

test("real DoT -> combat clock -> HP resolves French channel against steel resistance",()=>{
  const status={
    id:"bleed-steel",kind:"damage_over_time",polarity:"detrimental",
    durationMs:3000,tickIntervalMs:1000,stacking:"refresh",tags:[],
    amount:20,channel:"acier"
  };
  const skill=offensiveSkill("acier-dot",[{
    kind:"apply_status",targetScope:"target",status
  }]);
  const session=createCombatSession({fighters:[
    fighter("a",{damagePctByChannel:{steel:25}}),
    fighter("b",{resistancePctByChannel:{acier:20}})
  ]});
  const result=session.useSkill({actorId:"a",targetId:"b",skill});
  assert.equal(result.ok,true);
  session.advanceMs(1000);
  assert.equal(session.snapshot().fighters.b.hp,180,"25% steel boost and 20% Acier resistance balance to base 20");
  session.advanceMs(1000);
  assert.equal(session.snapshot().fighters.b.hp,160);
});

test("real authored Tempête de rouille zone -> tick -> HP uses Acier stat and steel natural resistances without modifying JSON",async()=>{
  const raw=await read("data/capture/showcase/tempete_rouille.capture-skill-transfer-v1.json");
  const parsed=importCaptureTransferJsonV1(raw);
  assert.equal(parsed.value.draft.definition.effects[0].tickEffect.channel,"acier");
  assert.equal(parsed.value.draft.definition.element,"steel");
  const skill=normalizeSkillDefinition(parsed.value.draft.definition);
  const session=createCombatSession({
    distance:"short",battleFormat:format1v1(),
    fighters:[
      fighter("a",{damagePctByChannel:{acier:25}}),
      fighter("b",{resistancePctByChannel:{steel:20}})
    ]
  });
  const used=session.useSkill({actorId:"a",targetId:"b",skill});
  assert.equal(used.ok,true);
  assert.equal(session.snapshot().persistentZones.length,1);
  session.advanceMs(1700);
  assert.equal(session.snapshot().fighters.b.hp,180,"one 20-damage zone tick after coherent 25% bonus / 20% resistance");
  assert.equal(JSON.parse(raw).draft.definition.effects[0].tickEffect.channel,"acier","original author data unchanged");
});
