import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

// Only global-assets owns each sprite's intrinsic orientation.
// The renderer uses headingRad to select a horizontal mirror for leftward
// flights, including a reflected projectile using its true contactPoint.
const catalogFile=new URL("../../data/assets/catalog/global-visual-assets.v1.json",import.meta.url);
const directed=[
  "pack:capture:sprite-air-wind-bolt-01",
  "pack:capture:sprite-steel-wing-projectile-01",
  "pack:capture:sprite-kitsune-lunaire-projectile-01",
  "pack:capture:sprite-crachat-acide-projectile-01",
  "pack:capture:sprite-feuille-tranchante-projectile-03",
  "pack:capture:sprite-graine-sangsue-projectile-01"
];
const upright=[
  "pack:capture:sprite-air-wind-tornado-01",
  "pack:capture:sprite-falling-rock-skyfall-01",
  "pack:capture:sprite-fluide-meteorite-projectile-01"
];
test("author directional projectile sprites declare their right-facing native heading once in the media catalog",async()=>{
  const catalog=JSON.parse(await readFile(catalogFile,"utf8"));
  const byId=new Map(catalog.assets.map(a=>[a.id,a]));
  assert.equal(byId.size,catalog.assets.length,"media IDs must be unique");
  for(const id of directed){
    const asset=byId.get(id);
    assert.ok(asset,"asset missing: "+id);
    assert.equal(asset.category,"travel");
    assert.ok(asset.resource.file,"physical sprite missing: "+id);
    assert.equal(asset.resource.headingRad,0,
      "right-facing projectile must supply explicit canonical native heading: "+id);
    assert.ok(asset.resource.frameCount>=12,"animation atlas must not be replaced: "+id);
  }
  for(const id of upright){
    const a=byId.get(id);
    assert.ok(a,"expected neutral asset: "+id);
    assert.equal(Object.hasOwn(a.resource,"headingRad"),false,
      "tornado/skyfall must not be rotated or flipped by horizontal projectile rules: "+id);
  }
});
