import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
import {dirname,resolve} from "node:path";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const dir=resolve(root,"assets/library/capture/sprites/skills/flower_defense");
const catalog=JSON.parse(readFileSync(resolve(root,"data/assets/catalog/global-visual-assets.v1.json")));
const h=b=>createHash("sha256").update(b).digest("hex");
test("Fleur defense contains original 12 real RGBA frames and one catalog resource",()=>{
 assert.equal(new Set(catalog.assets.map(x=>x.id)).size,catalog.assets.length);
 assert.equal(catalog.counts.assets,catalog.assets.length);
 assert.equal(catalog.counts.sprites,catalog.assets.filter(x=>x.assetType==="sprite").length);
 const entries=catalog.assets.filter(x=>x.id==="pack:capture:sprite-flower-defense-shield-01");
 assert.equal(entries.length,1);
 const asset=entries[0];
 assert.equal(asset.category,"skill");
 assert.equal(asset.resource.file,"capture/sprites/skills/flower_defense/fleur_defense_atlas_12f.webp");
 assert.equal(asset.resource.frameCount,12);
 assert.equal(asset.resource.playbackMode,"once");
 assert.equal(asset.resource.holdLastFrame,true);
 const s=JSON.parse(readFileSync(resolve(dir,"sprite_skill_fleur_defense_sequence_01.json")));
 const prov=JSON.parse(readFileSync(resolve(dir,"provenance.json")));
 assert.equal(prov.originalArchiveSha256,"653c5012f182931b4add1bef4641ab8837e749358236dba6b33d5ed0c70f9169");
 assert.equal(prov.originalGitBlobSha,"5f3bb2b288f8fdc4dc9c22bb474dfce13bb9b3c4");
 assert.equal(s.frame_count,12);assert.equal(s.holdLastFrame,true);
 assert.equal(s.holdFrameIndex,11);
 assert.equal(s.frames.length,12);
 const seen=new Set();
 for(let i=0;i<12;i++){
  const rel="frames/fleur_defense_"+String(i).padStart(2,"0")+".png";
  const original=readFileSync(resolve(dir,rel));
  assert.equal(h(original),prov.originalFileSha256[rel]);
  assert.equal(original.toString("hex",0,8),"89504e470d0a1a0a");
  assert.equal(original.readUInt32BE(16),512);
  assert.equal(original.readUInt32BE(20),512);
  assert.equal(original[25],6,"RGBA source must have alpha");
  const webp=readFileSync(resolve(dir,s.frames[i]));
  assert.equal(webp.toString("ascii",0,4),"RIFF");
  assert.equal(webp.toString("ascii",8,12),"WEBP");
  seen.add(h(original));
 }
 assert.equal(seen.size,12);
 const atlas=readFileSync(resolve(dir,"fleur_defense_atlas_12f.webp"));
 assert.equal(atlas.toString("ascii",0,4),"RIFF");
 assert.equal(atlas.toString("ascii",8,12),"WEBP");
 for(const rel of ["fleur_defense_preview_512.webp","fleur_defense_planche_512.png","manifest.json"]){
  assert.equal(h(readFileSync(resolve(dir,rel))),prov.originalFileSha256[rel]);
 }
 assert.ok(existsSync(resolve(dir,"README.md")));
});