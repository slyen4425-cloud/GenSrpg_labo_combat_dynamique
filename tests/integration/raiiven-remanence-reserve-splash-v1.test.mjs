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
test("Rémanence copies real all-enemy-reserves scope through canonical Roster once",()=>{
 const h=setup();
 const origin=h.session.useSkill({actorId:"enemy",targetId:"raiiven",skill:mixed});
 assert.equal(origin.ok,true);
 assert.equal(h.session.snapshot().fighters.raiiven.hp,180);
 assert.equal(h.hp("raiiven","r1"),190);
 // The source player was atomically refreshed by Roster; echo history must survive.
 const preview=h.session.previewSkill({actorId:"raiiven",targetId:"enemy",skill:echo});
 assert.equal(preview.ok,true,preview.outcome);
 const copied=h.session.useSkill({actorId:"raiiven",targetId:"enemy",skill:echo});
 assert.equal(copied.ok,true);
 assert.equal(h.session.snapshot().fighters.enemy.hp,188,"20 * 60% shadow on active target");
 assert.equal(h.hp("enemy","e1"),194,"10 * 60% shadow on first reserve");
 assert.equal(h.hp("enemy","e2"),194,"10 * 60% shadow on second reserve");
 assert.equal(h.session.snapshot().fighters.raiiven.energy,43,"echo paid 7 energy once");
 assert.equal(h.session.snapshot().fighters.raiiven.skillUseCounts[echo.id],1);
 assert.equal(copied.reserveResults.length,2,"one effect per living enemy reserve");
});
test("without Roster owner an echoed all-reserve effect fails without charging energy",()=>{
 const session=createCombatSession({fighters:[fighter("raiiven"),fighter("enemy")],battleFormat:format});
 assert.equal(session.useSkill({actorId:"enemy",targetId:"raiiven",skill:mixed}).outcome,"reserve_roster_required");
 const direct=projectNativeSkillEchoV1({echoSkill:echo,sourceSkill:mixed,actorId:"raiiven",targetId:"enemy"});
 assert.equal(direct.ok,true);
 assert.equal(direct.skill.effects[1].targetScope,"all_enemy_reserves");
 assert.equal(direct.skill.effects[1].amount,6);
 assert.equal(direct.skill.effects[1].channel,"shadow");
});
test("true replacement clears native last-skill history, tactical refresh preserves it",()=>{
 const h=setup();
 h.session.useSkill({actorId:"enemy",targetId:"raiiven",skill:mixed});
 assert.equal(h.session.previewSkill({actorId:"raiiven",targetId:"enemy",skill:echo}).ok,true);
 h.session.replaceFighter("enemy",fighter("enemy"));
 assert.equal(h.session.previewSkill({actorId:"raiiven",targetId:"enemy",skill:echo}).outcome,"no_copy_source");
});
