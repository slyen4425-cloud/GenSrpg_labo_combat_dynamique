import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createGlobalPresentationAssetResolverV1} from "../../src/assets/global-presentation-asset-resolver-v1.js";

const entryPath=new URL("../../examples/dom-demo/capture-editor-v2.js",import.meta.url);

test("REAL editor preview routes canonical pack sprites through the existing resolver without dropping native heading",async()=>{
  // The real creator editor used a SECOND hand-written projection of the
  // global catalog. It copied frames/url but LOST resource.headingRad,
  // making incoming Graine sansue point the wrong way despite green FX tests.
  const entry=await readFile(entryPath,"utf8");
  assert.match(entry,/createGlobalPresentationAssetResolverV1\s*\(/,
    "editor must delegate to the already-tested global catalog resolver");
  assert.match(entry,/visualContext\?\.resolvePresentationAsset\?\.\(assetId\)/,
    "live editor preview must use the canonical resolver for travel sprites");
  assert.doesNotMatch(entry,/const catalogAsset\s*=\s*visualContext\?\.assetCatalog/,
    "no competing hand-written resolver may discard future asset metadata");

  const catalog={assets:[
    {id:"pack:capture:sprite-graine-sangsue-projectile-01",resource:{
      file:"capture/sprites/skills/graine_sangsue/projectile/graine_sangsue_projectile_atlas_12f.webp",
      frameCount:12,frameMs:72,playbackMode:"loop",headingRad:0,
      coreAnchor:{x:0.62,y:0.5}
    }},
    {id:"pack:capture:sprite-air-wind-tornado-01",resource:{file:"neutral.webp",frameCount:8}}
  ]};
  const forId=createGlobalPresentationAssetResolverV1({assetCatalog:catalog,assetUrlForFile:file=>"https://example.test/"+file});
  const seed=forId("pack:capture:sprite-graine-sangsue-projectile-01");
  assert.equal(seed.headingRad,0);
  assert.equal(seed.frameCount,12);
  assert.equal(seed.playbackMode,"loop");
  assert.equal(forId("pack:capture:sprite-air-wind-tornado-01").headingRad,undefined);
});
