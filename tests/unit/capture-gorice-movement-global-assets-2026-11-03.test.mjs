import test from "node:test";
import assert from "node:assert/strict";
import {GLOBAL_VISUAL_LIBRARY,globalVisualAssetUrl} from "../../src/assets/global-visual-library.js";
import {createGlobalPresentationAssetResolverV1} from "../../src/assets/global-presentation-asset-resolver-v1.js";
const ids=["pack:capture:creature-gorille-des-glaces-movement-player-12-v1","pack:capture:creature-gorille-des-glaces-movement-opponent-12-v1"];
const prefix="capture/creatures/gorille_des_glaces/animations/movement/";
test("Gorice movement uses a single canonical updated global-assets catalog",()=>{
  assert.equal(GLOBAL_VISUAL_LIBRARY.branch,"global-assets");
  assert.equal(GLOBAL_VISUAL_LIBRARY.revision,"2026-11-03-v53-gorice-movement-24f");
  assert.ok(GLOBAL_VISUAL_LIBRARY.catalogUrl.includes("?v="+GLOBAL_VISUAL_LIBRARY.revision));
});
test("Gorice player/opponent movement uses source data, loops, preserves opposite facing",()=>{
  const expected=["player","opponent"].map((view,i)=>({
    id:ids[i],resource:{file:prefix+view+"/atlases/gorice_deplacement_"+(view==="player"?"joueur":"adversaire")+"_12f.webp",
      frameCount:12,frameMs:view==="player"?130:110,playbackMode:"loop"}
  }));
  const resolver=createGlobalPresentationAssetResolverV1({
    assetCatalog:{assets:expected},
    assetUrlForFile:globalVisualAssetUrl
  });
  for(const [i,id] of ids.entries()){
    const a=resolver(id);
    assert.equal(a.assetId,id);
    assert.equal(a.url,globalVisualAssetUrl(expected[i].resource.file));
    assert.equal(a.frameCount,12);
    assert.equal(a.frameMs,expected[i].resource.frameMs);
    assert.equal(a.playbackMode,"loop");
    assert.ok(a.url.includes("?v="+GLOBAL_VISUAL_LIBRARY.revision));
  }
  assert.equal(resolver("pack:capture:creature-gorille-des-glaces-movement-unknown-12-v1"),null);
});
