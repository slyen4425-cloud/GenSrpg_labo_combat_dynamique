import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createCombatState} from "../../src/core/combat/combat-state.js";
import {computeCombatDamageV1} from "../../src/core/combat/combat-damage-v1.js";
import {normalizeSkillEffectV1} from "../../src/contracts/skill-effect-v1.js";

test("editor supplies a single author control to synchronize ordinary resistances and global defense, preserving legacy specifics",async()=>{
  const ui = await readFile(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
  assert.match(ui,/skillEffectIgnoreAllMitigationPct/);
  assert.match(ui,/Ignorer toutes les résistances/);
  assert.match(ui,/ignoreResistance\.value\s*=\s*ignoreAll\.value/);
  assert.match(ui,/ignoreDefense\.value\s*=\s*ignoreAll\.value/);
  assert.match(ui,/Réglages avancés/);
  assert.match(ui,/ignoreResistancePct/);
  assert.match(ui,/ignoreDamageReductionPct/);
});

test("single 100% author penetration maps to existing two fields, ignoring elemental OR physical plus global defense",()=>{
  for(const channel of ["fire","physical"]){
    const state=createCombatState({fighters:[
      {id:"a",maxHp:200,initialHp:200,maxEnergy:10,initialEnergy:10},
      {id:"b",maxHp:200,initialHp:200,maxEnergy:10,initialEnergy:10,
       damageReductionPct:20,resistancePctByChannel:{fire:60,physical:60}}
    ]});
    const effect=normalizeSkillEffectV1({
      kind:"damage",targetScope:"target",channel,amount:100,
      ignoreResistancePct:100,ignoreDamageReductionPct:100
    });
    const opts={state,attackerId:"a",targetId:"b",baseDamage:effect.amount,channel,
      ignoreResistancePct:effect.ignoreResistancePct,
      ignoreDamageReductionPct:effect.ignoreDamageReductionPct};
    assert.equal(computeCombatDamageV1(opts).damage,100);
    assert.equal(computeCombatDamageV1({...opts,ignoreResistancePct:0,ignoreDamageReductionPct:0}).damage,32);
  }
});
