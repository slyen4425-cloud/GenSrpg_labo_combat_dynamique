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
test("real enemy reserve-only cast becomes inspectable, but direct echo rejects until exact reserve member is selected",()=>{
 const {session,roster}=harness();
 const actual=roster.useSkillOnTarget({actorId:"enemy",targetRef:{scope:"reserve",teamId:"raiiven",memberId:"r1"},skill:reserveShot});
 assert.equal(actual.ok,true);
 assert.equal(roster.reserveMemberSnapshot("raiiven","r1").hp,170);
 assert.equal(session.previewSkill({actorId:"raiiven",targetId:"enemy",skill:echo}).outcome,
   "copy_reserve_requires_member_selection");
 const inspected=session.inspectEchoSource({actorId:"raiiven",targetId:"enemy",skill:echo});
 assert.equal(inspected.ok,true);
 assert.equal(inspected.reserveMemberRequired,true);
 assert.deepEqual(inspected.skill.targetLocations,["reserve"]);
 assert.equal(inspected.skill.effects[0].amount,18);
 assert.equal(inspected.skill.effects[0].channel,"shadow");
 // Roster independently verifies an exact reserve member and target relation.
 const ref={scope:"reserve",teamId:"enemy",memberId:"e2"};
 const preview=roster.prepareSkillOnTarget({actorId:"raiiven",targetRef:ref,skill:inspected.skill});
 assert.equal(preview.ok,true,preview.outcome);
 assert.equal(preview.skill.id,echo.id);
 assert.deepEqual(preview.skill.effects,[]);
 assert.equal(roster.reserveMemberSnapshot("enemy","e1").hp,200);
 const hit=session.startSkill({actorId:"raiiven",targetId:preview.targetId,skill:preview.skill});
 assert.equal(hit.ok,true);
 const resolution=session.completeSkill({action:hit.action});
 assert.equal(resolution.outcome,"hit");
 const settled=roster.useSkillOnTarget({actorId:"raiiven",targetRef:ref,skill:inspected.skill,
  expectedActiveMemberId:preview.expectedActiveMemberId,completedResolution:resolution});
 assert.equal(settled.ok,true,settled.outcome);
 assert.equal(roster.reserveMemberSnapshot("enemy","e2").hp,182);
 assert.equal(roster.reserveMemberSnapshot("enemy","e1").hp,200);
 assert.equal(session.snapshot().fighters.raiiven.energy,23,"cost once");
 assert.equal(session.snapshot().fighters.raiiven.skillUseCounts[echo.id],1);
 const repeat=roster.useSkillOnTarget({actorId:"raiiven",targetRef:ref,skill:inspected.skill,
  expectedActiveMemberId:preview.expectedActiveMemberId,completedResolution:resolution});
 assert.equal(repeat.outcome,"unconfirmed_reserve_hit","no duplicate reserve effect");
});
test("self/ally reserve healing projects as ally and uses Roster permissions",()=>{
 const {session,roster}=harness();
 const harm=roster.useSkillOnTarget({actorId:"raiiven",
  targetRef:{scope:"reserve",teamId:"enemy",memberId:"e1"},skill:reserveShot});
 assert.equal(harm.ok,true);
 assert.equal(roster.reserveMemberSnapshot("enemy","e1").hp,170);
 roster.useSkillOnTarget({actorId:"enemy",
  targetRef:{scope:"reserve",teamId:"enemy",memberId:"e1"},skill:reserveAid});
 const inspect=session.inspectEchoSource({actorId:"raiiven",targetId:"enemy",skill:echo});
 assert.equal(inspect.ok,true);
 assert.deepEqual(inspect.skill.targetRelations,["ally"]);
 assert.deepEqual(inspect.skill.targetLocations,["reserve"]);
 assert.equal(inspect.skill.effects[0].amount,18);
 // On Raiiven side, ally means Raiiven's own bench, not the enemy's.
 const ok=roster.previewSkillOnTarget({actorId:"raiiven",
  targetRef:{scope:"reserve",teamId:"raiiven",memberId:"r1"},skill:inspect.skill});
 assert.equal(ok.ok,true);
 const deny=roster.previewSkillOnTarget({actorId:"raiiven",
  targetRef:{scope:"reserve",teamId:"enemy",memberId:"e1"},skill:inspect.skill});
 assert.equal(deny.outcome,"target_relation");
});
test("timed reserve source stores the real authored effects, not a zero-effect animation anchor",()=>{
 const {session,roster}=harness();
 const sourceRef={scope:"reserve",teamId:"raiiven",memberId:"r1"};
 const staged=roster.prepareSkillOnTarget({actorId:"enemy",targetRef:sourceRef,skill:reserveShot});
 assert.equal(staged.ok,true);
 assert.deepEqual(staged.skill.effects,[],"visible body never receives reserve damage");
 const started=session.startSkill({actorId:"enemy",targetId:staged.targetId,skill:staged.skill});
 assert.equal(started.ok,true);
 const inspected=session.inspectEchoSource({actorId:"raiiven",targetId:"enemy",skill:echo});
 assert.equal(inspected.ok,true);
 assert.equal(inspected.skill.effects[0].amount,18);
 assert.equal(inspected.sourceSkillId,reserveShot.id);
 const completed=session.completeSkill({action:started.action});
 const settled=roster.useSkillOnTarget({actorId:"enemy",targetRef:sourceRef,skill:reserveShot,
   expectedActiveMemberId:staged.expectedActiveMemberId,completedResolution:completed});
 assert.equal(settled.ok,true);
 assert.equal(roster.reserveMemberSnapshot("raiiven","r1").hp,170,"no double effects");
});
test("ultimate and a replacement still cannot be used as an echo source",()=>{
 const {session,roster}=harness();
 const ultimate=normalizeSkillDefinition({...reserveShot,id:"enemy-reserve-ultimate",loadoutSlot:"ultimate"});
 assert.equal(roster.useSkillOnTarget({actorId:"enemy",
  targetRef:{scope:"reserve",teamId:"raiiven",memberId:"r1"},skill:ultimate}).ok,true);
 assert.equal(session.inspectEchoSource({actorId:"raiiven",targetId:"enemy",skill:echo}).outcome,"no_copy_source");
 assert.equal(roster.useSkillOnTarget({actorId:"enemy",
  targetRef:{scope:"reserve",teamId:"raiiven",memberId:"r1"},skill:reserveShot}).ok,true);
 session.replaceFighter("enemy",fighter("enemy"));
 assert.equal(session.inspectEchoSource({actorId:"raiiven",targetId:"enemy",skill:echo}).outcome,"no_copy_source");
});
