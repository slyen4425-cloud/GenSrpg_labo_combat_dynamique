import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 as SKILLS} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {builtInBurrowSpriteAssetV1} from "../../src/assets/burrow-terrain-builtins-v1.js";
const path="data/capture/showcase/attaque-sous-terraine.capture-skill-transfer-v1.json";
test("user's full underground attack is registered once in the real skill library",()=>{
 assert.equal(SKILLS.filter(x=>x===path).length,1);
 const raw=readFileSync(new URL("../../"+path,import.meta.url),"utf8");
 const registry=normalizeCaptureStatRegistryV1(JSON.parse(readFileSync(new URL("../../data/capture/monster-capture-stat-registry.v1.json",import.meta.url),"utf8")));
 const imported=importCaptureTransferJsonV1(raw,{statRegistry:registry});
 assert.equal(imported.kind,"skill");
 const d=imported.value.draft;
 assert.equal(d.id,"attaque-sous-terraine");
 assert.equal(d.definition.approachMode,"burrow");
 assert.equal(d.definition.category,"offensive");
 assert.equal(d.definition.form,"contact");
 assert.deepEqual(d.definition.hitPresenceStates,["surface","underground"]);
 assert.equal(d.definition.travelMs,2000);
 assert.equal(d.definition.effects.find(x=>x.kind==="damage")?.amount,15);
 assert.equal(d.presentation.visual.burrowTerrain.start.assetId,"burrow:start");
 assert.equal(d.presentation.visual.burrowTerrain.travel.assetId,"burrow:travel");
 assert.equal(d.presentation.visual.burrowTerrain.impact.assetId,"burrow:impact");
 for(const stage of ["start","travel","impact"]){
  const url=builtInBurrowSpriteAssetV1("burrow:"+stage).url;
  assert.ok(url.endsWith("sprite_burrow_"+stage+"_atlas.webp"));
 }
 assert.equal(d.presentation.audio.impact.assetId,"gensrpg:sound:genrpg-pack2-742f6521");
});
