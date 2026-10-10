import test from "node:test";
import assert from "node:assert/strict";
import { normalizeStatusEffectV1 } from "../../src/contracts/status-effect-v1.js";
import { normalizeSkillEffectV1 } from "../../src/contracts/skill-effect-v1.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { applyStatusEffectV1, removeStatusEffectsV1 } from "../../src/core/combat/status-effect-runtime-v1.js";
import { advanceEnergyTicks } from "../../src/core/combat/combat-timing.js";
import { advanceCombatTime } from "../../src/core/combat/combat-state.js";
import { buildHumanTacticalSkillEffectsV1 } from "../../src/ui/capture-editor-human-v2.js";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { readFileSync } from "node:fs";

const effect = (pct, overrides={}) => ({
 id:"energy-regen-test",kind:"energy_regen_modifier",modifierPct:pct,polarity:pct>=0?"beneficial":"detrimental",
 durationMs:3500,stacking:"refresh",tags:["energy"],...overrides
});
const norm = (pct, overrides={})=>normalizeStatusEffectV1(effect(pct,overrides));
const fighter=(id)=>({id,maxHp:100,initialHp:100,maxEnergy:30,initialEnergy:0,energyChargeAmount:2,energyChargeIntervalMs:1000});
const session=()=>createCombatSession({fighters:[fighter("player"),fighter("opponent")]});
test("energy regen buff and debuff normalize strictly; other effects unchanged",()=>{
 assert.equal(norm(100).modifierPct,100);
 assert.equal(norm(-50).modifierPct,-50);
 assert.throws(()=>norm(Number.POSITIVE_INFINITY),RangeError);
 assert.throws(()=>norm(25,{otherUnknownField:1}),TypeError);
 assert.equal(normalizeSkillEffectV1({kind:"apply_status",targetScope:"self",status:effect(100)}).status.kind,"energy_regen_modifier");
});
test("energy regeneration is based on native tick positions and active status expiry, not frame size",()=>{
 const m=norm(100);
 const status={definition:m,appliedAtMs:0,expiresAtMs:2500,stacks:1,remainingActionEnds:null};
 const expected=advanceEnergyTicks({energy:0,maxEnergy:30,progressMs:0,amount:2,intervalMs:1000,deltaMs:4000,atMs:0,energyStatusEffects:[status]});
 assert.equal(expected.energy,12,"two boosted ticks then two normal ticks");
 assert.equal(expected.progressMs,0);
 const partial=advanceEnergyTicks({energy:0,maxEnergy:30,progressMs:500,amount:2,intervalMs:1000,deltaMs:2000,atMs:500,energyStatusEffects:[status]});
 assert.equal(partial.energy,8);
});
test("real combat status buffs recovery, expires, refreshes and supports cleanse",()=>{
 let c=session();
 let state=c.snapshot();
 state=applyStatusEffectV1({state,targetActorId:"player",sourceActorId:"player",status:norm(100)});
 state=advanceCombatTime(state,4000);
 assert.equal(state.fighters.player.energy,14);
 assert.equal(state.fighters.opponent.energy,8);
 assert.equal(state.fighters.player.energyChargeAmount,2);
 const cleansed=removeStatusEffectsV1({state,targetActorId:"player",polarity:"beneficial",statusTags:["energy"]});
 assert.equal(cleansed.fighters.player.statusEffects.length,0);
});
test("stacking and negative percent clamp energy gain to non-negative, cap to maximum",()=>{
 const m=norm(50,{stacking:"stack",maxStacks:3});
 const instance={definition:m,appliedAtMs:0,expiresAtMs:5000,stacks:3};
 assert.equal(advanceEnergyTicks({energy:0,maxEnergy:30,amount:2,intervalMs:1000,deltaMs:1000,atMs:0,energyStatusEffects:[instance]}).energy,5);
 const negative={...instance,definition:norm(-150)};
 assert.equal(advanceEnergyTicks({energy:0,maxEnergy:30,amount:2,intervalMs:1000,deltaMs:1000,atMs:0,energyStatusEffects:[negative]}).energy,0);
 assert.equal(advanceEnergyTicks({energy:29,maxEnergy:30,amount:2,intervalMs:1000,deltaMs:1000,atMs:0,energyStatusEffects:[instance]}).energy,30);
});
test("human tactical authoring builds regen status without changing baseline energy strategy",()=>{
 const buff=buildHumanTacticalSkillEffectsV1([{kind:"apply_status",targetScope:"all_allies",status:{id:"regen",kind:"energy_regen_modifier",polarity:"beneficial",durationSeconds:6,stacking:"refresh",modifierPct:75,tags:["energy"]}}]);
 assert.equal(buff[0].status.modifierPct,75);
 assert.equal(buff[0].status.durationMs,6000);
 const source=readFileSync(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
 assert.match(source,/skillStatusEnergyRegenModifierPct/);
 assert.match(source,/skillZoneStatusEnergyRegenModifierPct/);
 assert.match(source,/Régénération d’énergie/);
});

test("native CombatSession skill applies self-buff, restores boosted energy, and expires cleanly",()=>{
 const c=createCombatSession({fighters:[{...fighter("player"),initialEnergy:4},fighter("opponent")]});
 const ability=normalizeSkillDefinition({
  id:"energy-regen-ability",name:"Rechargement",category:"buff_debuff",form:"projectile",
  element:null,approachMode:"none",energyCost:2,preparationMs:0,travelMs:0,
  recoveryMs:0,cooldownMs:0,allowedDistances:["short","medium","long"],
  targetRelations:["self"],effect:{damage:0,heal:0,tags:[]},
  effects:[{kind:"apply_status",targetScope:"self",status:effect(100,{durationMs:2500})}]
 });
 const result=c.useSkill({actorId:"player",targetId:"player",skill:ability});
 assert.equal(result.ok,true);
 assert.equal(c.snapshot().fighters.player.statusEffects[0].definition.kind,"energy_regen_modifier");
 assert.equal(c.snapshot().fighters.player.energy,2);
 c.advanceMs(4000);
 assert.equal(c.snapshot().fighters.player.energy,14,"native gain 2+4+4+2+2");
 assert.equal(c.snapshot().fighters.player.statusEffects.length,0);
 assert.equal(c.snapshot().fighters.player.energyChargeAmount,2);
});
test("native stacking and refresh use same status owner and cleanse removes only the target buff",()=>{
 const base=session().snapshot();
 let state=applyStatusEffectV1({state:base,targetActorId:"player",sourceActorId:"player",status:norm(50,{stacking:"stack",maxStacks:3})});
 state=applyStatusEffectV1({state,targetActorId:"player",sourceActorId:"player",status:norm(50,{stacking:"stack",maxStacks:3})});
 assert.equal(state.fighters.player.statusEffects[0].stacks,2);
 state=advanceCombatTime(state,1000);
 assert.equal(state.fighters.player.energy,4,"2 energy * (1+100%)");
 const cleared=removeStatusEffectsV1({state,targetActorId:"player",polarity:"beneficial",statusTags:["energy"]});
 assert.equal(cleared.fighters.player.statusEffects.length,0);
 assert.equal(cleared.fighters.opponent.energy,2);
});
