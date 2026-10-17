import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createRosterSession} from "../../src/core/combat/roster-session.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {normalizeSkillEffectV1} from "../../src/contracts/skill-effect-v1.js";
import {applyStatusEffectV1} from "../../src/core/combat/status-effect-runtime-v1.js";
import {markerStatusDefinitionV1} from "../../src/contracts/capture-marker-v1.js";

const vol=JSON.parse(await readFile(new URL("../../data/capture/showcase/lib_paralyze.capture-skill-transfer-v1.json",import.meta.url),"utf8"));
const marker=vol.draft.definition.effects.find(e=>e.kind==="apply_marker").marker;
const targeted=(scope,charges=5)=>({kind:"apply_marker",targetScope:scope,marker,charges});
const fighter=(id,initialHp=100)=>({
  id,maxHp:100,initialHp,maxEnergy:40,initialEnergy:40,energyChargeAmount:0,
  energyChargeIntervalMs:2000,movementEnergyPerStep:0
});
const format={
  actors:[{actorId:"player",teamId:"heroes"},{actorId:"ally",teamId:"heroes"},{actorId:"opponent",teamId:"villains"}],
  teamOf(id){return this.actors.find(a=>a.actorId===id)?.teamId??null;}
};
function harness(){
  const configs=Object.fromEntries(
    ["p0","p1","a0","a1","e0","e1","e2"].map(id=>[id,fighter(id)])
  );
  const session=createCombatSession({
    distance:"medium",battleFormat:format,
    fighters:[{...configs.p0,id:"player"},{...configs.a0,id:"ally"},{...configs.e0,id:"opponent"}]
  });
  const team=(slotId,prefix,ids)=>({
    slotId,activeMemberId:ids[0],
    members:ids.map((id,i)=>({id,creatureId:prefix+i,displayName:id,fighterConfigId:id}))
  });
  const roster=createRosterSession({
    combatSession:session,fighterConfigs:configs,battleFormat:format,
    roster:{teams:{player:team("player","p",["p0","p1"]),
      ally:team("ally","a",["a0","a1"]),
      opponent:team("opponent","e",["e0","e1","e2"])}}
  });
  return {session,roster};
}
const skill=effects=>normalizeSkillDefinition({
  id:"nid-reserve-test",name:"Nid test",category:"offensive",form:"projectile",
  element:"electric",energyCost:8,preparationMs:0,travelMs:0,recoveryMs:0,cooldownMs:1000,
  maxUsesPerCombat:1,allowedDistances:["medium"],targetRelations:["enemy"],
  targetLocations:["active"],effect:{damage:0,heal:0},
  effects
});
const stacks=(fighterState)=>fighterState.statusEffects.find(x=>x.definition.id==="marker:venin-static")?.stacks??0;

test("RED: marker reserve scopes are permitted but energy/status/other unsupported kinds remain rejected",()=>{
  assert.equal(normalizeSkillEffectV1(targeted("all_enemy_reserves")).targetScope,"all_enemy_reserves");
  assert.equal(normalizeSkillEffectV1(targeted("all_ally_reserves")).targetScope,"all_ally_reserves");
  assert.throws(()=>normalizeSkillEffectV1({kind:"energy_drain",targetScope:"all_enemy_reserves",amount:1}),/reserve/i);
  assert.throws(()=>normalizeSkillEffectV1({kind:"apply_status",targetScope:"all_enemy_reserves",status:{
    id:"x",kind:"stun",polarity:"detrimental",durationMs:1000,stacking:"replace"
  }}),/reserve/i);
});
test("Nid effects reach active enemy and EACH enemy reserve exactly 5 charges with ONE native cast",()=>{
  const {session,roster}=harness();
  const nid=skill([targeted("all_enemies"),targeted("all_enemy_reserves")]);
  const result=roster.useSkillOnTarget({actorId:"player",targetRef:{scope:"active",actorId:"opponent"},skill:nid});
  assert.equal(result.ok,true);
  const snap=session.snapshot();
  assert.equal(stacks(snap.fighters.opponent),5);
  assert.equal(stacks(roster.reserveMemberSnapshot("opponent","e1")),5);
  assert.equal(stacks(roster.reserveMemberSnapshot("opponent","e2")),5);
  assert.equal(stacks(roster.reserveMemberSnapshot("player","p1")),0);
  assert.equal(stacks(roster.reserveMemberSnapshot("ally","a1")),0);
  assert.equal(snap.fighters.player.energy,32);
  assert.equal(snap.fighters.player.skillUseCounts[nid.id],1);
  assert.equal(Object.keys(snap.fighters).some(id=>id.startsWith("__reserve__")),false);
  assert.deepEqual(result.reserveResults?.map(x=>x.targetRef.memberId).sort(),["e1","e2"]);
});
test("bench marker stacks persist through recall/summon and periodic Venin doesn't tick during the bench",()=>{
  const {session,roster}=harness();
  const nid=skill([targeted("all_enemy_reserves")]);
  const result=roster.useSkillOnTarget({actorId:"player",targetRef:{scope:"active",actorId:"opponent"},skill:nid});
  assert.equal(result.ok,true);
  assert.equal(stacks(roster.reserveMemberSnapshot("opponent","e1")),5);
  const initialHp=roster.reserveMemberSnapshot("opponent","e1").hp;
  session.advanceMs(12000);
  const stillBenched=roster.reserveMemberSnapshot("opponent","e1");
  assert.equal(stacks(stillBenched),5);
  assert.equal(stillBenched.hp,initialHp,"no hidden DoT tick while in reserve");
  // Native recall/summon must restore stacks without creating synthetic slot actors.
  const recalled=roster.recall("opponent");
  assert.equal(recalled.ok,true);
  const summoned=roster.summon("opponent","e1");
  assert.equal(summoned.ok,true);
  assert.equal(stacks(session.snapshot().fighters.opponent),5);
});
test("reserve markers honor existing native immunity and apply no marks to KO bench fighters",()=>{
  const {session,roster}=harness();
  const nid=skill([targeted("all_enemy_reserves")]);
  assert.equal(roster.useSkillOnTarget({actorId:"player",targetRef:{scope:"active",actorId:"opponent"},skill:nid}).ok,true);
  assert.equal(stacks(roster.reserveMemberSnapshot("opponent","e1")),5);
  // Roster is the authoritative store; the status effect must keep its original
  // native definition, not be duplicated as a separate reserve-only counter.
  assert.equal(roster.reserveMemberSnapshot("opponent","e1").statusEffects[0].definition.kind,"stack_counter");
});
test("no roster: reserve marker splash is refused before payment",()=>{
  const session=createCombatSession({distance:"medium",battleFormat:format,
    fighters:[fighter("player"),fighter("opponent")]});
  const nid=skill([targeted("all_enemy_reserves")]);
  const result=session.useSkill({actorId:"player",targetId:"opponent",skill:nid});
  assert.equal(result.ok,false);
  assert.equal(result.outcome,"reserve_roster_required");
  assert.equal(session.snapshot().fighters.player.energy,40);
});
