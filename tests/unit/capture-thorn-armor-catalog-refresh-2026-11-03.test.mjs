import test from "node:test";
import assert from "node:assert/strict";
import { GLOBAL_VISUAL_LIBRARY, globalVisualAssetUrl } from "../../src/assets/global-visual-library.js";
import { createGlobalPresentationAssetResolverV1 } from "../../src/assets/global-presentation-asset-resolver-v1.js";

test("Thorn armor uses refreshed canonical catalog; the renderer receives the mask only", () => {
  assert.equal(GLOBAL_VISUAL_LIBRARY.branch,"global-assets");
  const version = GLOBAL_VISUAL_LIBRARY.revision.match(/^\d{4}-\d{2}-\d{2}-v(\d+)-[a-z0-9-]+$/);
  assert.ok(version && Number(version[1])>=54,"Thorn armor requires catalog cache revision v54+");
  assert.ok(GLOBAL_VISUAL_LIBRARY.catalogUrl.includes("/global-assets/data/assets/catalog/global-visual-assets.v1.json?v="+GLOBAL_VISUAL_LIBRARY.revision));
  const atlas = "capture/sprites/skills/armure_ronces_plante_carnivore/atlases/armure_ronces_plante_carnivore_atlas_6f.webp";
  const url = globalVisualAssetUrl(atlas);
  assert.ok(url.includes("/global-assets/assets/library/"+atlas));
  assert.ok(url.includes("?v="+GLOBAL_VISUAL_LIBRARY.revision));
  const id="pack:capture:sprite-armure-ronces-plante-carnivore-01";
  const definition={id,assetType:"sprite",mediaType:"image",category:"skill",tags:["nature","overlay"],
    resource:{file:atlas,format:"sprite-strip",mime:"image/webp",frameCount:6,frameMs:135,playbackMode:"once",holdLastFrame:true,persistentFrameIndex:5}};
  const resolve=createGlobalPresentationAssetResolverV1({assetCatalog:{assets:[definition]},assetUrlForFile:globalVisualAssetUrl});
  const sprite=resolve(id);
  assert.equal(sprite.assetId,id);
  assert.equal(sprite.frameCount,6);
  assert.equal(sprite.frameMs,135);
  assert.equal(sprite.playbackMode,"once");
  assert.equal(sprite.url,url);
  assert.ok(!sprite.url.includes("sur_creature"),"Never consume composite preview in game");
  assert.equal(resolve("pack:capture:sprite-armure-ronces-plante-carnivore-other"),null);
});
