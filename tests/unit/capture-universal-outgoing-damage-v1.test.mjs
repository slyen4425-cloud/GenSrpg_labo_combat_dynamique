import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {projectCaptureStatEffectsV1} from "../../src/core/combat/capture-stat-effects-v1.js";
import {normalizeStatEffectRulesByIdV1} from "../../src/contracts/stat-effect-rules-v1.js";
import {normalizeStatusEffectV1} from "../../src/contracts/status-effect-v1.js";
import {createCombatState} from "../../src/core/combat/combat-state.js";
import {computeCombatDamageV1} from "../../src/core/combat/combat-damage-v1.js";
import {applyStatusEffectV1} from "../../src/core/combat/status-effect-runtime-v1.js";
import {humanStatEffectSummaryV1} from "../../src/ui/capture-editor-human-v2.js";
const power={id:"power",label:"Puissance",damageChannel:null,resistanceChannel:null,
 damagePctPerPoint:0,resistancePctPerPoint:0,chargeTimeReductionPctPerPoint:0,
 outgoingDamagePctPerPoint:1};
const reg=normalizeCaptureStatRegistryV1({schema:"capture-stat-registry-v1",stats:[power]});
function state(outgoingDamagePct=0){
 const a={id:"player",maxHp:100,initialHp:100,maxEnergy:100,initialEnergy:100,
  outgoingDamagePct,statValuesById:{power:25},statEffectRulesById:{power:{
   damageChannel:null,resistanceChannel:null,damagePctPerPoint:0,resistancePctPerPoint:0,
   chargeTimeReductionPctPerPoint:0,outgoingDamagePctPerPoint:1}}};
 const b={id:"enemy",maxHp:100,initialHp:100,maxEnergy:100,initialEnergy:100,
  resistancePctByChannel:{fire:40,physical:10}};
 return createCombatState({fighters:[a,b]});
}
const calculate=(s,channel,atMs=0)=>computeCombatDamageV1({state:s,attackerId:"player",targetId:"enemy",
 baseDamage:100,channel,atMs});
test("Puissance stat: one point is +1% all outgoing damage, never resistance",()=>{
 assert.equal(reg.stats[0].outgoingDamagePctPerPoint,1);
 assert.equal(reg.stats[0].damageChannel,null);
 assert.equal(reg.stats[0].resistanceChannel,null);
 const p=projectCaptureStatEffectsV1({registry:reg,statValues:{schema:"capture-creature-stat-values-v1",creatureId:"player",values:{power:25}}});
 assert.equal(p.outgoingDamagePct,25);
 assert.deepEqual(p.damagePctByChannel,{});
 assert.deepEqual(p.resistancePctByChannel,{});
 assert.equal(calculate(state(p.outgoingDamagePct),"physical").damage,112.5);
 assert.equal(calculate(state(p.outgoingDamagePct),"fire").damage,75);
 assert.equal(calculate(state(p.outgoingDamagePct),"creator-custom-channel").damage,125);
 assert.match(humanStatEffectSummaryV1({definition:power,value:25}),/1 point = \+1 % tous dégâts infligés/);
 const rules=normalizeStatEffectRulesByIdV1({power:{damageChannel:null,resistanceChannel:null,
 damagePctPerPoint:0,resistancePctPerPoint:0,chargeTimeReductionPctPerPoint:0,outgoingDamagePctPerPoint:1}});
 assert.equal(rules.power.outgoingDamagePctPerPoint,1);
});
test("generic outgoing buff/debuff uses same damage owner, stacks and expires without altering defenses",()=>{
 const negative=normalizeStatusEffectV1({id:"weakening",kind:"outgoing_damage_modifier",polarity:"detrimental",
 durationModel:"time_ms",durationMs:10000,stacking:"stack",maxStacks:3,modifierPct:-30,tags:[]});
 const positive=normalizeStatusEffectV1({id:"empower",kind:"outgoing_damage_modifier",polarity:"beneficial",
 durationModel:"time_ms",durationMs:10000,stacking:"refresh",modifierPct:20,tags:[]});
 let s=state(25);
 s=applyStatusEffectV1({state:s,targetActorId:"player",sourceActorId:"enemy",sourceSkillId:"curse",status:negative});
 assert.equal(calculate(s,"creator-custom-channel").damage,95);
 assert.equal(calculate(s,"fire").damage,57);
 assert.equal(calculate(s,"physical").resistancePct,10);
 assert.equal(calculate(s,"physical").damage,85.5);
 s=applyStatusEffectV1({state:s,targetActorId:"player",sourceActorId:"enemy",sourceSkillId:"curse",status:negative});
 assert.equal(calculate(s,"creator-custom-channel").damage,65);
 s=applyStatusEffectV1({state:s,targetActorId:"player",sourceActorId:"player",sourceSkillId:"boon",status:positive});
 assert.equal(calculate(s,"creator-custom-channel").damage,85);
 assert.equal(calculate(s,"creator-custom-channel",10000).damage,125);
});
test("editor offers universal % both for custom stats and buff/debuff without all-element entries",()=>{
 const ui=readFileSync(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
 assert.match(ui,/Tous dégâts infligés % \/ point/);
 assert.match(ui,/outgoing_damage_modifier:"Dégâts infligés/);
 assert.match(ui,/skillStatusOutgoingDamageModifierPct/);
});
