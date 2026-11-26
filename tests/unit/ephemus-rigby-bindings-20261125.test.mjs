import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeCreaturePresentationBindingV10} from "../../src/contracts/creature-presentation-binding-v10.js";
import {createGlobalPresentationAssetResolverV1} from "../../src/assets/global-presentation-asset-resolver-v1.js";
const raw=JSON.parse(readFileSync(new URL("../../data/capture/showcase/Ephemus.capture-creature-transfer-v1.json",import.meta.url),"utf8"));
const slots=[["movement","movement","opponent"],["movementBack","movement","player"],["rangedAttack","attack","opponent"],["rangedAttackBack","attack","player"]];
test("Ephemus four directional sprite bindings survive the existing presentation contract, idle unchanged",()=>{
 const p=normalizeCreaturePresentationBindingV10(raw.draft.presentation);
 for(const [slot,action,view] of slots){
  assert.equal(p.visual[slot].assetId,`pack:capture:creature-ephemus-${action}-${view}-12-v1`);
  assert.equal(p.visual[slot].frameCount,12);
  assert.equal(p.visual[slot].mode,"sprite");
 }
 assert.equal(p.visual.front.assetId,"pack:capture:creature-ephemus-opponent-01");
 assert.equal(p.visual.back.assetId,"pack:capture:creature-ephemus-player-01");
 assert.equal(p.visual.icon.assetId,"pack:capture:creature-ephemus-icon-01");
 assert.equal(p.visual.movementPlayback.mode,"loop");
 assert.ok(!Object.keys(raw.draft.presentation.visual).some(k=>/^idle/i.test(k)));
 assert.equal(p.shadowOffset.y,30);
});
test("exact staged canonical catalog: four bindings resolve and two idle clips remain available without runtime binding",{skip:!process.env.GEN_EPHEMUS_CATALOG},()=>{
 const catalog=JSON.parse(readFileSync(process.env.GEN_EPHEMUS_CATALOG,"utf8"));
 const resolver=createGlobalPresentationAssetResolverV1({assetCatalog:catalog,assetUrlForFile:f=>"https://example.invalid/"+f});
 for(const action of ["movement","attack","idle"])for(const view of ["opponent","player"]){
  const id=`pack:capture:creature-ephemus-${action}-${view}-12-v1`;
  assert.equal(catalog.assets.filter(a=>a.id===id).length,1);
  const asset=resolver(id);
  assert.equal(asset.frameCount,12);assert.equal(asset.frameMs,83);
  assert.equal(asset.playbackMode,action==="attack"?"once":"loop");
 }
});
