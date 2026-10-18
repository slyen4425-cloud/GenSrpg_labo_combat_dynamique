import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {
  importCaptureTransferJsonV1,exportCaptureSkillTransferJsonV1,exportCaptureCreatureTransferJsonV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createRosterSession} from "../../src/core/combat/roster-session.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";

const base="data/capture/showcase/";
const bolt=base+"lib_light_bolt.capture-skill-transfer-v1.json";
const wave=base+"cap_light_atk_5.capture-skill-transfer-v1.json";
const lumilo=base+"crea_lumilo.capture-creature-transfer-v1.json";
const original="data/capture/source-exports/gensrpg-capture-skill-cap_light_atk_5-2026-10-17.json";
const read=async name=>readFile(new URL("../../"+name,import.meta.url));
const json=async name=>JSON.parse((await read(name)).toString("utf8"));
const sha=b=>createHash("sha256").update(b).digest("hex");
const registry=normalizeCaptureStatRegistryV1(await json("data/capture/monster-capture-stat-registry.v1.json"));

test("Author transfers including latest Lumilo are byte-exact and uniquely activated without duplicate IDs",async()=>{
  for(const [p,len,hash] of [
    ["data/capture/source-exports/gensrpg-capture-skill-lib_light_bolt-2026-10-18.json",5456,"68035a9810ce441725e699b1c47ea9e592edb8df5078a1c6c7dc95cb7d86256f"],
    [lumilo,5499,"d3856255f406ed55ae673a0d377af9cb99211337bfdc7f8302b210058815541f"],
    [original,1992,"55b6115d35d1b29b8199aff907a38d81892d78da2e0eefbbb93485ab5a68dd8a"]
  ]){
    const raw=await read(p);
    assert.equal(raw.length,len,p+" author length");
    assert.equal(sha(raw),hash,p+" author hash");
  }
  for(const p of [bolt,wave])
    assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(x=>x===p).length,1);
  assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(x=>x===lumilo).length,1);
  assert.equal(new Set(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1).size,CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.length);
  assert.equal(new Set(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1).size,CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.length);
});

test("Rayon lumineux stays EXACTLY the latest author projectile: 14 light, skill timing, FX and sounds",async()=>{
  const transfer=importCaptureTransferJsonV1((await read(bolt)).toString("utf8"));
  assert.equal(transfer.kind,"skill");
  const d=transfer.value.draft;
  assert.equal(d.id,"lib_light_bolt");
  assert.deepEqual(await read(bolt),await read("data/capture/source-exports/gensrpg-capture-skill-lib_light_bolt-2026-10-18.json"));
  assert.equal(d.definition.name,"Rayon lumineux");
  assert.deepEqual([d.requiredLevel,d.definition.energyCost,d.definition.preparationMs,
    d.definition.travelMs,d.definition.cooldownMs,d.definition.projectileClash.power],
    [1,3,600,600,8000,1]);
  assert.deepEqual(d.definition.effects.map(x=>[x.kind,x.targetScope,x.amount,x.channel]),
    [["damage","target",14,"light"]]);
  assert.equal(d.presentation.visual.travel.assetId,"pack:capture:sprite-projectile-light-01");
  assert.equal(d.presentation.audio.impact.assetId,"gensrpg:sound:genrpg-pack2-f75d0d8f");
  assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(d)).value.draft,d);
});

test("Lumilo source keeps light creature profile, 11 known skills and all five author slots",async()=>{
  const t=importCaptureTransferJsonV1((await read(lumilo)).toString("utf8"),{statRegistry:registry});
  assert.equal(t.kind,"creature");
  const c=t.value;
  assert.equal(c.draft.id,"crea_lumilo");
  assert.equal(c.draft.level,1);
  assert.deepEqual(c.draft.elements,["light"]);
  assert.equal(c.draft.skillIds.length,11);
  assert.equal(c.draft.capture.evolution.targetId,"crea_solarys");
  assert.equal(c.draft.capture.evolution.level,18);
  assert.equal(c.draft.combat.reaction.maxCharges,2);
  assert.deepEqual(c.loadout.slots.map(x=>x.skillId),
    ["lib_light_bolt","lib_magic_barrier","cap_light_special_1","cap_light_atk_3","cap_light_atk_5"]);
  assert.equal(c.draft.presentation.visual.front.assetId,"pack:capture:creature-renard-magique-dore-opponent-01");
  assert.equal(c.draft.presentation.visual.back.assetId,"pack:capture:creature-renard-magique-dore-player-01");
  assert.deepEqual(importCaptureTransferJsonV1(
    exportCaptureCreatureTransferJsonV1(c,{statRegistry:registry}),{statRegistry:registry}).value,c);
});

test("Onde lumineuse author correction only: reserve DAMAGE replaced by 100 HEAL, active 100 HEAL unchanged",async()=>{
  const author=await json(original),active=await json(wave);
  assert.deepEqual(author.draft.definition.effects.map(x=>[x.kind,x.targetScope,x.amount]),[
    ["heal","all_allies",100],["damage","all_ally_reserves",100]
  ]);
  const d=active.draft;
  assert.equal(d.id,"cap_light_atk_5");
  assert.equal(d.requiredLevel,20);
  assert.equal(d.definition.loadoutSlot,"ultimate");
  assert.equal(d.definition.maxUsesPerCombat,1);
  assert.deepEqual(d.definition.effects,[
    {kind:"heal",targetScope:"all_allies",amount:100},
    {kind:"heal",targetScope:"all_ally_reserves",amount:100}
  ]);
  assert.deepEqual({...active,draft:{...active.draft,definition:{
    ...active.draft.definition,effects:author.draft.definition.effects
  }}},author,"all other skill fields must match the uploaded source");
  const t=importCaptureTransferJsonV1(JSON.stringify(active));
  assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(t.value.draft)).value,t.value);
});

const f=(id,hp=100)=>({
 id,maxHp:100,initialHp:hp,maxEnergy:30,initialEnergy:30,energyChargeAmount:0,
 energyChargeIntervalMs:1000,movementEnergyPerStep:0
});
const format={
 actors:[{actorId:"player",teamId:"heroes"},{actorId:"ally",teamId:"heroes"},{actorId:"opponent",teamId:"enemies"}],
 teamOf(id){return this.actors.find(x=>x.actorId===id)?.teamId??null;}
};
function combat(){
 const conf=Object.fromEntries(["p0","p1","p2","a0","a1","e0","e1"].map(id=>[id,f(id,30)]));
 const session=createCombatSession({distance:"medium",battleFormat:format,
  fighters:[{...conf.p0,id:"player"},{...conf.a0,id:"ally"},{...conf.e0,id:"opponent"}]});
 const team=(actorId,ids)=>({slotId:actorId,activeMemberId:ids[0],
   members:ids.map((id,i)=>({id,creatureId:id,displayName:id,fighterConfigId:id}))});
 const roster=createRosterSession({combatSession:session,fighterConfigs:conf,battleFormat:format,
   roster:{teams:{player:team("player",["p0","p1","p2"]),
   ally:team("ally",["a0","a1"]),opponent:team("opponent",["e0","e1"])}}});
 return {session,roster};
}
test("REAL authored Onde lumineuse heals active allies and EVERY allied reserve once; enemies remain untouched",async()=>{
 const draft=(await json(wave)).draft;
 const skill=normalizeSkillDefinition(draft.definition);
 const {session,roster}=combat();
 const cast=roster.useSkillOnTarget({actorId:"player",targetRef:{scope:"active",actorId:"ally"},skill});
 assert.equal(cast.ok,true);
 assert.equal(session.snapshot().fighters.player.hp,100);
 assert.equal(session.snapshot().fighters.ally.hp,100);
 assert.equal(roster.reserveMemberSnapshot("player","p1").hp,100);
 assert.equal(roster.reserveMemberSnapshot("player","p2").hp,100);
 assert.equal(roster.reserveMemberSnapshot("ally","a1").hp,100);
 assert.equal(session.snapshot().fighters.opponent.hp,30);
 assert.equal(roster.reserveMemberSnapshot("opponent","e1").hp,30);
 assert.equal(session.snapshot().fighters.player.energy,20);
 assert.equal(session.snapshot().fighters.player.skillUseCounts[skill.id],1);
 assert.equal(Object.keys(session.snapshot().fighters).some(id=>id.startsWith("__reserve__")),false);
 assert.equal(roster.useSkillOnTarget({actorId:"player",targetRef:{scope:"active",actorId:"ally"},skill}).ok,false);
});
