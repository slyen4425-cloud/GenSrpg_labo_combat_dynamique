import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { normalizeSkillEffectV1 } from "../../src/contracts/skill-effect-v1.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { computeCombatDamageV1 } from "../../src/core/combat/combat-damage-v1.js";
import { buildHumanTacticalSkillEffectsV1 } from "../../src/ui/capture-editor-human-v2.js";

const teams={a:"players",ally:"players",b:"enemies",enemy2:"enemies"};
const format={actors:Object.keys(teams).map(actorId=>({actorId})),teamOf(id){return teams[id]??null;}};
const f=(id)=>({id,maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10,
  statEffectRulesById:{defense:{damageReductionPctPerPoint:1}}});
function status(kind="stat_modifier",id="cloud"){const raw={id,kind,polarity:kind==="damage_over_time"?"detrimental":"beneficial",
 durationMs:2000,stacking:"refresh",tags:kind==="damage_over_time"?["poison"]:[]};
 if(kind==="stat_modifier")return {...raw,statId:"defense",deltaPoints:25};
 if(kind==="damage_over_time")return {...raw,amount:5,tickIntervalMs:1000,channel:"poison"};
 if(kind==="damage_reflection")return {...raw,percent:40};
 return raw;
}
function skill(effect,scope="self"){return normalizeSkillDefinition({
 id:"zone-skill-"+effect.status?.kind,name:"Zone test",category:"buff_debuff",form:"aura",
 element:"water",approachMode:"none",energyCost:0,preparationMs:0,travelMs:0,recoveryMs:0,cooldownMs:0,
 allowedDistances:["short","medium","long"],targetRelations:["self","ally","enemy"],
 effect:{damage:0,heal:0,tags:[]},effects:[{
  kind:"persistent_zone",zoneId:"cloud",targetScope:scope,radius:"short",durationMs:5000,
  tickIntervalMs:1000,reactivation:"refresh",maxActivations:1,radiusGrowthSteps:0,
  tickEffect:effect,statusBehavior:effect.kind==="apply_status"?(effect.status.kind==="damage_over_time"?"on_enter":"while_inside"):undefined
 }].map(e=>e.statusBehavior===undefined?(({statusBehavior,...rest})=>rest)(e):e)
});}
const effect=(st)=>({kind:"apply_status",targetScope:"all_allies",status:st});

test("skill contract preserves legacy damage zones but allows native statuses with explicit occupancy behavior",()=>{
  assert.equal(normalizeSkillEffectV1({
    kind:"persistent_zone",targetScope:"self",zoneId:"z",radius:"short",
    durationMs:1000,tickIntervalMs:500,tickEffect:effect(status()),
    statusBehavior:"while_inside"
  }).tickEffect.kind,"apply_status");
  assert.throws(()=>normalizeSkillEffectV1({
    kind:"persistent_zone",targetScope:"self",zoneId:"z",radius:"short",
    durationMs:1000,tickIntervalMs:500,tickEffect:effect(status()),statusBehavior:"not_real"
  }),/statusBehavior/);
  assert.throws(()=>normalizeSkillEffectV1({
    kind:"persistent_zone",targetScope:"self",zoneId:"z",radius:"short",
    durationMs:1000,tickIntervalMs:500,tickEffect:{kind:"heal",targetScope:"self",amount:2}
  }),/tickEffect/);
});

test("defensive zone gives its native defense stat to occupants, not to absent opponents, and expires cleanly",()=>{
 const session=createCombatSession({distance:"short",battleFormat:format,fighters:[f("a"),f("ally"),f("b"),f("enemy2")]});
 const aura=skill(effect(status()),"all_allies");
 assert.equal(session.useSkill({actorId:"a",targetId:"a",skill:aura}).ok,true);
 session.advanceMs(1);
 assert.equal(session.snapshot().fighters.a.statusEffects.length,1);
 assert.equal(session.snapshot().fighters.ally.statusEffects.length,1);
 assert.equal(session.snapshot().fighters.b.statusEffects.length,0);
 assert.equal(computeCombatDamageV1({state:session.snapshot(),attackerId:"b",targetId:"a",baseDamage:20}).damage,15);
 session.advanceMs(5000);
 assert.equal(session.snapshot().persistentZones.length,0);
 assert.equal(session.snapshot().fighters.a.statusEffects.length,0);
 assert.equal(session.snapshot().fighters.ally.statusEffects.length,0);
 assert.equal(computeCombatDamageV1({state:session.snapshot(),attackerId:"b",targetId:"a",baseDamage:20}).damage,20);
});

test("a zone does not remove an independently authored same-ID buff when the zone leaves",()=>{
 const session=createCombatSession({distance:"short",battleFormat:format,fighters:[f("a"),f("ally"),f("b"),f("enemy2")]});
 const independent=normalizeSkillDefinition({
 id:"own-buff",name:"Own buff",category:"buff_debuff",form:"self",element:null,
 approachMode:"none",energyCost:0,preparationMs:0,travelMs:0,recoveryMs:0,cooldownMs:0,
 allowedDistances:["short","medium","long"],targetRelations:["self"],
 effect:{damage:0,heal:0,tags:[]},effects:[{kind:"apply_status",targetScope:"self",status:{...status(),durationMs:30000}}]
 });
 assert.equal(session.useSkill({actorId:"a",targetId:"a",skill:independent}).ok,true);
 assert.equal(session.useSkill({actorId:"a",targetId:"a",skill:skill(effect(status()))}).ok,true);
 session.advanceMs(1);
 assert.equal(session.snapshot().fighters.a.statusEffects.length,2);
 session.advanceMs(5000);
 const remaining=session.snapshot().fighters.a.statusEffects;
 assert.equal(remaining.length,1);
 assert.equal(remaining[0].definition.id,"cloud");
});

test("poison is applied only once on entry, ticks natively and may outlive the zone contact",()=>{
 const session=createCombatSession({distance:"short",battleFormat:format,fighters:[f("a"),f("ally"),f("b"),f("enemy2")]});
 const poison=skill(effect(status("damage_over_time","toxin")),"all_enemies");
 assert.equal(session.useSkill({actorId:"a",targetId:"b",skill:poison}).ok,true);
 session.advanceMs(1);
 assert.equal(session.snapshot().fighters.b.statusEffects.length,1);
 session.advanceMs(1000);
 assert.equal(session.snapshot().fighters.b.hp,95);
 assert.equal(session.snapshot().fighters.b.statusEffects.length,1);
 session.advanceMs(1000);
 assert.equal(session.snapshot().fighters.b.hp,90);
 assert.equal(session.snapshot().fighters.b.statusEffects.length,0,"on-enter status expires naturally; no reapply while standing");
});

test("zone-owned status clears immediately when caster recalled/replaced, including allied active slot",()=>{
 const session=createCombatSession({distance:"short",battleFormat:format,fighters:[f("a"),f("ally"),f("b"),f("enemy2")]});
 assert.equal(session.useSkill({actorId:"a",targetId:"a",skill:skill(effect(status()),"all_allies")}).ok,true);
 session.advanceMs(1);
 assert.equal(session.snapshot().fighters.ally.statusEffects.length,1);
 session.replaceFighter("a",f("a"),{clearSourceZones:true});
 assert.equal(session.snapshot().persistentZones.length,0);
 assert.equal(session.snapshot().fighters.ally.statusEffects.length,0);
});

test("Human Editor exports status-bearing zones without breaking the damage zone format",async()=>{
 const zoneInput={
  kind:"persistent_zone",targetScope:"all_allies",zoneId:"mist",
  radius:"medium",durationSeconds:12,tickSeconds:1,reactivation:"refresh",
  maxActivations:1,radiusGrowthSteps:0,statusBehavior:"while_inside",
  tickEffect:effect(status())
 };
 const [out]=buildHumanTacticalSkillEffectsV1([zoneInput],{defaultDamageChannel:"water"});
 assert.equal(out.tickEffect.kind,"apply_status");
 assert.equal(out.tickEffect.status.deltaPoints,25);
 assert.equal(out.statusBehavior,"while_inside");
 const [old]=buildHumanTacticalSkillEffectsV1([{...zoneInput,
  statusBehavior:undefined,tickEffect:undefined,tickDamage:4,channel:"fire"}]);
 assert.equal(old.tickEffect.kind,"damage");
 assert.equal(Object.hasOwn(old,"statusBehavior"),false);
 const ui=await readFile(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
 assert.match(ui,/skillZoneEffectKind/);
 assert.match(ui,/skillZoneStatusBehavior/);
});

const bounds=(left,top,width=20,height=20)=>({left,top,width,height});
function spatial(zone,candidates){
  return {visibleZones:{
    zones:[{zoneId:zone.id,sourceActorId:zone.sourceActorId,radius:zone.radius,bounds:bounds(0,0,100,100)}],
    actors:Object.entries(candidates).map(([actorId,xy])=>({actorId,bounds:bounds(...xy)}))
  }};
}

test("real visible ellipse drives distinct 2v2 buffs, removes an ally on exit and adds entering ally",()=>{
 const session=createCombatSession({distance:"short",battleFormat:format,fighters:[f("a"),f("ally"),f("b"),f("enemy2")]});
 session.useSkill({actorId:"a",targetId:"a",skill:skill(effect(status()),"all_allies")});
 const zone=session.snapshot().persistentZones[0];
 session.advanceMs(1,{zoneSpatialContext:spatial(zone,{a:[20,20],ally:[20,20],b:[200,200],enemy2:[200,200]})});
 assert.equal(session.snapshot().fighters.ally.statusEffects.length,1);
 session.advanceMs(100,{zoneSpatialContext:spatial(zone,{a:[20,20],ally:[200,200],b:[200,200],enemy2:[200,200]})});
 assert.equal(session.snapshot().fighters.ally.statusEffects.length,0,"buff must disappear as soon as ally leaves ellipse");
 session.advanceMs(100,{zoneSpatialContext:spatial(zone,{a:[20,20],ally:[20,20],b:[200,200],enemy2:[200,200]})});
 assert.equal(session.snapshot().fighters.ally.statusEffects.length,1,"returning occupant reacquires native buff");
});

test("while-inside poison is removed before the native DoT tick when its victim exits",()=>{
 const session=createCombatSession({distance:"short",battleFormat:format,fighters:[f("a"),f("ally"),f("b"),f("enemy2")]});
 const original=skill(effect(status("damage_over_time","venom")),"all_enemies");
 const aura=normalizeSkillDefinition({...original,effects:[{
   ...original.effects[0],statusBehavior:"while_inside"
 }]});
 session.useSkill({actorId:"a",targetId:"b",skill:aura});
 const zone=session.snapshot().persistentZones[0];
 session.advanceMs(1,{zoneSpatialContext:spatial(zone,{a:[20,20],b:[20,20],enemy2:[200,200]})});
 assert.equal(session.snapshot().fighters.b.statusEffects.length,1);
 session.advanceMs(1200,{zoneSpatialContext:spatial(zone,{a:[20,20],b:[200,200],enemy2:[200,200]})});
 assert.equal(session.snapshot().fighters.b.hp,100,"no obsolete DoT tick after leaving");
 assert.equal(session.snapshot().fighters.b.statusEffects.length,0);
});

test("a saved recalled member cannot revive a detached zone buff from its reserve snapshot",()=>{
 const session=createCombatSession({distance:"short",battleFormat:format,fighters:[f("a"),f("ally"),f("b"),f("enemy2")]});
 session.useSkill({actorId:"a",targetId:"a",skill:skill(effect(status()))});
 session.advanceMs(1);
 const oldSnapshot=session.snapshot().fighters.a;
 assert.equal(oldSnapshot.statusEffects.length,1);
 session.replaceFighter("a",f("a"),{clearSourceZones:true});
 assert.equal(session.snapshot().persistentZones.length,0);
 session.replaceFighter("a",{...f("a"),statusEffects:oldSnapshot.statusEffects},{clearSourceZones:true});
 assert.equal(session.snapshot().fighters.a.statusEffects.length,0);
});
