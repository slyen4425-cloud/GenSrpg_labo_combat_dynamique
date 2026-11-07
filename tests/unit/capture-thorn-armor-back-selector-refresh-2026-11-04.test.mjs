import test from "node:test";
import assert from "node:assert/strict";
import { GLOBAL_VISUAL_LIBRARY, globalVisualAssetUrl } from "../../src/assets/global-visual-library.js";
import { createGlobalPresentationAssetResolverV1 } from "../../src/assets/global-presentation-asset-resolver-v1.js";
import { captureEditorAssetMatchesRoleV1, humanVisualAssetElementV1 } from "../../src/ui/capture-editor-human-v2.js";

test("Thorn armor BACK appears only as Nature / status overlay from canonical catalog v57+",()=>{
  assert.equal(GLOBAL_VISUAL_LIBRARY.branch,"global-assets");
  const ver = GLOBAL_VISUAL_LIBRARY.revision.match(/-v([0-9]+)-/);
  assert.ok(ver && Number(ver[1])>=57,"back mask needs new cache revision >=57");
  const id="pack:capture:sprite-armure-ronces-plante-carnivore-back-01";
  const frontId="pack:capture:sprite-armure-ronces-plante-carnivore-01";
  const path="capture/sprites/skills/armure_ronces_plante_carnivore/back/atlases/armure_ronces_dos_6f.webp";
  const visual={id,assetType:"sprite",mediaType:"image",category:"skill",
    tags:["capture","skill","nature","defense","overlay","status","player","back"],
    resource:{file:path,format:"sprite-strip",mime:"image/webp",frameCount:6,frameMs:138,
              playbackMode:"once",holdLastFrame:true,persistentFrameIndex:5},
    compatibility:{uses:["combat","capture","editor"]}};
  assert.equal(humanVisualAssetElementV1(visual),"nature");
  assert.equal(captureEditorAssetMatchesRoleV1(visual,"status"),true);
  assert.equal(captureEditorAssetMatchesRoleV1(visual,"creature"),false);
  assert.equal(captureEditorAssetMatchesRoleV1(visual,"movement"),false);
  assert.equal(captureEditorAssetMatchesRoleV1(visual,"attack"),false);
  const resolver = createGlobalPresentationAssetResolverV1({
    assetCatalog:{assets:[visual]},assetUrlForFile:globalVisualAssetUrl
  });
  const media = resolver(id);
  assert.equal(media.assetId,id);
  assert.equal(media.frameCount,6);
  assert.equal(media.frameMs,138);
  assert.equal(media.playbackMode,"once");
  assert.equal(media.url,globalVisualAssetUrl(path));
  assert.ok(media.url.includes("/global-assets/assets/library/"+path));
  assert.ok(media.url.includes("?v="+GLOBAL_VISUAL_LIBRARY.revision));
  assert.ok(!media.url.includes("sur_creature"),"composite preview prohibited as runtime sprite");
  assert.equal(resolver(frontId),null,"front is separate and has not been changed in this fixture");
});