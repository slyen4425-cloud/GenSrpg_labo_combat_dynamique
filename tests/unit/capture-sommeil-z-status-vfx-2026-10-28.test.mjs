import test from "node:test";
import assert from "node:assert/strict";
import {existsSync, readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const folder=resolve(root,"assets/library/capture/sprites/skills/sommeil_z");
const cat=JSON.parse(readFileSync(resolve(root,"data/assets/catalog/global-visual-assets.v1.json")));
const h=(bytes)=>createHash("sha256").update(bytes).digest("hex");
const id="pack:capture:sprite-sommeil-z-status-01";

test("Sommeil Z: 12 real original transparent WebP frames in canonical Capture catalog",()=>{
 assert.equal(cat.storage.branch,"global-assets");
 assert.equal(cat.counts.assets,cat.assets.length);
 assert.equal(cat.counts.sprites,cat.assets.filter(x=>x.assetType==="sprite").length);
 assert.equal(new Set(cat.assets.map(x=>x.id)).size,cat.assets.length);
 const entries=cat.assets.filter(x=>x.id===id);
 assert.equal(entries.length,1);
 const asset=entries[0];
 assert.equal(asset.assetType,"sprite");
 assert.equal(asset.mediaType,"image");
 assert.equal(asset.category,"skill");
 assert.ok(["combat","capture","editor"].every(use=>asset.compatibility.uses.includes(use)));
 assert.deepEqual([asset.resource.frameCount,asset.resource.frameMs,asset.resource.playbackMode],[12,110,"loop"]);
 assert.equal(asset.resource.file,"capture/sprites/skills/sommeil_z/sommeil_z_atlas_12f.webp");
 const manifest=JSON.parse(readFileSync(resolve(folder,"manifest.json")));
 const seq=JSON.parse(readFileSync(resolve(folder,"sprite_skill_sommeil_z_sequence_01.json")));
 const prov=JSON.parse(readFileSync(resolve(folder,"provenance.json")));
 assert.equal(prov.originalArchiveSha256,"c54544b0d60519738ffa5bf81b1c5de57e1782d70eb5964fe65ee987449d02c6");
 assert.equal(prov.originalGitBlobSha,"6d6e5d763e55133935726dbf95043ac9f1e1a445");
 assert.equal(manifest.assetId,id);
 assert.equal(seq.id,id);
 assert.deepEqual(seq.frameSize,[512,512]);
 assert.equal(seq.frame_ms,110);
 assert.equal(seq.playback_mode,"loop");
 assert.equal(seq.loopUntil,"status-removed");
 assert.equal(seq.anchor,"above-head");
 assert.equal(seq.followTarget,true);
 assert.equal(seq.visualOnly,true);
 assert.deepEqual(seq.atlas,{file:"sommeil_z_atlas_12f.webp",format:"sprite-strip",frameCount:12,frameWidth:512,frameHeight:512});
 const atlas=readFileSync(resolve(root,cat.storage.libraryRoot,asset.resource.file));
 assert.equal(atlas.toString("ascii",0,4),"RIFF");
 assert.equal(atlas.toString("ascii",8,12),"WEBP");
 assert.equal(h(atlas),prov.originalFileSha256[seq.atlas.file]);
 const distinct=new Set();
 for(let n=1;n<=12;n++){
   const rel="frames/sommeil_z_"+String(n).padStart(2,"0")+".webp";
   assert.equal(seq.frames[n-1],rel);
   const bytes=readFileSync(resolve(folder,rel));
   assert.equal(bytes.toString("ascii",0,4),"RIFF");
   assert.equal(bytes.toString("ascii",8,12),"WEBP");
   assert.equal(h(bytes),prov.originalFileSha256[rel]);
   distinct.add(h(bytes));
 }
 assert.equal(distinct.size,12);
 assert.equal(seq.frames.length,12);
 for(const rel of ["preview_sommeil_z_12f.webp","planche_sommeil_z_12f.png"]){
   assert.ok(existsSync(resolve(folder,rel)),rel);
   assert.equal(h(readFileSync(resolve(folder,rel))),prov.originalFileSha256[rel]);
 }
 assert.equal(seq.preview,"preview_sommeil_z_12f.webp");
});
