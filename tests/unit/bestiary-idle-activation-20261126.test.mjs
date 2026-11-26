import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {beforeBestiaryIdleActivationBytesV1} from "../helpers/bestiary-idle-activation-archive-v1.mjs";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {normalizeCreaturePresentationBinding} from "../../src/contracts/creature-presentation-binding.js";

const read=path=>JSON.parse(readFileSync(new URL("../../"+path,import.meta.url),"utf8"));
test("every published creature with a certified idle pair has its own FACE and DOS, combined engine mode, scale 1.2",()=>{
 const files=CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1;
 assert.equal(files.length,25);
 const ids=new Set();
 let configured=0,waiting=0;
 for(const path of files){
  const p=read(path).draft.presentation;
  if(path.endsWith("/Ephemus.capture-creature-transfer-v1.json")){
   // Separate #398 owns the as-yet unpublished Ephemus animation media.
   waiting++;continue;
  }
  const normalized=normalizeCreaturePresentationBinding(p);
  assert.equal(normalized.version,11,path);
  const idle=normalized.visual.idle;
  assert.equal(idle.mode,"both",path);
  assert.equal(idle.front.displayScale,1.2,path);
  assert.equal(idle.back.displayScale,1.2,path);
  assert.equal(idle.frontAssetId,p.visual.front.assetId.replace(/-opponent-(01|v1)$/,"-idle-opponent-gif-v1"),path);
  assert.equal(idle.backAssetId,p.visual.back.assetId.replace(/-player-(01|v1)$/,"-idle-player-gif-v1"),path);
  for(const id of [idle.frontAssetId,idle.backAssetId]){
   assert.ok(id.includes("-idle-"),path);
   assert.ok(!ids.has(id),"shared or duplicate idle "+id);ids.add(id);
  }
  assert.deepEqual(normalizeCreaturePresentationBinding(normalized),normalized,path);
  configured++;
 }
 assert.equal(configured,24);assert.equal(ids.size,48);assert.equal(waiting,1);
});

test("all 24 live cards reconstruct the exact pre-activation Git blobs; no other author fields changed",()=>{
 for(const path of CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1){
  if(path.endsWith("/Ephemus.capture-creature-transfer-v1.json")) continue;
  beforeBestiaryIdleActivationBytesV1(readFileSync(new URL("../../"+path,import.meta.url)));
 }
});
