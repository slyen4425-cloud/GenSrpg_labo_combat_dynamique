import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const folder=resolve(root,"assets/library/capture/icons/skills");
const provenance=JSON.parse(readFileSync(resolve(folder,"capture_four_shadow_icons_2026_10_18.provenance.json"),"utf8"));
const historical=JSON.parse(readFileSync(resolve(folder,"capture_eight_skill_icons_v1.provenance.json"),"utf8"));
const cat=JSON.parse(readFileSync(resolve(root,"data/assets/catalog/global-visual-assets.v1.json"),"utf8"));
const expected=new Map([
 ["pack:capture:icon-skill-attaque-ombre-01","icon_skill_attaque_ombre_01.webp"],
 ["pack:capture:icon-skill-drain-de-vie-01","icon_skill_drain_de_vie_01.webp"],
 ["pack:capture:icon-skill-voile-ombre-01","icon_skill_voile_ombre_01.webp"],
 ["pack:capture:icon-skill-malediction-feline-01","icon_skill_malediction_feline_01.webp"]
]);
test("four approved Shadow skill icons are real distinct 128px VP8 WebP and source-traceable",()=>{
 assert.deepEqual(provenance.runtimeDimensions,[128,128]);
 assert.equal(provenance.owner,"global-assets");
 assert.equal(provenance.assets.length,4);
 assert.equal(new Set(provenance.assets.map(x=>x.gitBlobSHA)).size,4);
 for(const a of provenance.assets){
  assert.equal(a.derivedFile,"capture/icons/skills/"+expected.get(a.assetId));
  assert.match(a.sourceSha256,/^[0-9a-f]{64}$/);
  const b=readFileSync(resolve(root,"assets/library",a.derivedFile));
  assert.ok(b.length>1500,"Non-placeholder binary required");
  assert.equal(b.length,a.bytes);
  assert.equal(b.toString("ascii",0,4),"RIFF");
  assert.equal(b.readUInt32LE(4)+8,b.length);
  assert.equal(b.toString("ascii",8,12),"WEBP");
  assert.equal(b.toString("ascii",12,16),"VP8 ");
  assert.equal(b.toString("hex",23,26),"9d012a");
  assert.equal(b.readUInt16LE(26)&0x3fff,128);
  assert.equal(b.readUInt16LE(28)&0x3fff,128);
  assert.equal(createHash("sha256").update(b).digest("hex"),a.derivedSha256);
  assert.equal(createHash("sha1").update("blob "+b.length+"\0").update(b).digest("hex"),a.gitBlobSHA);
 }
});
test("one owner per skill, old Drain de vie ID retained, only 3 new catalog entries",()=>{
 assert.equal(cat.storage.branch,"global-assets");
 assert.equal(cat.counts.assets,cat.assets.length);
 assert.equal(cat.counts.icons,cat.assets.filter(x=>x.assetType==="icon").length);
 assert.equal(new Set(cat.assets.map(x=>x.id)).size,cat.assets.length);
 assert.equal(cat.counts.assets,172);
 assert.equal(cat.counts.icons,70);
 for(const item of provenance.assets){
  const found=cat.assets.filter(x=>x.id===item.assetId);
  assert.equal(found.length,1,item.assetId);
  const a=found[0];
  assert.equal(a.assetType,"icon");
  assert.equal(a.category,"skill");
  assert.equal(a.resource.file,item.derivedFile);
  assert.equal(a.resource.mime,"image/webp");
  assert.deepEqual(a.compatibility.uses,["combat","capture","editor"]);
 }
 const drain=provenance.assets.find(x=>x.assetId==="pack:capture:icon-skill-drain-de-vie-01");
 const oldDrain=historical.assets.find(x=>x.assetId===drain.assetId);
 assert.deepEqual([oldDrain.derivedSha256,oldDrain.sourceSha256,oldDrain.bytes],[drain.derivedSha256,drain.sourceSha256,drain.bytes]);
 assert.equal(historical.assets.length,8);
 assert.equal(historical.revisions.at(-1).previous.derivedSha256,"4823240c81bb46bedcfe6123ba33f9e15396e685ca6878a5495793cb21ee9ca4");
});
