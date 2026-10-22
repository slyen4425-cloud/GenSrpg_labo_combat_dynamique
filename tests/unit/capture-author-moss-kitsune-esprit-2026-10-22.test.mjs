import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {normalizeCaptureStatRegistryV1,captureStatDefinitionForIdV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {normalizeCaptureCreatureStatValuesV1} from "../../src/contracts/capture-creature-stat-values-v1.js";
import {normalizeCreaturePresentationBinding} from "../../src/contracts/creature-presentation-binding.js";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {creatureMovementAppearanceForViewV1,creatureRangedAppearanceForViewV1} from "../../src/ui/demo-app.js";

const read=path=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const registry=normalizeCaptureStatRegistryV1(JSON.parse(read("data/capture/monster-capture-stat-registry.v1.json")));
const active=id=>"data/capture/showcase/"+id+".capture-creature-transfer-v1.json";
const archive=id=>"data/capture/source-exports/gensrpg-capture-creature-"+id+"-2026-10-22.json";
const moss="crea_mossback",kitsune="kitsune_lunaire";
const visuals={
  moss:[
    "pack:capture:creature-golem-moussu-opponent-01",
    "pack:capture:creature-golem-moussu-player-01",
    "pack:capture:creature-golem-moussu-icon-01",
    "pack:capture:creature-golem-moussu-movement-face-12-v1",
    "pack:capture:creature-golem-moussu-movement-dos-12-v1",
    "pack:capture:creature-golem-moussu-attack-face-12-v1",
    "pack:capture:creature-golem-moussu-attack-dos-12-v1"
  ],
  kitsune:[
    "pack:capture:creature-renard-lunaire-opponent-01",
    "pack:capture:creature-renard-lunaire-player-01",
    "pack:capture:creature-renard-lunaire-icon-01"
  ]
};
test("Esprit appends to original 14 canonical stats; channels preserved as authored",()=>{
 const ids=registry.stats.map(s=>s.id);
 assert.equal(ids.length,15);
 assert.deepEqual(ids.slice(-3),["acier","nature","esprit"]);
 assert.equal(new Set(ids).size,15);
 const spirit=captureStatDefinitionForIdV1(registry,"esprit");
 assert.equal(spirit.label,"Esprit");
 assert.equal(spirit.damageChannel,"esprit");
 assert.equal(spirit.resistanceChannel,"spirit");
 assert.equal(spirit.damagePctPerPoint,1);
 assert.equal(spirit.resistancePctPerPoint,1);
 const old=normalizeCaptureCreatureStatValuesV1({schema:"capture-creature-stat-values-v1",creatureId:"legacy",values:{acier:4,nature:3}},registry);
 assert.equal(Object.hasOwn(old.values,"esprit"),false,"legacy stat arrays without esprit remain valid");
 assert.equal(captureStatDefinitionForIdV1(registry,"nature").resistanceChannel,"nature");
});
test("Kitsune is unique in the active catalog; old source remains immutable",()=>{
 assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(p=>p===active(kitsune)).length,1);
 assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(p=>p===active(moss)).length,1);
 for(const id of [kitsune,moss]){
   assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.includes(archive(id)),false);
   if(id===moss)assert.equal(read(active(id)),read(archive(id)));
   else assert.equal(read(active(id)),read("data/capture/source-exports/gensrpg-capture-creature-kitsune_lunaire-2026-10-22-r2.json"));
   const normalized=importCaptureTransferJsonV1(read(active(id)),{statRegistry:registry});
   assert.equal(normalized.kind,"creature");
   assert.equal(normalized.value.draft.id,id);
   const normalizedVisual=normalizeCreaturePresentationBinding(JSON.parse(JSON.stringify(normalized.value.draft.presentation)));
   assert.deepEqual(normalizedVisual,normalized.value.draft.presentation);
   assert.equal(normalized.value.statValues.values.esprit,0);
 }
});
test("Moussados V9 uses four distinct official 12-frame movement/attack assets FACE and DOS",()=>{
 const {value}=importCaptureTransferJsonV1(read(active(moss)),{statRegistry:registry});
 const p=value.draft.presentation,visual=p.visual;
 assert.equal(value.draft.displayName,"Moussados");
 assert.equal(p.version,9);
 assert.equal(p.profileId,"massive");
 const slots=["front","back","icon","movement","movementBack","rangedAttack","rangedAttackBack"];
 for(const [i,role] of slots.entries())assert.equal(visual[role].assetId,visuals.moss[i],role);
 assert.equal(visual.movementPlayback.mode,"loop");
 assert.equal(visual.movementPlayback.frameMs,0);
 assert.equal(p.viewOverrides.player.displayScale,1.7);
 assert.equal(p.viewOverrides.opponent.displayScale,.9);
 assert.equal(p.viewOverrides.opponent.position.x,-30);
 assert.equal(p.viewOverrides.opponent.position.y,35);
 assert.equal(p.audio.movement.assetId,"gensrpg:sound:genrpg-pack2-f75d0d8f");
 assert.deepEqual(value.loadout.slots.map(s=>s.skillId),[
   "cap_earth_atk_2","lib_earth_guard","cap_earth_atk_4","cap_earth_atk_3","cap_earth_atk_7"
 ]);
 for(const id of value.loadout.slots.map(s=>s.skillId))assert.ok(
   CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.some(f=>f.endsWith("/"+id+".capture-skill-transfer-v1.json")),id+" must be in canonical skills");
 assert.equal(value.statValues.values.earth,10);
 assert.equal(value.statValues.values.nature,0);
 assert.equal(p.sockets.length,5);
});
test("Kitsune Lunaire keeps static Renard FACE/DOS/icon and now equips three author skills without inventing animation",()=>{
 const {value}=importCaptureTransferJsonV1(read(active(kitsune)),{statRegistry:registry});
 const p=value.draft.presentation,visual=p.visual;
 assert.equal(value.draft.displayName,"Kitsune Lunaire");
 assert.deepEqual(value.draft.elements,["spirit"]);
 assert.equal(p.version,2);
 assert.equal(p.profileId,"quadruped");
 assert.deepEqual([visual.front.assetId,visual.back.assetId,visual.icon.assetId],visuals.kitsune);
 assert.equal(visual.movement,undefined);
 assert.equal(visual.movementBack,undefined);
 assert.equal(visual.rangedAttack,undefined);
 assert.equal(visual.rangedAttackBack,undefined);
 assert.deepEqual(value.draft.skillIds,["teleport-strike","Onde Spirituel","fleche_spirituel"]);
 assert.deepEqual(value.loadout.slots.map(s=>s.skillId),["teleport-strike","Onde Spirituel","fleche_spirituel",null,null]);
 assert.equal(p.viewOverrides.player.displayScale,1);
 assert.equal(p.viewOverrides.opponent.displayScale,.7);
 assert.deepEqual(p.viewOverrides.opponent.position,{x:-30,y:50});
 for(const id of value.draft.skillIds)assert.ok(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.some(f=>f.endsWith("/"+id+".capture-skill-transfer-v1.json")),id+" missing from active skill presets");
 assert.equal(value.statValues.values.health,110);
 assert.equal(value.statValues.values.speed,20);
 assert.equal(value.draft.combat.approachTimeModifierPct,-40);
 assert.equal(value.draft.combat.reaction.type,"dodge");
 assert.equal(value.draft.combat.reaction.maxCharges,3);
 assert.equal(value.draft.combat.reaction.rechargeMs,20000);
 assert.equal(value.draft.combat.reaction.activeWindowMs,400);
});
test("Moussados original movement and attack FACE/DOS are not overwritten with single-image fallbacks",()=>{
 const {value}=importCaptureTransferJsonV1(read(active(moss)),{statRegistry:registry});
 const p=value.draft.presentation;
 const proxy={
   id:moss,views:{player:"",opponent:""},
   visual:{
     movement:{assetId:p.visual.movement.assetId},
     movementBack:{assetId:p.visual.movementBack.assetId},
     rangedAttack:{assetId:p.visual.rangedAttack.assetId},
     rangedAttackBack:{assetId:p.visual.rangedAttackBack.assetId}
   },
   movement:p.visual.movement,
   movementBack:p.visual.movementBack,
   rangedAttack:p.visual.rangedAttack,
   rangedAttackBack:p.visual.rangedAttackBack
 };
 // Ensure both directional bindings survive the author import and are distinct.
 assert.notEqual(p.visual.movement.assetId,p.visual.movementBack.assetId);
 assert.notEqual(p.visual.rangedAttack.assetId,p.visual.rangedAttackBack.assetId);
});
