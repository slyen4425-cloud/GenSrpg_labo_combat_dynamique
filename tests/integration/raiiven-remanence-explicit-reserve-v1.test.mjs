import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createRosterSession} from "../../src/core/combat/roster-session.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {normalizeCaptureSkillTransferV1} from "../../src/contracts/capture-skill-transfer-v1.js";

const echo=normalizeCaptureSkillTransferV1(JSON.parse(readFileSync(
  "data/capture/showcase/raiiven-remanence-interdite.capture-skill-transfer-v1.json","utf8"))).draft.definition;
const fighter=id=>({id,maxHp:200,initialHp:200,maxEnergy:30,initialEnergy:30,
  energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0});
const format={actors:[{actorId:"raiiven",teamId:"player"},{actorId:"enemy",teamId:"enemy"}],
  teamOf(id){return this.actors.find(x=>x.actorId===id)?.teamId??null;}};
const reserveShot=normalizeSkillDefinition({id:"enemy-reserve-bolt",name:"Rayon réserve",
 category:"offensive",form:"beam",element:"fire",approachMode:"none",energyCost:2,
 preparationMs:0,travelMs:0,recoveryMs:0,cooldownMs:0,
 allowedDistances:["short","medium","long"],targetRelations:["enemy"],targetLocations:["reserve"],
 effect:{damage:0,heal:0},effects:[{kind:"damage",targetScope:"target",amount:30,channel:"fire"}]});
const reserveAid=normalizeSkillDefinition({id:"enemy-reserve-aid",name:"Soin réserve",
 category:"heal",form:"self",element:"nature",approachMode:"none",energyCost:0,
 preparationMs:0,travelMs:0,recoveryMs:0,cooldownMs:0,
 allowedDistances:["short","medium","long"],targetRelations:["ally"],targetLocations:["reserve"],
 effect:{damage:0,heal:0},effects:[{kind:"heal",targetScope:"target",amount:30}]});
function harness(){
 const configs=Object.fromEntries(["r0","r1","e0","e1","e2"].map(id=>[id,fighter(id)]));
 const session=createCombatSession({battleFormat:format,fighters:[
  {...configs.r0,id:"raiiven"},{...configs.e0,id:"enemy"}]});
 const team=(id,names)=>({slotId:id,activeMemberId:names[0],
  members:names.map(name=>({id:name,creatureId:name,displayName:name,fighterConfigId:name}))});
 const roster=createRosterSession({combatSession:session,battleFormat:format,fighterConfigs:configs,
  roster:{teams:{raiiven:team("raiiven",["r0","r1"]),enemy:team("enemy",["e0","e1","e2"])}}});
 return {session,roster};
}
test("an actual reserve-only bolt still hits its real bench member but cannot arm Rémanence",()=>{
 const {session,roster}=harness();
 const cast=roster.useSkillOnTarget({actorId:"enemy",
   targetRef:{scope:"reserve",teamId:"raiiven",memberId:"r1"},skill:reserveShot});
 assert.equal(cast.ok,true);
 assert.equal(roster.reserveMemberSnapshot("raiiven","r1").hp,170);
 assert.equal(session.inspectMemorizedEcho({actorId:"raiiven"}),null);
 assert.equal(session.previewSkill({actorId:"raiiven",targetId:"enemy",skill:echo}).outcome,"no_copy_source");
});

test("reserve ally healing retains canonical Roster permissions and is NOT a received copy",()=>{
 const {session,roster}=harness();
 const ref={scope:"reserve",teamId:"enemy",memberId:"e1"};
 assert.equal(roster.useSkillOnTarget({actorId:"raiiven",targetRef:ref,skill:reserveShot}).ok,true);
 assert.equal(roster.reserveMemberSnapshot("enemy","e1").hp,170);
 assert.equal(roster.useSkillOnTarget({actorId:"enemy",targetRef:ref,skill:reserveAid}).ok,true);
 assert.equal(roster.reserveMemberSnapshot("enemy","e1").hp,200);
 assert.equal(session.inspectMemorizedEcho({actorId:"raiiven"}),null);
});

test("a timed reserve spell settles through Roster but its animation anchor cannot arm false memory",()=>{
 const {session,roster}=harness();
 const ref={scope:"reserve",teamId:"raiiven",memberId:"r1"};
 const staged=roster.prepareSkillOnTarget({actorId:"enemy",targetRef:ref,skill:reserveShot});
 assert.equal(staged.ok,true);
 assert.deepEqual(staged.skill.effects,[],"no phantom hit against active Raiiven");
 const started=session.startSkill({actorId:"enemy",targetId:staged.targetId,skill:staged.skill});
 assert.equal(started.ok,true);
 const finished=session.completeSkill({action:started.action});
 const settled=roster.useSkillOnTarget({actorId:"enemy",targetRef:ref,skill:reserveShot,
   expectedActiveMemberId:staged.expectedActiveMemberId,completedResolution:finished});
 assert.equal(settled.ok,true);
 assert.equal(roster.reserveMemberSnapshot("raiiven","r1").hp,170);
 assert.equal(session.inspectMemorizedEcho({actorId:"raiiven"}),null);
});

test("a relay replacing Raiiven clears the skill it actually received",()=>{
 const {session,roster}=harness();
 const direct=normalizeSkillDefinition({...reserveShot,
   id:"active-echo-bolt",targetLocations:["active"]});
 assert.equal(session.useSkill({actorId:"enemy",targetId:"raiiven",skill:direct}).ok,true);
 assert.equal(session.inspectMemorizedEcho({actorId:"raiiven"}).skill.id,direct.id);
 const relay=normalizeSkillDefinition({id:"echo-test-relay",name:"Native relay",category:"heal",
   form:"self",approachMode:"none",energyCost:0,preparationMs:0,travelMs:0,
   recoveryMs:0,cooldownMs:0,targetRelations:["ally"],targetLocations:["reserve"],
   effect:{damage:0,heal:0},
   effects:[{kind:"ally_reserve_relay",targetScope:"target",healAmount:5,durationMs:1000,outgoingDamagePct:10}]});
 const result=roster.useSkillOnTarget({actorId:"raiiven",
   targetRef:{scope:"reserve",teamId:"raiiven",memberId:"r1"},skill:relay});
 assert.equal(result.ok,true,result.outcome);
 assert.equal(session.inspectMemorizedEcho({actorId:"raiiven"}),null);
});

test("neither an ultimate nor a reserve-only source is copyable, even after a real bench hit",()=>{
 const {session,roster}=harness();
 const ultimate=normalizeSkillDefinition({...reserveShot,id:"enemy-reserve-ultimate",loadoutSlot:"ultimate"});
 assert.equal(roster.useSkillOnTarget({actorId:"enemy",
  targetRef:{scope:"reserve",teamId:"raiiven",memberId:"r1"},skill:ultimate}).ok,true);
 assert.equal(session.inspectEchoSource({actorId:"raiiven",targetId:"enemy",skill:echo}).outcome,"no_copy_source");
 assert.equal(roster.useSkillOnTarget({actorId:"enemy",
  targetRef:{scope:"reserve",teamId:"raiiven",memberId:"r1"},skill:reserveShot}).ok,true);
 assert.equal(session.inspectEchoSource({actorId:"raiiven",targetId:"enemy",skill:echo}).outcome,"no_copy_source");
});
