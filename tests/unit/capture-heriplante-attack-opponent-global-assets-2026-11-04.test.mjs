import test from "node:test";
import assert from "node:assert/strict";
import {GLOBAL_VISUAL_LIBRARY,globalVisualAssetUrl} from "../../src/assets/global-visual-library.js";
import {createGlobalPresentationAssetResolverV1} from "../../src/assets/global-presentation-asset-resolver-v1.js";
import {captureEditorCreatureVisualKindV1,captureEditorAssetMatchesRoleV1} from "../../src/ui/capture-editor-human-v2.js";
const id="pack:capture:creature-heriplante-attack-opponent-12-v1";
const file="capture/creatures/heriplante/animations/attack/opponent/atlases/heriplante_attack_opponent_12f_strip.webp";
const asset={id,label:"Hériplante — attaque adversaire 12 frames",assetType:"sprite",mediaType:"image",category:"creature",
 tags:["capture","creature","heriplante","nature","attack","animated","opponent","face"],
 resource:{file,format:"sprite-strip",mime:"image/webp",frameCount:12,frameMs:130,playbackMode:"once"},
 compatibility:{uses:["combat","capture","editor"]}};
test("editor uses canonical catalog revision for opponent attack",()=>{
 assert.equal(GLOBAL_VISUAL_LIBRARY.branch,"global-assets");
 assert.ok(Number(GLOBAL_VISUAL_LIBRARY.revision.match(/-v([0-9]+)-/)?.[1]||0)>=59,"Hériplante opponent attack is present from official revision v59 onward");
});
test("opponent attack is not movement and resolves to the real approved 12f atlas",()=>{
 assert.equal(captureEditorCreatureVisualKindV1(asset),"attack");
 assert.ok(captureEditorAssetMatchesRoleV1(asset,"attack"));
 assert.equal(captureEditorAssetMatchesRoleV1(asset,"movement"),false);
 const resolver=createGlobalPresentationAssetResolverV1({assetCatalog:{assets:[asset]},assetUrlForFile:globalVisualAssetUrl});
 const found=resolver(id);
 assert.equal(found.url,globalVisualAssetUrl(file));
 assert.equal(found.frameCount,12);
 assert.equal(found.frameMs,130);
 assert.equal(found.playbackMode,"once");
 assert.equal(found.headingRad,undefined);
 assert.equal(resolver("pack:capture:creature-heriplante-movement-opponent-12-v1"),null);
});
