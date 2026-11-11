import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {attachCaptureEncounterDisplayLevelsV1} from "../../src/ui/capture-encounter-combat-source-v1.js";
import {captureCombatActorLevelLabelV1} from "../../src/ui/combat-2v2-test-ui.js";

function battle(){
 return {battleFormat:{localActorId:"player",teams:{"enemy-team":["opponent"]}},
  roster:{teams:{player:{members:[
   {id:"first",creatureId:"sylvorne"},{id:"second",creatureId:"sylvorne"},
   {id:"third",creatureId:"gorice"}]},
   opponent:{members:[{id:"wild",creatureId:"gorice"}]}}}};
}

test("official encounter levels are keyed per roster INSTANCE, never per species",()=>{
 const source=battle(),raw=JSON.stringify(source);
 const enriched=attachCaptureEncounterDisplayLevelsV1(source,{
  local:{speciesId:"sylvorne",level:2},
  localReserve:[{speciesId:"sylvorne",level:17},{speciesId:"gorice",level:5}],
  opponent:{speciesId:"gorice",level:12}
 });
 assert.deepEqual(enriched.displayLevelsByRosterMember,{
  player:{first:2,second:17,third:5},opponent:{wild:12}
 });
 assert.equal(captureCombatActorLevelLabelV1("Sylvorne",enriched.displayLevelsByRosterMember.player.first),
  "Sylvorne · Niv. 2");
 assert.equal(captureCombatActorLevelLabelV1("Sylvorne",enriched.displayLevelsByRosterMember.player.second),
  "Sylvorne · Niv. 17");
 assert.equal(captureCombatActorLevelLabelV1("Gorille des glaces",enriched.displayLevelsByRosterMember.opponent.wild),
  "Gorille des glaces · Niv. 12");
 assert.equal(JSON.stringify(source),raw,"Original Combat roster remains untouched");
 assert.equal(Object.isFrozen(enriched.displayLevelsByRosterMember.player),true);
 assert.equal(Object.hasOwn(source,"displayLevelsByRosterMember"),false);
});

test("unknown or invalid author levels are never invented for combat labels",()=>{
 assert.equal(captureCombatActorLevelLabelV1("Gorice",null),"Gorice");
 assert.equal(captureCombatActorLevelLabelV1("Gorice",0),"Gorice");
 assert.equal(captureCombatActorLevelLabelV1("Gorice",NaN),"Gorice");
 assert.throws(()=>attachCaptureEncounterDisplayLevelsV1(battle(),{
  local:{speciesId:"sylvorne",level:1},
  localReserve:[{speciesId:"sylvorne",level:4}],opponent:{speciesId:"gorice",level:12}
 }),/roster/);
});

test("native HUD rereads the current roster member on every render, including swaps and KO",()=>{
 const source=readFileSync(new URL("../../src/ui/combat-2v2-test-ui.js",import.meta.url),"utf8");
 const encounter=readFileSync(new URL("../../src/ui/capture-encounter-combat-source-v1.js",import.meta.url),"utf8");
 assert.match(source,/rosterController\?\.activeMember\(actor\.actorId\)/);
 assert.match(source,/displayLevelsByRosterMember\?\.\[actor\.actorId\]\?\.\[activeMember\.id\]/);
 assert.match(source,/card\.classList\?\.contains\("squad-card"\)/);
 assert.match(encounter,/local,opponent,localReserve/);
 assert.match(encounter,/displayLevelsByRosterMember:Object\.freeze/);
});
