import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const catalog = JSON.parse(readFileSync(resolve(root, "data/assets/catalog/global-visual-assets.v1.json"), "utf8"));
const sequences = [
  { folder:"falling_rock_skyfall", stem:"sprite_skill_falling_rock_skyfall", id:"pack:capture:sprite-falling-rock-skyfall-01", count:20, frameMs:70, category:"travel" },
  { folder:"rock_impact_upward", stem:"sprite_skill_rock_impact_upward", id:"pack:capture:sprite-rock-impact-upward-01", count:16, frameMs:75, category:"impact" }
];
function webpInfo(filename) {
  const b=readFileSync(filename);
  assert.equal(b.toString("ascii",0,4),"RIFF",filename);
  assert.equal(b.toString("ascii",8,12),"WEBP",filename);
  assert.equal(b.toString("ascii",12,16),"VP8X",filename);
  assert.ok((b[20]&0x10)!==0, "alpha missing: "+filename);
  return { width:1+b.readUIntLE(24,3), height:1+b.readUIntLE(27,3) };
}
test("rock skyfall asset catalog is additive and internally consistent", () => {
  assert.equal(catalog.counts.assets,catalog.assets.length);
  assert.equal(catalog.counts.sprites,catalog.assets.filter(a=>a.assetType==="sprite").length);
  assert.equal(new Set(catalog.assets.map(x=>x.id)).size,catalog.assets.length);
  assert.equal(catalog.assets.some(a=>a.id==="pack:capture:sprite-water-healing-bubble-01"),true);
  assert.equal(catalog.assets.some(a=>a.id==="pack:capture:sprite-stone-carapace-aura-01"),true);
});
for(const s of sequences)test(s.id+" has complete ordered alpha frames and a real atlas",()=>{
  const prefix="assets/library/capture/sprites/skills/"+s.folder;
  const base=resolve(root,prefix);
  const m=JSON.parse(readFileSync(resolve(base,s.stem+"_sequence.json"),"utf8"));
  const candidates=catalog.assets.filter(a=>a.id===s.id);
  assert.equal(candidates.length,1);
  const a=candidates[0];
  assert.equal(a.category,s.category);
  assert.equal(a.resource.frameCount,s.count);
  assert.equal(a.resource.frameMs,s.frameMs);
  assert.equal(a.resource.playbackMode,"once");
  assert.equal(m.frame_count,s.count);
  assert.equal(m.frame_ms,s.frameMs);
  assert.equal(m.playback_mode,"once");
  assert.deepEqual(m.frame_size,[512,512]);
  assert.equal(m.frames.length,s.count);
  assert.equal(new Set(m.frames).size,s.count);
  assert.equal(readdirSync(resolve(base,"frames")).filter(f=>f.endsWith(".webp")).length,s.count);
  m.frames.forEach((f,i)=>{
    assert.equal(f,"frames/"+s.stem+"_"+String(i+1).padStart(2,"0")+".webp");
    assert.deepEqual(webpInfo(resolve(base,f)),{width:512,height:512});
  });
  assert.equal(m.atlas.frameCount,s.count);
  assert.equal(m.atlas.frameWidth,384);
  assert.equal(m.atlas.frameHeight,384);
  assert.deepEqual(webpInfo(resolve(base,m.atlas.file)),{width:s.count*384,height:384});
  assert.equal(a.resource.file,"capture/sprites/skills/"+s.folder+"/"+m.atlas.file);
});