import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeSkillEffectV1} from "../../src/contracts/skill-effect-v1.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {buildHumanTacticalSkillEffectsV1} from "../../src/ui/capture-editor-human-v2.js";

const marker={id:"poison",name:"Poison",polarity:"detrimental",durationMs:30000,maxStacks:10};
const zoneEffect={kind:"persistent_zone",targetScope:"all_enemies",zoneId:"poison-cloud",radius:"short",
 durationMs:20000,tickIntervalMs:1000,reactivation:"refresh",maxActivations:1,radiusGrowthSteps:0,
 tickEffect:{kind:"apply_marker",targetScope:"all_enemies",marker,charges:2}};
const bounds=(left,top,width=20,height=20)=>({left,top,width,height});
const f=id=>({id,maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10});
const teams={a:"players",ally:"players",b:"enemies",enemy2:"enemies"};
const format={actors:Object.keys(teams).map(actorId=>({actorId})),teamOf(id){return teams[id]??null;}};
const spatial=(zone,pos)=>({visibleZones:{
 zones:[{zoneId:zone.id,sourceActorId:zone.sourceActorId,radius:zone.radius,bounds:bounds(0,0,100,100)}],
 actors:Object.entries(pos).map(([actorId,xy])=>({actorId,bounds:bounds(...xy)}))}});
const cast=()=>{
 const session=createCombatSession({distance:"long",battleFormat:format,
 fighters:Object.keys(teams).map(f)});
 const skill=normalizeSkillDefinition({id:"poison-cloud",name:"Nuage toxique",category:"buff_debuff",
  form:"aura",element:"poison",approachMode:"none",energyCost:0,preparationMs:2000,travelMs:0,
  recoveryMs:0,cooldownMs:45000,allowedDistances:["short","medium","long"],
  targetRelations:["self","enemy"],effect:{damage:0,heal:0,tags:[]},effects:[zoneEffect]});
 const initial=session.useSkill({actorId:"a",targetId:"a",skill});
 assert.equal(initial.ok,true,JSON.stringify(initial));
 session.advanceMs(2000);
 const zone=session.snapshot().persistentZones[0];
 assert.ok(zone,"active zone after 2000ms preparation");
 assert.equal(zone.durationMs,20000);
 assert.equal(zone.radius,"short");
 assert.equal(zone.radiusGrowthSteps,0);
 return {session,zone};
};
const stacks=(session,id)=>session.snapshot().fighters[id].statusEffects
 .find(x=>x.definition.id==="marker:poison")?.stacks??0;
test("Native zone contract accepts marker effects and rejects unsupported nested kinds",()=>{
 const normalized=normalizeSkillEffectV1(zoneEffect);
 assert.equal(normalized.tickEffect.kind,"apply_marker");
 assert.equal(normalized.tickEffect.charges,2);
 assert.equal(normalized.tickEffect.marker.id,"poison");
 assert.throws(()=>normalizeSkillEffectV1({...zoneEffect,
  tickEffect:{kind:"consume_marker",targetScope:"all_enemies",markerId:"poison",count:1,minimum:1,effects:[]}}),/tickEffect/);
});
test("Editor normalizes native two-marker zone with fixed radius, 20s duration, 2s cast and 45s cooldown retained",()=>{
 const [effect]=buildHumanTacticalSkillEffectsV1([{...zoneEffect,durationMs:undefined,
  durationSeconds:20,tickSeconds:1}]);
 assert.equal(effect.durationMs,20000);
 assert.equal(effect.radiusGrowthSteps,0);
 assert.deepEqual(effect.tickEffect,normalizeSkillEffectV1(zoneEffect.tickEffect));
 const editor=readFileSync(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
 assert.match(editor,/captureMarkerZoneSelectV1/);
 const sharedPicker=readFileSync(new URL("../../src/ui/capture-marker-effect-fields-v1.js",import.meta.url),"utf8");
 assert.match(sharedPicker,/skillZoneMarkerPick/);
 assert.match(editor,/skillZoneMarkerCharges/);
 assert.match(editor,/Ajouter des marqueurs à l’entrée/);
});
test("Zone entry applies exactly two native Poison markers to each enemy; not to ally; does not tick",()=>{
 const {session,zone}=cast();
 const inZone={a:[20,20],ally:[20,20],b:[20,20],enemy2:[220,220]};
 session.advanceMs(1,{zoneSpatialContext:spatial(zone,inZone)});
 assert.equal(stacks(session,"b"),2);
 assert.equal(stacks(session,"enemy2"),0);
 assert.equal(stacks(session,"ally"),0);
 session.advanceMs(3000,{zoneSpatialContext:spatial(zone,inZone)});
 assert.equal(stacks(session,"b"),2,"remaining inside must never add marker charges per tick");
 session.advanceMs(100,{zoneSpatialContext:spatial(zone,{...inZone,b:[220,220],enemy2:[20,20]})});
 assert.equal(stacks(session,"b"),2,"Poison persists outside zone");
 assert.equal(stacks(session,"enemy2"),2,"second enemy entering receives its own two charges");
 session.advanceMs(100,{zoneSpatialContext:spatial(zone,{...inZone,enemy2:[20,20]})});
 assert.equal(stacks(session,"b"),4,"reentering adds exactly two more charges");
 session.advanceMs(17100);
 assert.equal(session.snapshot().persistentZones.length,0,"zone expires after 20s");
 assert.equal(stacks(session,"b"),4,"markers retain own duration after zone expires");
});
