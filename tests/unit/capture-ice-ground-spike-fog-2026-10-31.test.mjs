import test from "node:test";
import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {createHash} from "node:crypto";
const root=new URL("../../",import.meta.url);
const read=(p)=>readFileSync(new URL(p,root));
const kinds={
  zone_gelee:["zone-gelee","skill",100],
  pointe_glace:["pointe-glace","impact",90],
  brouillard_gelant:["brouillard-gelant","skill",100]
};
test("ice pack is exact uploaded ZIP, 36 original PNG frames",()=>{
 const raw=read("_incoming/pack_sprites_glace_suite_36_frames.zip");
 assert.equal(raw.length,13489375);
 assert.equal(createHash("sha256").update(raw).digest("hex"),"33f5dce30a96a52990f53e652b21ec0c840f1ab4917c756d2ccfc01135dc1506");
});
test("three 12-frame ice sprites are unique, ready and in only canonical global-assets catalog",()=>{
 const cat=JSON.parse(read("data/assets/catalog/global-visual-assets.v1.json"));
 assert.equal(cat.storage.branch,"global-assets");
 assert.equal(cat.counts.assets,cat.assets.length);
 assert.equal(cat.counts.sprites,cat.assets.filter(x=>x.assetType==="sprite").length);
 assert.equal(new Set(cat.assets.map(x=>x.id)).size,cat.assets.length);
 const actualIcePackIds=cat.assets
  .filter(a=>a.resource?.file?.startsWith("capture/sprites/skills/glace_suite/"))
  .map(a=>a.id).sort();
 assert.deepEqual(actualIcePackIds,[
  "pack:capture:sprite-brouillard-gelant-01",
  "pack:capture:sprite-pointe-glace-01",
  "pack:capture:sprite-zone-gelee-01"
 ]);
 const rootDir="assets/library/capture/sprites/skills/glace_suite/";
 const sequence=JSON.parse(read(rootDir+"sequence.json"));
 assert.equal(sequence.sourceArchiveSha256,"33f5dce30a96a52990f53e652b21ec0c840f1ab4917c756d2ccfc01135dc1506");
 for(const [role,[slug,category,ms]] of Object.entries(kinds)){
   const id="pack:capture:sprite-"+slug+"-01";
   const found=cat.assets.filter(x=>x.id===id);
   assert.equal(found.length,1,id);
   const a=found[0];
   assert.equal(a.assetType,"sprite");
   assert.equal(a.category,category);
   assert.equal(a.resource.format,"sprite-strip");
   assert.equal(a.resource.frameCount,12);
   assert.equal(a.resource.frameMs,ms);
   assert.equal(a.resource.playbackMode,"once");
   assert.equal(a.resource.holdLastFrame,true);
   assert.equal(a.resource.file,"capture/sprites/skills/glace_suite/"+role+"/"+role+"_atlas_12f.webp");
   const atlas=read("assets/library/"+a.resource.file);
   assert.equal(atlas.toString("ascii",0,4),"RIFF");
   assert.equal(atlas.toString("ascii",8,12),"WEBP");
   assert.equal(sequence.sequences[role].id,id);
   for(let n=1;n<=12;n++) assert.ok(existsSync(new URL(rootDir+role+"/png/"+role+"_"+String(n).padStart(2,"0")+".png",root)));
   assert.ok(existsSync(new URL(rootDir+role+"/preview_"+role+".gif",root)));
 }
});
