import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
const root=process.cwd();
const catalog=JSON.parse(fs.readFileSync(path.join(root,"data/assets/catalog/global-visual-assets.v1.json"),"utf8"));
const provenance=JSON.parse(fs.readFileSync(path.join(root,"assets/library/capture/icons/skills/capture_eight_skill_icons_v1.provenance.json"),"utf8"));

test("eight new Capture skill icons use only the canonical global catalog",()=>{
 assert.equal(catalog.storage.branch,"global-assets");
 assert.equal(catalog.assets.length,catalog.counts.assets);
 assert.equal(catalog.assets.filter(x=>x.assetType==="icon").length,catalog.counts.icons);
 assert.equal(new Set(catalog.assets.map(x=>x.id)).size,catalog.assets.length);
 assert.equal(provenance.assets.length,8);
 for(const x of provenance.assets){
  const matches=catalog.assets.filter(y=>y.id===x.assetId);assert.equal(matches.length,1,x.assetId);
  const a=matches[0];assert.equal(a.label,x.label);assert.equal(a.assetType,"icon");assert.equal(a.category,"skill");
  assert.equal(a.resource.file,x.derivedFile);assert.equal(a.resource.mime,"image/webp");
  assert.equal(a.source.packId,"capture");assert.deepEqual(a.compatibility.uses,["combat","capture","editor"]);
 }
 for(const id of ["pack:capture:icon-skill-rafale-01","pack:capture:icon-skill-souffle-01","pack:capture:icon-skill-aerial-attack-01","pack:capture:icon-skill-tailwind-feather-01"]){assert.equal(catalog.assets.filter(a=>a.id===id).length,1,id)}
});
test("eight real nonempty 128px VP8 WebP skill icons match published provenance checksums",()=>{
 for(const x of provenance.assets){
  const b=fs.readFileSync(path.join(root,"assets/library",x.derivedFile));
  assert.equal(b.length,x.bytes,x.assetId);assert.ok(b.length>1500);
  assert.equal(b.toString("ascii",0,4),"RIFF");assert.equal(b.readUInt32LE(4)+8,b.length);
  assert.equal(b.toString("ascii",8,12),"WEBP");assert.equal(b.toString("ascii",12,16),"VP8 ");
  assert.equal(b.toString("hex",23,26),"9d012a");assert.equal(b.readUInt16LE(26)&0x3fff,128);
  assert.equal(b.readUInt16LE(28)&0x3fff,128);
  assert.equal(createHash("sha256").update(b).digest("hex"),x.derivedSha256);
  assert.match(x.sourceSha256,/^[0-9a-f]{64}$/);
 }
});
