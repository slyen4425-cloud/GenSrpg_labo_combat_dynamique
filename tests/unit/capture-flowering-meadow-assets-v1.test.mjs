import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const base = resolve(root, "assets/library/capture/sprites/skills/flowering_meadow");
const catalog = JSON.parse(readFileSync(resolve(root,"data/assets/catalog/global-visual-assets.v1.json"),"utf8"));
const id = "pack:capture:sprite-flowering-meadow-ground-01";

function inspectWebp(path) {
  const b = readFileSync(path);
  assert.equal(b.toString("ascii",0,4),"RIFF");
  assert.equal(b.toString("ascii",8,12),"WEBP");
  assert.equal(b.toString("ascii",12,16),"VP8X");
  assert.equal((b[20] & 16),16, "WebP alpha required: "+path);
  return [1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];
}

test("Flowering meadow: 20 transparent 512px frames and mobile atlas", () => {
  const manifest=JSON.parse(readFileSync(resolve(base,"sprite_skill_flowering_meadow_sequence.json"),"utf8"));
  assert.equal(manifest.id,id);
  assert.deepEqual(manifest.frame_size,[512,512]);
  assert.equal(manifest.frame_count,20);
  assert.equal(manifest.frame_ms,80);
  assert.equal(manifest.playback_mode,"once");
  assert.equal(manifest.frames.length,20);
  assert.equal(new Set(manifest.frames).size,20);
  assert.equal(readdirSync(resolve(base,"frames")).filter(x=>x.endsWith(".webp")).length,20);
  for(let i=0;i<20;i++){
    const expected="frames/sprite_skill_flowering_meadow_"+String(i+1).padStart(2,"0")+".webp";
    assert.equal(manifest.frames[i],expected);
    assert.ok(existsSync(resolve(base,expected)));
    assert.deepEqual(inspectWebp(resolve(base,expected)),[512,512]);
  }
  assert.deepEqual(inspectWebp(resolve(base,manifest.atlas.file)),[7680,384]);
  assert.equal(manifest.atlas.frameCount,20);
  assert.equal(manifest.atlas.format,"sprite-strip");
  assert.equal(manifest.atlas.frameWidth,384);
  assert.equal(manifest.atlas.frameHeight,384);
  assert.equal(manifest.source.pixel_size[0],1402);
  assert.equal(manifest.source.pixel_size[1],1122);
});

test("Flowering meadow: canonical catalog, visual only, no duplicate ID", () => {
  const found=catalog.assets.filter(a=>a.id===id);
  assert.equal(found.length,1);
  assert.equal(found[0].assetType,"sprite");
  assert.equal(found[0].category,"skill");
  assert.equal(found[0].resource.file,"capture/sprites/skills/flowering_meadow/atlases/sprite_skill_flowering_meadow_atlas_01.webp");
  assert.equal(found[0].resource.frameCount,20);
  assert.equal(found[0].resource.frameMs,80);
  assert.equal(found[0].resource.playbackMode,"once");
  assert.ok(found[0].tags.includes("ground"));
  assert.ok(found[0].tags.includes("zone"));
  assert.ok(catalog.counts.assets>=122, "must retain the original 122 assets even as new packs are added");
  assert.ok(catalog.counts.sprites>=69,"must retain original 69 sprites while allowing additive packs");
  assert.equal(catalog.counts.assets,catalog.assets.length);
  assert.equal(catalog.counts.sprites,catalog.assets.filter(a=>a.assetType==="sprite").length);
  assert.equal(new Set(catalog.assets.map(a=>a.id)).size,catalog.assets.length);
  for(const stable of ["pack:capture:sprite-rock-impact-upward-01","pack:capture:sprite-water-healing-bubble-01","pack:capture:sprite-stone-carapace-aura-01"])assert.equal(catalog.assets.filter(a=>a.id===stable).length,1);
});
