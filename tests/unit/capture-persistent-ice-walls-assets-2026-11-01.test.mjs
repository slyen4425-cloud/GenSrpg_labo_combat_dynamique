import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {createHash} from "node:crypto";
const root=new URL("../../",import.meta.url);
const read=p=>readFileSync(new URL(p,root));
const zipHash="4cf5ac450117c0111079d0cf32caa26acd3d786e5d8d1e022c6d68d197bd03d1";
const walls={mur_glace:"mur-glace",mur_glace_herisse:"mur-glace-herisse",mur_glace_arcanique:"mur-glace-arcanique"};
test("uploaded persistent ice walls archive matches the author source",()=>{
 const b=read("_incoming/pack_murs_glace_suite_36_frames.zip");
 assert.equal(b.length,15386792);
 assert.equal(createHash("sha256").update(b).digest("hex"),zipHash);
});
test("three distinct durable wall sprites have unique ids, physically present 12f atlases and last frame hold",()=>{
 const catalog=JSON.parse(read("data/assets/catalog/global-visual-assets.v1.json"));
 assert.equal(catalog.storage.branch,"global-assets");
 assert.equal(catalog.counts.assets,catalog.assets.length);
 assert.equal(catalog.counts.sprites,catalog.assets.filter(a=>a.assetType==="sprite").length);
 assert.equal(new Set(catalog.assets.map(a=>a.id)).size,catalog.assets.length);
 const rootPath="assets/library/capture/sprites/skills/murs_glace/";
 const sequence=JSON.parse(read(rootPath+"sequence.json"));
 assert.equal(sequence.sourceArchiveSha256,zipHash);
 for(const [role,slug] of Object.entries(walls)){
   const id="pack:capture:sprite-"+slug+"-01";
   const hits=catalog.assets.filter(a=>a.id===id);
   assert.equal(hits.length,1,id);
   const a=hits[0];assert.equal(a.category,"skill");
   assert.equal(a.resource.frameCount,12);
   assert.equal(a.resource.frameMs,100);
   assert.equal(a.resource.playbackMode,"once");
   assert.equal(a.resource.holdLastFrame,true,"the erected wall must remain visible after construction");
   assert.equal(a.resource.format,"sprite-strip");
   assert.equal(a.resource.file,"capture/sprites/skills/murs_glace/"+role+"/"+role+"_atlas_12f.webp");
   assert.equal(sequence.sequences[role].persistentFrameIndex,11);
   const bytes=read("assets/library/"+a.resource.file);
   assert.equal(bytes.toString("ascii",0,4),"RIFF");
   assert.equal(bytes.toString("ascii",8,12),"WEBP");
   for(let i=1;i<=12;i++)assert.ok(existsSync(new URL(rootPath+role+"/png/"+role+"_"+String(i).padStart(2,"0")+".png",root)));
   assert.ok(existsSync(new URL(rootPath+role+"/preview_"+role+".gif",root)));
 }
});
