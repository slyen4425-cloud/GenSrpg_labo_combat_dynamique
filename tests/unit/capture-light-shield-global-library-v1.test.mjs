import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { GLOBAL_VISUAL_LIBRARY, globalVisualAssetUrl } from "../../src/assets/global-visual-library.js";
import { createGlobalPresentationAssetResolverV1 } from "../../src/assets/global-presentation-asset-resolver-v1.js";

// This fixture is copied from the verified global-assets source catalog at df7422758a0149937763c4ffd187dd8aabc75220.
// The binary and source-catalog tests run on global-assets, not through this duplicated test fixture.
const publishedAssets = [
  {
    "id": "pack:capture:sprite-light-shield-cast-01",
    "assetType": "sprite",
    "category": "release",
    "resource": {
      "file": "capture/sprites/skills/light_shield/atlases/sprite_skill_light_shield_cast_atlas_01.webp",
      "format": "sprite-strip",
      "mime": "image/webp",
      "frameCount": 20,
      "frameMs": 70,
      "playbackMode": "once"
    }
  },
  {
    "id": "pack:capture:sprite-light-shield-barrier-01",
    "assetType": "sprite",
    "category": "skill",
    "resource": {
      "file": "capture/sprites/skills/light_shield/atlases/sprite_skill_light_shield_barrier_atlas_01.webp",
      "format": "sprite-strip",
      "mime": "image/webp",
      "frameCount": 20,
      "frameMs": 80,
      "playbackMode": "once",
      "holdLastFrame": true
    }
  }
];

test("Light Shield Cast and Barrier: editor assetId resolver uses global-assets and freshly versioned URLs",()=>{
 assert.equal(GLOBAL_VISUAL_LIBRARY.repository,"slyen4425-cloud/GenSrpg_labo_combat_dynamique");
 assert.equal(GLOBAL_VISUAL_LIBRARY.branch,"global-assets");
 assert.match(GLOBAL_VISUAL_LIBRARY.revision,/^20\d{2}-\d{2}-\d{2}-v\d+-/);
 assert.ok(Number(GLOBAL_VISUAL_LIBRARY.revision.match(/-v(\d+)-/)?.[1])>=34, "Never roll back Light Shield visual catalog");
 assert.equal(new URL(GLOBAL_VISUAL_LIBRARY.catalogUrl).searchParams.get("v"),GLOBAL_VISUAL_LIBRARY.revision);
 const resolveAsset=createGlobalPresentationAssetResolverV1({
   assetCatalog:{assets:publishedAssets},
   assetUrlForFile:globalVisualAssetUrl
 });
 assert.equal(publishedAssets.length,2);
 for(const asset of publishedAssets){
   const resolved=resolveAsset(asset.id);
   assert.ok(resolved,asset.id);
   assert.equal(resolved.assetId,asset.id);
   assert.equal(resolved.frameCount,20);
   assert.equal(resolved.frameMs,asset.resource.frameMs);
   assert.equal(resolved.playbackMode,"once");
   assert.ok(asset.resource.file.startsWith("capture/sprites/skills/light_shield/atlases/"));
   const url=new URL(resolved.url);
   assert.ok(url.pathname.endsWith("/global-assets/assets/library/"+asset.resource.file));
   assert.equal(url.searchParams.get("v"),GLOBAL_VISUAL_LIBRARY.revision);
   assert.ok(!url.pathname.includes("/work/"));
 }
 assert.equal(resolveAsset("pack:capture:sprite-light-shield-invalid-01"),null);
 assert.equal(publishedAssets[1].resource.holdLastFrame,true);
});

test("Light Shield Barrier: existing authored hold-last control and real FX renderer remain the owners",()=>{
 const controls=readFileSync(fileURLToPath(new URL("../../src/ui/capture-editor-sprite-controls-v1.js",import.meta.url)),"utf8");
 const renderer=readFileSync(fileURLToPath(new URL("../../src/adapters/renderer/dom-status-fx.js",import.meta.url)),"utf8");
 assert.match(controls,/\["hold-last", "Jouer une fois puis garder la dernière image/);
 assert.match(renderer,/applySpriteVisual/, "Status renderer delegates to the canonical sprite owner");
 const spriteOwner=readFileSync(fileURLToPath(new URL("../../src/adapters/renderer/dom-skill-fx.js",import.meta.url)),"utf8");
 assert.match(spriteOwner,/hold-last/, "Canonical FX renderer supports hold-last");
});
