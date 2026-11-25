import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeCreaturePresentationBinding} from "../../src/contracts/creature-presentation-binding.js";
import {createGlobalPresentationAssetResolverV1} from "../../src/assets/global-presentation-asset-resolver-v1.js";
import {captureEditorAssetMatchesRoleV1} from "../../src/ui/capture-editor-human-v2.js";
const read = p => JSON.parse(readFileSync(p,"utf8"));
test("staged native GIFs resolve in the existing chooser and V11 binding without losing historical fields",{skip:!process.env.GEN_IDLE_CATALOG},()=>{
 const c=read(process.env.GEN_IDLE_CATALOG),r=read(process.env.GEN_IDLE_REPORT);
 const resolve=createGlobalPresentationAssetResolverV1({assetCatalog:c,assetUrlForFile:f=>"https://example.invalid/"+f});
 assert.equal(r.items.length,46);assert.equal(Object.keys(r.bindings).length,23);
 for(const pair of Object.values(r.bindings)){
  const raw=read(new URL("../../data/capture/showcase/"+pair.showcase+".capture-creature-transfer-v1.json",import.meta.url)).draft.presentation;
  const {showcase,...idle}=pair;
  // Compare using identical V10 migration path so existing optional/default fields remain intact.
  const migrated=normalizeCreaturePresentationBinding({...raw,version:10});
  const next=normalizeCreaturePresentationBinding({...raw,version:11,visual:{...raw.visual,idle}});
  const {idle:actual,...rest}=next.visual;
  assert.deepEqual(actual,idle);
  assert.deepEqual({...next,version:10,visual:rest},migrated);
  for(const id of [idle.frontAssetId,idle.backAssetId]){
   const a=c.assets.filter(x=>x.id===id);
   assert.equal(a.length,1);
   assert.equal(a[0].resource.mime,"image/gif");
   assert.equal(captureEditorAssetMatchesRoleV1(a[0],"idle"),true);
   assert.equal(captureEditorAssetMatchesRoleV1(a[0],"movement"),false);
   assert.equal(captureEditorAssetMatchesRoleV1(a[0],"attack"),false);
   const resolved=resolve(id);assert.equal(resolved.frameCount,1);assert.match(resolved.url,/\.gif$/);
  }
 }
});
