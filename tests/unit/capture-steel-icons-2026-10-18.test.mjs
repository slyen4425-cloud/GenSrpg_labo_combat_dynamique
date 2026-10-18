import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {createHash} from "node:crypto";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const base=resolve(root,"assets/library/capture/icons/skills");
const cat=JSON.parse(readFileSync(resolve(root,"data/assets/catalog/global-visual-assets.v1.json")));
const prov=JSON.parse(readFileSync(resolve(base,"capture_four_steel_icons_2026_10_18.provenance.json")));
test("Four real user-approved Steel skill icons: unique catalog IDs and expected RGB WebP source bytes",()=>{
 assert.equal(cat.storage.branch,"global-assets");
 assert.equal(cat.counts.assets,cat.assets.length);
 assert.equal(cat.counts.icons,cat.assets.filter(x=>x.assetType==="icon").length);
 assert.equal(new Set(cat.assets.map(x=>x.id)).size,cat.assets.length);
 assert.equal(prov.assets.length,4);
 assert.equal(prov.sourceArchiveSha256,"7f89231542fb2fc1933a6b7f5212f837e4f9dc8d0376f9b07e6b2b02263b6fc2");
 for(const item of prov.assets){
  const asset=cat.assets.find(x=>x.id===item.assetId);assert.ok(asset,item.assetId);
  assert.equal(asset.assetType,"icon");assert.equal(asset.category,"skill");
  assert.equal(asset.resource.mime,"image/webp");assert.ok(asset.compatibility.uses.includes("editor"));
  assert.equal(asset.resource.file,"capture/icons/skills/"+item.derivedFile);
  const p=resolve(root,cat.storage.libraryRoot,asset.resource.file);assert.ok(existsSync(p));
  const b=readFileSync(p);
  assert.equal(b.length,item.bytes);
  assert.equal(createHash("sha256").update(b).digest("hex"),item.derivedSha256);
  assert.equal(b.toString("ascii",0,4),"RIFF");
  assert.equal(b.toString("ascii",8,12),"WEBP");
  assert.equal(b.toString("ascii",12,16),"VP8 ");
 }
});
