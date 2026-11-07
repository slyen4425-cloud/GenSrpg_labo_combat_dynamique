import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {importCaptureTransferJsonV1, exportCaptureSkillTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 as catalog} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";

const read=path=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const published={
 "cap_water_atk_2":"data/capture/showcase/cap_water_atk_2.capture-skill-transfer-v1.json",
 "attaque-sous-terraine":"data/capture/showcase/attaque-sous-terraine.capture-skill-transfer-v1.json"
};

test("author's two replacement skills each occupy exactly one official active library entry and round-trip",()=>{
 for(const [id,path] of Object.entries(published)){
  assert.equal(catalog.filter(x=>x===path).length,1,"duplicate or missing catalog ID "+id);
  const raw=read(path),transfer=JSON.parse(raw);
  assert.equal(transfer.schema,"capture-skill-transfer-v1");
  assert.equal(transfer.draft.id,id);
  assert.equal(transfer.draft.definition.id,id);
  assert.equal(transfer.draft.definition.approachMode,"burrow");
  const imported=importCaptureTransferJsonV1(raw);
  assert.equal(imported.kind,"skill");
  assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(imported.value.draft)).value.draft,imported.value.draft);
 }
});

test("new Morsure de marée preserves authored contact water damage, energy drain and three selectable burrow sprites",()=>{
 const draft=JSON.parse(read(published.cap_water_atk_2)).draft;
 assert.equal(draft.definition.name,"Morsure de marée");
 assert.equal(draft.definition.element,"water");
 assert.equal(draft.definition.energyCost,5);
 assert.equal(draft.definition.travelMs,1100);
 assert.equal(draft.definition.recoveryMs,0);
 assert.equal(draft.definition.cooldownMs,20000);
 assert.equal(draft.requiredLevel,5);
 assert.equal(draft.presentation.version,13);
 assert.deepEqual(draft.definition.effects.map(x=>[x.kind,x.amount]),[["damage",20],["energy_drain",3]]);
 const terrain=draft.presentation.visual.burrowTerrain;
 assert.deepEqual(["start","travel","impact"].map(s=>terrain[s].assetId),[
  "pack:capture:sprite-pressurized-jet-impact-01","pack:capture:sprite-cast-water-01","burrow:impact"
 ]);
 assert.deepEqual(["start","travel","impact"].map(s=>terrain[s].scale),[1.2,1.2,1]);
 assert.deepEqual(["start","travel","impact"].map(s=>terrain[s].offsetY),[-25,0,0]);
 assert.equal(draft.presentation.visual.impact.assetId,"pack:capture:sprite-impact-physical-01");
 assert.equal(draft.presentation.visual.icon.assetId,"pack:capture:icon-skill-marine-bite-01");
 assert.equal(draft.presentation.feedback.cameraShake.amplitudePx,120);
});

test("new Attaque sous-terraine retains combat contract and author exactly adjusted terrain geometry",()=>{
 const draft=JSON.parse(read(published["attaque-sous-terraine"])).draft;
 assert.equal(draft.requiredLevel,10);
 assert.equal(draft.definition.element,"earth");
 assert.equal(draft.definition.preparationMs,900);
 assert.equal(draft.definition.travelMs,2000);
 assert.equal(draft.definition.cooldownMs,25000);
 assert.equal(draft.definition.effects[0].amount,15);
 const terrain=draft.presentation.visual.burrowTerrain;
 assert.deepEqual(["start","travel","impact"].map(s=>terrain[s].assetId),["burrow:start","burrow:travel","burrow:impact"]);
 assert.deepEqual(["start","travel","impact"].map(s=>terrain[s].scale),[1.5,1.5,1]);
 assert.deepEqual(["start","travel","impact"].map(s=>terrain[s].offsetY),[-25,-50,0]);
 assert.equal(draft.presentation.audio.impact.assetId,"gensrpg:sound:genrpg-pack2-742f6521");
});
