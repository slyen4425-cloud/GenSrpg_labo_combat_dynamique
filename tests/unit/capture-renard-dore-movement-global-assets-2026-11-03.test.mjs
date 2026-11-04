import test from "node:test";
import assert from "node:assert/strict";
import {GLOBAL_VISUAL_LIBRARY,globalVisualAssetUrl} from "../../src/assets/global-visual-library.js";
import {createGlobalPresentationAssetResolverV1} from "../../src/assets/global-presentation-asset-resolver-v1.js";

const id="pack:capture:creature-renard-magique-dore-movement-player-12-v1";
const file="capture/creatures/renard_magique_dore/animations/movement/player/atlases/renard_magique_dore_mouvement_joueur_12f.webp";
test("Renard dore attack classification uses freshly versioned unique global-assets catalog",()=>{
  assert.equal(GLOBAL_VISUAL_LIBRARY.branch,"global-assets");
  assert.equal(GLOBAL_VISUAL_LIBRARY.revision,"2026-11-04-v56-lumilo-opponent-attack-12f");
  assert.ok(GLOBAL_VISUAL_LIBRARY.catalogUrl.includes("?v="+GLOBAL_VISUAL_LIBRARY.revision));
  assert.equal(globalVisualAssetUrl(file).split("?")[0],
    "https://raw.githubusercontent.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/global-assets/assets/library/"+file);
});
test("Renard dore player attack: native resolver preserves 12 frames, loop and orientation",()=>{
  const asset={id,resource:{file,format:"sprite-strip",frameCount:12,frameMs:120,playbackMode:"loop"}};
  const resolve=createGlobalPresentationAssetResolverV1({assetCatalog:{assets:[asset]},assetUrlForFile:globalVisualAssetUrl});
  const result=resolve(id);
  assert.equal(result.assetId,id);
  assert.equal(result.url,globalVisualAssetUrl(file));
  assert.equal(result.frameCount,12);
  assert.equal(result.frameMs,120);
  assert.equal(result.playbackMode,"loop");
  assert.equal(result.headingRad,undefined,"No invented orientation metadata");
  assert.equal(resolve("pack:capture:creature-renard-magique-dore-movement-opponent-12-v1"),null,
    "Do not invent an adversary attack animation");
});
