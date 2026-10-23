import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {adaptCaptureSkillToSkillDefinition} from "../../src/adapters/input/capture/capture-skill-to-skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createRosterSession} from "../../src/core/combat/roster-session.js";
import {computeCombatDamageV1} from "../../src/core/combat/combat-damage-v1.js";

const read = path => readFileSync(new URL("../../" + path, import.meta.url));
const specs = [
 {id:"aura-lunaire",source:"gensrpg-capture-skill-aura-lunaire-2026-10-23.json",hash:"f43b0f04c2c0072cac281aa5473065fcace38f937a1aa2bf16c4ca41c169d408"},
 {id:"Sacrifice_kitsune",source:"gensrpg-capture-skill-Sacrifice_kitsune-2026-10-23.json",hash:"2f7b3bcc7dfbd5ab05a214d1fdcfcb333f7910fde676a770e8822c60ab1b5e3b"}
];
function active(id){return importCaptureTransferJsonV1(read("data/capture/showcase/"+id+".capture-skill-transfer-v1.json").toString()).value.draft;}
function native(id){const draft=active(id);return adaptCaptureSkillToSkillDefinition({id,definition:draft.definition},draft.presentation);}
const f = (id,hp=100) => ({id,maxHp:100,initialHp:hp,maxEnergy:20,initialEnergy:20});
function arena() {
 const actors=["player","opponent"];
 const format={actors:actors.map(actorId=>({actorId})),teamOf:actorId=>actorId==="player"?"player":"opponent"};
 const session=createCombatSession({distance:"short",battleFormat:format,fighters:[f("player"),f("opponent")]});
 const roster=createRosterSession({
  combatSession:session,recallCooldownMs:0,
  roster:{teams:{
   player:{slotId:"player",activeMemberId:"kitsune",members:[
    {id:"kitsune",creatureId:"kitsune_lunaire",displayName:"Kitsune",fighterConfigId:"kitsune"},
    {id:"ally",creatureId:"ally",displayName:"Allié",fighterConfigId:"ally"}]},
   opponent:{slotId:"opponent",activeMemberId:"opponent-a",members:[
    {id:"opponent-a",creatureId:"opponent-a",displayName:"Adversaire",fighterConfigId:"opponent-a"}]}
  }},
  fighterConfigs:{kitsune:f("kitsune"),ally:f("ally",60),"opponent-a":f("opponent-a")}
 });
 return {session,roster};
}

test("two exact raw author exports are archived and both skills have unique active catalog registrations",()=>{
 for(const spec of specs){
  const original=read("data/capture/source-exports/"+spec.source);
  assert.equal(createHash("sha256").update(original).digest("hex"),spec.hash);
  const path="data/capture/showcase/"+spec.id+".capture-skill-transfer-v1.json";
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p=>p===path).length,1);
  const parsed=active(spec.id);
  assert.equal(parsed.definition.id,spec.id);
  assert.equal(native(spec.id).id,spec.id);
  if(spec.id==="aura-lunaire")assert.deepEqual(read(path),original,"Aura Lunaire is an untouched author export");
 }
 assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.length,
  new Set(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1).size,"no duplicated preset file");
});

test("Sacrifice Kitsune converts three independent immediate statuses to three native lasting ally areas",()=>{
 const raw=JSON.parse(read("data/capture/source-exports/"+specs[1].source));
 assert.deepEqual(raw.draft.definition.effects.map(e=>e.kind),["knockout","persistent_zone","apply_status","apply_status"],
  "retain byte-exact original as proof of configuration flaw");
 const draft=active("Sacrifice_kitsune"),effects=draft.definition.effects;
 assert.deepEqual(draft.definition.targetRelations,["self"]);
 assert.equal(effects.filter(e=>e.kind==="knockout"&&e.targetScope==="self").length,1);
 const zones=effects.filter(e=>e.kind==="persistent_zone");
 assert.equal(zones.length,3);
 assert.equal(new Set(zones.map(z=>z.zoneId)).size,3);
 assert.deepEqual(zones.map(z=>z.tickEffect.status.kind),[
  "energy_regen_modifier","heal_over_time","outgoing_damage_modifier"
 ]);
 for(const zone of zones){
  assert.equal(zone.targetScope,"all_allies");
  assert.equal(zone.tickEffect.targetScope,"all_allies");
  assert.equal(zone.persistAfterRecall,true);
  assert.equal(zone.statusBehavior,"while_inside");
  assert.equal(zone.durationMs,45000);
  assert.equal(zone.radius,"short");
 }
 assert.equal(zones[1].tickEffect.status.amount,10);
 assert.equal(zones[1].tickEffect.status.tickIntervalMs,2000);
 assert.equal(zones[2].tickEffect.status.modifierPct,200);
});

test("native combat route: ultimate KOs Kitsune, retains three zones after KO and heals/buffs the summoned ally",()=>{
 const {session,roster}=arena();
 const use=session.useSkill({actorId:"player",targetId:"player",skill:native("Sacrifice_kitsune")});
 assert.equal(use.ok,true,use.outcome);
 assert.equal(session.snapshot().fighters.player.hp,0,"the sacrifice is real");
 assert.equal(session.snapshot().persistentZones.length,3);
 const r=roster.replaceKnockedOut("player");
 assert.equal(r.ok,true,r.outcome);
 assert.equal(r.outcome,"ko_replaced");
 assert.equal(session.snapshot().persistentZones.length,3,"all native zones persist after owner KO");
 session.advanceMs(1);
 const state=session.snapshot();
 assert.equal(state.fighters.player.hp,60,"newly summoned member starts with its own health");
 const kinds=state.fighters.player.statusEffects.map(x=>x.definition.kind);
 for(const type of ["energy_regen_modifier","heal_over_time","outgoing_damage_modifier"]){
  assert.ok(kinds.includes(type),type+" must be inherited on entry");
 }
 assert.equal(state.fighters.opponent.statusEffects.length,0,"enemies must not get the buff");
 const effective=computeCombatDamageV1({state,attackerId:"player",targetId:"opponent",baseDamage:10}).damage;
 assert.ok(effective>10,"damage modifier acts through the canonical combat calculator");
 session.advanceMs(2000);
 assert.ok(session.snapshot().fighters.player.hp>60,"native HoT tick must heal the replacement");
 session.advanceMs(43000);
 assert.equal(session.snapshot().persistentZones.length,0,"zones expire at their original 45s limit");
});

test("Aura Lunaire retains author heal and damage buff on the normal active target",()=>{
 const {session}=arena();
 const cast=session.useSkill({actorId:"player",targetId:"player",skill:native("aura-lunaire")});
 assert.equal(cast.ok,true,cast.outcome);
 const statuses=session.snapshot().fighters.player.statusEffects;
 assert.deepEqual(statuses.map(s=>s.definition.kind).sort(),["heal_over_time","outgoing_damage_modifier"]);
 assert.equal(active("aura-lunaire").definition.cooldownMs,45000);
});
