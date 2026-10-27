import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
const read=async p=>readFile(new URL("../../"+p,import.meta.url),"utf8");
for(const [id,kind] of [["crea_nat_1","creature"],["coupe_feuille","skill"]]){
 test("author export "+id+" is preserved and registered once",async()=>{
  const suffix=kind==="creature"?"creature":"skill";
  const live="data/capture/showcase/"+id+".capture-"+suffix+"-transfer-v1.json";
  const archived="data/capture/source-exports/gensrpg-capture-"+suffix+"-"+id+"-2026-10-27.json";
  assert.equal(await read(live),await read(archived));
  const catalog=kind==="creature"?CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1:CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1;
  assert.equal(catalog.filter(p=>p===live).length,1);
  const registry=normalizeCaptureStatRegistryV1(JSON.parse(await read("data/capture/monster-capture-stat-registry.v1.json")));
  const imported=importCaptureTransferJsonV1(await read(live),{statRegistry:registry});
  assert.equal(imported.kind,kind);
  assert.equal(imported.value.draft.id,id);
 });
}
test("Grainou points to the three approved Hériplante media assets",async()=>{
 const j=JSON.parse(await read("data/capture/showcase/crea_nat_1.capture-creature-transfer-v1.json"));
 assert.equal(j.draft.displayName,"Grainou");
 assert.deepEqual(["front","back","icon"].map(k=>j.draft.presentation.visual[k].assetId),[
  "pack:capture:creature-heriplante-opponent-01",
  "pack:capture:creature-heriplante-player-01",
  "pack:capture:creature-heriplante-icon-01"
 ]);
 assert.equal(j.loadout.slots.length,5);
});
test("Coupe feuille preserves the user-authored damage and resistance bypass",async()=>{
 const j=JSON.parse(await read("data/capture/showcase/coupe_feuille.capture-skill-transfer-v1.json"));
 assert.equal(j.draft.definition.element,"nature");
 assert.equal(j.draft.definition.effects[0].amount,15);
 assert.equal(j.draft.definition.effects[0].ignoreResistancePct,30);
 assert.equal(j.draft.definition.effects[0].ignoreDamageReductionPct,30);
});
