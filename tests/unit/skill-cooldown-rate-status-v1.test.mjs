import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeStatusEffectV1} from "../../src/contracts/status-effect-v1.js";
import {normalizeSkillEffectV1} from "../../src/contracts/skill-effect-v1.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {applyStatusEffectV1,removeStatusEffectsV1} from "../../src/core/combat/status-effect-runtime-v1.js";
import {advanceCombatTime,withSkillCooldown,skillCooldownRemainingMs} from "../../src/core/combat/combat-state.js";
import {buildHumanTacticalSkillEffectsV1} from "../../src/ui/capture-editor-human-v2.js";

const status=(pct,extra={})=>normalizeStatusEffectV1({id:"cooldown-buff",kind:"skill_cooldown_rate_modifier",modifierPct:pct,polarity:pct<0?"detrimental":"beneficial",durationMs:2500,stacking:"refresh",tags:["cooldown"],...extra});
const fighter=id=>({id,maxHp:100,initialHp:100,maxEnergy:20,initialEnergy:10,energyChargeAmount:1,energyChargeIntervalMs:2000});
const initial=()=>createCombatSession({fighters:[fighter("player"),fighter("opponent")]}).snapshot();
const assign=(state,pct,durationMs=2500,options={})=>applyStatusEffectV1({state,targetActorId:"player",sourceActorId:"player",status:status(pct,{durationMs,...options})});

test("status contract rejects unknown or invalid modifiers; skill effect accepts self and allies",()=>{
 assert.equal(status(100).modifierPct,100);
 assert.equal(status(-50).modifierPct,-50);
 assert.throws(()=>status(Infinity),RangeError);
 assert.throws(()=>status(20,{invented:1}),TypeError);
 for(const targetScope of ["self","all_allies"]){
  assert.equal(normalizeSkillEffectV1({kind:"apply_status",targetScope,status:status(100)}).status.kind,"skill_cooldown_rate_modifier");
 }
});

test("bonus accelerates already running cooldown then expires precisely mid-frame",()=>{
 let state=withSkillCooldown(initial(),"player","fireball",5000);
 state=assign(state,100,2500);
 state=advanceCombatTime(state,4000);
 assert.equal(skillCooldownRemainingMs(state,"player","fireball"),0,"5 s work completed after 2.5 s at 2x speed");
 assert.deepEqual(state.fighters.player.skillCooldowns,{});
 assert.equal(state.fighters.opponent.energy,12,"energy regeneration independent");
});

test("short buff saves progress and remaining duration goes at original pace",()=>{
 let state=withSkillCooldown(initial(),"player","fireball",8000);
 state=assign(state,100,2000);
 state=advanceCombatTime(state,4000);
 assert.equal(skillCooldownRemainingMs(state,"player","fireball"),2000,"2 s accelerated and 2 s baseline => 6 s work");
 state=advanceCombatTime(state,2000);
 assert.equal(skillCooldownRemainingMs(state,"player","fireball"),0);
});

test("buff only begins after casting, debuff slows cooldown, -100 pauses",()=>{
 let s=withSkillCooldown(initial(),"player","water",6000);
 s=advanceCombatTime(s,1000);
 s=assign(s,-50,2000);
 s=advanceCombatTime(s,3000);
 assert.equal(skillCooldownRemainingMs(s,"player","water"),3000,"1 s baseline +2 s half +1 s baseline");
 let p=withSkillCooldown(initial(),"player","water",5000);
 p=assign(p,-150,3000);
 p=advanceCombatTime(p,4000);
 assert.equal(skillCooldownRemainingMs(p,"player","water"),4000,"3 s paused then 1 s baseline");
});

test("stackable cooldown buff, refresh, cleanse, and multiple skill IDs",()=>{
 let s=initial();
 s=withSkillCooldown(s,"player","fire",9000);
 s=withSkillCooldown(s,"player","ice",7000);
 const buff=status(50,{stacking:"stack",maxStacks:3,durationMs:3000});
 s=applyStatusEffectV1({state:s,targetActorId:"player",sourceActorId:"player",status:buff});
 s=applyStatusEffectV1({state:s,targetActorId:"player",sourceActorId:"player",status:buff});
 assert.equal(s.fighters.player.statusEffects[0].stacks,2);
 s=advanceCombatTime(s,2000);
 assert.equal(skillCooldownRemainingMs(s,"player","fire"),5000);
 assert.equal(skillCooldownRemainingMs(s,"player","ice"),3000);
 s=removeStatusEffectsV1({state:s,targetActorId:"player",polarity:"beneficial",statusTags:["cooldown"]});
 assert.equal(s.fighters.player.statusEffects.length,0);
 s=advanceCombatTime(s,1000);
 assert.equal(skillCooldownRemainingMs(s,"player","fire"),4000);
});

test("native CombatSession applies skill buff and advances cooldown HUD state without changing definition",()=>{
 const c=createCombatSession({fighters:[fighter("player"),fighter("opponent")]});
 const ability=normalizeSkillDefinition({
  id:"surge",name:"Impulsion",category:"buff_debuff",form:"projectile",
  element:null,approachMode:"none",energyCost:2,preparationMs:0,travelMs:0,
  recoveryMs:0,cooldownMs:8000,allowedDistances:["short","medium","long"],
  targetRelations:["self"],effect:{damage:0,heal:0,tags:[]},
  effects:[{kind:"apply_status",targetScope:"self",status:status(100,{durationMs:2000})}]
 });
 const result=c.useSkill({actorId:"player",targetId:"player",skill:ability});
 assert.equal(result.ok,true);
 assert.equal(ability.cooldownMs,8000);
 assert.equal(skillCooldownRemainingMs(c.snapshot(),"player","surge"),8000);
 c.advanceMs(4000);
 assert.equal(skillCooldownRemainingMs(c.snapshot(),"player","surge"),2000);
 assert.equal(c.snapshot().fighters.player.statusEffects.length,0);
});

test("editor status/zone exposes signed percent and human authoring preserves it",()=>{
 const buff=buildHumanTacticalSkillEffectsV1([{kind:"apply_status",targetScope:"all_allies",status:{id:"haste",kind:"skill_cooldown_rate_modifier",modifierPct:100,polarity:"beneficial",durationSeconds:6,stacking:"refresh",tags:["cooldown"]}}]);
 assert.equal(buff[0].status.modifierPct,100);
 assert.equal(buff[0].status.durationMs,6000);
 const ui=readFileSync(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
 assert.match(ui,/skillStatusCooldownRateModifierPct/);
 assert.match(ui,/skillZoneStatusCooldownRateModifierPct/);
 assert.match(ui,/Recharge des compétences/);
});
