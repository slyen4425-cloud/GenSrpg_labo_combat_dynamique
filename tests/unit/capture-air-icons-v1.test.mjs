import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
const root=process.cwd();
const catalog=JSON.parse(fs.readFileSync(path.join(root,"data/assets/catalog/global-visual-assets.v1.json"),"utf8"));
const provenance=JSON.parse(fs.readFileSync(path.join(root,"assets/library/capture/icons/skills/capture_air_icons_v1.provenance.json"),"utf8"));
test("Air icons use the one Capture asset catalog and retain prior assets",()=>{
 assert.equal(catalog.storage.branch,"global-assets");
 assert.equal(catalog.counts.assets,catalog.assets.length);
 assert.equal(catalog.counts.icons,catalog.assets.filter(a=>a.assetType==="icon").length);
 assert.equal(new Set(catalog.assets.map(a=>a.id)).size,catalog.assets.length);
 assert.equal(provenance.assets.length,3);
 for(const row of provenance.assets){
  const matches=catalog.assets.filter(a=>a.id===row.id);
  assert.equal(matches.length,1,row.id);
  const a=matches[0];assert.equal(a.label,row.label);
  assert.equal(a.assetType,"icon");assert.equal(a.mediaType,"image");assert.equal(a.category,"skill");
  assert.deepEqual(a.compatibility.uses,["combat","capture","editor"]);
  assert.equal(a.resource.file,row.derivedFile);assert.equal(a.resource.mime,"image/webp");
  assert.ok(a.tags.includes("air"));assert.equal(a.source.packId,"capture");
 }
 for(const id of ["pack:capture:icon-skill-tailwind-feather-01","pack:capture:icon-skill-blinding-ash-01","pack:capture:sprite-air-wind-tornado-01"])assert.equal(catalog.assets.filter(a=>a.id===id).length,1,id);
});
test("All three new WebP images have valid RIFF, VP8, dimensions, and source provenance",()=>{
 for(const row of provenance.assets){
  const b=fs.readFileSync(path.join(root,"assets/library",row.derivedFile));
  assert.equal(b.length,row.derivedBytes,row.id);
  assert.ok(b.length>3000,row.id+" real image");
  assert.equal(b.toString("ascii",0,4),"RIFF");
  assert.equal(b.readUInt32LE(4)+8,b.length,row.id+" complete RIFF");
  assert.equal(b.toString("ascii",8,12),"WEBP");
  assert.equal(b.toString("ascii",12,16),"VP8 ");
  assert.equal(b.toString("hex",23,26),"9d012a");
  assert.equal(b.readUInt16LE(26)&0x3fff,128);assert.equal(b.readUInt16LE(28)&0x3fff,128);
  assert.equal(createHash("sha256").update(b).digest("hex"),row.derivedSha256);
  assert.match(row.sourceSha256,/^[0-9a-f]{64}$/);
 }
});
