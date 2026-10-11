import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
const root=process.cwd();
const catalog=JSON.parse(fs.readFileSync(path.join(root,"data/assets/catalog/global-visual-assets.v1.json"),"utf8"));
const cases=[
  {
    "slug": "wind_charge",
    "hyphen": "wind-charge",
    "label": "Charge de vent",
    "cat": "release",
    "frameMs": 80,
    "playback": "once",
    "sourceHash": "2b87e3d35b70d17564de8395be3957005914cbd6fb3e4604fe9501f22caf709a"
  },
  {
    "slug": "wind_bolt",
    "hyphen": "wind-bolt",
    "label": "Projectile — Rafale de vent",
    "cat": "travel",
    "frameMs": 65,
    "playback": "loop",
    "sourceHash": "82436f328c67acc854d64af6aba14d9e633fafbc5e517d58211acb5977f0fee7"
  },
  {
    "slug": "wind_tornado",
    "hyphen": "wind-tornado",
    "label": "Projectile — Tornade",
    "cat": "travel",
    "frameMs": 70,
    "playback": "loop",
    "sourceHash": "de9ccc4584c67f81db0fa441e5c3c4586fc8dbf74e3184948927891492c6f273"
  },
  {
    "slug": "wind_impact",
    "hyphen": "wind-impact",
    "label": "Impact de vent",
    "cat": "impact",
    "frameMs": 65,
    "playback": "once",
    "sourceHash": "128a2417bfafa13068325d5b1e86f65a18bb8a68c5babf41fffb88db9ef5a4c4"
  }
];
test("Air VFX catalogue is additive, single-owner and has four unique IDs",()=>{
 assert.equal(catalog.storage.branch,"global-assets");
 assert.equal(catalog.counts.assets,catalog.assets.length);
 assert.equal(catalog.counts.sprites,catalog.assets.filter(a=>a.assetType==="sprite").length);
 assert.equal(catalog.counts.assets,134);
 assert.equal(catalog.counts.sprites,73);
 assert.equal(new Set(catalog.assets.map(a=>a.id)).size,catalog.assets.length);
 for(const c of cases){
   const id="pack:capture:sprite-air-"+c.hyphen+"-01";
   const a=catalog.assets.find(x=>x.id===id);
   assert.ok(a,id);assert.equal(a.category,c.cat);assert.equal(a.assetType,"sprite");
   assert.equal(a.resource.frameCount,20);assert.equal(a.resource.frameMs,c.frameMs);
   assert.equal(a.resource.playbackMode,c.playback);
   assert.equal(a.resource.format,"sprite-strip");
   assert.deepEqual(a.compatibility.uses,["combat","capture","editor"]);
   assert.equal(a.resource.file,"capture/sprites/skills/air_"+c.slug+"/atlases/sprite_air_"+c.slug+"_atlas_01.webp");
 }
});
test("Air VFX 80 frames are transparent 512px PNG; four atlases real WebP",()=>{
 for(const c of cases){
  const folder=path.join(root,"assets/library/capture/sprites/skills/air_"+c.slug);
  const manifest=JSON.parse(fs.readFileSync(path.join(folder,"sprite_air_"+c.slug+"_sequence.json"),"utf8"));
  assert.equal(manifest.frameCount,20);assert.equal(manifest.frames.length,20);assert.equal(manifest.atlasWidth,7680);
  const atlas=fs.readFileSync(path.join(folder,manifest.atlas));
  assert.ok(atlas.length>60000);assert.equal(atlas.toString("ascii",0,4),"RIFF");assert.equal(atlas.toString("ascii",8,12),"WEBP");
  const files=manifest.frames.map(x=>x.file);
  assert.equal(new Set(files).size,20);
  for(const p of files){
   const b=fs.readFileSync(path.join(folder,p));
   assert.ok(b.length>10000);
   assert.equal(b.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
   assert.equal(b.readUInt32BE(16),512);
   assert.equal(b.readUInt32BE(20),512);
   assert.equal(b.readUInt8(25),6);
  }
 }
});


test("Air VFX media hashes and alpha match real generated source and provenance",()=>{
 const sha=b=>createHash("sha256").update(b).digest("hex");
 for(const c of cases){
  const folder=path.join(root,"assets/library/capture/sprites/skills/air_"+c.slug);
  const raw=fs.readFileSync(path.join(folder,"sources/sprite_air_"+c.slug+"_source_512.webp"));
  assert.equal(sha(raw),c.sourceHash,"original source checksum: "+c.slug);
  const manifest=JSON.parse(fs.readFileSync(path.join(folder,"sprite_air_"+c.slug+"_sequence.json"),"utf8"));
  assert.equal(manifest.sourceSHA256,c.sourceHash);
  const p=fs.readFileSync(path.join(folder,"provenance.csv"),"utf8").trim().split(/\r?\n/);
  assert.equal(p.length,21,"20 recorded frame hashes plus CSV header");
  const hashes=new Map(p.slice(1).map(line=>{const v=line.split(",");return [v[1],v[2]];}));
  assert.equal(hashes.size,20);
  for(const frame of manifest.frames){
   const data=fs.readFileSync(path.join(folder,frame.file));
   assert.equal(sha(data),hashes.get(frame.file),"must be exact authored frame: "+frame.file);
  }
  const b=fs.readFileSync(path.join(folder,manifest.atlas));
  assert.equal(b.toString("ascii",12,16),"VP8X");
  assert.equal((b[20]&16),16,"alpha flag required in runtime atlas");
  assert.equal(1+b.readUIntLE(24,3),7680);
  assert.equal(1+b.readUIntLE(27,3),384);
 }
});
