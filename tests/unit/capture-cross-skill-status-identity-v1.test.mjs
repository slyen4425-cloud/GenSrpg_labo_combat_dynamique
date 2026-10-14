import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createCombatRuntime} from "../../src/core/combat/combat-runtime.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createDomStatusFxRenderer} from "../../src/adapters/renderer/dom-status-fx.js";

const load=name=>normalizeSkillDefinition(JSON.parse(readFileSync(new URL(
 "../../data/capture/showcase/"+name+".capture-skill-transfer-v1.json",import.meta.url),"utf8")).draft.definition);
const ultimate=load("cap_electric_special_2");
const dodge=load("dodge");
const arc=load("lib_chain_lightning");
assert.equal(ultimate.effects[0].status.id,dodge.effects[0].status.id);
assert.equal(ultimate.effects[2].status.id,arc.effects[1].status.id);
const fighter=id=>({id,maxHp:250,initialHp:250,maxEnergy:100,initialEnergy:100,
 energyChargeAmount:2,energyChargeIntervalMs:1000,movementEnergyPerStep:0,chargeTimeModifierPct:0,
 statEffectRulesById:{electric:{damageChannel:"electric",resistanceChannel:"electric",
 damagePctPerPoint:1,resistancePctPerPoint:0,chargeTimeReductionPctPerPoint:0}}});
const castUltimate=session=>session.useSkill({actorId:"voltige",targetId:"voltige",skill:ultimate});
const castDodge=session=>session.useSkill({actorId:"voltige",targetId:"voltige",skill:dodge});
const active=session=>session.snapshot().fighters.voltige.statusEffects;
function longSkill(){return normalizeSkillDefinition({id:"long-mobile",name:"long-mobile",category:"offensive",form:"contact",element:null,
 approachMode:"ground",energyCost:0,preparationMs:100,travelMs:10000,recoveryMs:0,cooldownMs:0,
 allowedDistances:["short","medium","long"],targetRelations:["enemy"],
 effect:{damage:20,heal:0,stunMs:0,interruptsPreparation:false,tags:[]}})}
test("RED: authentic Surcharge and authentic Esquive foudroyante coexist despite status-1 collision",()=>{
 const session=createCombatSession({fighters:[fighter("voltige"),fighter("enemy")]});
 assert.equal(castUltimate(session).outcome,"hit");
 assert.equal(active(session).length,5);
 assert.equal(castDodge(session).outcome,"hit");
 assert.equal(active(session).length,6,"5 ultimate effects + 1 extra skill, no arbitrary four-buff cap");
 assert.equal(active(session).filter(s=>s.definition.id==="status-1").length,2);
 assert.equal(active(session).some(s=>s.definition.kind==="auto_dodge"),true);
 assert.equal(active(session).some(s=>s.definition.kind==="approach_time_modifier"),true);
 const incoming=normalizeSkillDefinition({...arc,effects:[arc.effects[0]]});
 const impact=session.useSkill({actorId:"enemy",targetId:"voltige",skill:incoming});
 assert.equal(impact.outcome,"evaded");
 assert.equal(session.snapshot().fighters.voltige.hp,250);
 castDodge(session);
 assert.equal(active(session).length,6,"same skill+status ID still refreshes rather than duplicates");
});
test("RED: authentic Arc stun coexists with Surcharge energy buff status-2 and stops a real active movement",()=>{
 let now=0,tick=()=>{},interrupted=[];
 const session=createCombatSession({fighters:[fighter("voltige"),fighter("enemy")]});
 const runtime=createCombatRuntime({session,now:()=>now,setTimer:fn=>(tick=fn,1),clearTimer:()=>{},
  onInterrupted:r=>interrupted.push(r)});
 runtime.start();
 assert.equal(castUltimate(session).outcome,"hit");
 assert.equal(runtime.startSkill({actorId:"voltige",targetId:"enemy",skill:longSkill()}).ok,true);
 assert.equal(runtime.startSkill({actorId:"enemy",targetId:"voltige",skill:arc}).ok,true);
 now=1600;tick();
 assert.equal(active(session).some(s=>s.definition.kind==="energy_regen_modifier"),true);
 assert.equal(active(session).some(s=>s.definition.kind==="stun"),true,"Arc stun must not refresh Surcharge energy regen");
 assert.equal(active(session).filter(s=>s.definition.id==="status-2").length,2);
 assert.equal(runtime.hasActiveActionFor("voltige"),false,"stun terminates moving action");
 assert.equal(interrupted.filter(x=>x.action?.actorId==="voltige"&&x.reason==="stun").length,1);
 runtime.dispose();
});
test("RED: independent status timers and per-skill refresh, same author IDs do not affect each other's expiry",()=>{
 const session=createCombatSession({fighters:[fighter("voltige"),fighter("enemy")]});
 castUltimate(session);
 session.advanceMs(5000);
 castDodge(session);
 let entries=active(session).filter(s=>s.definition.id==="status-1");
 assert.equal(entries.length,2);
 assert.equal(entries.find(x=>x.sourceSkillId==="dodge").expiresAtMs,15000);
 assert.equal(entries.find(x=>x.sourceSkillId==="cap_electric_special_2").expiresAtMs,60000);
 castDodge(session);
 assert.equal(active(session).filter(s=>s.definition.id==="status-1").length,2);
 session.advanceMs(10000);
 entries=active(session);
 assert.equal(entries.some(x=>x.definition.kind==="auto_dodge"),false);
 assert.equal(entries.some(x=>x.definition.kind==="approach_time_modifier"),true);
});
test("RED: status HUD keeps separate icons for different source skills sharing a status ID",()=>{
 const session=createCombatSession({fighters:[fighter("voltige"),fighter("enemy")]});
 castUltimate(session);castDodge(session);
 const document={createElement(){const node={className:"",dataset:{},style:{},hidden:false,textContent:"",children:[],append(...v){this.children.push(...v)},remove(){this.removed=true},setAttribute(){}};node.ownerDocument=document;return node}};
 const host=document.createElement("div");
 const renderer=createDomStatusFxRenderer({targetFor:()=>({statusHost:host}),statusPresentationFor:()=>null,skillPresentationFor:()=>null,skillDefinitionFor:()=>null});
 renderer.sync(session.snapshot());
 assert.equal(host.children.filter(x=>!x.removed).length,6,"all independent buffs must be visible, not collapsed by same ID");
 renderer.dispose();
});
