import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeSkillEffectV1} from "../../src/contracts/skill-effect-v1.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatState} from "../../src/core/combat/combat-state.js";
import {applyImmediateTacticalEffectsV1} from "../../src/core/combat/immediate-tactical-effects-v1.js";
import {applyCombatDamageV1} from "../../src/core/combat/combat-damage-application-v1.js";
import {describeCaptureSkillV1} from "../../src/ui/capture-skill-explanation-v1.js";
import {buildHumanTacticalSkillEffectsV1} from "../../src/ui/capture-editor-human-v2.js";

const data=p=>JSON.parse(readFileSync(new URL("../../"+p,import.meta.url),"utf8"));
const wallEffect={kind:"summon_entity",targetScope:"self",entityKind:"barrier",statId:"glace",
 hpPerStatPoint:1,interceptKinds:["projectile","beam","contact"]};
const wallSkill=()=>normalizeSkillDefinition({...data("data/combat/skills/fireball.skill.json"),
 id:"ice-wall-test",name:"Mur de glace",form:"self",category:"defensive",element:"ice",
 preparationMs:500,travelMs:0,energyCost:2,projectileClash:{power:0},
 effect:{damage:0,heal:0,stunMs:0,interruptsPreparation:false,tags:[]},
 effects:[wallEffect],targetRelations:["self"],targetLocations:["active"]});
function state(points=80){
 return createCombatState({fighters:[
  {id:"hero",maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10,
    statValuesById:{glace:points,fire:7}},
  {id:"enemy",maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10,
    statValuesById:{glace:0}}
 ]});
}
function summon(s=state()){
 return applyImmediateTacticalEffectsV1({state:s,actorId:"hero",targetId:"hero",skill:wallSkill(),atMs:0});
}
test("ice wall is an explicit defensive entity contract, not a shield/status alias",()=>{
 const v=normalizeSkillEffectV1(wallEffect);
 assert.deepEqual(v.interceptKinds,wallEffect.interceptKinds);
 assert.equal(v.statId,"glace");
 assert.throws(()=>normalizeSkillEffectV1({...wallEffect,hpPerStatPoint:-1}),/hpPerStatPoint/);
 assert.throws(()=>normalizeSkillEffectV1({...wallEffect,targetScope:"all_enemies"}),/targetScope|summon/i);
 assert.throws(()=>normalizeSkillEffectV1({...wallEffect,entityKind:"familiar"}),/entityKind/);
 assert.deepEqual(buildHumanTacticalSkillEffectsV1([wallEffect]),[v]);
});
test("native effect creates one barrier with stat-snapshotted HP from official glace stat",()=>{
 const spawn=summon();const e=spawn.state.combatEntities;
 assert.equal(e.length,1);
 assert.equal(e[0].hp,80);assert.equal(e[0].maxHp,80);
 assert.equal(e[0].statId,"glace");assert.equal(e[0].statPoints,80);
 assert.equal(e[0].protectedActorId,"hero");
 assert.equal(spawn.events.filter(x=>x.type==="combat-entity-created").length,1);
 assert.equal(summon(spawn.state).state.combatEntities.length,1,"recast replaces wall rather than stacking invisible duplicates");
 assert.equal(summon(state(0)).state.combatEntities.length,0,"zero glace does not invent HP");
});
test("barrier intercepts actual incoming contact/beam/projectile damage, is destroyed and spills remainder to fighter",()=>{
 const starting=summon().state;
 let hit=applyCombatDamageV1({state:starting,sourceActorId:"enemy",targetActorId:"hero",
   damage:30,incomingKind:"projectile"});
 assert.equal(hit.appliedDamage,0);assert.equal(hit.absorbedByEntity,30);
 assert.equal(hit.state.combatEntities[0].hp,50);assert.equal(hit.state.fighters.hero.hp,100);
 hit=applyCombatDamageV1({state:hit.state,sourceActorId:"enemy",targetActorId:"hero",
   damage:65,incomingKind:"beam"});
 assert.equal(hit.absorbedByEntity,50);assert.equal(hit.appliedDamage,15);
 assert.equal(hit.state.combatEntities.length,0);
 assert.equal(hit.state.fighters.hero.hp,85);
 assert.equal(hit.destroyedEntityId!=null,true);
});
test("wall cannot intercept internal DoT, zone, self-hit or allied source; no wall when ice is zero",()=>{
 const withWall=summon().state;
 let hit=applyCombatDamageV1({state:withWall,sourceActorId:"enemy",targetActorId:"hero",damage:10,incomingKind:"dot"});
 assert.equal(hit.appliedDamage,10);assert.equal(hit.state.combatEntities[0].hp,80);
 hit=applyCombatDamageV1({state:withWall,sourceActorId:"hero",targetActorId:"hero",damage:10,incomingKind:"contact"});
 assert.equal(hit.appliedDamage,10);assert.equal(hit.state.combatEntities[0].hp,80);
 const noWall=summon(state(0)).state;
 hit=applyCombatDamageV1({state:noWall,sourceActorId:"enemy",targetActorId:"hero",damage:10,incomingKind:"projectile"});
 assert.equal(hit.appliedDamage,10);
});
test("bestiary explains per-point math explicitly, while other skill effects remain unchanged",()=>{
 const desc=describeCaptureSkillV1(wallSkill()).sentences.join(" ");
 assert.match(desc,/glace/i);assert.match(desc,/PV/i);assert.match(desc,/1/);
 assert.equal(normalizeSkillEffectV1({kind:"heal",targetScope:"self",amount:9}).amount,9);
});
