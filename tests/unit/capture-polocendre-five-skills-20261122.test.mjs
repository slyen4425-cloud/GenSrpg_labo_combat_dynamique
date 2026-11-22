import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeCaptureSkillTransferV1} from "../../src/contracts/capture-skill-transfer-v1.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {normalizeSkillEffectV1} from "../../src/contracts/skill-effect-v1.js";
import {evaluateSkillActivationRequirementsV1} from "../../src/core/combat/skill-activation-requirements-v1.js";
import {createCombatState} from "../../src/core/combat/combat-state.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {computeCombatDamageV1} from "../../src/core/combat/combat-damage-v1.js";
import {applyStatusEffectV1} from "../../src/core/combat/status-effect-runtime-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
const read=p=>JSON.parse(readFileSync(new URL("../../"+p,import.meta.url),"utf8"));
const ids=["polocendre-charge","polocendre-trainee-feu","polocendre-coup-sabot","cap_fire_atk_5","polocendre-ruee-explosive"];
const official=ids.map(id=>read("data/capture/showcase/"+id+".capture-skill-transfer-v1.json"));
const skills=official.map(t=>normalizeCaptureSkillTransferV1(t).draft.definition);
const creature=read("data/capture/showcase/polocendre.capture-creature-transfer-v1.json");
const {equal,deepEqual,ok}=assert;

test("Polocendre owns exactly five skills: four distinct new native transfers plus unmodified Vague incendiaire",()=>{
 deepEqual(creature.draft.skillIds,ids);
 deepEqual(creature.loadout.slots.map(s=>s.skillId),ids);
 for(const id of ids){
  const path="data/capture/showcase/"+id+".capture-skill-transfer-v1.json";
  equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p=>p===path).length,1,id);
 }
 for(const id of ids.filter(id=>id.startsWith("polocendre-")))
  equal(official.find(s=>s.draft.id===id)?.draft.usageScopes.includes("combat"),true);
 equal(official[3].draft.definition.name,"Vague incendiaire");
 equal(official[3].draft.requiredLevel,15);
 deepEqual(skills[0].activationRequirements.conditions,[]);
 equal(skills[4].loadoutSlot,"ultimate");
 deepEqual(skills[4].activationRequirements.conditions,[{type:"allies_defeated",threshold:1}]);
});
test("Charge: level 1, physical 10, Embrasement 5% each/5 cap/15 seconds and 8-second cooldown",()=>{
 const draft=official[0].draft, s=skills[0];
 equal(draft.requiredLevel,1); equal(s.form,"contact");equal(s.approachMode,"ground");
 equal(s.cooldownMs,8000);
 equal(s.effects[0].kind,"damage");equal(s.effects[0].amount,10);equal(s.effects[0].channel,"physical");
 const marker=s.effects[1],buff=s.effects[2];
 equal(marker.kind,"apply_marker");equal(marker.targetScope,"self");equal(marker.marker.id,"polocendre-embrasement");
 equal(marker.marker.durationMs,15000);equal(marker.marker.maxStacks,5);equal(marker.charges,1);
 equal(buff.kind,"apply_status");equal(buff.targetScope,"self");
 equal(buff.status.kind,"outgoing_damage_modifier");equal(buff.status.modifierPct,5);
 equal(buff.status.durationMs,15000);equal(buff.status.maxStacks,5);
 let state=createCombatState({fighters:[{id:"player",maxHp:100,maxEnergy:10,initialEnergy:10,initialHp:100},{id:"enemy",maxHp:100,maxEnergy:10,initialEnergy:10,initialHp:100}]});
 const result=()=>computeCombatDamageV1({state,attackerId:"player",targetId:"enemy",baseDamage:100,channel:"fire"});
 equal(result().damage,100);
 for(let i=1;i<=6;i++){
  state=applyStatusEffectV1({state,targetActorId:"player",sourceActorId:"player",sourceSkillId:s.id,status:buff.status});
  equal(result().damage,100+Math.min(i,5)*5);
 }
 equal(computeCombatDamageV1({state,attackerId:"player",targetId:"enemy",baseDamage:100,channel:"physical"}).damage,125);
 equal(computeCombatDamageV1({state,attackerId:"player",targetId:"enemy",baseDamage:100,channel:"fire",atMs:15000}).damage,100);
});
test("Traînée de feu: 7 fire damage plus exactly three distinct native entry-only 5 damage ground patches for 10s",()=>{
 const s=skills[1];equal(s.form,"contact");equal(s.approachMode,"ground");
 equal(s.effects[0].amount,7);equal(s.effects[0].channel,"fire");
 const zones=s.effects.filter(e=>e.kind==="persistent_zone");
 equal(zones.length,3);equal(new Set(zones.map(z=>z.zoneId)).size,3);
 for(const [i,z] of zones.entries()){
  equal(z.trailIndex,i+1);equal(z.trailCount,3);
  equal(z.durationMs,10000);equal(z.damageTrigger,"entry_only");
  equal(z.tickEffect.amount,5);equal(z.tickEffect.channel,"fire");
  equal(z.targetScope,"all_enemies");equal(z.radius,"short");
 }
 const aura=normalizeSkillDefinition({...s,form:"aura",approachMode:"none",preparationMs:0,travelMs:0,
  energyCost:0, cooldownMs:0,effects:zones});
 const teams={a:"player",b:"enemy"};
 const battleFormat={actors:[{actorId:"a"},{actorId:"b"}],teamOf(id){return teams[id]??null}};
 const combat=createCombatSession({distance:"medium",battleFormat,
  fighters:[{id:"a",maxHp:100,initialHp:100,maxEnergy:20,initialEnergy:20},
            {id:"b",maxHp:100,initialHp:100,maxEnergy:20,initialEnergy:20}]});
 equal(combat.useSkill({actorId:"a",targetId:"b",skill:aura}).ok,true);
 const active=combat.snapshot().persistentZones;
 equal(active.length,3);
 deepEqual(active.map(z=>z.trailIndex),[1,2,3]);
 const bounds=(left,top,width=24,height=24)=>({left,top,width,height});
 const spatial=(x)=>({visibleZones:{
  zones:active.map((zone,i)=>({zoneId:zone.id,sourceActorId:zone.sourceActorId,radius:zone.radius,bounds:bounds(i*100,0,40,40)})),
  actors:[{actorId:"a",bounds:bounds(400,0)},{actorId:"b",bounds:bounds(x,10)}]
 }});
 combat.advanceMs(1,{zoneSpatialContext:spatial(5)});
 equal(combat.snapshot().fighters.b.hp,95,"first of three areas hits exactly once");
 combat.advanceMs(2,{zoneSpatialContext:spatial(105)});
 equal(combat.snapshot().fighters.b.hp,90,"second area applies independent damage");
 combat.advanceMs(1000,{zoneSpatialContext:spatial(105)});
 equal(combat.snapshot().fighters.b.hp,90,"entry-only zone has no damage-over-time tick");
 combat.advanceMs(9000,{zoneSpatialContext:spatial(400)});
 equal(combat.snapshot().persistentZones.length,0);
});
test("Coup de sabot: physical 15 and three seconds stun, no movement or projectile",()=>{
 const s=skills[2];
 equal(s.form,"area");equal(s.approachMode,"none");equal(s.travelMs,0);
 equal(s.effects[0].kind,"damage");equal(s.effects[0].amount,15);equal(s.effects[0].channel,"physical");
 equal(s.effects[1].status.kind,"stun");equal(s.effects[1].status.durationMs,3000);
 equal(official[2].draft.presentation.visual.impact.assetId,"pack:capture:sprite-impact-physical-01");
 ok(!official[2].draft.presentation.visual.travel);
});
test("Ruée explosive: slow ground charge, one KO ally gate, 60 active / 40 to each enemy reserve",()=>{
 const s=skills[4];
 equal(s.form,"contact");equal(s.approachMode,"ground");equal(s.travelMs,3500);
 equal(s.maxUsesPerCombat,1);
 deepEqual(s.effects.map(e=>[e.kind,e.targetScope,e.amount,e.channel]),
  [["damage","target",60,"fire"],["damage","all_enemy_reserves",40,"fire"]]);
 equal(official[4].draft.presentation.visual.impact.assetId,"pack:capture:sprite-fluide-meteorite-impact-01");
 const format={actors:[{actorId:"p"},{actorId:"ally"},{actorId:"enemy"}],
  teamOf(id){return id==="p"||id==="ally"?"good":"evil"}};
 const state=hp=>createCombatState({fighters:[{id:"p",maxHp:100,maxEnergy:10,initialEnergy:10,initialHp:100},
  {id:"ally",maxHp:100,maxEnergy:10,initialEnergy:10,initialHp:hp},{id:"enemy",maxHp:100,maxEnergy:10,initialEnergy:10,initialHp:100}]});
 equal(evaluateSkillActivationRequirementsV1({state:state(1),actorId:"p",skill:s,battleFormat:format}).satisfied,false);
 equal(evaluateSkillActivationRequirementsV1({state:state(0),actorId:"p",skill:s,battleFormat:format}).satisfied,true);
});
test("trail metadata is rejected unless exactly indexed and bounded; normal zones remain compatible",()=>{
 const zone=skills[1].effects[1];
 assert.throws(()=>normalizeSkillEffectV1({...zone,trailIndex:4}),/trailIndex|trailCount/i);
 assert.throws(()=>normalizeSkillEffectV1({...zone,trailCount:0}),/trailIndex|trailCount/i);
 const plain={...zone};delete plain.trailIndex;delete plain.trailCount;
 ok(!Object.hasOwn(normalizeSkillEffectV1(plain),"trailIndex"));
 const visual=readFileSync(new URL("../../src/adapters/renderer/dom-skill-fx.js",import.meta.url),"utf8");
 assert.match(visual,/zone\.trailIndex \/ \(zone\.trailCount \+ 1\)/);
 assert.match(visual,/record\.zoneCenter/);
});
