import test from "node:test";
import assert from "node:assert/strict";
import {GLOBAL_VISUAL_LIBRARY,globalVisualAssetUrl} from "../../src/assets/global-visual-library.js";
import {createGlobalPresentationAssetResolverV1} from "../../src/assets/global-presentation-asset-resolver-v1.js";
import {captureEditorCreatureVisualKindV1,captureEditorAssetMatchesRoleV1} from "../../src/ui/capture-editor-human-v2.js";

const common="capture/creatures/heriplante/animations/";
const metadata=[
  {action:"attack",mode:"once",ms:125,id:"pack:capture:creature-heriplante-attack-player-12-v1"},
  {action:"movement",mode:"loop",ms:100,id:"pack:capture:creature-heriplante-movement-player-12-v1"}
];
const assets=metadata.map(({action,mode,ms,id})=>({
  id,label:"Hériplante — "+action+" joueur dos 12 frames",assetType:"sprite",mediaType:"image",category:"creature",
  tags:["capture","creature","heriplante","nature",action,"animated","player","dos"],
  resource:{file:common+action+"/player/atlases/heriplante_"+action+"_player_12f.webp",
    format:"sprite-strip",mime:"image/webp",frameCount:12,frameMs:ms,playbackMode:mode},
  compatibility:{uses:["combat","capture","editor"]}
}));
test("the official catalog revision is refreshed without a second authority",()=>{
  assert.equal(GLOBAL_VISUAL_LIBRARY.branch,"global-assets");
  assert.ok(Number(GLOBAL_VISUAL_LIBRARY.revision.match(/-v([0-9]+)-/)?.[1]||0)>=58,"Earlier player animations require a canonical revision v58+");
});
test("the two authored player animations are classified into distinct editor role selectors",()=>{
  assert.equal(assets.length,2);
  for(let i=0;i<2;i++){
    const asset=assets[i],item=metadata[i],other=metadata[1-i];
    assert.equal(captureEditorCreatureVisualKindV1(asset),item.action);
    assert.ok(captureEditorAssetMatchesRoleV1(asset,item.action));
    assert.equal(captureEditorAssetMatchesRoleV1(asset,other.action),false);
    const resolve=createGlobalPresentationAssetResolverV1({assetCatalog:{assets},assetUrlForFile:globalVisualAssetUrl});
    const media=resolve(item.id);
    assert.equal(media.url,globalVisualAssetUrl(asset.resource.file));
    assert.equal(media.frameCount,12);
    assert.equal(media.frameMs,item.ms);
    assert.equal(media.playbackMode,item.mode);
    assert.equal(media.headingRad,undefined,"Do not flip the approved back view");
  }
  assert.equal(assets.some(a=>a.tags.includes("opponent")),false);
});
