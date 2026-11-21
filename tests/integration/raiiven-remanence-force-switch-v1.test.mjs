import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createRosterSession} from "../../src/core/combat/roster-session.js";
import {normalizeCaptureSkillTransferV1} from "../../src/contracts/capture-skill-transfer-v1.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {projectNativeSkillEchoV1} from "../../src/core/combat/skill-echo-v1.js";

const load=id=>normalizeCaptureSkillTransferV1(JSON.parse(readFileSync(
  "data/capture/showcase/"+id+".capture-skill-transfer-v1.json","utf8"))).draft.definition;
const echo=load("raiiven-remanence-interdite");
const vineUltimate=load("liane_venimeuse");
// The authored Liane venimeuse is an ULTIMATE, rightly forbidden. This test
// uses a standalone, non-ultimate contract carrying its native switch mechanics.
const vine=normalizeSkillDefinition({...vineUltimate,
 id:"test-reserve-switch-standard",name:"Changement forcé non ultime",loadoutSlot:"standard"});
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
test("force-switch retains its native Roster transaction but is excluded from copied skills",()=>{
 const {session,roster}=harness();
 const cast=roster.useSkillOnTarget({actorId:"enemy",
  targetRef:{scope:"reserve",teamId:"friend",memberId:"f1"},skill:vine});
 assert.equal(cast.ok,true,cast.outcome);
 assert.equal(cast.outcome,"forced_switched");
 assert.equal(roster.snapshot().friend.activeMemberId,"f1");
 assert.equal(roster.snapshot().raiiven.activeMemberId,"r0");
 assert.equal(session.inspectEchoSource({actorId:"raiiven",targetId:"enemy",skill:echo}).outcome,
   "no_copy_source","a bench switch is not an attack suffered by Raiiven");
 const direct=projectNativeSkillEchoV1({echoSkill:echo,sourceSkill:vine,
   actorId:"raiiven",targetId:"enemy"});
 assert.equal(direct.outcome,"copy_source_forbidden",
   "even a non-ultimate roster-switch is impossible to reproduce");
});

test("real Liane venimeuse is an ultimate and correctly cannot become Rémanence source",()=>{
 assert.equal(vineUltimate.loadoutSlot,"ultimate");
 const {session,roster}=harness();
 const cast=roster.useSkillOnTarget({actorId:"enemy",
   targetRef:{scope:"reserve",teamId:"friend",memberId:"f1"},skill:vineUltimate});
 assert.equal(cast.ok,true);
 assert.equal(session.inspectEchoSource({
   actorId:"raiiven",targetId:"enemy",skill:echo}).outcome,"no_copy_source");
});
