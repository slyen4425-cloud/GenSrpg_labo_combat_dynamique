import assert from "node:assert/strict";
import test from "node:test";
import { GLOBAL_VISUAL_LIBRARY,globalVisualAssetUrl } from "../../src/assets/global-visual-library.js";
import { createGlobalPresentationAssetResolverV1 } from "../../src/assets/global-presentation-asset-resolver-v1.js";

const id="pack:capture:icon-skill-tailwind-feather-01";
const file="capture/icons/skills/icon_skill_tailwind_feather_01.webp";
test("Vent arrière exposes the new version of the one canonical library",()=>{
  assert.equal(GLOBAL_VISUAL_LIBRARY.repository,"slyen4425-cloud/GenSrpg_labo_combat_dynamique");
  assert.equal(GLOBAL_VISUAL_LIBRARY.branch,"global-assets");
  assert.ok(Number(GLOBAL_VISUAL_LIBRARY.revision.match(/-v(\d+)-/)?.[1])>=28,"tailwind cache revision must not regress");
  const catalogURL=new URL(GLOBAL_VISUAL_LIBRARY.catalogUrl);
  assert.ok(catalogURL.pathname.endsWith("/global-assets/data/assets/catalog/global-visual-assets.v1.json"));
  assert.equal(catalogURL.searchParams.get("v"),GLOBAL_VISUAL_LIBRARY.revision);
});
test("Vent arrière's assetId resolves through existing presentation code, no second loader or auto-binding",()=>{
 const resolver=createGlobalPresentationAssetResolverV1({
   assetCatalog:{assets:[{id,label:"Vent arrière",assetType:"icon",category:"skill",resource:{file,mime:"image/webp"}}]},
   assetUrlForFile:globalVisualAssetUrl
 });
 const result=resolver(id);
 assert.equal(result.assetId,id);
 assert.equal(result.frameCount,1);
 assert.equal(result.playbackMode,"once");
 const url=new URL(result.url);
 assert.ok(url.pathname.endsWith("/global-assets/assets/library/"+file));
 assert.equal(url.searchParams.get("v"),GLOBAL_VISUAL_LIBRARY.revision);
 assert.ok(!url.pathname.includes("/work/"));
 assert.equal(resolver("pack:capture:icon-skill-not-real"),null);
});
