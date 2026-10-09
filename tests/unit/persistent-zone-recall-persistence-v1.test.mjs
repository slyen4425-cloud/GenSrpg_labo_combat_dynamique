import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { normalizeSkillEffectV1 } from "../../src/contracts/skill-effect-v1.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createRosterSession } from "../../src/core/combat/roster-session.js";
import { createDomSkillFxRenderer } from "../../src/adapters/renderer/dom-skill-fx.js";
import { computeCombatDamageV1 } from "../../src/core/combat/combat-damage-v1.js";
import { buildHumanTacticalSkillEffectsV1 } from "../../src/ui/capture-editor-human-v2.js";

const f = id => ({
  id, maxHp:100, initialHp:100, maxEnergy:20, initialEnergy:20,
  statEffectRulesById:{defense:{damageReductionPctPerPoint:1}}
});
const status = (kind="stat_modifier") => kind === "stat_modifier"
  ? {id:"mist-defense",kind,polarity:"beneficial",durationMs:5000,stacking:"refresh",
     statId:"defense",deltaPoints:25}
  : {id:"toxic-entry",kind,polarity:"detrimental",durationMs:2000,
     stacking:"refresh",amount:5,tickIntervalMs:1000,channel:"poison"};
function zone({persistent=false,scope="all_allies",kind="stat_modifier",zoneId="mist",skillId="mist-skill"}={}) {
  return normalizeSkillDefinition({
    id:skillId,name:skillId,category:"buff_debuff",form:"aura",element:"water",
    approachMode:"none",energyCost:0,preparationMs:0,travelMs:0,recoveryMs:0,cooldownMs:0,
    allowedDistances:["short","medium","long"],targetRelations:["self","ally","enemy"],
    effect:{damage:0,heal:0,tags:[]},
    effects:[{kind:"persistent_zone",targetScope:scope,zoneId,radius:"long",
      durationMs:5000,tickIntervalMs:1000,reactivation:"refresh",
      maxActivations:1,radiusGrowthSteps:0,...(persistent?{persistAfterRecall:true}:{}),
      statusBehavior:kind==="stat_modifier"?"while_inside":"on_enter",
      tickEffect:{kind:"apply_status",targetScope:scope,status:status(kind)}}]
  });
}
function harness({duo=false}={}) {
  const actors=duo?["player","opponent","ally","enemy2"]:["player","opponent"];
  const teamOf=actorId=>["player","ally"].includes(actorId)?"player":"opponent";
  const battleFormat={actors:actors.map(actorId=>({actorId})),teamOf};
  const session=createCombatSession({
    distance:"long",battleFormat,fighters:actors.map(f)
  });
  const roster=createRosterSession({
    combatSession:session,
    roster:{teams:{
      player:{slotId:"player",activeMemberId:"water",
        members:[
          {id:"water",creatureId:"water",displayName:"Water",fighterConfigId:"water"},
          {id:"earth",creatureId:"earth",displayName:"Earth",fighterConfigId:"earth"}]},
      opponent:{slotId:"opponent",activeMemberId:"opponent-a",
        members:[
          {id:"opponent-a",creatureId:"enemy-a",displayName:"A",fighterConfigId:"enemy-a"},
          {id:"opponent-b",creatureId:"enemy-b",displayName:"B",fighterConfigId:"enemy-b"}]}
    }},
    fighterConfigs:{"water":f("water"),"earth":f("earth"),
      "enemy-a":f("enemy-a"),"enemy-b":f("enemy-b")}
  });
  return {session,roster};
}
function attackReduction(session,targetId="player"){
  return computeCombatDamageV1({
    state:session.snapshot(),attackerId:"opponent",targetId,baseDamage:20
  }).damage;
}

test("contract defaults to legacy recall cleanup and validates optional status-zone flag",()=>{
  const base=zone().effects[0];
  assert.equal(Object.hasOwn(base,"persistAfterRecall"),false);
  const lasting=zone({persistent:true}).effects[0];
  assert.equal(lasting.persistAfterRecall,true);
  assert.throws(()=>normalizeSkillEffectV1({...lasting,persistAfterRecall:"yes"}),/persistAfterRecall/);
  assert.throws(()=>normalizeSkillEffectV1({...lasting,persistAfterRecall:1}),/persistAfterRecall/);
});

test("Voile brumeux: switch keeps original ground zone, new fighter gains buff and old reserve cannot keep it",()=>{
  const {session,roster}=harness();
  assert.equal(session.useSkill({actorId:"player",targetId:"player",skill:zone({persistent:true})}).ok,true);
  session.advanceMs(1);
  assert.equal(attackReduction(session),15);
  const before=session.snapshot().persistentZones[0];
  assert.equal(roster.switchMember("player","earth").ok,true);
  let current=session.snapshot();
  assert.equal(current.persistentZones.length,1);
  assert.equal(current.persistentZones[0].id,before.id);
  assert.equal(current.persistentZones[0].sourceActorId,"player");
  assert.equal(current.persistentZones[0].originRosterMemberId,"water");
  assert.equal(current.persistentZones[0].detachedFromSource,true);
  session.advanceMs(1);
  assert.equal(attackReduction(session),15,"replacement inherits area while it is active");
  assert.equal(session.snapshot().fighters.player.statusEffects.length,1);
  const oldReserve=roster.reserveMemberSnapshot("player","water");
  assert.equal(oldReserve.statusEffects.some(x=>x.definition.id.startsWith("__zone_bound_status__:")),true,
    "old reserve may hold a stale zone instance only as a snapshot until next summon");
  assert.equal(roster.switchMember("player","water").ok,true);
  session.advanceMs(1);
  assert.equal(attackReduction(session),15,"original caster returns into the same field without stacking");
  assert.equal(session.snapshot().fighters.player.statusEffects.length,1);
  session.advanceMs(5000);
  assert.equal(session.snapshot().persistentZones.length,0);
  assert.equal(session.snapshot().fighters.player.statusEffects.length,0);
  assert.equal(attackReduction(session),20);
});

test("ordinary zones disappear on switch and legacy Firestorm contract remains unchanged",()=>{
  const {session,roster}=harness();
  session.useSkill({actorId:"player",targetId:"player",skill:zone()});
  session.advanceMs(1);
  assert.equal(session.snapshot().persistentZones.length,1);
  roster.switchMember("player","earth");
  assert.equal(session.snapshot().persistentZones.length,0);
  session.advanceMs(1);
  assert.equal(attackReduction(session),20);
});

test("recall then summon retains zone while no creature is active; on-enter must trigger again for new member",()=>{
  const {session,roster}=harness();
  session.useSkill({actorId:"player",targetId:"opponent",skill:zone({persistent:true,scope:"all_enemies",kind:"damage_over_time",zoneId:"poison",skillId:"poison-field"})});
  session.advanceMs(1);
  assert.equal(session.snapshot().fighters.opponent.statusEffects.length,1);
  const now=session.snapshot().persistentZones[0].expiresAtMs;
  roster.recall("player");
  assert.equal(session.snapshot().persistentZones.length,1);
  roster.selectReserve("player","earth");
  roster.summon("player");
  assert.equal(session.snapshot().persistentZones.length,1);
  assert.equal(session.snapshot().persistentZones[0].expiresAtMs,now,"native lifetime not restarted");
  session.advanceMs(2000);
  assert.equal(session.snapshot().fighters.opponent.hp,90);
  session.advanceMs(5000);
  assert.equal(session.snapshot().persistentZones.length,0);
});

test("two zones from successive roster members with same skill id coexist and do not refresh former cast",()=>{
  const {session,roster}=harness();
  const same=zone({persistent:true});
  session.useSkill({actorId:"player",targetId:"player",skill:same});
  session.advanceMs(1);
  const first=session.snapshot().persistentZones[0];
  roster.switchMember("player","earth");
  const result=session.useSkill({actorId:"player",targetId:"player",skill:same});
  assert.equal(result.ok,true);
  const zones=session.snapshot().persistentZones;
  assert.equal(zones.length,2,"new member must not become owner of the old zone");
  assert.notEqual(zones[0].id,zones[1].id);
  assert.equal(zones.find(z=>z.id===first.id).originRosterMemberId,"water");
  assert.equal(zones.find(z=>!z.detachedFromSource).id!==first.id,true);
});

test("2v2: switch affects only departing player's zones and matching allies, not enemy zones",()=>{
  const {session,roster}=harness({duo:true});
  session.useSkill({actorId:"player",targetId:"player",skill:zone({persistent:true,scope:"all_allies"})});
  session.useSkill({actorId:"opponent",targetId:"opponent",skill:zone({persistent:false,scope:"all_allies",zoneId:"enemy-field",skillId:"enemy-skill"})});
  session.advanceMs(1);
  assert.equal(attackReduction(session,"ally"),15);
  assert.equal(session.snapshot().fighters.enemy2.statusEffects.length,1);
  roster.switchMember("player","earth");
  session.advanceMs(1);
  assert.equal(session.snapshot().persistentZones.length,2);
  assert.equal(attackReduction(session,"player"),15);
  assert.equal(attackReduction(session,"ally"),15);
  assert.equal(session.snapshot().fighters.enemy2.statusEffects.length,1);
});

test("Human Editor roundtrips and exposes explicit persistence checkbox without changing legacy JSON",async()=>{
  const input={kind:"persistent_zone",targetScope:"all_allies",zoneId:"mist",
    radius:"long",durationSeconds:12,tickSeconds:1,reactivation:"refresh",
    maxActivations:1,radiusGrowthSteps:0,persistAfterRecall:true,
    statusBehavior:"while_inside",
    tickEffect:{kind:"apply_status",targetScope:"all_allies",status:{
      ...status(),durationSeconds:5,durationMs:undefined
    }}};
  const [exported]=buildHumanTacticalSkillEffectsV1([input]);
  assert.equal(exported.persistAfterRecall,true);
  const [legacy]=buildHumanTacticalSkillEffectsV1([{...input,persistAfterRecall:undefined}]);
  assert.equal(Object.hasOwn(legacy,"persistAfterRecall"),false);
  const ui=await readFile(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
  assert.match(ui,/skillZonePersistAfterRecall/);
  assert.match(ui,/data-skill-zone-persist-after-recall/);
});

test("rendered status zone stays on its ground coordinate after source slot anchor moves",()=>{
  let sourceRect={left:80,top:180,width:40,height:40};
  const fake = rect => ({
    className:"",dataset:{},style:{},children:[],removed:false,
    append(child){this.children.push(child)},
    remove(){this.removed=true},
    getBoundingClientRect(){return typeof rect==="function"?rect():rect;}
  });
  const arena=fake({left:0,top:0,width:400,height:300});
  const source=fake(()=>sourceRect);
  arena.ownerDocument={createElement(){
    const node=fake({left:0,top:0,width:20,height:20});
    node.ownerDocument=arena.ownerDocument;return node;
  }};
  const fx=createDomSkillFxRenderer({
    arena,anchors:{player:source},targetAnchors:{player:source},
    presentationForSkill(){return {persistentZone:{
      assetId:"mist-visual",url:"zone.webp",displayScale:1,playbackMode:"loop"
    },persistentZoneLayer:"behind"}},
    animate(){return {finished:new Promise(()=>{}),cancel(){}}},
    requestFrame(){return null},cancelFrame(){}
  });
  const zoneView={id:"player:mist:mist",skillId:"mist",sourceActorId:"player",radius:"short"};
  fx.syncPersistentZones([zoneView]);
  const node=arena.children[0];
  assert.equal(node.style.left,"100px");
  assert.equal(node.style.top,"200px");
  sourceRect={left:300,top:20,width:40,height:40};
  fx.syncPersistentZones([{...zoneView,detachedFromSource:true,originRosterMemberId:"water"}]);
  assert.equal(node.style.left,"100px","the zone must not follow incoming monster's anchor");
  assert.equal(node.style.top,"200px");
  fx.syncPersistentZones([]);
  assert.equal(node.removed,true);
  fx.dispose();
});
