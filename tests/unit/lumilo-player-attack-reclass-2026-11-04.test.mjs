import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const catalog=JSON.parse(readFileSync("data/assets/catalog/global-visual-assets.v1.json","utf8"));
const manifest=JSON.parse(readFileSync(
  "assets/library/capture/creatures/renard_magique_dore/animations/movement/player/movement.manifest.json","utf8"));
const id="pack:capture:creature-renard-magique-dore-movement-player-12-v1";
const path="capture/creatures/renard_magique_dore/animations/movement/player/atlases/renard_magique_dore_mouvement_joueur_12f.webp";
test("RED: Lumilo 12f artwork is attack, no longer movement, without new asset authority",()=>{
  assert.equal(catalog.assets.filter(asset=>asset.id===id).length,1);
  const asset=catalog.assets.find(asset=>asset.id===id);
  assert.equal(asset.category,"creature");
  assert.equal(asset.assetType,"sprite");
  assert.equal(asset.mediaType,"image");
  assert.equal(asset.compatibility.uses.includes("editor"),true);
  assert.ok(asset.tags.includes("attack"),"editor attack role derives from the single global-assets tag");
  assert.ok(!asset.tags.includes("movement"),"editor movement chooser must no longer show it");
  assert.ok(asset.tags.includes("player") && asset.tags.includes("dos"),"player-back asset only");
  assert.match(asset.label,/attaque.*joueur/i);
  assert.equal(manifest.action,"attack");
  assert.equal(manifest.view,"player");
  assert.equal(manifest.assetId,id,"preserve stable ID and old bookmarks");
  assert.equal(asset.resource.file,path,"preserve authored WebP, no duplicate media");
  assert.equal(asset.resource.frameCount,12);
  assert.equal(asset.resource.frameMs,120);
  assert.equal(asset.resource.playbackMode,"loop","do not change the approved animation");
  assert.equal(manifest.atlas.sha256,"0c4206f2658bce77990563747d407e00bd9e42605c0f986528f4a4f3938e7b4f");
  assert.equal(catalog.assets.some(asset=>asset.id.includes("renard-magique-dore")&&asset.tags?.includes("attack")&&asset.tags?.includes("opponent")),false,
    "do not invent an opponent attack animation");
});
