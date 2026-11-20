import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createRosterSession} from "../../src/core/combat/roster-session.js";
import {normalizeCaptureSkillTransferV1} from "../../src/contracts/capture-skill-transfer-v1.js";

const load=id=>normalizeCaptureSkillTransferV1(JSON.parse(readFileSync(
  "data/capture/showcase/"+id+".capture-skill-transfer-v1.json","utf8"))).draft.definition;
const echo=load("raiiven-remanence-interdite");
const vine=load("liane_venimeuse");
const fighter=id=>({id,maxHp:200,initialHp:200,maxEnergy:30,initialEnergy:30,
 energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
const format={actors:[
 {actorId:"raiiven",teamId:"heroes"},{actorId:"friend",teamId:"heroes"},
 {actorId:"enemy",teamId:"foes"}],
 teamOf(id){return this.actors.find(a=>a.actorId===id)?.teamId??null;}
};
function harness(){
 const configs=Object.fromEntries(["r0","f0","f1","e0","e1","e2"].map(id=>[id,fighter(id)]));
 const session=createCombatSession({battleFormat:format,fighters:[
  {...configs.r0,id:"raiiven"},{...configs.f0,id:"friend"},{...configs.e0,id:"enemy"}]});
 const roster=createRosterSession({combatSession:session,battleFormat:format,
  fighterConfigs:configs,roster:{teams:{
   raiiven:{slotId:"raiiven",activeMemberId:"r0",members:[{id:"r0",creatureId:"r0",displayName:"r0",fighterConfigId:"r0"}]},
   friend:{slotId:"friend",activeMemberId:"f0",members:["f0","f1"].map(id=>({id,creatureId:id,displayName:id,fighterConfigId:id}))},
   enemy:{slotId:"enemy",activeMemberId:"e0",members:["e0","e1","e2"].map(id=>({id,creatureId:id,displayName:id,fighterConfigId:id}))}
  }}});
 return {session,roster};
}
test("native Rémanence replicates an actual force-switch spell with native Roster, not a dummy buff",()=>{
 const {session,roster}=harness();
 const sourceCast=roster.useSkillOnTarget({actorId:"enemy",
   targetRef:{scope:"reserve",teamId:"friend",memberId:"f1"},skill:vine});
 assert.equal(sourceCast.ok,true,sourceCast.outcome);
 assert.equal(sourceCast.outcome,"forced_switched");
 assert.equal(roster.snapshot().friend.activeMemberId,"f1");
 assert.equal(roster.snapshot().raiiven.activeMemberId,"r0","Raiiven remains available");
 const echoSource=session.inspectEchoSource({actorId:"raiiven",targetId:"enemy",skill:echo});
 assert.equal(echoSource.ok,true,echoSource.outcome);
 assert.equal(echoSource.sourceSkillId,"liane_venimeuse");
 assert.equal(echoSource.reserveMemberRequired,true);
 assert.equal(echoSource.skill.effects[0].kind,"force_reserve_switch");
 assert.equal(echoSource.skill.effects[1].marker.periodic.channel,"shadow","periodic original nature converted");
 assert.equal(echoSource.skill.effects[1].marker.periodic.amount,3,"periodic 5 scaled to 60%");
 const targetRef={scope:"reserve",teamId:"enemy",memberId:"e2"};
 const prepared=roster.prepareSkillOnTarget({actorId:"raiiven",targetRef,skill:echoSource.skill});
 assert.equal(prepared.ok,true,prepared.outcome);
 assert.equal(prepared.targetId,"enemy");
 assert.deepEqual(prepared.skill.effects,[]);
 const started=session.startSkill({actorId:"raiiven",targetId:prepared.targetId,skill:prepared.skill});
 assert.equal(started.ok,true);
 const result=session.completeSkill({action:started.action});
 assert.equal(result.ok,true);
 assert.equal(result.outcome,"hit");
 const applied=roster.useSkillOnTarget({actorId:"raiiven",targetRef,
   skill:echoSource.skill,expectedActiveMemberId:prepared.expectedActiveMemberId,completedResolution:result});
 assert.equal(applied.ok,true,applied.outcome);
 assert.equal(applied.outcome,"forced_switched");
 assert.equal(roster.snapshot().enemy.activeMemberId,"e2");
 assert.equal(session.snapshot().fighters.raiiven.energy,23,"Remanence pays 7 energy exactly once");
 assert.equal(session.snapshot().fighters.raiiven.skillUseCounts[echo.id],1);
 assert.ok(session.snapshot().fighters.enemy.statusEffects.length>0,"native status transfer applied to new reserve");
 assert.equal(roster.useSkillOnTarget({actorId:"raiiven",targetRef,skill:echoSource.skill,
   expectedActiveMemberId:prepared.expectedActiveMemberId,completedResolution:result}).ok,false,
   "one visual contact may only settle once");
});
