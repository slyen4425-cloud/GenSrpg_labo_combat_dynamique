import test from "node:test";
import assert from "node:assert/strict";
import { GLOBAL_VISUAL_LIBRARY, globalVisualAssetUrl } from "../../src/assets/global-visual-library.js";
import { createGlobalPresentationAssetResolverV1 } from "../../src/assets/global-presentation-asset-resolver-v1.js";

const expected = [
  ["wind-charge","wind_charge","release",80,"once"],
  ["wind-bolt","wind_bolt","travel",65,"loop"],
  ["wind-tornado","wind_tornado","travel",70,"loop"],
  ["wind-impact","wind_impact","impact",65,"once"]
];

test("Capture Air VFX V1 resolves four canonically cataloged media through the existing presentation resolver", () => {
  assert.equal(GLOBAL_VISUAL_LIBRARY.repository,"slyen4425-cloud/GenSrpg_labo_combat_dynamique");
  assert.equal(GLOBAL_VISUAL_LIBRARY.branch,"global-assets");
  assert.equal(GLOBAL_VISUAL_LIBRARY.revision,"2026-10-11-v27-capture-air-vfx");
  const catalogURL=new URL(GLOBAL_VISUAL_LIBRARY.catalogUrl);
  assert.ok(catalogURL.pathname.endsWith("/global-assets/data/assets/catalog/global-visual-assets.v1.json"));
  assert.equal(catalogURL.searchParams.get("v"),GLOBAL_VISUAL_LIBRARY.revision);

  const assets = expected.map(([suffix, slug, category, frameMs, playbackMode]) => ({
    id:"pack:capture:sprite-air-"+suffix+"-01",
    assetType:"sprite", mediaType:"image", category,
    resource:{
      file:"capture/sprites/skills/air_"+slug+"/atlases/sprite_air_"+slug+"_atlas_01.webp",
      mime:"image/webp",format:"sprite-strip",frameCount:20,frameMs,playbackMode
    }
  }));
  const resolver=createGlobalPresentationAssetResolverV1({
    assetCatalog:{assets}, assetUrlForFile:globalVisualAssetUrl
  });
  assert.equal(assets.length,4);
  for(const asset of assets){
    const resolved=resolver(asset.id);
    assert.ok(resolved,asset.id);
    assert.equal(resolved.assetId,asset.id);
    assert.equal(resolved.frameCount,20);
    assert.equal(resolved.frameMs,asset.resource.frameMs);
    assert.equal(resolved.playbackMode,asset.resource.playbackMode);
    const url=new URL(resolved.url);
    assert.ok(url.pathname.endsWith("/global-assets/assets/library/"+asset.resource.file));
    assert.equal(url.searchParams.get("v"),GLOBAL_VISUAL_LIBRARY.revision);
    assert.ok(!url.pathname.includes("/work/"),"runtime references stable media owner only");
  }
  assert.equal(resolver("pack:capture:sprite-air-unknown-01"),null);
});
