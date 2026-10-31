import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeStatusEffectV1} from "../../src/contracts/status-effect-v1.js";
import {createCombatState} from "../../src/core/combat/combat-state.js";
import {applyStatusEffectV1} from "../../src/core/combat/status-effect-runtime-v1.js";
import {computeCombatDamageV1} from "../../src/core/combat/combat-damage-v1.js";
import {applyCombatDamageV1,applyCombatHealV1} from "../../src/core/combat/combat-damage-application-v1.js";
const fighter=(id,hp=100)=>({id,maxHp:300,initialHp:hp,maxEnergy:10,initialEnergy:10});
const state=(hp=100)=>createCombatState({fighters:[fighter("caster"),fighter("victim",hp)]});
function status(affectedPolarity,modifierPct=30,stacking="refresh"){
 return normalizeStatusEffectV1({id:"incoming-test-"+affectedPolarity,kind:"incoming_effect_modifier",
 polarity:modifierPct>=0?"detrimental":"beneficial",durationModel:"time_ms",durationMs:1000,
 stacking,maxStacks:3,modifierPct,affectedPolarity,tags:[]});
}
const apply=(s,st)=>applyStatusEffectV1({state:s,targetActorId:"victim",sourceActorId:"caster",
 sourceSkillId:"freeze",status:st});
const damage=s=>applyCombatDamageV1({state:s,sourceActorId:"caster",targetActorId:"victim",damage:100});
const heal=(s,amount=100)=>applyCombatHealV1({state:s,targetActorId:"victim",amount});
test("incoming amplifier is a native signed status with selectable negative positive or both",()=>{
 for(const affectedPolarity of ["detrimental","beneficial","both"]){
  const s=status(affectedPolarity);
  assert.equal(s.kind,"incoming_effect_modifier");
  assert.equal(s.affectedPolarity,affectedPolarity);
  assert.equal(s.modifierPct,30);
 }
 assert.throws(()=>status("none"),/affectedPolarity/);
});
test("negative target takes 30% more from all incoming damage even with 0 defense",()=>{
 let s=apply(state(200),status("detrimental"));
 const base=computeCombatDamageV1({state:s,attackerId:"caster",targetId:"victim",baseDamage:100,channel:"ice"});
 assert.equal(base.damage,100);
 const result=damage(s);
 assert.equal(result.appliedDamage,130);
 assert.equal(result.state.fighters.victim.hp,70);
 assert.equal(heal(apply(state(100),status("detrimental")),50).applied,50);
});
test("positive target takes normal damage but 30% more healing",()=>{
 const s=apply(state(100),status("beneficial"));
 assert.equal(damage(s).appliedDamage,100);
 assert.equal(heal(s,100).applied,130);
 assert.equal(heal(s,100).state.fighters.victim.hp,230);
});
test("both affects damage and healing; stacked debuffs, expiration and signed reductions",()=>{
 let s=apply(state(100),status("both",30,"stack"));
 s=apply(s,status("both",30,"stack"));
 assert.equal(damage(s).appliedDamage,160);
 assert.equal(heal(s,100).applied,160);
 assert.equal(heal(s,100,1001).applied,100);
 let reverse=apply(state(100),status("both",-25));
 assert.equal(damage(reverse).appliedDamage,75);
 assert.equal(heal(reverse,100).applied,75);
});
test("editor authoring includes scope and signed value for status and zone; bestiary explains it",()=>{
 const author=readFileSync(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
 const bestiary=readFileSync(new URL("../../src/ui/capture-skill-explanation-v1.js",import.meta.url),"utf8");
 assert.match(author,/incoming_effect_modifier/);
 assert.match(author,/skillStatusIncomingEffectModifierPct/);
 assert.match(author,/skillZoneStatusIncomingEffectModifierPct/);
 assert.match(author,/affectedPolarity/);
 assert.match(bestiary,/incoming_effect_modifier/);
});
