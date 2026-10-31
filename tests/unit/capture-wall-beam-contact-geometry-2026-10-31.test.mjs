import test from "node:test";
import assert from "node:assert/strict";
import {nearestBarrierSegmentContactV1} from "../../src/core/combat/combat-barrier-spatial-v1.js";
import {createCombatState} from "../../src/core/combat/combat-state.js";
import {createCombatBarrierV1,interceptCombatBarrierV1} from "../../src/core/combat/combat-entity-v1.js";

const effect={kind:"summon_entity",targetScope:"self",entityKind:"barrier",statId:"glace",
  hpPerStatPoint:1,interceptKinds:["projectile","beam","contact"]};
function scene(){
  const initial=createCombatState({fighters:[
    {id:"hero",maxHp:100,maxEnergy:10,initialEnergy:10,statValuesById:{glace:80}},
    {id:"enemy",maxHp:100,maxEnergy:10,initialEnergy:10}]});
  return createCombatBarrierV1({state:initial,sourceActorId:"hero",protectedActorId:"hero",
    sourceSkillId:"ice-wall",effect}).state;
}
test("beam/contact visual segment picks the nearest wall actually intersected, never a lateral one",()=>{
  const from={x:0,y:50},to={x:100,y:50};
  const candidates=[
    {entityId:"far",rect:{left:70,top:20,width:15,height:60}},
    {entityId:"away",rect:{left:15,top:75,width:15,height:20}},
    {entityId:"near",rect:{left:30,top:20,width:15,height:60}}
  ];
  assert.deepEqual(nearestBarrierSegmentContactV1({from,to,barriers:candidates}),
    {entityId:"near",point:{x:30,y:50}});
  assert.equal(nearestBarrierSegmentContactV1({from:{x:0,y:5},to:{x:100,y:5},barriers:candidates}),null);
  assert.equal(nearestBarrierSegmentContactV1({from:{x:0,y:50},to:{x:20,y:50},barriers:candidates}),null);
  assert.equal(nearestBarrierSegmentContactV1({from:{x:20,y:50},to:{x:20,y:50},barriers:candidates}),null);
});
test("native beam and melee cannot steal wall HP without exact geometric evidence",()=>{
  const state=scene(),id=state.combatEntities[0].id;
  for(const incomingKind of ["beam","contact"]){
    const miss=interceptCombatBarrierV1({state,sourceActorId:"enemy",targetActorId:"hero",
      damage:35,incomingKind});
    assert.equal(miss.absorbedByEntity,0,incomingKind+" must not auto-hit invisible wall");
    const fake=interceptCombatBarrierV1({state,sourceActorId:"enemy",targetActorId:"hero",
      damage:35,incomingKind,contactedEntityId:"another-wall"});
    assert.equal(fake.absorbedByEntity,0);
    const observed=interceptCombatBarrierV1({state,sourceActorId:"enemy",targetActorId:"hero",
      damage:35,incomingKind,contactedEntityId:id});
    assert.equal(observed.absorbedByEntity,35);
    assert.equal(observed.state.combatEntities[0].hp,45);
  }
});

test("native CombatSession keeps contact-hold tick damage on the observed wall, not behind it",async()=>{
  const {createCombatSession}=await import("../../src/core/combat/combat-session.js");
  const {normalizeSkillDefinition}=await import("../../src/contracts/skill-definition.js");
  const {readFileSync}=await import("node:fs");
  const base=JSON.parse(readFileSync(new URL("../../data/combat/skills/fireball.skill.json",import.meta.url),"utf8"));
  const session=createCombatSession({fighters:[
    {id:"hero",maxHp:100,maxEnergy:10,initialEnergy:10,statValuesById:{glace:80}},
    {id:"enemy",maxHp:100,maxEnergy:10,initialEnergy:10}
  ]});
  const wallSkill=normalizeSkillDefinition({...base,id:"wall-for-hold",form:"self",
    category:"defensive",energyCost:0,preparationMs:0,travelMs:0,
    effect:{damage:0,heal:0,stunMs:0,interruptsPreparation:false,tags:[]},
    targetRelations:["self"],targetLocations:["active"],projectileClash:{power:0},
    effects:[effect]});
  const start=session.startSkill({actorId:"hero",targetId:"hero",skill:wallSkill});
  assert.equal(start.ok,true);
  assert.equal(session.completeSkill({action:start.action}).ok,true);
  const id=session.snapshot().combatEntities[0].id;
  const skill={id:"native-hold",category:"offensive",form:"contact",element:"fire",
    contactHold:{tickIntervalMs:1000,effects:[
      {kind:"damage",targetScope:"target",amount:12,channel:"fire"}]}};
  const tick=session.applyContactHoldTickV1({actorId:"enemy",targetId:"hero",skill,
    atMs:session.snapshot().elapsedMs,contactedEntityId:id});
  assert.equal(tick.ok,true);
  assert.equal(session.snapshot().combatEntities[0].hp,68);
  assert.equal(session.snapshot().fighters.hero.hp,100);
  const noContact=session.applyContactHoldTickV1({actorId:"enemy",targetId:"hero",skill,
    atMs:session.snapshot().elapsedMs,contactedEntityId:null});
  assert.equal(noContact.ok,true);
  assert.equal(session.snapshot().combatEntities[0].hp,68);
  assert.equal(session.snapshot().fighters.hero.hp,88);
});

test("real CombatRuntime routes the beam visual evidence to the only native damage owner",async()=>{
  const {createCombatSession}=await import("../../src/core/combat/combat-session.js");
  const {createCombatRuntime}=await import("../../src/core/combat/combat-runtime.js");
  const {normalizeSkillDefinition}=await import("../../src/contracts/skill-definition.js");
  const {readFileSync}=await import("node:fs");
  const base=JSON.parse(readFileSync(new URL("../../data/combat/skills/fireball.skill.json",import.meta.url),"utf8"));
  const wallSkill=normalizeSkillDefinition({...base,id:"wall-beam-path",form:"self",category:"defensive",
    energyCost:0,preparationMs:0,travelMs:0,projectileClash:{power:0},
    effect:{damage:0,heal:0,stunMs:0,interruptsPreparation:false,tags:[]},
    targetRelations:["self"],targetLocations:["active"],effects:[effect]});
  const beam=normalizeSkillDefinition({...base,id:"native-beam-test",form:"beam",
    preparationMs:100,travelMs:200,recoveryMs:0,projectileClash:{power:0}});
  for(const observed of [false,true]){
    const session=createCombatSession({fighters:[
      {id:"hero",maxHp:100,maxEnergy:10,initialEnergy:10,statValuesById:{glace:80}},
      {id:"enemy",maxHp:100,maxEnergy:10,initialEnergy:10}
    ]});
    const wallStart=session.startSkill({actorId:"hero",targetId:"hero",skill:wallSkill});
    assert.equal(wallStart.ok,true);
    assert.equal(session.completeSkill({action:wallStart.action}).ok,true);
    const id=session.snapshot().combatEntities[0].id;
    let clock=0,tick=null,queries=0;
    const runtime=createCombatRuntime({session,now:()=>clock,
      setTimer:fn=>(tick=fn,1),clearTimer:()=>{},
      readBarrierContact:({sourceActorId,targetActorId,kind})=>{
        queries++;
        assert.equal(sourceActorId,"enemy");
        assert.equal(targetActorId,"hero");
        assert.equal(kind,"beam");
        return observed?{entityId:id}:null;
      }});
    runtime.start();
    assert.equal(runtime.startSkill({actorId:"enemy",targetId:"hero",skill:beam}).ok,true);
    clock=350;
    assert.equal(typeof tick,"function");
    tick();
    assert.equal(queries,1,"geometry queried once at semantic impact");
    assert.equal(session.snapshot().fighters.hero.hp,observed?100:70);
    assert.equal(session.snapshot().combatEntities[0].hp,observed?50:80);
    runtime.dispose();
  }
});
