import test from "node:test";
import assert from "node:assert/strict";
import { GLOBAL_VISUAL_LIBRARY, globalVisualAssetUrl } from "../../src/assets/global-visual-library.js";
import { createGlobalPresentationAssetResolverV1 } from "../../src/assets/global-presentation-asset-resolver-v1.js";

// Canonical metadata captured and checked from real global-assets commit 5faf0bc4ae2551afe2466d6c0e893f710b27aa27.
const canonicalAssets = [
  {
    "id": "pack:capture:sprite-shadow-spell-cast-01",
    "label": "Sort d’ombre — Cast",
    "category": "release",
    "assetType": "sprite",
    "resource": {
      "file": "capture/sprites/skills/shadow_spell/atlases/sprite_skill_shadow_cast_atlas_01.webp",
      "format": "sprite-strip",
      "mime": "image/webp",
      "frameCount": 20,
      "frameMs": 70,
      "playbackMode": "once"
    }
  },
  {
    "id": "pack:capture:sprite-shadow-spell-impact-01",
    "label": "Sort d’ombre — Impact",
    "category": "impact",
    "assetType": "sprite",
    "resource": {
      "file": "capture/sprites/skills/shadow_spell/atlases/sprite_skill_shadow_impact_atlas_01.webp",
      "format": "sprite-strip",
      "mime": "image/webp",
      "frameCount": 20,
      "frameMs": 65,
      "playbackMode": "once"
    }
  },
  {
    "id": "pack:capture:sprite-life-drain-cast-01",
    "label": "Drain de vie — Cast",
    "category": "release",
    "assetType": "sprite",
    "resource": {
      "file": "capture/sprites/skills/life_drain/atlases/sprite_skill_life_drain_cast_atlas_01.webp",
      "format": "sprite-strip",
      "mime": "image/webp",
      "frameCount": 20,
      "frameMs": 70,
      "playbackMode": "once"
    }
  },
  {
    "id": "pack:capture:sprite-life-drain-impact-01",
    "label": "Drain de vie — Impact",
    "category": "impact",
    "assetType": "sprite",
    "resource": {
      "file": "capture/sprites/skills/life_drain/atlases/sprite_skill_life_drain_impact_atlas_01.webp",
      "format": "sprite-strip",
      "mime": "image/webp",
      "frameCount": 20,
      "frameMs": 65,
      "playbackMode": "once"
    }
  }
];

test("80-frame Shadow and Life Drain pack: all four assets selectable through one canonical editor resolver",()=>{
 assert.equal(GLOBAL_VISUAL_LIBRARY.repository,"slyen4425-cloud/GenSrpg_labo_combat_dynamique");
 assert.equal(GLOBAL_VISUAL_LIBRARY.branch,"global-assets");
 assert.ok(Number(GLOBAL_VISUAL_LIBRARY.revision.match(/-v(\d+)-/)?.[1])>=36,"Shadow/Life Drain must never roll back its catalog revision");
 const catalogUrl=new URL(GLOBAL_VISUAL_LIBRARY.catalogUrl);
 assert.ok(catalogUrl.pathname.endsWith("/global-assets/data/assets/catalog/global-visual-assets.v1.json"));
 assert.equal(catalogUrl.searchParams.get("v"),GLOBAL_VISUAL_LIBRARY.revision);
 const resolveAsset=createGlobalPresentationAssetResolverV1({assetCatalog:{assets:canonicalAssets},assetUrlForFile:globalVisualAssetUrl});
 assert.equal(canonicalAssets.length,4);
 assert.equal(new Set(canonicalAssets.map(x=>x.id)).size,4);
 for(const asset of canonicalAssets){
  const view=resolveAsset(asset.id);
  assert.ok(view,asset.id);
  assert.equal(view.assetId,asset.id);
  assert.equal(view.frameCount,20);
  assert.equal(view.frameMs,asset.category==="release"?70:65);
  assert.equal(view.playbackMode,"once");
  assert.ok(asset.resource.file.startsWith("capture/sprites/skills/"));
  const uri=new URL(view.url);
  assert.equal(uri.searchParams.get("v"),GLOBAL_VISUAL_LIBRARY.revision);
  assert.ok(uri.pathname.endsWith("/global-assets/assets/library/"+asset.resource.file));
  assert.ok(!uri.pathname.includes("/work/"));
 }
 assert.equal(resolveAsset("pack:capture:sprite-not-existing-01"),null);
});
