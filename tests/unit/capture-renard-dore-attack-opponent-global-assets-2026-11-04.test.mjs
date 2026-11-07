import test from "node:test";
import assert from "node:assert/strict";
import {GLOBAL_VISUAL_LIBRARY,globalVisualAssetUrl} from "../../src/assets/global-visual-library.js";
import {createGlobalPresentationAssetResolverV1} from "../../src/assets/global-presentation-asset-resolver-v1.js";
import {captureEditorCreatureVisualKindV1,captureEditorAssetMatchesRoleV1} from "../../src/ui/capture-editor-human-v2.js";

const id="pack:capture:creature-renard-magique-dore-attack-opponent-12-v1";
const file="capture/creatures/renard_magique_dore/animations/attack/opponent/atlases/renard_magique_dore_attaque_adversaire_12f.webp";
const opponent={
 id,label:"Renard magique doré — attaque spirituelle adversaire (12 frames)",
 category:"creature",assetType:"sprite",mediaType:"image",
 tags:["capture","creature","renard-magique-dore","gold","light","spirit","fox","attack","animated","opponent","face"],
 resource:{file,format:"sprite-strip",frameCount:12,frameMs:115,playbackMode:"once"},
 compatibility:{uses:["combat","capture","editor"]}
};

test("fresh canonical catalog revision exposes approved attack opponent",()=>{
 assert.equal(GLOBAL_VISUAL_LIBRARY.branch,"global-assets");
 assert.ok(Number(GLOBAL_VISUAL_LIBRARY.revision.match(/-v([0-9]+)-/)?.[1]||0)>=56,"Older assets require a canonical catalog revision v56+");
 assert.ok(GLOBAL_VISUAL_LIBRARY.catalogUrl.endsWith("?v="+GLOBAL_VISUAL_LIBRARY.revision));
 assert.equal(globalVisualAssetUrl(file),
 "https://raw.githubusercontent.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/global-assets/assets/library/"+file+"?v="+GLOBAL_VISUAL_LIBRARY.revision);
});

test("attack opponent is a single real native asset, 12f once, never movement",()=>{
 const resolver=createGlobalPresentationAssetResolverV1({assetCatalog:{assets:[opponent]},assetUrlForFile:globalVisualAssetUrl});
 assert.equal(captureEditorCreatureVisualKindV1(opponent),"attack");
 assert.equal(captureEditorAssetMatchesRoleV1(opponent,"attack"),true);
 assert.equal(captureEditorAssetMatchesRoleV1(opponent,"movement"),false);
 assert.equal(opponent.tags.includes("opponent"),true);
 assert.equal(opponent.tags.includes("player"),false);
 const a=resolver(id);
 assert.equal(a.assetId,id);
 assert.equal(a.url,globalVisualAssetUrl(file));
 assert.equal(a.frameCount,12);
 assert.equal(a.frameMs,115);
 assert.equal(a.playbackMode,"once");
 assert.equal(a.headingRad,undefined,"do not mirror or invent heading");
 assert.equal(resolver("pack:capture:creature-renard-magique-dore-movement-opponent-12-v1"),null,
   "user did not approve a movement animation for opponent");
});
