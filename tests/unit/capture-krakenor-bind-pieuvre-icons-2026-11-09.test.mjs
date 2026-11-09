import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {captureCreatureVisualBindingForIdV1} from "../../src/catalogs/capture-creature-visual-bindings-v1.js";
import {GLOBAL_VISUAL_LIBRARY} from "../../src/assets/global-visual-library.js";
const read=async relative=>readFile(new URL("../../"+relative,import.meta.url),"utf8");
const ids=["krakenor-perle-pression","krakenor-etau-tentaculaire","krakenor-voile-encre","krakenor-bulle-implosion","krakenor-abysse-huit-bras"];
const icons=["pack:capture:icon-skill-cascade-percutante-01","pack:capture:icon-skill-harpon-des-marees-01","pack:capture:icon-skill-brume-du-neant-01","pack:capture:icon-skill-bulles-captives-01","pack:capture:icon-skill-spirale-des-abysses-01"];
test("Krakenor uses exactly one canonical creature transfer and five active unique skills",async()=>{
 const registry=normalizeCaptureStatRegistryV1(JSON.parse(await read("data/capture/monster-capture-stat-registry.v1.json")));
 const file="data/capture/showcase/crea_mer_3.capture-creature-transfer-v1.json";
 assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(x=>x===file).length,1);
 const imported=importCaptureTransferJsonV1(await read(file),{statRegistry:registry});
 assert.equal(imported.kind,"creature");
 const c=imported.value;
 assert.equal(c.draft.id,"crea_mer_3");
 assert.equal(c.draft.displayName,"Krakenor");
 assert.deepEqual(c.draft.skillIds,ids);
 assert.deepEqual(c.loadout.slots.map(x=>x.skillId),ids);
 assert.equal(c.draft.combat.maxHp,c.statValues.values.health);
 assert.equal(c.draft.resistances.find(x=>x.kind==="element:electric").value,-50);
 assert.equal(c.draft.presentation.profileId,"serpentine");
 assert.deepEqual(Object.keys(c.draft.presentation.visual).sort(),["back","front","icon"]);
 assert.deepEqual([
  c.draft.presentation.visual.front.assetId,
  c.draft.presentation.visual.back.assetId,
  c.draft.presentation.visual.icon.assetId
 ],["pack:capture:creature-pieuvre-opponent-01","pack:capture:creature-pieuvre-player-01","pack:capture:creature-pieuvre-icon-01"]);
 assert.equal(captureCreatureVisualBindingForIdV1("crea_mer_3"),null,"explicit authored presentation must remain the sole owner, no incomplete metadata override");
 assert.match(GLOBAL_VISUAL_LIBRARY.revision,/2026-11-09-v62-krakenor-icons80-ui18/);
});
test("Five unused Nov-9 skill icons are new, unique and not assigned to another Showcase skill",async()=>{
 const iconOwners=new Map();
 const all=CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1;
 assert.equal(new Set(icons).size,5);
 for(const path of all){
   const d=JSON.parse(await read(path)).draft;
   const id=d.presentation?.visual?.icon?.assetId;
   if(icons.includes(id)){
     assert.ok(ids.includes(d.id),"new Krakenor icon is not used by another skill: "+d.id);
     assert.equal(iconOwners.has(id),false,"new water icon is assigned once");
     iconOwners.set(id,d.id);
   }
 }
 assert.deepEqual([...iconOwners.values()].sort(),[...ids].sort());
 assert.ok(icons.every(id=>id.startsWith("pack:capture:icon-skill-")));
});
test("Krakenor source defines no fake movement or attack sprite slots",async()=>{
 const p=JSON.parse(await read("data/capture/showcase/crea_mer_3.capture-creature-transfer-v1.json")).draft.presentation;
 for(const key of ["movement","movementBack","rangedAttack","rangedAttackBack","movementPlayback","rangedAttackScaleByView","movementScaleByView"]){
   assert.equal(Object.hasOwn(p.visual,key),false,key);
 }
});
