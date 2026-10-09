import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const base = resolve(root, "assets/library/capture/sprites/skills/water_healing_bubble");
const id = "pack:capture:sprite-water-healing-bubble-01";
function webpSize(p) {
  const b = readFileSync(p);
  assert.equal(b.toString("ascii",0,4),"RIFF");
  assert.equal(b.toString("ascii",8,12),"WEBP");
  assert.equal(b.toString("ascii",12,16),"VP8X");
  return [1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];
}
test("water healing bubble: 20 transparent WebP frames, atlas and canonical catalog", () => {
  const meta=JSON.parse(readFileSync(resolve(base,"sprite_heal_water_bubble_sequence.json"),"utf8"));
  const catalog=JSON.parse(readFileSync(resolve(root,"data/assets/catalog/global-visual-assets.v1.json"),"utf8"));
  const matches=catalog.assets.filter(x=>x.id===id);
  assert.equal(matches.length,1);
  const a=matches[0];
  assert.equal(a.resource.frameCount,20);
  assert.equal(a.resource.frameMs,70);
  assert.equal(a.resource.playbackMode,"loop");
  assert.deepEqual(meta.frame_size,[512,512]);
  assert.equal(meta.frames.length,20);
  assert.equal(new Set(meta.frames).size,20);
  assert.equal(readdirSync(resolve(base,"frames")).filter(x=>x.endsWith(".webp")).length,20);
  for (const p of meta.frames) assert.deepEqual(webpSize(resolve(base,p)),[512,512]);
  assert.deepEqual(webpSize(resolve(base,meta.atlas.file)),[7680,384]);
  assert.equal(a.resource.file,"capture/sprites/skills/water_healing_bubble/"+meta.atlas.file);
  assert.equal(catalog.counts.assets,catalog.assets.length);
  assert.equal(catalog.counts.sprites,catalog.assets.filter(x=>x.assetType==="sprite").length);
});
