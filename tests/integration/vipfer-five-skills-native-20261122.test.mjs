import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeCaptureSkillTransferV1} from "../../src/contracts/capture-skill-transfer-v1.js";
import {normalizeCaptureCreatureTransferV1} from "../../src/contracts/capture-creature-transfer-v1.js";
import {normalizeBattleFormatDefinition} from "../../src/contracts/battle-format-definition.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createCombatRuntime} from "../../src/core/combat/combat-runtime.js";

const slugs=["morsure-ressort","etreinte-acier","mue-tranchante","couronne-eclats","broyeur-serpentin"];
const files=slugs.map(x=>"data/capture/showcase/vipfer-"+x+".capture-skill-transfer-v1.json");
const skills=files.map(p=>normalizeCaptureSkillTransferV1(JSON.parse(readFileSync(p,"utf8"))).draft.definition);
const [bite,bind,armor,volley,ultimate]=skills;
const skill=(i)=>skills[i];
const fighter=(id)=>({id,maxHp:300,initialHp:300,maxEnergy:50,initialEnergy:50,
  energyChargeAmount:0,energyChargeIntervalMs:2000,statValuesById:{defense:25},statEffectRulesById:{defense:{damageReductionPctPerPoint:0.2}}});
const format=normalizeBattleFormatDefinition({id:"vipfer-native",localActorId:"a",
  teams:{p:["a"],e:["b"]},actors:["a","b"].map(id=>({actorId:id,teamId:id==="a"?"p":"e",
    creatureId:id,displayName:id,fighterConfigId:id,controllerId:"human-local"}))});
function harness(){
 const session=createCombatSession({fighters:[fighter("a"),fighter("b")],battleFormat:format,distance:"medium"});
 let t=0,next=null;const events=[];
 const runtime=createCombatRuntime({session,now:()=>t,
   setTimer(fn){next=fn;return 1;},clearTimer(){},
   groundContactResolution:"visible",onResolved:v=>events.push(v)});
 runtime.start();
 return {session,runtime,events,advance(time){t=time;next?.();},now:()=>t};
}

test("all five Vipfer transfers are canonical, in the native catalogue and active loadout",async()=>{
 const {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1}=await import("../../src/catalogs/capture-showcase-skill-presets-v1.js");
 const creature=JSON.parse(readFileSync("data/capture/showcase/Vipfer.capture-creature-transfer-v1.json","utf8"));
 const ids=slugs.map(x=>"vipfer-"+x);
 assert.deepEqual(creature.draft.skillIds,ids);
 assert.deepEqual(creature.loadout.slots.map(x=>x.skillId),ids);
 for(const file of files)assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p=>p===file).length,1);
 assert.deepEqual(skills.map(x=>x.energyCost),[2,4,5,5,9]);
 assert.deepEqual(skills.map(x=>x.cooldownMs),[7000,26000,32000,28000,0]);
 assert.deepEqual(skills.map(x=>x.effects.find(e=>e.kind==="damage")?.amount??0),[12,13,0,12,60]);
 assert.equal(bite.form,"contact");
 assert.equal(bind.effects.find(e=>e.kind==="apply_status").status.durationMs,10000);
 assert.equal(armor.effects[0].status.deltaPoints,200);
 assert.equal(armor.effects[1].status.contactDamage,25);
 assert.equal(armor.effects[1].status.consumeOnContact,true);
 assert.deepEqual(volley.salvo,{shots:3,shotDurationMs:550,gapMs:150});
 assert.equal(volley.effects[1].status.durationMs,6000);
 assert.equal(volley.effects[1].status.modifierPct,15);
 assert.equal(ultimate.effect.damage,0);
 assert.equal(ultimate.effects[0].amount,60);
 assert.equal(ultimate.contactHold.tickIntervalMs,500);
 assert.equal(ultimate.contactHold.maxDurationMs,0);
 assert.equal(ultimate.contactHold.effects[0].amount,10);
 assert.equal(ultimate.contactHold.stopOnDamageFromTarget,true);
 assert.equal(ultimate.maxUsesPerCombat,1);
 assert.equal(ultimate.activationRequirements.conditions[0].threshold,30000);
});

test("Mue tranchante retaliation triggers once on melee and not on the second hit",()=>{
 const session=createCombatSession({fighters:[fighter("a"),fighter("b")]});
 assert.equal(session.useSkill({actorId:"a",targetId:"a",skill:armor}).ok,true);
 const jab=normalizeSkillDefinition({id:"jab",name:"jab",category:"offensive",form:"contact",
  approachMode:"none",energyCost:0,preparationMs:0,travelMs:0,recoveryMs:0,cooldownMs:0,
  effect:{damage:1,heal:0,tags:[]},allowedDistances:["short","medium","long"]});
 const first=session.useSkill({actorId:"b",targetId:"a",skill:jab});
 assert.equal(first.ok,true);
 assert.equal(session.snapshot().fighters.b.hp,275);
 const second=session.useSkill({actorId:"b",targetId:"a",skill:jab});
 assert.equal(second.ok,true);
 assert.equal(session.snapshot().fighters.b.hp,275);
 const riposte=session.snapshot().fighters.a.statusEffects.filter(x=>x.definition.id==="vipfer-mue-tranchante:riposte");
 assert.equal(riposte.length,0);
});

test("Couronne d'éclats makes three independent authoritative hits and pays energy once",()=>{
 const h=harness();try{
  assert.equal(h.runtime.startSkill({actorId:"a",targetId:"b",skill:volley}).ok,true);
  assert.equal(h.session.snapshot().fighters.a.energy,45);
  h.advance(850);
  assert.equal(h.runtime.reportExpandingWaveTargetContact({actorId:"a",targetId:"b",skillId:volley.id,passIndex:0}).ok,true);
  assert.equal(h.session.snapshot().fighters.b.hp,288);
  assert.equal(h.runtime.reportExpandingWaveTargetContact({actorId:"a",targetId:"b",skillId:volley.id,passIndex:0}).outcome,"already_contacted");
  h.advance(1550);
  assert.equal(h.runtime.reportExpandingWaveTargetContact({actorId:"a",targetId:"b",skillId:volley.id,passIndex:1}).ok,true);
  h.advance(2250);
  assert.equal(h.runtime.reportExpandingWaveTargetContact({actorId:"a",targetId:"b",skillId:volley.id,passIndex:2}).ok,true);
  assert.equal(h.session.snapshot().fighters.b.hp,264);
  assert.equal(h.session.snapshot().fighters.a.energy,45);
  assert.equal(h.events.filter(x=>x.salvoShotIndex!==undefined).length,3);
  const slow=h.session.snapshot().fighters.b.statusEffects.filter(x=>x.definition.id==="vipfer-couronne-eclats:ralentissement");
  assert.equal(slow.length,1);
 }finally{h.runtime.dispose();}
});

test("Broyeur serpentin starts after 30 seconds, pulses 10 every 500ms and stops on target HP damage",()=>{
 const h=harness();
 try{
  const early=h.runtime.startSkill({actorId:"a",targetId:"b",skill:ultimate});
  assert.equal(early.ok,false);
  h.session.advanceMs(30000);
  assert.equal(h.runtime.startSkill({actorId:"a",targetId:"b",skill:ultimate}).ok,true);
  h.advance(1600);
  const contact=h.runtime.reportActionContact({actorId:"a",targetId:"b",skillId:ultimate.id});
  assert.equal(contact.ok,true);
  assert.equal(contact.outcome,"contact_held");
  assert.equal(h.session.snapshot().fighters.b.hp,240);
  h.advance(2100);
  assert.equal(h.session.snapshot().fighters.b.hp,230);
  h.advance(2600);
  assert.equal(h.session.snapshot().fighters.b.hp,220);
  const jab=normalizeSkillDefinition({id:"jab-reply",name:"jab-reply",category:"offensive",form:"contact",
    approachMode:"none",energyCost:0,preparationMs:0,travelMs:0,recoveryMs:0,cooldownMs:0,
    effect:{damage:5,heal:0,tags:[]},allowedDistances:["short","medium","long"]});
  assert.equal(h.session.useSkill({actorId:"b",targetId:"a",skill:jab}).ok,true);
  h.advance(2601);
  assert.equal(h.runtime.hasContactHoldFor("a"),false);
  h.advance(3600);
  assert.equal(h.session.snapshot().fighters.b.hp,220);
 }finally{h.runtime.dispose();}
});
