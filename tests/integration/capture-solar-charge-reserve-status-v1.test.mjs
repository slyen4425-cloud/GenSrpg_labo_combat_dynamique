import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {normalizeSkillEffectV1} from "../../src/contracts/skill-effect-v1.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createRosterSession} from "../../src/core/combat/roster-session.js";

const paths=[
 "data/capture/showcase/cap_light_atk_3.capture-skill-transfer-v1.json",
 "data/capture/showcase/cap_light_special_1.capture-skill-transfer-v1.json",
 "data/capture/showcase/lib_light_bolt.capture-skill-transfer-v1.json"
];
const read = async path=>JSON.parse(await readFile(new URL("../../"+path,import.meta.url),"utf8"));
const fighter=id=>({id,maxHp:100,initialHp:100,maxEnergy:40,initialEnergy:40,
  energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
const format={
 actors:[{actorId:"player",teamId:"heroes"},{actorId:"ally",teamId:"heroes"},{actorId:"opponent",teamId:"foes"}],
 teamOf(id){return this.actors.find(a=>a.actorId===id)?.teamId??null;}
};
function setup(){
 const config=Object.fromEntries(["p0","p1","p2","a0","a1","e0","e1"].map(id=>[id,fighter(id)]));
 const session=createCombatSession({distance:"medium",battleFormat:format,
   fighters:[{...config.p0,id:"player"},{...config.a0,id:"ally"},{...config.e0,id:"opponent"}]});
 const team=(slotId,ids)=>({slotId,activeMemberId:ids[0],members:ids.map(id=>({
   id,creatureId:id,displayName:id,fighterConfigId:id}))});
 const roster=createRosterSession({combatSession:session, fighterConfigs:config,battleFormat:format,
   roster:{teams:{player:team("player",["p0","p1","p2"]),ally:team("ally",["a0","a1"]),opponent:team("opponent",["e0","e1"])}}});
 return {session,roster};
}
test("RED: reserve status must normalize using the original SkillEffectV1 owner",()=>{
 const status={id:"solar-reserve",kind:"outgoing_damage_modifier",polarity:"beneficial",
   durationModel:"time_ms",durationMs:30000,stacking:"refresh",maxStacks:1,tags:[],modifierPct:50};
 const effect=normalizeSkillEffectV1({kind:"apply_status",targetScope:"all_ally_reserves",status});
 assert.equal(effect.status.modifierPct,50);
 assert.equal(effect.targetScope,"all_ally_reserves");
 assert.throws(()=>normalizeSkillEffectV1({kind:"energy_restore",targetScope:"all_enemy_reserves",amount:3}),/Reserve effect scopes/);
});
test("RED: three author skill IDs remain unique and author parameters are preserved",async()=>{
 for(const path of paths)assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p=>p===path).length,1,path);
 assert.equal(new Set(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1).size,CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.length);
 const solar=(await read(paths[0])).draft;
 assert.equal(solar.definition.name,"Charge solaire");
 assert.deepEqual(solar.definition.effects.map(x=>[x.kind,x.targetScope,x.status?.modifierPct,x.status?.durationMs]),[
   ["apply_status","target",50,30000],["apply_status","all_ally_reserves",50,30000]
 ]);
 assert.deepEqual(solar.definition.targetRelations,["ally","self"]);
 const heal=(await read(paths[1])).draft;
 assert.equal(heal.definition.cooldownMs,30000);
 assert.deepEqual(heal.definition.targetRelations,["ally","self"]);
 assert.equal(heal.definition.effects[1].effects[0].amount,10);
 const ray=(await read(paths[2])).draft;
 assert.equal(ray.definition.effects[0].amount,14);
 assert.equal(ray.definition.projectileClash.power,1);
});
test("RED: Charge solaire +50% persists on all allied bench and never hostile; recalled attacker deals +50%",async()=>{
 const skill=importCaptureTransferJsonV1(await readFile(new URL("../../"+paths[0],import.meta.url),"utf8")).value.draft.definition;
 const {session,roster}=setup();
 const r=roster.useSkillOnTarget({actorId:"player",targetRef:{scope:"active",actorId:"ally"},skill});
 assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(session.snapshot().fighters.player.energy,37);
 assert.equal(session.snapshot().fighters.player.skillUseCounts[skill.id],1);
 const buff=s=>s.statusEffects.filter(x=>x.definition.kind==="outgoing_damage_modifier"&&x.sourceSkillId===skill.id);
 assert.equal(buff(session.snapshot().fighters.player).length,0,"author removed separate self buff when ally is targeted");
 assert.equal(buff(session.snapshot().fighters.ally).length,1,"selected ally keeps existing buff");
 for(const [slot,member] of [["player","p1"],["player","p2"],["ally","a1"]]){
   const b=buff(roster.reserveMemberSnapshot(slot,member));
   assert.equal(b.length,1,slot+"/"+member);
   assert.equal(b[0].definition.modifierPct,50);
   assert.equal(b[0].expiresAtMs,30000);
 }
 assert.equal(buff(roster.reserveMemberSnapshot("opponent","e1")).length,0);
 assert.equal(buff(session.snapshot().fighters.opponent).length,0);
 assert.equal(Object.keys(session.snapshot().fighters).some(k=>k.startsWith("__reserve__")),false);
 assert.equal(roster.switchMember("player","p1").ok,true);
 assert.equal(buff(session.snapshot().fighters.player).length,1,"bench buff survives real recall/switch");
 const strike=normalizeSkillDefinition({id:"test-solar-strike",name:"strike",category:"offensive",
   form:"projectile",projectileTargeting:"direct",element:"physical",energyCost:0,
   preparationMs:0,travelMs:0,recoveryMs:0,cooldownMs:0,
   allowedDistances:["medium"],targetRelations:["enemy"],effect:{damage:20,heal:0}});
 const attack=session.useSkill({actorId:"player",targetId:"opponent",skill:strike});
 assert.equal(attack.ok,true);
 assert.equal(session.snapshot().fighters.opponent.hp,70,"20 + 50% = 30 damage");
 session.advanceMs(30001);
 assert.equal(buff(roster.reserveMemberSnapshot("player","p2")).length,0,"bench effect expires on one combat clock");
});
test("RED: no roster cannot cast supplemental all_ally_reserves status",async()=>{
 const skill=importCaptureTransferJsonV1(await readFile(new URL("../../"+paths[0],import.meta.url),"utf8")).value.draft.definition;
 const session=createCombatSession({distance:"medium",battleFormat:format,
   fighters:[fighter("player"),fighter("ally"),fighter("opponent")]});
 const cast=session.useSkill({actorId:"player",targetId:"ally",skill});
 assert.equal(cast.ok,false);
 assert.equal(cast.outcome,"reserve_roster_required");
 assert.equal(session.snapshot().fighters.player.energy,40);
});

test("Charge solaire 1v1: authored 45s recharge prevents early recast, reserve buff expires at 30s",async()=>{
 const skill=importCaptureTransferJsonV1(await readFile(new URL("../../"+paths[0],import.meta.url),"utf8")).value.draft.definition;
 const format1v1={actors:[{actorId:"player",teamId:"us"},{actorId:"opponent",teamId:"them"}],
   teamOf(id){return this.actors.find(a=>a.actorId===id)?.teamId??null;}};
 const configs=Object.fromEntries(["p0","p1","e0","e1"].map(id=>[id,fighter(id)]));
 const session=createCombatSession({distance:"medium",battleFormat:format1v1,
   fighters:[{...configs.p0,id:"player"},{...configs.e0,id:"opponent"}]});
 const members=(slotId,ids)=>({slotId,activeMemberId:ids[0],members:ids.map(id=>({
    id,creatureId:id,displayName:id,fighterConfigId:id}))});
 const roster=createRosterSession({combatSession:session,fighterConfigs:configs,battleFormat:format1v1,
   roster:{teams:{player:members("player",["p0","p1"]),opponent:members("opponent",["e0","e1"])}}});
 const cast=()=>roster.useSkillOnTarget({actorId:"player",targetRef:{scope:"active",actorId:"player"},skill});
 assert.equal(cast().ok,true);
 let statuses=roster.reserveMemberSnapshot("player","p1").statusEffects.filter(x=>x.sourceSkillId===skill.id);
 assert.equal(statuses.length,1);
 assert.equal(statuses[0].expiresAtMs,30000);
 session.advanceMs(10000);
 const premature=cast();
 assert.equal(premature.ok,false,"new authored 45s cooldown blocks a second launch");
 assert.equal(premature.outcome,"cooldown");
 assert.equal(roster.reserveMemberSnapshot("player","p1").statusEffects.length,1);
 assert.equal(session.snapshot().fighters.player.energy,37,"rejected cast must not consume energy");
 session.advanceMs(20001);
 assert.equal(roster.reserveMemberSnapshot("player","p1").statusEffects.length,0,"buff expires after authored 30s");
 assert.equal(roster.reserveMemberSnapshot("opponent","e1").statusEffects.length,0);
 session.advanceMs(15000);
 assert.equal(cast().ok,true,"cooldown expired after authored 45s");
 statuses=roster.reserveMemberSnapshot("player","p1").statusEffects.filter(x=>x.sourceSkillId===skill.id);
 assert.equal(statuses.length,1,"fresh buff after cooldown");
 assert.equal(statuses[0].expiresAtMs,75001);
 assert.equal(session.snapshot().fighters.player.energy,34,"two valid casts charge energy twice");
});
