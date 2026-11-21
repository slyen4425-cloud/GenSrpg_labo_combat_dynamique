import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createRosterSession} from "../../src/core/combat/roster-session.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {normalizeCaptureSkillTransferV1} from "../../src/contracts/capture-skill-transfer-v1.js";
import {projectNativeSkillEchoV1} from "../../src/core/combat/skill-echo-v1.js";

const echo=normalizeCaptureSkillTransferV1(JSON.parse(readFileSync(
 "data/capture/showcase/raiiven-remanence-interdite.capture-skill-transfer-v1.json","utf8"
))).draft.definition;
const fighter=id=>({id,maxHp:200,initialHp:200,maxEnergy:50,initialEnergy:50,
 energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
const format={
 actors:[{actorId:"raiiven",teamId:"ours"},{actorId:"enemy",teamId:"theirs"}],
 teamOf(id){return this.actors.find(a=>a.actorId===id)?.teamId??null;}
};
const mixed=normalizeSkillDefinition({
 id:"original-bench-wave",name:"Vague mixte",category:"offensive",
 form:"aura",element:"fire",approachMode:"none",energyCost:2,
 preparationMs:0,travelMs:0,recoveryMs:0,cooldownMs:0,
 allowedDistances:["short","medium","long"],targetRelations:["enemy"],targetLocations:["active"],
 effect:{damage:0,heal:0},effects:[
  {kind:"damage",targetScope:"target",amount:20,channel:"fire"},
  {kind:"damage",targetScope:"all_enemy_reserves",amount:10,channel:"fire"}
 ]});
function setup(){
 const configs=Object.fromEntries(["r0","r1","e0","e1","e2"].map(id=>[id,fighter(id)]));
 const session=createCombatSession({fighters:[{...configs.r0,id:"raiiven"},{...configs.e0,id:"enemy"}],battleFormat:format});
 const team=(slotId,ids)=>({slotId,activeMemberId:ids[0],members:ids.map(id=>(
  {id,creatureId:id,displayName:id,fighterConfigId:id}
 ))});
 const roster=createRosterSession({combatSession:session,battleFormat:format,fighterConfigs:configs,
  roster:{teams:{raiiven:team("raiiven",["r0","r1"]),enemy:team("enemy",["e0","e1","e2"])}}});
 const hp=(side,id)=>roster.reserveMemberSnapshot(side,id).hp;
 return {session,roster,hp};
}
test("mixed native active+reserve splash still damages live targets, but Rémanence cannot duplicate benches",()=>{
 const h=setup();
 const origin=h.session.useSkill({actorId:"enemy",targetId:"raiiven",skill:mixed});
 assert.equal(origin.ok,true);
 assert.equal(h.session.snapshot().fighters.raiiven.hp,180);
 assert.equal(h.hp("raiiven","r1"),190);
 assert.equal(h.session.inspectMemorizedEcho({actorId:"raiiven"}),null);
 assert.equal(h.session.previewSkill({actorId:"raiiven",targetId:"enemy",skill:echo}).outcome,"no_copy_source");
});

test("an unowned Roster effect remains rejected and is explicitly not copyable",()=>{
 const session=createCombatSession({fighters:[fighter("raiiven"),fighter("enemy")],battleFormat:format});
 assert.equal(session.useSkill({actorId:"enemy",targetId:"raiiven",skill:mixed}).outcome,"reserve_roster_required");
 const copied=projectNativeSkillEchoV1({echoSkill:echo,sourceSkill:mixed,
   actorId:"raiiven",targetId:"enemy"});
 assert.equal(copied.ok,false);
 assert.equal(copied.outcome,"copy_source_forbidden");
 assert.equal(session.snapshot().fighters.raiiven.energy,50);
});

test("the suffered active-only spell belongs to Raiiven even after enemy replacement; own replacement clears it",()=>{
 const h=setup();
 const direct=normalizeSkillDefinition({...mixed,id:"original-active-wave",
   effects:[mixed.effects[0]]});
 assert.equal(h.session.useSkill({actorId:"enemy",targetId:"raiiven",skill:direct}).ok,true);
 assert.equal(h.session.previewSkill({actorId:"raiiven",targetId:"enemy",skill:echo}).ok,true);
 h.session.replaceFighter("enemy",fighter("enemy"));
 assert.equal(h.session.previewSkill({actorId:"raiiven",targetId:"enemy",skill:echo}).ok,true);
 h.session.replaceFighter("raiiven",fighter("raiiven"));
 assert.equal(h.session.previewSkill({actorId:"raiiven",targetId:"enemy",skill:echo}).outcome,"no_copy_source");
});
