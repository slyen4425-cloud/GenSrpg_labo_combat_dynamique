import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const read=p=>readFileSync(resolve(root,p));
const catalog=JSON.parse(read("data/assets/catalog/global-visual-assets.v1.json"));
const manifest=JSON.parse(read("assets/library/capture/icons/skills/capture_poison_icons_2026_10_24.provenance.json"));
const sha256=b=>createHash("sha256").update(b).digest("hex");
const git=b=>createHash("sha1").update(Buffer.from("blob "+b.length+String.fromCharCode(0))).update(b).digest("hex");
test("Poison skill icons: exact five real images, integrity and canonical editor catalog",()=>{
 assert.equal(manifest.assets.length,5);
 assert.equal(catalog.counts.assets,catalog.assets.length);
 assert.equal(catalog.counts.icons,catalog.assets.filter(a=>a.assetType==="icon").length);
 assert.equal(new Set(catalog.assets.map(a=>a.id)).size,catalog.assets.length);
 assert.equal(catalog.storage.branch,"global-assets");
 for(const v of manifest.assets){
  const arr=catalog.assets.filter(a=>a.id===v.assetId);assert.equal(arr.length,1,v.assetId);
  const a=arr[0];assert.equal(a.assetType,"icon");assert.equal(a.category,"skill");
  assert.equal(a.mediaType,"image");assert.ok(a.compatibility.uses.includes("editor"));
  assert.equal(a.resource.mime,"image/webp");assert.equal(a.resource.file,v.derivedFile);
  const b=read("assets/library/"+a.resource.file);assert.equal(b.length,v.bytes);
  assert.equal(sha256(b),v.derivedSha256);assert.equal(git(b),v.gitBlobSHA);
  assert.equal(b.toString("ascii",0,4),"RIFF");assert.equal(b.toString("ascii",8,12),"WEBP");
  assert.equal(b.toString("ascii",12,16),"VP8 ");
  assert.equal(b.readUInt16LE(26)&0x3fff,128);assert.equal(b.readUInt16LE(28)&0x3fff,128);
 }
});
