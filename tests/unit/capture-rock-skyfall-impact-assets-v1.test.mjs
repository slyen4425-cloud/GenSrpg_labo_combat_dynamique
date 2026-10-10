import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const catalog=JSON.parse(readFileSync(resolve(root,"data/assets/catalog/global-visual-assets.v1.json"),"utf8"));
function sizeAlpha(path) {
  const b=readFileSync(path);
  assert.equal(b.toString("ascii",0,4),"RIFF");
  assert.equal(b.toString("ascii",8,12),"WEBP");
  assert.equal(b.toString("ascii",12,16),"VP8X");
  assert.equal((b[20]&16),16, "transparent alpha flag expected");
  return [1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];
}
const cases=[
  {dir:"falling_rock_skyfall",name:"sprite_skill_falling_rock_skyfall",id:"pack:capture:sprite-falling-rock-skyfall-01",count:20,frameMs:70,category:"travel"},
  {dir:"rock_impact_upward",name:"sprite_skill_rock_impact_upward",id:"pack:capture:sprite-rock-impact-upward-01",count:16,frameMs:75,category:"impact"}
];
for(const cfg of cases)test("Earth VFX assets: "+cfg.id,()=>{
  const base=resolve(root,"assets/library/capture/sprites/skills",cfg.dir);
  const man=JSON.parse(readFileSync(resolve(base,cfg.name+"_sequence.json"),"utf8"));
  const matches=catalog.assets.filter(x=>x.id===cfg.id);
  assert.equal(matches.length,1);
  assert.equal(matches[0].category,cfg.category);
  assert.equal(matches[0].resource.frameCount,cfg.count);
  assert.equal(matches[0].resource.frameMs,cfg.frameMs);
  assert.equal(matches[0].resource.playbackMode,"once");
  assert.deepEqual(man.frame_size,[512,512]);
  assert.equal(man.frame_count,cfg.count);
  assert.equal(man.frame_ms,cfg.frameMs);
  assert.equal(man.frames.length,cfg.count);
  assert.equal(new Set(man.frames).size,cfg.count);
  assert.equal(readdirSync(resolve(base,"frames")).filter(x=>x.endsWith(".webp")).length,cfg.count);
  for(const f of man.frames){assert.ok(existsSync(resolve(base,f)));assert.deepEqual(sizeAlpha(resolve(base,f)),[512,512]);}
  const atlas=resolve(base,man.atlas.file);
  assert.deepEqual(sizeAlpha(atlas),[384*cfg.count,384]);
  assert.equal(matches[0].resource.file,"capture/sprites/skills/"+cfg.dir+"/"+man.atlas.file);
});
test("Earth VFX: original catalog inventory and gameplay independent",()=>{
 assert.equal(catalog.counts.assets,catalog.assets.length);
 assert.equal(catalog.counts.sprites,catalog.assets.filter(x=>x.assetType==="sprite").length);
 assert.equal(catalog.counts.assets,121);
 assert.equal(catalog.counts.sprites,68);
 for(const id of ["pack:capture:sprite-water-healing-bubble-01","pack:capture:sprite-stone-carapace-aura-01","pack:capture:sprite-pressurized-jet-beam-body-01"])assert.equal(catalog.assets.filter(x=>x.id===id).length,1);
 assert.equal(new Set(catalog.assets.map(x=>x.id)).size,catalog.assets.length);
});
