import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {normalizeCaptureSkillTransferV1} from "../../src/contracts/capture-skill-transfer-v1.js";
import {normalizeCaptureCreatureTransferV1} from "../../src/contracts/capture-creature-transfer-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {computeCombatDamageV1} from "../../src/core/combat/combat-damage-v1.js";
const ids=["ephemus-poussiere-oubli","ephemus-battement-limbes","ephemus-chrysalide-fantome","ephemus-lanterne-ames","ephemus-danse-mille-ames"];
const root=p=>new URL("../../"+p,import.meta.url);
const load=async p=>JSON.parse(await readFile(root(p),"utf8"));
const skills=await Promise.all(ids.map(async id=>(normalizeCaptureSkillTransferV1(await load("data/capture/showcase/"+id+".capture-skill-transfer-v1.json"))).draft.definition));
const session=(distance="short")=>createCombatSession({
 distance,
 battleFormat:{actors:[{actorId:"ephemus"},{actorId:"enemy"}],teamOf:id=>id==="ephemus"?"player":"enemy"},
 fighters:[{id:"ephemus",maxHp:200,initialHp:200,maxEnergy:30,initialEnergy:30,energyChargeAmount:0,movementEnergyPerStep:0},
           {id:"enemy",maxHp:200,initialHp:200,maxEnergy:30,initialEnergy:30,energyChargeAmount:0,movementEnergyPerStep:0}]
});
test("Éphémus: official character, stats and 5 slots are compatible with the native Capture import",async()=>{
 const registry=normalizeCaptureStatRegistryV1(await load("data/capture/monster-capture-stat-registry.v1.json"));
 const original=await load("data/capture/showcase/Ephemus.capture-creature-transfer-v1.json");
 const creature=normalizeCaptureCreatureTransferV1(original,registry);
 assert.deepEqual(creature.draft.skillIds,ids);
 assert.deepEqual(creature.loadout.slots.map(x=>x.skillId),ids);
 assert.equal(creature.draft.presentation.version,10);
 assert.equal(creature.draft.combat.maxHp,120);
 assert.deepEqual(skills.map(x=>x.id),ids);
 assert.deepEqual(skills.map(x=>x.loadoutSlot),["standard","standard","standard","standard","ultimate"]);
 assert.equal(skills[2].energyCost,5);
 assert.equal(skills[2].cooldownMs,30000);
 assert.equal(skills[3].energyCost,6);
 assert.equal(skills[3].cooldownMs,30000);
 for(const id of ids){
  const file="data/capture/showcase/"+id+".capture-skill-transfer-v1.json";
  assert.equal((await load(file)).draft.definition.id,id);
 }
});
test("Voile is one unique four-second marker with 20% outgoing debuff, and only it triggers conditional silence",()=>{
 const a=session(),[powder,wing]=skills;
 assert.equal(a.useSkill({actorId:"ephemus",targetId:"enemy",skill:wing}).ok,true);
 assert.equal(a.snapshot().fighters.enemy.statusEffects.some(x=>x.definition.id==="ephemus-limbes-silence"),false);
 const b=session();
 assert.equal(b.useSkill({actorId:"ephemus",targetId:"enemy",skill:powder}).ok,true);
 const state=b.snapshot();
 const veil=state.fighters.enemy.statusEffects.find(x=>x.definition.id==="marker:ephemus-voile");
 const weakened=state.fighters.enemy.statusEffects.find(x=>x.definition.id==="ephemus-voile-affaiblissement");
 assert.equal(veil?.expiresAtMs,4000);
 assert.equal(weakened?.definition.modifierPct,-20);
 assert.equal(b.useSkill({actorId:"ephemus",targetId:"enemy",skill:wing}).ok,true);
 assert.equal(b.snapshot().fighters.enemy.statusEffects.some(x=>x.definition.id==="ephemus-limbes-silence"),true);
});
test("Chrysalide gives exactly 10 seconds of native intangibility then 12 enemy-only Spirit damage once",()=>{
 const a=session();
 assert.equal(a.useSkill({actorId:"ephemus",targetId:"ephemus",skill:skills[2]}).ok,true);
 assert.ok(a.snapshot().fighters.ephemus.statusEffects.some(x=>x.definition.intangible===true));
 assert.equal(a.snapshot().scheduledEffects[0].dueAtMs,10000);
 a.advanceMs(9999);
 assert.equal(a.snapshot().fighters.enemy.hp,200);
 a.advanceMs(1);
 assert.equal(a.snapshot().fighters.enemy.hp,188);
 assert.equal(a.snapshot().fighters.ephemus.hp,200);
 assert.equal(a.snapshot().scheduledEffects.length,0);
 assert.equal(a.snapshot().fighters.ephemus.statusEffects.some(x=>x.definition.intangible===true),false);
 a.advanceMs(1000);assert.equal(a.snapshot().fighters.enemy.hp,188);
});
test("Lanterne has two colocated native zones, 10 half-second ticks, and +20% spirit only while in zone",()=>{
 const a=session();
 assert.equal(a.useSkill({actorId:"ephemus",targetId:"enemy",skill:skills[3]}).ok,true);
 assert.equal(a.snapshot().persistentZones.length,2);
 assert.deepEqual(a.snapshot().persistentZones.map(x=>x.tickIntervalMs),[500,500]);
 a.advanceMs(500);
 const state=a.snapshot();
 const effect=state.fighters.enemy.statusEffects.find(x=>x.definition.kind==="incoming_damage_channel_modifier");
 assert.ok(effect);
 assert.equal(effect.definition.channel,"spirit");
 assert.equal(effect.definition.modifierPct,20);
 const spirit=computeCombatDamageV1({state,attackerId:"ephemus",targetId:"enemy",baseDamage:10,channel:"spirit"});
 const water=computeCombatDamageV1({state,attackerId:"ephemus",targetId:"enemy",baseDamage:10,channel:"water"});
 assert.equal(spirit.incomingDamagePct,20);assert.equal(spirit.damage,12);
 assert.equal(water.incomingDamagePct,0);assert.equal(water.damage,10);
 // The zone clock starts at the real authored impact timestamp, not the
 // click timestamp; honor the exact native expiresAtMs rather than assuming 0.
 const expiry=Math.max(...a.snapshot().persistentZones.map(z=>z.expiresAtMs));
 const remaining=Math.max(0,expiry-a.snapshot().elapsedMs);
 a.advanceMs(remaining);
 assert.equal(a.snapshot().persistentZones.length,0);
 const hpAfter=a.snapshot().fighters.enemy.hp;
 // 5 s / 0.5 s = precisely ten pulses, each 4 Spirit with the 20% zone-only weakness.
 assert.equal(200-hpAfter,48,"Lanterne must deal exactly ten native ticks, not 9 or 11");
 a.advanceMs(1000);
 assert.equal(a.snapshot().fighters.enemy.hp,hpAfter);
 assert.equal(a.snapshot().fighters.enemy.statusEffects.some(x=>x.definition.kind==="incoming_damage_channel_modifier"),false);
});
test("Ultimate native six pulses deliver 60 Spirit + 40 on final tick only with active Voile",()=>{
 for(const withVeil of [false,true]){
  const a=session(),powder=skills[0],ultimate=skills[4];
  if(withVeil) assert.equal(a.useSkill({actorId:"ephemus",targetId:"enemy",skill:powder}).ok,true);
  const before=a.snapshot().fighters.enemy.hp;
  for(let i=1;i<=6;i++){
   const result=a.applyChannelingTickV1({actorId:"ephemus",targetId:"enemy",skill:ultimate,atMs:i*500,tickIndex:i});
   assert.equal(result.ok,true);
  }
  assert.equal(before-a.snapshot().fighters.enemy.hp,withVeil?100:60);
 }
 assert.equal(skills[4].channeling.maxDurationMs,3000);
 assert.equal(skills[4].channeling.tickIntervalMs,500);
 assert.equal(skills[4].channeling.maxTicks,6);
});
